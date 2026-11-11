import { Check, CornerUpLeft, X, Clock, AlertTriangle, Circle } from 'lucide-react'
import type { ApprovalStep, ProposalEvent, ProposalPacket } from '../../types'
import { formatDateTime, cn } from '../../lib/utils'
import { isOverdue } from '../../lib/proposals'

const stepIcon = (s: ApprovalStep) => {
  switch (s.status) {
    case 'approved':
      return <Check className="w-4 h-4" />
    case 'returned':
      return <CornerUpLeft className="w-4 h-4" />
    case 'rejected':
      return <X className="w-4 h-4" />
    case 'pending':
      return isOverdue(s) ? <AlertTriangle className="w-4 h-4" /> : <Clock className="w-4 h-4" />
    default:
      return <Circle className="w-3 h-3" />
  }
}

export function ApprovalStepper({
  steps,
  people = {},
  compact = false,
}: {
  steps: ApprovalStep[]
  people?: ProposalPacket['people']
  compact?: boolean
}) {
  if (steps.length === 0) {
    return <p className="text-xs text-[var(--muted)]">Not yet submitted. Routing starts on submit.</p>
  }
  return (
    <ol className={cn('flex gap-2', compact ? 'items-center' : 'flex-col sm:flex-row')} aria-label="Approval progress">
      {steps.map((s, i) => {
        const done = s.status === 'approved'
        const active = s.status === 'pending'
        const bad = s.status === 'returned' || s.status === 'rejected'
        return (
          <li key={s.id} className={cn('flex items-center gap-2', !compact && 'flex-1 min-w-0')}>
            <span
              className={cn(
                'shrink-0 w-7 h-7 rounded-full border flex items-center justify-center',
                done && 'bg-[var(--ink)] text-[var(--paper)] border-[var(--ink)]',
                active && 'border-[var(--ink)] border-2',
                bad && 'bg-[var(--surface)] border-dashed border-[var(--ink)]',
                s.status === 'waiting' && 'border-[var(--line)] text-[var(--faint)]',
              )}
              title={`${s.label}: ${s.status}`}
            >
              {stepIcon(s)}
            </span>
            {!compact && (
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-wider truncate">{s.label}</p>
                <p className="text-xs text-[var(--muted)] truncate">
                  {s.status === 'pending'
                    ? isOverdue(s)
                      ? `Overdue since ${formatDateTime(s.due_at)}`
                      : `Awaiting · due ${formatDateTime(s.due_at)}`
                    : s.status === 'waiting'
                      ? 'Waiting'
                      : `${s.status[0].toUpperCase()}${s.status.slice(1)} by ${people[s.acted_by ?? '']?.full_name ?? '—'}`}
                </p>
              </div>
            )}
            {compact && i < steps.length - 1 && <span className="w-4 h-px bg-[var(--line)]" />}
          </li>
        )
      })}
    </ol>
  )
}

const ACTION_TEXT: Record<string, string> = {
  created: 'created the draft',
  submitted: 'submitted the proposal',
  resubmitted: 'resubmitted the proposal',
  approved: 'approved',
  final_approved: 'gave final approval',
  returned: 'returned it for revision',
  rejected: 'rejected the proposal',
  cancelled: 'cancelled the proposal',
  reminder_sent: 'Overdue reminder sent to approvers',
}

export function ProposalTimeline({
  events,
  steps,
  people,
}: {
  events: ProposalEvent[]
  steps: ApprovalStep[]
  people: ProposalPacket['people']
}) {
  const stepLabel = (order?: number | null) => steps.find((s) => s.step_order === order)?.label
  return (
    <ol className="relative border-l border-[var(--line)] ml-2 space-y-5">
      {[...events].reverse().map((e) => {
        const who = e.actor_id ? people[e.actor_id]?.full_name ?? 'Someone' : 'System'
        const label = ['approved', 'final_approved', 'returned', 'rejected'].includes(e.action)
          ? stepLabel(e.step_order)
          : null
        return (
          <li key={e.id} className="ml-5">
            <span className="absolute -left-[5px] mt-1.5 w-2.5 h-2.5 rounded-full bg-[var(--ink)]" />
            <p className="text-sm">
              {e.action === 'reminder_sent' ? (
                <span className="font-semibold">{ACTION_TEXT[e.action]}</span>
              ) : (
                <>
                  <span className="font-semibold">{who}</span>
                  {label && <span className="text-[var(--muted)]"> ({label})</span>} {ACTION_TEXT[e.action] ?? e.action}
                </>
              )}
              {e.revision ? <span className="ml-2 text-xs font-mono text-[var(--muted)]">rev {e.revision}</span> : null}
            </p>
            <time className="text-xs text-[var(--muted)]">{formatDateTime(e.created_at)}</time>
            {e.comment && (
              <blockquote className="mt-1.5 text-sm border-l-2 border-[var(--ink)] pl-3 py-1 bg-[var(--surface)]">
                {e.comment}
              </blockquote>
            )}
          </li>
        )
      })}
    </ol>
  )
}
