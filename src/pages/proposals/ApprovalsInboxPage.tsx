import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Inbox, AlertTriangle, BellRing, CalendarDays, MapPin, ShieldCheck, ArrowRight } from 'lucide-react'
import { useAuth } from '../../features/auth/AuthContext'
import { dataStore } from '../../lib/dataStore'
import { proposalStore, isOverdue, type InboxItem } from '../../lib/proposals'
import { StudentOrgEventsCalendar } from '../../components/calendar/StudentOrgEventsCalendar'
import { formatDateTime } from '../../lib/utils'
import type { Organization } from '../../types'

const ROLE_LABEL: Record<string, string> = {
  adviser: 'Step 1 Signatory · Organization Adviser',
  college_dean: 'Step 2 Signatory · Office of the College Dean',
  osas: 'Step 3 Signatory · Office of Student Affairs & Services (OSAS)',
  osa_staff: 'Step 3 Signatory · Office of Student Affairs',
  campus_director: 'Step 4 Signatory · Office of the Campus Director',
  university_president: 'Step 5 Signatory · Office of the University President',
  facility_admin: 'Venue Clearance · Facility Administrator',
  system_admin: 'Institutional System Administrator · All Signatory Steps',
}

export function ApprovalsInboxPage() {
  const { user } = useAuth()
  const [items, setItems] = useState<InboxItem[]>([])
  const [advisedOrgs, setAdvisedOrgs] = useState<Organization[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const load = () => {
    if (!user) return
    setLoading(true)
    Promise.all([
      proposalStore.getInbox(user.primary_role, user.id),
      user.primary_role === 'adviser'
        ? dataStore.getAdvisedOrganizations(user.id)
        : Promise.resolve([] as Organization[]),
    ])
      .then(([inbox, orgs]) => {
        setItems(inbox)
        setAdvisedOrgs(orgs)
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(load, [user])

  const overdue = items.filter((i) => isOverdue(i.step))
  const canRemind = ['facility_admin', 'system_admin', 'osa_staff'].includes(user?.primary_role ?? '')

  const remind = async () => {
    try {
      const n = await proposalStore.sendOverdueReminders()
      setNotice(n ? `Sent ${n} reminder(s) to approvers.` : 'No reminders were due.')
    } catch (e) {
      setError((e as Error).message)
    }
  }

  return (
    <div className="space-y-6">
      {/* Grayish-Black Signatory Banner */}
      <header className="rounded-[var(--radius-lg)] bg-[var(--ink)] text-[var(--paper)] p-6 sm:p-8 border border-[var(--ink-soft)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-xs bg-[var(--ink-soft)] border border-[var(--accent)]/40 text-[10px] font-mono uppercase tracking-widest text-[var(--accent-line)]">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
              {ROLE_LABEL[user?.primary_role ?? ''] ?? 'Signatory Office'}
            </div>
            {user?.primary_role === 'adviser' &&
              advisedOrgs.map((org) => (
                <span
                  key={org.id}
                  className="px-2.5 py-0.5 rounded-xs bg-[var(--accent)] text-[var(--accent-ink)] text-[10px] font-mono font-bold uppercase tracking-wider"
                >
                  Assigned to {org.acronym}
                </span>
              ))}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--paper)]">
            {user?.primary_role === 'adviser' && advisedOrgs.length > 0
              ? `${advisedOrgs.map((o) => o.acronym).join(' / ')} Adviser Endorsement Inbox`
              : 'Digital Signatory & Clearance Inbox'}
          </h1>
          <p className="text-xs sm:text-sm text-[var(--paper)]/70">
            {user?.primary_role === 'adviser' && advisedOrgs.length > 0
              ? `Showing Step 1 proposals exclusively from ${advisedOrgs.map((o) => (o.name === o.acronym ? o.name : `${o.name} (${o.acronym})`)).join(', ')}.`
              : 'Only proposals that have reached your specific signatory step in the approval chain appear in this queue.'}
          </p>
        </div>
        {canRemind && overdue.length > 0 && (
          <button className="btn-accent text-xs inline-flex items-center gap-2 shrink-0" onClick={remind}>
            <BellRing className="w-4 h-4" /> Nudge Overdue Approvers
          </button>
        )}
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="panel p-5 border-t-2 border-t-[var(--accent)]">
          <p className="kpi-value">{items.length}</p>
          <p className="kpi-label">Awaiting Your Signature</p>
        </div>
        <div className="panel p-5">
          <p className="kpi-value">{overdue.length}</p>
          <p className="kpi-label">Overdue (&gt;48 Hours)</p>
        </div>
        <div className="panel p-5">
          <p className="kpi-value">SHA-256</p>
          <p className="kpi-label">Digital Signature Standard</p>
        </div>
      </div>

      {error && <p role="alert" className="panel p-4 text-sm text-[var(--danger-text)] border-[var(--danger)]/30 bg-[var(--danger-tint)]">{error}</p>}
      {notice && <p role="status" className="panel p-4 text-sm text-[var(--accent-text)] border-[var(--accent-line)] bg-[var(--accent-tint)]">{notice}</p>}

      {loading ? (
        <div className="panel p-10 text-center">
          <p className="text-xs font-mono uppercase tracking-widest text-[var(--muted)]">Loading signatory queue…</p>
        </div>
      ) : items.length === 0 ? (
        <div className="panel p-12 text-center space-y-2">
          <div className="w-10 h-10 rounded-[var(--radius)] bg-[var(--accent-tint)] border border-[var(--accent-line)] text-[var(--accent-text)] flex items-center justify-center mx-auto mb-2">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <p className="font-extrabold text-base text-[var(--ink)]">Signatory Queue Clear</p>
          <p className="text-xs text-[var(--muted)] max-w-md mx-auto">
            No student organization event proposals are waiting on your signature right now.
          </p>
        </div>
      ) : (
        <div className="panel overflow-hidden">
          <div className="px-5 py-3.5 border-b border-[var(--line)] bg-[var(--surface)] flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
            <span className="flex items-center gap-2">
              <Inbox className="w-4 h-4 text-[var(--accent)]" />
              Action Required ({items.length})
            </span>
            <span className="font-mono text-[11px]">Sorted by SLA Due Date</span>
          </div>
          <ul className="divide-y divide-[var(--line)]">
            {items.map(({ proposal: p, step, organization, facility }) => {
              const late = isOverdue(step)
              return (
                <li key={step.id}>
                  <Link
                    to={`/proposals/${p.id}`}
                    className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-[var(--accent-tint)] transition group"
                  >
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="tag tag-approved">Step {step.step_order} · {step.label}</span>
                        <span className="text-xs font-mono text-[var(--muted)]">{p.reference_no}</span>
                        {p.revision > 1 && <span className="text-xs font-mono text-[var(--muted)]">rev {p.revision}</span>}
                        {late && (
                          <span className="tag tag-maintenance inline-flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" /> Overdue SLA
                          </span>
                        )}
                      </div>
                      <p className="font-extrabold text-base text-[var(--ink)] group-hover:text-[var(--accent-text)] truncate">
                        {p.title}
                      </p>
                      <p className="text-xs text-[var(--muted)] flex flex-wrap gap-x-4 gap-y-1">
                        <span className="font-semibold text-[var(--ink)]">{organization?.acronym ?? organization?.name}</span>
                        <span className="inline-flex items-center gap-1">
                          <CalendarDays className="w-3.5 h-3.5 text-[var(--accent)]" />
                          {formatDateTime(p.start_datetime)}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-[var(--accent)]" />
                          {facility?.name ?? '—'}
                        </span>
                      </p>
                    </div>
                    <div className="flex items-center gap-4 shrink-0">
                      <div className="text-xs text-right">
                        <p className="text-[10px] font-mono uppercase text-[var(--muted)]">SLA Due</p>
                        <p className={late ? 'font-bold text-[var(--danger-text)]' : 'font-mono text-[var(--ink)]'}>
                          {formatDateTime(step.due_at)}
                        </p>
                      </div>
                      <span className="btn-primary text-xs gap-1.5">
                        Inspect Packet <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
      )}

      {/* University-Wide Student Organization Events Calendar */}
      <StudentOrgEventsCalendar />
    </div>
  )
}
