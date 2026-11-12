import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams, useSearchParams, Link } from 'react-router-dom'
import { z } from 'zod'
import { ArrowLeft, ArrowRight, Trash2, Plus, Upload, Paperclip, Send, Save, AlertTriangle, CornerUpLeft } from 'lucide-react'
import { useAuth } from '../../features/auth/AuthContext'
import { dataStore } from '../../lib/dataStore'
import {
  proposalStore,
  EVENT_TYPE_LABEL,
  ATTACHMENT_LABEL,
  FUND_LABEL,
  budgetTotal,
  formatPeso,
  type ProposalDraftInput,
} from '../../lib/proposals'
import { formatDateTime, cn } from '../../lib/utils'
import type {
  AttachmentType,
  BudgetItem,
  Facility,
  EventType,
  FundSource,
  MaintenancePeriod,
  ProposalAttachment,
  ProposalEvent,
  Reservation,
} from '../../types'

const STEPS = ['Details', 'Venue & schedule', 'Budget', 'Attachments', 'Review & submit'] as const

const detailsSchema = z.object({
  title: z.string().trim().min(5, 'Give the event a descriptive title (min 5 characters).'),
  description: z.string().trim().min(20, 'Describe the event in at least 20 characters.'),
  objectives: z.string().trim().min(10, 'List the objectives of the event.'),
  expected_attendees: z.number().int().positive('Expected attendees must be at least 1.'),
})

const venueSchema = z
  .object({
    facility_id: z.string().min(1, 'Pick a venue.'),
    start: z.string().min(1, 'Set a start date and time.'),
    end: z.string().min(1, 'Set an end date and time.'),
  })
  .refine((v) => new Date(v.end) > new Date(v.start), { message: 'End must be after start.', path: ['end'] })
  .refine((v) => new Date(v.start) > new Date(), { message: 'Event must be scheduled in the future.', path: ['start'] })

const toLocalInput = (iso?: string | null) => {
  if (!iso) return ''
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}
const fromLocalInput = (v: string) => (v ? new Date(v).toISOString() : null)
const overlaps = (aS: string, aE: string, bS: string, bE: string) =>
  Math.max(+new Date(aS), +new Date(bS)) < Math.min(+new Date(aE), +new Date(bE))

const emptyBudgetRow = (): BudgetItem => ({ description: '', quantity: 1, unit_cost: 0, source_of_funds: 'org_funds' })

export function ProposalFormPage() {
  const { id } = useParams()
  const [search] = useSearchParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [proposalId, setProposalId] = useState<string | null>(id ?? null)
  const [orgId, setOrgId] = useState<string>(search.get('org') ?? '')
  const [status, setStatus] = useState<string>('draft')
  const [loading, setLoading] = useState<boolean>(Boolean(id))
  const [editable, setEditable] = useState<boolean>(!id)
  const [step, setStep] = useState(0)
  const [errors, setErrors] = useState<string[]>([])
  const [busy, setBusy] = useState(false)
  const [savedAt, setSavedAt] = useState<Date | null>(null)
  const [returnNote, setReturnNote] = useState<ProposalEvent | null>(null)

  // form state
  const [title, setTitle] = useState('')
  const [eventType, setEventType] = useState<EventType>('seminar')
  const [description, setDescription] = useState('')
  const [objectives, setObjectives] = useState('')
  const [attendees, setAttendees] = useState(30)
  const [facilityId, setFacilityId] = useState(search.get('facility') ?? '')
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')
  const [equipment, setEquipment] = useState<string[]>([])
  const [budget, setBudget] = useState<BudgetItem[]>([emptyBudgetRow()])
  const [attachments, setAttachments] = useState<ProposalAttachment[]>([])
  const [docType, setDocType] = useState<AttachmentType>('program_flow')

  // reference data
  const [facilities, setFacilities] = useState<Facility[]>([])
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [maintenance, setMaintenance] = useState<MaintenancePeriod[]>([])

  useEffect(() => {
    dataStore.getFacilities().then((f) => setFacilities(f.filter((x) => x.reservation_enabled)))
    dataStore.getMaintenance().then(setMaintenance)
  }, [])

  useEffect(() => {
    if (!user || id) return
    // Default to an organisation the user may actually file for.
    if (!orgId) dataStore.getFilingOrganizations(user.id).then((o) => setOrgId(o[0]?.id ?? ''))
  }, [user, id, orgId])

  // Load existing draft.
  // `loading` gates the whole form until the packet is known, so the user
  // cannot click Next / Save / Upload while the proposal's status is still
  // unknown and land on a write that RLS will reject.
  useEffect(() => {
    if (!id) {
      setLoading(false)
      return
    }
    let cancelled = false
    proposalStore
      .getPacket(id)
      .then((pk) => {
        if (cancelled) return
        if (!pk) {
          setErrors(['Proposal not found or you do not have access.'])
          setLoading(false)
          return
        }
        const p = pk.proposal
        if (p.status !== 'draft' && p.status !== 'returned') {
          // No longer editable — send them back to the read-only view.
          setEditable(false)
          setLoading(false)
          navigate(`/proposals/${p.id}`, { replace: true })
          return
        }
        setEditable(true)
        setOrgId(p.organization_id)
        setStatus(p.status)
        setTitle(p.title === 'Untitled event' ? '' : p.title)
        setEventType(p.event_type)
        setDescription(p.description ?? '')
        setObjectives(p.objectives ?? '')
        setAttendees(p.expected_attendees)
        setFacilityId(p.facility_id ?? '')
        setStart(toLocalInput(p.start_datetime))
        setEnd(toLocalInput(p.end_datetime))
        setEquipment(p.requested_equipment ?? [])
        setBudget(pk.budget.length ? pk.budget : [emptyBudgetRow()])
        setAttachments(pk.attachments)
        setReturnNote([...pk.events].reverse().find((e) => e.action === 'returned') ?? null)
        setLoading(false)
      })
      .catch((e) => {
        if (cancelled) return
        setErrors([(e as Error).message])
        setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [id, navigate])

  useEffect(() => {
    if (!facilityId) return setReservations([])
    dataStore.getReservations({ facilityId, status: 'approved' }).then(setReservations)
  }, [facilityId])

  const facility = facilities.find((f) => f.id === facilityId)
  const conflicts = useMemo(() => {
    if (!start || !end || !facilityId) return []
    const s = fromLocalInput(start)!
    const e = fromLocalInput(end)!
    return [
      ...reservations.filter((r) => overlaps(s, e, r.start_datetime, r.end_datetime)).map((r) => `Booked: ${r.title}`),
      ...maintenance
        .filter((m) => m.facility_id === facilityId && overlaps(s, e, m.start_datetime, m.end_datetime))
        .map((m) => `Maintenance: ${m.title}`),
    ]
  }, [start, end, facilityId, reservations, maintenance])

  const payload = (): ProposalDraftInput => ({
    title: title.trim() || 'Untitled event',
    event_type: eventType,
    description,
    objectives,
    expected_attendees: Math.max(1, attendees || 1),
    facility_id: facilityId || null,
    start_datetime: fromLocalInput(start),
    end_datetime: start && end && new Date(end) > new Date(start) ? fromLocalInput(end) : null,
    requested_equipment: equipment,
  })

  /** Persist draft; creates it on first save. Returns the proposal id. */
  const save = async (): Promise<string> => {
    if (!user) throw new Error('Not signed in')
    if (!editable) {
      throw new Error('This proposal can no longer be edited. It has already been submitted for approval.')
    }
    let pid = proposalId
    if (!pid) {
      if (!orgId) throw new Error('No organization selected.')
      const created = await proposalStore.createDraft(orgId, user.id, payload())
      pid = created.id
      setProposalId(pid)
      window.history.replaceState(null, '', `/proposals/${pid}/edit`)
    } else {
      await proposalStore.updateDraft(pid, payload())
    }
    await proposalStore.replaceBudget(pid, budget)
    setSavedAt(new Date())
    return pid
  }

  const validate = (i: number): string[] => {
    if (i === 0) {
      const r = detailsSchema.safeParse({ title, description, objectives, expected_attendees: attendees })
      return r.success ? [] : r.error.issues.map((x) => x.message)
    }
    if (i === 1) {
      const r = venueSchema.safeParse({ facility_id: facilityId, start, end })
      const errs = r.success ? [] : r.error.issues.map((x) => x.message)
      if (facility && attendees > facility.capacity)
        errs.push(`${facility.name} holds ${facility.capacity}; you expect ${attendees}.`)
      if (conflicts.length) errs.push('The selected slot conflicts with an existing booking or maintenance.')
      return errs
    }
    if (i === 2) {
      const bad = budget.some((b) => b.description.trim() && (b.quantity <= 0 || b.unit_cost < 0))
      return bad ? ['Budget quantities must be positive and costs cannot be negative.'] : []
    }
    return []
  }

  const go = async (next: number) => {
    if (next > step) {
      const errs = validate(step)
      setErrors(errs)
      if (errs.length) return
    } else setErrors([])
    setBusy(true)
    try {
      await save()
      setStep(next)
    } catch (e) {
      setErrors([(e as Error).message])
    } finally {
      setBusy(false)
    }
  }

  const handleUpload = async (file: File | undefined) => {
    if (!file || !user) return
    if (file.size > 10 * 1024 * 1024) return setErrors(['Files must be 10 MB or smaller.'])
    setBusy(true)
    setErrors([])
    try {
      const pid = await save()
      const att = await proposalStore.uploadAttachment(pid, user.id, file, docType)
      setAttachments((a) => [...a, att])
    } catch (e) {
      setErrors([(e as Error).message])
    } finally {
      setBusy(false)
    }
  }

  const handleSubmit = async () => {
    const all = [0, 1, 2].flatMap(validate)
    setErrors(all)
    if (all.length) return
    setBusy(true)
    try {
      const pid = await save()
      await proposalStore.submit(pid)
      navigate(`/proposals/${pid}`, { replace: true })
    } catch (e) {
      setErrors([(e as Error).message])
    } finally {
      setBusy(false)
    }
  }

  const handleDiscard = async () => {
    if (!proposalId || status !== 'draft') return navigate('/proposals')
    if (!confirm('Delete this draft? This cannot be undone.')) return
    await proposalStore.deleteDraft(proposalId)
    navigate('/proposals')
  }

  const total = budgetTotal(budget)

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between gap-4">
          <Link to="/proposals" className="btn-text inline-flex items-center gap-1 text-sm">
            <ArrowLeft className="w-4 h-4" /> All proposals
          </Link>
          <span className="text-xs text-[var(--muted)]" aria-live="polite">
            Loading proposal…
          </span>
        </div>
        <p className="text-sm text-[var(--muted)]">Loading proposal…</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-4">
        <Link to="/proposals" className="btn-text inline-flex items-center gap-1 text-sm">
          <ArrowLeft className="w-4 h-4" /> All proposals
        </Link>
        <span className="text-xs text-[var(--muted)]" aria-live="polite">
          {busy ? 'Saving…' : savedAt ? `Draft saved ${savedAt.toLocaleTimeString()}` : ''}
        </span>
      </div>

      <header>
        <p className="text-xs font-bold uppercase tracking-widest text-[var(--muted)]">
          {status === 'returned' ? 'Revise & resubmit' : 'New event proposal'}
        </p>
        <h1 className="text-2xl font-black">{title || 'Untitled event'}</h1>
      </header>

      {returnNote && status === 'returned' && (
        <div className="panel p-4 border-[var(--ink)] flex gap-3">
          <CornerUpLeft className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold">Returned for revision · {formatDateTime(returnNote.created_at)}</p>
            <p className="text-sm mt-1">{returnNote.comment}</p>
            <p className="text-xs text-[var(--muted)] mt-1">
              Update the proposal and resubmit. Approval restarts from step 1.
            </p>
          </div>
        </div>
      )}

      {/* Step indicator */}
      <ol className="grid grid-cols-5 gap-1" aria-label="Form steps">
        {STEPS.map((label, i) => (
          <li key={label}>
            <button
              type="button"
              onClick={() => (i < step ? go(i) : undefined)}
              disabled={i > step || busy || !editable}
              aria-current={i === step ? 'step' : undefined}
              className={cn(
                'w-full text-left border-t-4 pt-2 text-xs font-bold uppercase tracking-wider',
                i <= step ? 'border-[var(--ink)]' : 'border-[var(--line)] text-[var(--faint)]',
              )}
            >
              <span className="font-mono mr-1">{i + 1}</span>
              <span className="hidden sm:inline">{label}</span>
            </button>
          </li>
        ))}
      </ol>

      {errors.length > 0 && (
        <div role="alert" className="panel p-4 space-y-1">
          {errors.map((e) => (
            <p key={e} className="text-sm flex gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" /> {e}
            </p>
          ))}
        </div>
      )}

      <section className="panel p-5 sm:p-6 space-y-5">
        {step === 0 && (
          <>
            <div>
              <label className="field-label" htmlFor="title">Event title</label>
              <input id="title" className="field-input w-full" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. ACM Hackathon 2026" />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="field-label" htmlFor="type">Event type</label>
                <select id="type" className="field-input w-full" value={eventType} onChange={(e) => setEventType(e.target.value as EventType)}>
                  {Object.entries(EVENT_TYPE_LABEL).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="field-label" htmlFor="att">Expected attendees</label>
                <input id="att" type="number" min={1} className="field-input w-full" value={attendees} onChange={(e) => setAttendees(Number(e.target.value))} />
              </div>
            </div>
            <div>
              <label className="field-label" htmlFor="desc">Description / rationale</label>
              <textarea id="desc" rows={4} className="field-input w-full" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What is the event and why should it be held?" />
            </div>
            <div>
              <label className="field-label" htmlFor="obj">Objectives</label>
              <textarea id="obj" rows={3} className="field-input w-full" value={objectives} onChange={(e) => setObjectives(e.target.value)} placeholder="One objective per line" />
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <div>
              <label className="field-label" htmlFor="venue">Venue</label>
              <select id="venue" className="field-input w-full" value={facilityId} onChange={(e) => { setFacilityId(e.target.value); setEquipment([]) }}>
                <option value="">Select a facility…</option>
                {facilities.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name} ({f.facility_code}) · capacity {f.capacity}
                  </option>
                ))}
              </select>
              {facility && attendees > facility.capacity && (
                <p className="text-xs mt-1 font-semibold">⚠ Capacity {facility.capacity} is below your expected {attendees} attendees.</p>
              )}
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="field-label" htmlFor="start">Starts</label>
                <input id="start" type="datetime-local" className="field-input w-full" value={start} onChange={(e) => setStart(e.target.value)} />
              </div>
              <div>
                <label className="field-label" htmlFor="end">Ends</label>
                <input id="end" type="datetime-local" className="field-input w-full" value={end} onChange={(e) => setEnd(e.target.value)} />
              </div>
            </div>
            {facilityId && start && end && (
              <p className={cn('text-sm p-3 border', conflicts.length ? 'border-[var(--ink)] font-semibold' : 'border-[var(--line)]')}>
                {conflicts.length ? `Slot unavailable: ${conflicts.join('; ')}` : '✓ Slot is currently free. It is held while your proposal is reviewed and confirmed at final approval.'}
              </p>
            )}
            {facility && facility.equipment.length > 0 && (
              <fieldset>
                <legend className="field-label">Equipment needed</legend>
                <div className="flex flex-wrap gap-2">
                  {facility.equipment.map((eq) => {
                    const name = typeof eq === 'string' ? eq : String((eq as any)?.name ?? eq)
                    const on = equipment.includes(name)
                    return (
                      <label key={name} className={cn('px-3 py-1.5 border text-sm cursor-pointer', on ? 'bg-[var(--accent)] text-[var(--accent-ink)] border-[var(--accent)]' : 'border-[var(--line)]')}>
                        <input type="checkbox" className="sr-only" checked={on} onChange={() => setEquipment((l) => (on ? l.filter((x) => x !== name) : [...l, name]))} />
                        {name}
                      </label>
                    )
                  })}
                </div>
              </fieldset>
            )}
          </>
        )}

        {step === 2 && (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wider text-[var(--muted)]">
                    <th className="py-2 pr-2">Item</th>
                    <th className="py-2 pr-2 w-20">Qty</th>
                    <th className="py-2 pr-2 w-28">Unit cost</th>
                    <th className="py-2 pr-2 w-36">Source</th>
                    <th className="py-2 pr-2 w-28 text-right">Subtotal</th>
                    <th className="w-8" />
                  </tr>
                </thead>
                <tbody>
                  {budget.map((b, i) => {
                    const set = (patch: Partial<BudgetItem>) => setBudget((l) => l.map((x, j) => (j === i ? { ...x, ...patch } : x)))
                    return (
                      <tr key={i} className="border-t border-[var(--line)]">
                        <td className="py-2 pr-2"><input aria-label="Item" className="field-input w-full" value={b.description} onChange={(e) => set({ description: e.target.value })} placeholder="e.g. Snacks for participants" /></td>
                        <td className="py-2 pr-2"><input aria-label="Quantity" type="number" min={1} className="field-input w-full" value={b.quantity} onChange={(e) => set({ quantity: Number(e.target.value) })} /></td>
                        <td className="py-2 pr-2"><input aria-label="Unit cost" type="number" min={0} step="0.01" className="field-input w-full" value={b.unit_cost} onChange={(e) => set({ unit_cost: Number(e.target.value) })} /></td>
                        <td className="py-2 pr-2">
                          <select aria-label="Source of funds" className="field-input w-full" value={b.source_of_funds} onChange={(e) => set({ source_of_funds: e.target.value as FundSource })}>
                            {Object.entries(FUND_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                          </select>
                        </td>
                        <td className="py-2 pr-2 text-right font-mono">{formatPeso((b.quantity || 0) * (b.unit_cost || 0))}</td>
                        <td><button type="button" aria-label="Remove row" className="btn-text" onClick={() => setBudget((l) => (l.length > 1 ? l.filter((_, j) => j !== i) : [emptyBudgetRow()]))}><Trash2 className="w-4 h-4" /></button></td>
                      </tr>
                    )
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-[var(--ink)]">
                    <td colSpan={4} className="py-2 font-bold uppercase text-xs tracking-wider">Total</td>
                    <td className="py-2 pr-2 text-right font-mono font-bold">{formatPeso(total)}</td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
            <button type="button" className="btn-outline inline-flex items-center gap-2 text-sm" onClick={() => setBudget((l) => [...l, emptyBudgetRow()])}>
              <Plus className="w-4 h-4" /> Add line item
            </button>
            <p className="text-xs text-[var(--muted)]">Leave the budget empty if the event has no expenses.</p>
          </>
        )}

        {step === 3 && (
          <>
            <p className="text-sm text-[var(--muted)]">
              Attach supporting documents (PDF, DOCX, JPG/PNG, max 10 MB): signed letter, program flow, waivers, etc.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
              <div>
                <label className="field-label" htmlFor="doctype">Document type</label>
                <select id="doctype" className="field-input" value={docType} onChange={(e) => setDocType(e.target.value as AttachmentType)}>
                  {Object.entries(ATTACHMENT_LABEL)
                    .filter(([k]) => k !== 'proposal_letter')
                    .map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <label className={cn('btn-primary inline-flex items-center gap-2 cursor-pointer', (busy || !editable) && 'opacity-50 pointer-events-none')}>
                <Upload className="w-4 h-4" /> Upload file
                <input type="file" className="sr-only" accept=".pdf,.doc,.docx,.png,.jpg,.jpeg" disabled={busy || !editable} onChange={(e) => { handleUpload(e.target.files?.[0]); e.target.value = '' }} />
              </label>
            </div>
            {attachments.length === 0 ? (
              <p className="text-sm border border-dashed border-[var(--line)] p-6 text-center text-[var(--muted)]">No files attached yet.</p>
            ) : (
              <ul className="divide-y divide-[var(--line)] border border-[var(--line)]">
                {attachments.map((a) => (
                  <li key={a.id} className="flex items-center gap-3 p-3 text-sm">
                    <Paperclip className="w-4 h-4 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="truncate font-medium">{a.file_name}</p>
                      <p className="text-xs text-[var(--muted)]">{ATTACHMENT_LABEL[a.doc_type]} · {((a.size_bytes ?? 0) / 1024).toFixed(0)} KB</p>
                    </div>
                    <button type="button" className="btn-text" aria-label={`Remove ${a.file_name}`} onClick={async () => { await proposalStore.removeAttachment(a); setAttachments((l) => l.filter((x) => x.id !== a.id)) }}>
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}

        {step === 4 && (
          <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-4 text-sm">
            <Review label="Title" value={title} />
            <Review label="Type" value={EVENT_TYPE_LABEL[eventType]} />
            <Review label="Venue" value={facility ? `${facility.name} (${facility.facility_code})` : '—'} />
            <Review label="Schedule" value={start && end ? `${formatDateTime(fromLocalInput(start))} – ${formatDateTime(fromLocalInput(end))}` : '—'} />
            <Review label="Expected attendees" value={String(attendees)} />
            <Review label="Equipment" value={equipment.join(', ') || 'None'} />
            <Review label="Budget" value={`${formatPeso(total)} · ${budget.filter((b) => b.description.trim()).length} item(s)`} />
            <Review label="Attachments" value={`${attachments.length} file(s)`} />
            <div className="sm:col-span-2"><Review label="Description" value={description} /></div>
            <div className="sm:col-span-2 panel p-4 bg-[var(--surface)]">
              <p className="text-xs font-bold uppercase tracking-wider mb-1">Routing on submit</p>
              <p>Organization Adviser → Office of Student Affairs → Facility Administrator. Each approver has 48 hours; you'll be notified at every step.</p>
            </div>
          </dl>
        )}
      </section>

      <div className="flex items-center justify-between gap-3">
        <div className="flex gap-2">
          {step > 0 && (
            <button type="button" className="btn-outline inline-flex items-center gap-2" disabled={busy} onClick={() => go(step - 1)}>
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
          )}
          {status === 'draft' && (
            <button type="button" className="btn-text text-sm" onClick={handleDiscard} disabled={busy}>
              Discard draft
            </button>
          )}
        </div>
        <div className="flex gap-2">
          <button type="button" className="btn-outline inline-flex items-center gap-2" disabled={busy || !editable} onClick={() => save().catch((e) => setErrors([e.message]))}>
            <Save className="w-4 h-4" /> Save draft
          </button>
          {step < STEPS.length - 1 ? (
            <button type="button" className="btn-primary inline-flex items-center gap-2" disabled={busy || !editable} onClick={() => go(step + 1)}>
              Next <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button type="button" className="btn-primary inline-flex items-center gap-2" disabled={busy || !editable} onClick={handleSubmit}>
              <Send className="w-4 h-4" /> {status === 'returned' ? 'Resubmit for approval' : 'Submit for approval'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function Review({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">{label}</dt>
      <dd className="mt-0.5 whitespace-pre-line">{value || '—'}</dd>
    </div>
  )
}
