import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, FileText, CalendarDays, MapPin } from 'lucide-react'
import { useAuth } from '../../features/auth/AuthContext'
import { dataStore } from '../../lib/dataStore'
import {
  proposalStore,
  proposalTagClass,
  PROPOSAL_STATUS_LABEL,
} from '../../lib/proposals'
import { ApprovalStepper } from '../../components/proposals/ApprovalStepper'
import { formatDateTime } from '../../lib/utils'
import type { ApprovalStep, Facility, Organization, Proposal, ProposalStatus } from '../../types'

const FILTERS: (ProposalStatus | 'all')[] = ['all', 'draft', 'in_review', 'returned', 'approved', 'rejected']

export function ProposalsListPage() {
  const { user } = useAuth()
  const [orgs, setOrgs] = useState<Organization[]>([])
  const [orgId, setOrgId] = useState<string>('')
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [steps, setSteps] = useState<ApprovalStep[]>([])
  const [facilities, setFacilities] = useState<Record<string, Facility>>({})
  const [filter, setFilter] = useState<ProposalStatus | 'all'>('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    // Only organizations where the user is an active president or secretary
    // may file proposals - this mirrors public.is_org_officer() in the
    // database. Picking any membership (e.g. a plain 'officer' seat) makes
    // the INSERT fail with "new row violates row-level security policy".
    Promise.all([dataStore.getFilingOrganizations(user.id), dataStore.getFacilities()])
      .then(([o, f]) => {
        setOrgs(o)
        setOrgId((prev) => prev || o[0]?.id || '')
        setFacilities(Object.fromEntries(f.map((x) => [x.id, x])))
        if (o.length === 0) setLoading(false)
      })
      .catch((e) => {
        setError(e.message)
        setLoading(false)
      })
  }, [user])

  useEffect(() => {
    if (!orgId) return
    setLoading(true)
    proposalStore
      .listForOrganization(orgId)
      .then(async (list) => {
        setProposals(list)
        setSteps(await proposalStore.getSteps(list.map((p) => p.id)))
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [orgId])

  const visible = filter === 'all' ? proposals : proposals.filter((p) => p.status === filter)
  const counts = (s: ProposalStatus) => proposals.filter((p) => p.status === s).length

  return (
    <div className="space-y-6">
      <header className="rounded-[var(--radius-lg)] bg-[var(--ink)] text-[var(--paper)] p-6 sm:p-8 border border-[var(--ink-soft)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-xs bg-[var(--ink-soft)] border border-[var(--accent)]/40 text-[10px] font-mono uppercase tracking-widest text-[var(--accent-line)]">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
            Student Organization Digital Paperwork
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--paper)]">
            Event Proposals &amp; Signatory Routing
          </h1>
          <p className="text-xs sm:text-sm text-[var(--paper)]/70 max-w-2xl">
            File the activity proposal, budget, and venue request once. It moves through the Org Adviser, College Dean,
            OSAS, Campus Director, and University President approvals digitally.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {orgs.length > 1 && (
            <select
              className="border border-[var(--ink-soft)] rounded-[var(--radius)] text-xs py-2.5 px-3 font-medium text-[var(--paper)] bg-[var(--ink-dark)] focus:border-[var(--accent)]"
              value={orgId}
              onChange={(e) => setOrgId(e.target.value)}
              aria-label="Organization"
            >
              {orgs.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.acronym}
                </option>
              ))}
            </select>
          )}
          {orgId && (
            <Link
              to={`/proposals/new?org=${orgId}`}
              className="btn-accent inline-flex items-center gap-2 whitespace-nowrap"
            >
              <Plus className="w-4 h-4 shrink-0" /> New Proposal
            </Link>
          )}
        </div>
      </header>

      {error && <p className="panel p-4 text-sm" role="alert">{error}</p>}

      {!loading && orgs.length === 0 && (
        <div className="panel p-8 text-center">
          <p className="font-semibold">Access restricted: Organization President or Secretary required.</p>
          <p className="text-sm text-[var(--muted)]">Only active organization presidents and secretaries can access and file proposals for student organizations.</p>
        </div>
      )}

      {orgs.length > 0 && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {(['draft', 'in_review', 'returned', 'approved'] as ProposalStatus[]).map((s) => (
              <div key={s} className="panel p-4">
                <p className="kpi-value">{counts(s)}</p>
                <p className="kpi-label">{PROPOSAL_STATUS_LABEL[s]}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filter by status">
            {FILTERS.map((f) => (
              <button
                key={f}
                role="tab"
                aria-selected={filter === f}
                onClick={() => setFilter(f)}
                className={filter === f ? 'btn-primary text-xs' : 'btn-outline text-xs'}
              >
                {f === 'all' ? 'All' : PROPOSAL_STATUS_LABEL[f]}
              </button>
            ))}
          </div>

          {loading ? (
            <p className="text-sm text-[var(--muted)]">Loading proposals…</p>
          ) : visible.length === 0 ? (
            <div className="panel p-10 text-center">
              <FileText className="w-8 h-8 mx-auto mb-2 text-[var(--faint)]" />
              <p className="font-semibold">No proposals here yet</p>
              <p className="text-sm text-[var(--muted)]">Start a new proposal to request an event.</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {visible.map((p) => {
                const pSteps = steps.filter((s) => s.proposal_id === p.id)
                const editable = p.status === 'draft' || p.status === 'returned'
                return (
                  <li key={p.id}>
                    <Link
                      to={editable ? `/proposals/${p.id}/edit` : `/proposals/${p.id}`}
                      className="panel p-4 sm:p-5 flex flex-col md:flex-row md:items-center gap-4 hover:border-[var(--accent)] transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={proposalTagClass(p.status)}>{PROPOSAL_STATUS_LABEL[p.status]}</span>
                          {p.reference_no && <span className="text-xs font-mono text-[var(--muted)]">{p.reference_no}</span>}
                          {p.revision > 1 && <span className="text-xs font-mono text-[var(--muted)]">rev {p.revision}</span>}
                        </div>
                        <p className="font-bold truncate">{p.title}</p>
                        <p className="text-xs text-[var(--muted)] flex flex-wrap gap-x-4 mt-1">
                          <span className="inline-flex items-center gap-1">
                            <CalendarDays className="w-3.5 h-3.5" />
                            {p.start_datetime ? formatDateTime(p.start_datetime) : 'No schedule yet'}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5" />
                            {p.facility_id ? facilities[p.facility_id]?.name ?? 'Venue' : 'No venue yet'}
                          </span>
                        </p>
                      </div>
                      <ApprovalStepper steps={pSteps} compact />
                      {p.status === 'returned' && (
                        <span className="text-xs font-bold uppercase">Needs your revision →</span>
                      )}
                    </Link>
                  </li>
                )
              })}
            </ul>
          )}
        </>
      )}
    </div>
  )
}
