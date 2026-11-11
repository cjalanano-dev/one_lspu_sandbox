import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import { ArrowLeft, Printer } from 'lucide-react'
import {
  proposalStore,
  PROPOSAL_STATUS_LABEL,
  EVENT_TYPE_LABEL,
  ATTACHMENT_LABEL,
  FUND_LABEL,
  budgetTotal,
  formatPeso,
} from '../../lib/proposals'
import { formatDateTime } from '../../lib/utils'
import type { ProposalPacket } from '../../types'

/**
 * Printable packet. "Save as PDF" from the browser print dialog produces the
 * signed document; each approval shows its sha256 signature and the QR code
 * links to the public /verify page so a printout can be checked.
 */
export function ProposalPrintPage() {
  const { id } = useParams()
  const [packet, setPacket] = useState<ProposalPacket | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (id) proposalStore.getPacket(id).then(setPacket).catch((e) => setError(e.message))
  }, [id])

  if (error) return <p className="p-8">{error}</p>
  if (!packet) return <p className="p-8 text-sm">Preparing packet…</p>

  const { proposal: p, organization, facility, budget, attachments, steps, people } = packet
  const verifyUrl = `${window.location.origin}/verify/${encodeURIComponent(p.reference_no ?? '')}`
  const approved = p.status === 'approved'

  return (
    <div className="min-h-screen bg-[hsl(var(--surface))] print:bg-white">
      <div className="print:hidden max-w-[210mm] mx-auto flex justify-between items-center py-4 px-2">
        <Link to={`/proposals/${p.id}`} className="btn-text inline-flex items-center gap-1 text-sm">
          <ArrowLeft className="w-4 h-4" /> Back to proposal
        </Link>
        <button className="btn-primary inline-flex items-center gap-2" onClick={() => window.print()}>
          <Printer className="w-4 h-4" /> Save as PDF / Print
        </button>
      </div>

      <article className="relative max-w-[210mm] mx-auto bg-white p-[15mm] text-[11pt] leading-snug shadow print:shadow-none print:p-0 text-black">
        {!approved && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none" aria-hidden>
            <span className="text-[64pt] font-black text-black/5 -rotate-30 uppercase">{PROPOSAL_STATUS_LABEL[p.status]}</span>
          </div>
        )}

        <header className="flex justify-between items-start border-b-2 border-black pb-3 mb-4">
          <div>
            <p className="text-[9pt] uppercase tracking-widest">ONE LSPU · Event Proposal Packet</p>
            <h1 className="text-[18pt] font-black leading-tight">{p.title}</h1>
            <p className="text-[10pt]">{organization?.name} ({organization?.acronym})</p>
          </div>
          <div className="text-right text-[9pt] flex gap-3 items-start">
            <div>
              <p className="font-mono font-bold text-[11pt]">{p.reference_no}</p>
              <p>Revision {p.revision}</p>
              <p>Status: <strong>{PROPOSAL_STATUS_LABEL[p.status]}</strong></p>
              {p.decided_at && <p>Decided {formatDateTime(p.decided_at)}</p>}
            </div>
            {p.reference_no && <QRCodeSVG value={verifyUrl} size={72} level="M" />}
          </div>
        </header>

        <Section title="1. Event information">
          <Grid
            rows={[
              ['Event type', EVENT_TYPE_LABEL[p.event_type]],
              ['Schedule', `${formatDateTime(p.start_datetime)} – ${formatDateTime(p.end_datetime)}`],
              ['Venue', facility ? `${facility.name} (${facility.facility_code}), capacity ${facility.capacity}` : '—'],
              ['Expected attendees', String(p.expected_attendees)],
              ['Equipment', p.requested_equipment.join(', ') || 'None'],
              ['Filed by', `${people[p.submitted_by]?.full_name ?? '—'} on ${formatDateTime(p.submitted_at)}`],
            ]}
          />
        </Section>

        <Section title="2. Description & rationale">
          <p className="whitespace-pre-line">{p.description || '—'}</p>
        </Section>

        <Section title="3. Objectives">
          <p className="whitespace-pre-line">{p.objectives || '—'}</p>
        </Section>

        <Section title={`4. Budget (${formatPeso(budgetTotal(budget))})`}>
          {budget.length === 0 ? (
            <p>No expenses declared.</p>
          ) : (
            <table className="w-full text-[10pt] border-collapse">
              <thead>
                <tr className="border-b border-black text-left">
                  <th className="py-1">Item</th><th>Qty</th><th>Unit cost</th><th>Source</th><th className="text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {budget.map((b) => (
                  <tr key={b.id} className="border-b border-black/20">
                    <td className="py-1">{b.description}</td>
                    <td>{b.quantity}</td>
                    <td>{formatPeso(b.unit_cost)}</td>
                    <td>{FUND_LABEL[b.source_of_funds]}</td>
                    <td className="text-right">{formatPeso(b.quantity * b.unit_cost)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Section>

        <Section title="5. Attachments on file">
          {attachments.length === 0 ? <p>None.</p> : (
            <ul className="list-disc pl-5">
              {attachments.map((a) => <li key={a.id}>{ATTACHMENT_LABEL[a.doc_type]}: {a.file_name}</li>)}
            </ul>
          )}
        </Section>

        <Section title="6. Approvals">
          <div className="grid grid-cols-3 gap-3 break-inside-avoid">
            {steps.map((s) => (
              <div key={s.id} className="border border-black p-2 min-h-[34mm] flex flex-col">
                <p className="text-[8pt] uppercase tracking-wider">Step {s.step_order}</p>
                <p className="font-bold text-[10pt]">{s.label}</p>
                {s.status === 'approved' ? (
                  <>
                    <p className="mt-auto font-semibold">{people[s.acted_by ?? '']?.full_name}</p>
                    <p className="text-[8pt]">Digitally approved {formatDateTime(s.acted_at)}</p>
                    <p className="text-[7pt] font-mono break-all mt-1">SIG {s.signature?.slice(0, 32)}</p>
                  </>
                ) : (
                  <p className="mt-auto text-[9pt] uppercase">{s.status === 'waiting' ? 'Pending' : s.status}</p>
                )}
              </div>
            ))}
          </div>
        </Section>

        <footer className="mt-6 pt-2 border-t border-black text-[8pt] flex justify-between">
          <span>Verify this document: {verifyUrl}</span>
          <span>Generated {formatDateTime(new Date().toISOString())}</span>
        </footer>
      </article>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-4 break-inside-avoid">
      <h2 className="text-[10pt] font-black uppercase tracking-wider border-b border-black mb-1.5">{title}</h2>
      {children}
    </section>
  )
}

function Grid({ rows }: { rows: [string, string][] }) {
  return (
    <dl className="grid grid-cols-[38mm_1fr] gap-y-0.5">
      {rows.map(([k, v]) => (
        <div key={k} className="contents">
          <dt className="font-semibold">{k}</dt>
          <dd>{v}</dd>
        </div>
      ))}
    </dl>
  )
}
