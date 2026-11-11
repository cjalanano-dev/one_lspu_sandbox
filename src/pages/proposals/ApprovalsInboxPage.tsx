import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Inbox, AlertTriangle, BellRing, CalendarDays, MapPin } from 'lucide-react'
import { useAuth } from '../../features/auth/AuthContext'
import { proposalStore, isOverdue, type InboxItem } from '../../lib/proposals'
import { formatDateTime } from '../../lib/utils'

const ROLE_LABEL: Record<string, string> = {
  adviser: 'Organization Adviser',
  college_dean: 'College Dean',
  osas: 'Office of Student Affairs & Services (OSAS)',
  osa_staff: 'Office of Student Affairs',
  campus_director: 'Campus Director',
  university_president: 'University President',
  facility_admin: 'Facility Administrator',
  system_admin: 'System Administrator (all steps)',
}

export function ApprovalsInboxPage() {
  const { user } = useAuth()
  const [items, setItems] = useState<InboxItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const load = () => {
    if (!user) return
    setLoading(true)
    proposalStore
      .getInbox(user.primary_role)
      .then(setItems)
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
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-[hsl(var(--muted))]">
            {ROLE_LABEL[user?.primary_role ?? ''] ?? 'Approver'}
          </p>
          <h1 className="text-2xl font-black">Approvals inbox</h1>
          <p className="text-sm text-[hsl(var(--muted))] mt-1">Event proposals waiting on your signature.</p>
        </div>
        {canRemind && overdue.length > 0 && (
          <button className="btn-outline inline-flex items-center gap-2" onClick={remind}>
            <BellRing className="w-4 h-4" /> Nudge overdue approvers
          </button>
        )}
      </header>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="panel p-4"><p className="kpi-value">{items.length}</p><p className="kpi-label">Awaiting you</p></div>
        <div className="panel p-4"><p className="kpi-value">{overdue.length}</p><p className="kpi-label">Overdue (&gt;48h)</p></div>
      </div>

      {error && <p role="alert" className="panel p-4 text-sm">{error}</p>}
      {notice && <p role="status" className="panel p-4 text-sm">{notice}</p>}

      {loading ? (
        <p className="text-sm text-[hsl(var(--muted))]">Loading…</p>
      ) : items.length === 0 ? (
        <div className="panel p-10 text-center">
          <Inbox className="w-8 h-8 mx-auto mb-2 text-[hsl(var(--faint))]" />
          <p className="font-semibold">Inbox zero</p>
          <p className="text-sm text-[hsl(var(--muted))]">No proposals are waiting on you right now.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {items.map(({ proposal: p, step, organization, facility }) => {
            const late = isOverdue(step)
            return (
              <li key={step.id}>
                <Link
                  to={`/proposals/${p.id}`}
                  className="panel p-4 sm:p-5 flex flex-col md:flex-row md:items-center gap-4 hover:border-[hsl(var(--ink))] transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="tag tag-pending">Step {step.step_order} · {step.label}</span>
                      <span className="text-xs font-mono">{p.reference_no}</span>
                      {p.revision > 1 && <span className="text-xs font-mono text-[hsl(var(--muted))]">rev {p.revision}</span>}
                      {late && (
                        <span className="tag tag-approved inline-flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> Overdue
                        </span>
                      )}
                    </div>
                    <p className="font-bold truncate">{p.title}</p>
                    <p className="text-xs text-[hsl(var(--muted))] flex flex-wrap gap-x-4 mt-1">
                      <span>{organization?.acronym ?? organization?.name}</span>
                      <span className="inline-flex items-center gap-1"><CalendarDays className="w-3.5 h-3.5" />{formatDateTime(p.start_datetime)}</span>
                      <span className="inline-flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{facility?.name ?? '—'}</span>
                    </p>
                  </div>
                  <div className="text-xs text-right">
                    <p className="text-[hsl(var(--muted))]">Due</p>
                    <p className={late ? 'font-bold' : ''}>{formatDateTime(step.due_at)}</p>
                  </div>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
