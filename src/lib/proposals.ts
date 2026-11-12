import { supabase } from './supabase'
import type {
  ApprovalStep,
  BudgetItem,
  Proposal,
  ProposalAction,
  ProposalAttachment,
  ProposalEvent,
  ProposalPacket,
  ProposalStatus,
  AttachmentType,
  Organization,
  Facility,
} from '../types'

const BUCKET = 'proposal-files'

export type ProposalDraftInput = Partial<
  Pick<
    Proposal,
    | 'title'
    | 'event_type'
    | 'description'
    | 'objectives'
    | 'start_datetime'
    | 'end_datetime'
    | 'expected_attendees'
    | 'facility_id'
    | 'requested_equipment'
  >
>

export interface InboxItem {
  proposal: Proposal
  step: ApprovalStep
  organization?: Organization
  facility?: Facility
}

function fail(error: { message: string } | null): asserts error is null {
  if (error) throw new Error(error.message)
}

const ORG_NAME_OVERRIDES: Record<string, string> = {
  OCTA: 'Organization for Computing and Technology Advancements',
  COESC: 'College of Engineering Student Council',
}

function normalizeOrganization<T extends { name: string; acronym?: string | null } | null | undefined>(org: T): T {
  if (!org) return org
  const key = org.acronym ? String(org.acronym).toUpperCase() : ''
  return key && ORG_NAME_OVERRIDES[key] ? { ...org, name: ORG_NAME_OVERRIDES[key] } : org
}

function mapProposal(row: any): Proposal {
  return {
    ...row,
    requested_equipment: row.requested_equipment ?? [],
  }
}

async function rpc(fn: string, args: Record<string, unknown>) {
  const { data, error } = await supabase.rpc(fn, args)
  fail(error)
  const result = data as { success?: boolean; error?: string } | null
  if (result && result.success === false) throw new Error(result.error || 'Action failed')
  return result
}

export const proposalStore = {
  // ---------- Read ----------
  async listForOrganization(orgId: string): Promise<Proposal[]> {
    const { data, error } = await supabase
      .from('proposals')
      .select('*')
      .eq('organization_id', orgId)
      .order('updated_at', { ascending: false })
    fail(error)
    return (data ?? []).map(mapProposal)
  },

  async listVisible(status?: ProposalStatus): Promise<Proposal[]> {
    let q = supabase.from('proposals').select('*').order('updated_at', { ascending: false })
    if (status) q = q.eq('status', status)
    const { data, error } = await q
    fail(error)
    return (data ?? []).map(mapProposal)
  },

  async getSteps(proposalIds: string[]): Promise<ApprovalStep[]> {
    if (proposalIds.length === 0) return []
    const { data, error } = await supabase
      .from('approval_steps')
      .select('*')
      .in('proposal_id', proposalIds)
      .order('step_order')
    fail(error)
    return data ?? []
  },

  /** Proposals whose current pending step the given role can act on (RLS limits rows). */
  async getInbox(role: string): Promise<InboxItem[]> {
    let q = supabase.from('approval_steps').select('*').eq('status', 'pending')
    if (role !== 'system_admin') {
      if (role === 'osas' || role === 'osa_staff') {
        q = q.in('step_role', ['osas', 'osa_staff'])
      } else {
        q = q.eq('step_role', role)
      }
    }
    const { data: steps, error } = await q.order('due_at')
    fail(error)
    if (!steps?.length) return []

    const ids = steps.map((s) => s.proposal_id)
    const { data: props, error: pErr } = await supabase.from('proposals').select('*').in('id', ids)
    fail(pErr)
    const orgIds = [...new Set((props ?? []).map((p) => p.organization_id))]
    const facIds = [...new Set((props ?? []).map((p) => p.facility_id).filter(Boolean))]
    const [{ data: orgs }, { data: facs }] = await Promise.all([
      supabase.from('organizations').select('*').in('id', orgIds),
      facIds.length
        ? supabase.from('facilities').select('*').in('id', facIds)
        : Promise.resolve({ data: [] as any[] }),
    ])
    const byId = new Map((props ?? []).map((p) => [p.id, mapProposal(p)]))
    return steps
      .filter((s) => byId.has(s.proposal_id) && byId.get(s.proposal_id)!.status === 'in_review')
      .map((s) => {
        const proposal = byId.get(s.proposal_id)!
        return {
          step: s,
          proposal,
          organization: normalizeOrganization(orgs?.find((o) => o.id === proposal.organization_id)),
          facility: facs?.find((f) => f.id === proposal.facility_id),
        }
      })
  },

  async getPacket(id: string): Promise<ProposalPacket | null> {
    const { data: proposal, error } = await supabase.from('proposals').select('*').eq('id', id).maybeSingle()
    fail(error)
    if (!proposal) return null

    const [org, fac, budget, attachments, steps, events] = await Promise.all([
      supabase.from('organizations').select('*').eq('id', proposal.organization_id).maybeSingle(),
      proposal.facility_id
        ? supabase.from('facilities').select('*').eq('id', proposal.facility_id).maybeSingle()
        : Promise.resolve({ data: null, error: null }),
      supabase.from('proposal_budget_items').select('*').eq('proposal_id', id).order('position'),
      supabase.from('proposal_attachments').select('*').eq('proposal_id', id).order('created_at'),
      supabase.from('approval_steps').select('*').eq('proposal_id', id).order('step_order'),
      supabase.from('proposal_events').select('*').eq('proposal_id', id).order('created_at'),
    ])

    const peopleIds = new Set<string>([proposal.submitted_by])
    ;(steps.data ?? []).forEach((s) => s.acted_by && peopleIds.add(s.acted_by))
    ;(events.data ?? []).forEach((e) => e.actor_id && peopleIds.add(e.actor_id))
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, primary_role')
      .in('id', [...peopleIds])
    const people: ProposalPacket['people'] = {}
    ;(profiles ?? []).forEach((p) => (people[p.id] = { full_name: p.full_name, primary_role: p.primary_role }))

    return {
      proposal: mapProposal(proposal),
      organization: normalizeOrganization(org.data) ?? null,
      facility: fac.data ? { ...fac.data, equipment: fac.data.equipment ?? [] } : null,
      budget: (budget.data ?? []).map((b) => ({ ...b, quantity: Number(b.quantity), unit_cost: Number(b.unit_cost) })),
      attachments: (attachments.data ?? []) as ProposalAttachment[],
      steps: (steps.data ?? []) as ApprovalStep[],
      events: (events.data ?? []) as ProposalEvent[],
      people,
    }
  },

  // ---------- Draft editing ----------
  // Note on .single(): it throws PGRST116 "Cannot coerce the result to a
  // single JSON object" whenever the statement returns anything other than
  // exactly one row. For writes that are legitimately filtered to zero rows
  // by RLS (e.g. updating a proposal that is no longer in 'draft' or
  // 'returned'), that message is meaningless to the user. These helpers
  // therefore select without .single() and check the row count explicitly.
  async createDraft(orgId: string, userId: string, input: ProposalDraftInput): Promise<Proposal> {
    const { data, error } = await supabase
      .from('proposals')
      .insert([{ ...input, title: input.title || 'Untitled event', organization_id: orgId, submitted_by: userId }])
      .select()
    fail(error)
    if (!data || data.length === 0) {
      throw new Error('The proposal could not be created. You may not have permission to file for this organization.')
    }
    return mapProposal(data[0])
  },

  async updateDraft(id: string, input: ProposalDraftInput): Promise<Proposal> {
    const { data, error } = await supabase.from('proposals').update(input).eq('id', id).select()
    fail(error)
    if (!data || data.length === 0) {
      throw new Error('This proposal can no longer be edited. It has already been submitted for approval.')
    }
    return mapProposal(data[0])
  },

  async deleteDraft(id: string) {
    const { error } = await supabase.from('proposals').delete().eq('id', id)
    fail(error)
  },

  async replaceBudget(proposalId: string, items: BudgetItem[]) {
    const { error: delErr } = await supabase.from('proposal_budget_items').delete().eq('proposal_id', proposalId)
    fail(delErr)
    const rows = items
      .filter((i) => i.description.trim())
      .map((i, idx) => ({
        proposal_id: proposalId,
        description: i.description.trim(),
        quantity: i.quantity,
        unit_cost: i.unit_cost,
        source_of_funds: i.source_of_funds,
        position: idx,
      }))
    if (rows.length) {
      const { error } = await supabase.from('proposal_budget_items').insert(rows)
      if (error) {
        throw new Error(
          error.message.includes('row-level security policy')
            ? 'The budget can only be edited while the proposal is still a draft.'
            : error.message,
        )
      }
    }
  },

  async uploadAttachment(proposalId: string, userId: string, file: File, docType: AttachmentType) {
    const safeName = file.name.replace(/[^\w.\-]+/g, '_')
    const path = `${proposalId}/${Date.now()}_${safeName}`
    const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, file, {
      contentType: file.type || undefined,
    })
    fail(upErr)
    const { data, error } = await supabase
      .from('proposal_attachments')
      .insert([
        {
          proposal_id: proposalId,
          doc_type: docType,
          file_name: file.name,
          storage_path: path,
          size_bytes: file.size,
          uploaded_by: userId,
        },
      ])
      .select()
    if (error) {
      await supabase.storage.from(BUCKET).remove([path])
      throw new Error(
        error.message.includes('row-level security policy')
          ? 'Attachments can only be added while the proposal is still a draft.'
          : error.message,
      )
    }
    if (!data || data.length === 0) {
      await supabase.storage.from(BUCKET).remove([path])
      throw new Error('The attachment could not be saved.')
    }
    return data[0] as ProposalAttachment
  },

  async removeAttachment(att: ProposalAttachment) {
    const { error } = await supabase.from('proposal_attachments').delete().eq('id', att.id)
    fail(error)
    await supabase.storage.from(BUCKET).remove([att.storage_path])
  },

  async getAttachmentUrl(att: ProposalAttachment): Promise<string> {
    const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(att.storage_path, 300)
    fail(error)
    return data.signedUrl
  },

  // ---------- Workflow ----------
  submit: (id: string) => rpc('submit_proposal', { p_proposal: id }),
  act: (id: string, action: ProposalAction, comment?: string) =>
    rpc('act_on_proposal', { p_proposal: id, p_action: action, p_comment: comment ?? null }),
  cancel: (id: string, reason?: string) => rpc('cancel_proposal', { p_proposal: id, p_reason: reason ?? null }),
  sendOverdueReminders: async (): Promise<number> => {
    const { data, error } = await supabase.rpc('send_overdue_reminders')
    fail(error)
    return (data as number) ?? 0
  },
  verify: async (reference: string) => {
    const { data, error } = await supabase.rpc('verify_proposal', { p_reference: reference })
    fail(error)
    return data as null | {
      reference_no: string
      title: string
      organization: string
      status: ProposalStatus
      revision: number
      start_datetime: string
      end_datetime: string
      decided_at: string | null
      steps: { label: string; status: string; acted_at: string | null; approver: string | null; signature: string | null }[]
    }
  },

  /** Subscribe to changes on a single proposal (status moves). Returns unsubscribe. */
  subscribe(proposalId: string, onChange: () => void) {
    const channel = supabase
      .channel(`proposal-${proposalId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'proposals', filter: `id=eq.${proposalId}` },
        onChange,
      )
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  },
}

// ---------- Display helpers ----------
export const PROPOSAL_STATUS_LABEL: Record<ProposalStatus, string> = {
  draft: 'Draft',
  in_review: 'In review',
  returned: 'Returned',
  approved: 'Approved',
  rejected: 'Rejected',
  cancelled: 'Cancelled',
}

export const proposalTagClass = (status: string) => {
  switch (status) {
    case 'approved':
      return 'tag tag-approved'
    case 'in_review':
    case 'pending':
      return 'tag tag-pending'
    case 'returned':
      return 'tag tag-maintenance'
    case 'rejected':
    case 'cancelled':
      return 'tag tag-rejected'
    default:
      return 'tag tag-reserved'
  }
}

export const EVENT_TYPE_LABEL: Record<string, string> = {
  academic: 'Academic',
  seminar: 'Seminar / Workshop',
  competition: 'Competition',
  social: 'Social',
  outreach: 'Outreach',
  sports: 'Sports',
  meeting: 'Meeting / Assembly',
  other: 'Other',
}

export const ATTACHMENT_LABEL: Record<AttachmentType, string> = {
  proposal_letter: 'Activity proposal letter',
  program_flow: 'Program flow',
  budget_breakdown: 'Budget breakdown',
  parental_waiver: 'Parental waiver',
  other: 'Other',
}

export const FUND_LABEL: Record<string, string> = {
  org_funds: 'Org funds',
  student_fees: 'Student fees',
  sponsorship: 'Sponsorship',
  school_subsidy: 'School subsidy',
  other: 'Other',
}

export const budgetTotal = (items: BudgetItem[]) =>
  items.reduce((sum, i) => sum + (Number(i.quantity) || 0) * (Number(i.unit_cost) || 0), 0)

export const formatPeso = (n: number) =>
  new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(n)

export const isOverdue = (step: Pick<ApprovalStep, 'status' | 'due_at'>) =>
  step.status === 'pending' && !!step.due_at && new Date(step.due_at).getTime() < Date.now()
