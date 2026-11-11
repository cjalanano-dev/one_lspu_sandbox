import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Check, CornerUpLeft, X, Paperclip, Printer, Pencil, Ban, CalendarDays, MapPin, Users } from 'lucide-react'
import { useAuth } from '../../features/auth/AuthContext'
import {
  proposalStore,
  proposalTagClass,
  PROPOSAL_STATUS_LABEL,
  EVENT_TYPE_LABEL,
  ATTACHMENT_LABEL,
  FUND_LABEL,
  budgetTotal,
  formatPeso,
} from '../../lib/proposals'
import { ApprovalStepper, ProposalTimeline } from '../../components/proposals/ApprovalStepper'
import { Dialog } from '../../components/ui/Dialog'
import { formatDateTime } from '../../lib/utils'
import type { ProposalAction, ProposalPacket } from '../../types'

export function ProposalDetailPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const [packet, setPacket] = useState<ProposalPacket | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dialog, setDialog] = useState<ProposalAction | 'cancel' | null>(null)
  const [comment, setComment] = useState('')
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    if (!id) return
    try {
      setPacket(await proposalStore.getPacket(id))
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    load()
    if (!id) return
    return proposalStore.subscribe(id, load)
  }, [id, load])

  if (loading) return <p className="text-sm text-[var(--muted)]">Loading proposal…</p>
  if (!packet)
    return (
      <div className="panel p-8 text-center">
        <p className="font-semibold">Proposal not found</p>
        <p className="text-sm text-[var(--muted)]">It may not exist, or it hasn't reached your approval step yet.</p>
        <Link to="/proposals" className="btn-outline inline-block mt-4">Back</Link>
      </div>
    )

  const { proposal: p, organization, facility, budget, attachments, steps, events, people } = packet
  const current = steps.find((s) => s.step_order === p.current_step && s.status === 'pending')
  const role = user?.primary_role
  const canAct =
    !!current &&
    p.status === 'in_review' &&
    (role === current.step_role ||
      (current.step_role === 'osas' && role === 'osa_staff') ||
      (current.step_role === 'osa_staff' && role === 'osas') ||
      role === 'system_admin')
  const isOwnerSide = user?.id === p.submitted_by || role === 'officer'
  const total = budgetTotal(budget)

  const runAction = async () => {
    if (!dialog) return
    setBusy(true)
    setError(null)
    try {
      if (dialog === 'cancel') await proposalStore.cancel(p.id, comment)
      else await proposalStore.act(p.id, dialog, comment)
      setDialog(null)
      setComment('')
      await load()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  const openAttachment = async (a: (typeof attachments)[number]) => {
    try {
      window.open(await proposalStore.getAttachmentUrl(a), '_blank', 'noopener')
    } catch (e) {
      setError((e as Error).message)
    }
  }

  const dialogCopy = {
    approve: { title: 'Approve proposal', cta: 'Approve & sign', need: false, hint: 'Optional note for the officer.' },
    return: { title: 'Return for revision', cta: 'Return to officer', need: true, hint: 'What needs to change? The officer will see this.' },
    reject: { title: 'Reject proposal', cta: 'Reject', need: true, hint: 'Reason for rejection. This ends the request.' },
    cancel: { title: 'Cancel proposal', cta: 'Cancel proposal', need: false, hint: 'Optional reason.' },
  } as const

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <Link to={role === 'officer' ? '/proposals' : '/approvals'} className="btn-text inline-flex items-center gap-1 text-sm">
        <ArrowLeft className="w-4 h-4" /> Back
      </Link>

      <header className="panel p-5 sm:p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className={proposalTagClass(p.status)}>{PROPOSAL_STATUS_LABEL[p.status]}</span>
              {p.reference_no && <span className="text-xs font-mono">{p.reference_no}</span>}
              <span className="text-xs font-mono text-[var(--muted)]">rev {p.revision}</span>
            </div>
            <h1 className="text-2xl font-black">{p.title}</h1>
            <p className="text-sm text-[var(--muted)]">
              {organization?.name} · {EVENT_TYPE_LABEL[p.event_type]} · filed by {people[p.submitted_by]?.full_name ?? '—'}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {p.status !== 'draft' && (
              <Link to={`/proposals/${p.id}/print`} className="btn-outline inline-flex items-center gap-2 text-sm">
                <Printer className="w-4 h-4" /> {p.status === 'approved' ? 'Signed PDF' : 'Print packet'}
              </Link>
            )}
            {isOwnerSide && (p.status === 'returned' || p.status === 'draft') && (
              <Link to={`/proposals/${p.id}/edit`} className="btn-primary inline-flex items-center gap-2 text-sm">
                <Pencil className="w-4 h-4" /> {p.status === 'returned' ? 'Revise & resubmit' : 'Continue editing'}
              </Link>
            )}
            {isOwnerSide && ['draft', 'in_review', 'returned'].includes(p.status) && role === 'officer' && (
              <button className="btn-text inline-flex items-center gap-1 text-sm" onClick={() => setDialog('cancel')}>
                <Ban className="w-4 h-4" /> Cancel
              </button>
            )}
          </div>
        </div>
        <ApprovalStepper steps={steps} people={people} />
      </header>

      {error && <p role="alert" className="panel p-4 text-sm font-semibold">{error}</p>}

      {canAct && current && (
        <section className="panel p-5 border-2 border-[var(--ink)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest">Your action · {current.label}</p>
            <p className="text-sm text-[var(--muted)]">
              Due {formatDateTime(current.due_at)}. Approving adds your digital signature to the packet.
            </p>
          </div>
          <div className="flex gap-2">
            <button className="btn-primary inline-flex items-center gap-1" onClick={() => setDialog('approve')}><Check className="w-4 h-4" /> Approve</button>
            <button className="btn-outline inline-flex items-center gap-1" onClick={() => setDialog('return')}><CornerUpLeft className="w-4 h-4" /> Return</button>
            <button className="btn-outline inline-flex items-center gap-1" onClick={() => setDialog('reject')}><X className="w-4 h-4" /> Reject</button>
          </div>
        </section>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <section className="panel p-5 space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-widest">Event details</h2>
            <div className="grid sm:grid-cols-3 gap-4 text-sm">
              <p className="flex gap-2"><CalendarDays className="w-4 h-4 shrink-0 mt-0.5" />{p.start_datetime ? `${formatDateTime(p.start_datetime)} – ${formatDateTime(p.end_datetime)}` : '—'}</p>
              <p className="flex gap-2"><MapPin className="w-4 h-4 shrink-0 mt-0.5" />{facility ? `${facility.name} (${facility.facility_code}) · cap. ${facility.capacity}` : '—'}</p>
              <p className="flex gap-2"><Users className="w-4 h-4 shrink-0 mt-0.5" />{p.expected_attendees} expected</p>
            </div>
            <div>
              <h3 className="field-label">Description</h3>
              <p className="text-sm whitespace-pre-line">{p.description || '—'}</p>
            </div>
            <div>
              <h3 className="field-label">Objectives</h3>
              <p className="text-sm whitespace-pre-line">{p.objectives || '—'}</p>
            </div>
            {p.requested_equipment.length > 0 && (
              <div>
                <h3 className="field-label">Equipment</h3>
                <p className="text-sm">{p.requested_equipment.join(', ')}</p>
              </div>
            )}
          </section>

          <section className="panel p-5">
            <h2 className="text-xs font-bold uppercase tracking-widest mb-3">Budget · {formatPeso(total)}</h2>
            {budget.length === 0 ? (
              <p className="text-sm text-[var(--muted)]">No expenses declared.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase text-[var(--muted)]">
                    <th className="py-1">Item</th><th>Qty</th><th>Unit</th><th>Source</th><th className="text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {budget.map((b) => (
                    <tr key={b.id} className="border-t border-[var(--line)]">
                      <td className="py-1.5">{b.description}</td>
                      <td>{b.quantity}</td>
                      <td className="font-mono">{formatPeso(b.unit_cost)}</td>
                      <td>{FUND_LABEL[b.source_of_funds]}</td>
                      <td className="text-right font-mono">{formatPeso(b.quantity * b.unit_cost)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>

          <section className="panel p-5">
            <h2 className="text-xs font-bold uppercase tracking-widest mb-3">Attachments</h2>
            {attachments.length === 0 ? (
              <p className="text-sm text-[var(--muted)]">No attachments.</p>
            ) : (
              <ul className="space-y-2">
                {attachments.map((a) => (
                  <li key={a.id}>
                    <button className="btn-text inline-flex items-center gap-2 text-sm text-left" onClick={() => openAttachment(a)}>
                      <Paperclip className="w-4 h-4" />
                      <span className="underline">{a.file_name}</span>
                      <span className="text-xs text-[var(--muted)]">· {ATTACHMENT_LABEL[a.doc_type]}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <aside className="panel p-5 h-fit">
          <h2 className="text-xs font-bold uppercase tracking-widest mb-4">Audit trail</h2>
          <ProposalTimeline events={events} steps={steps} people={people} />
        </aside>
      </div>

      <Dialog
        isOpen={!!dialog}
        onClose={() => !busy && setDialog(null)}
        title={dialog ? dialogCopy[dialog].title : ''}
        titleId="proposal-action-title"
      >
        {dialog && (
          <div className="space-y-4">
            <label className="field-label" htmlFor="action-comment">
              Comment{dialogCopy[dialog].need ? ' (required)' : ''}
            </label>
            <textarea
              id="action-comment"
              rows={4}
              className="field-input w-full"
              placeholder={dialogCopy[dialog].hint}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
            {error && <p role="alert" className="text-sm font-semibold">{error}</p>}
            <div className="flex justify-end gap-2">
              <button className="btn-outline" onClick={() => setDialog(null)} disabled={busy}>Back</button>
              <button
                className="btn-primary"
                disabled={busy || (dialogCopy[dialog].need && !comment.trim())}
                onClick={runAction}
              >
                {busy ? 'Working…' : dialogCopy[dialog].cta}
              </button>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  )
}
