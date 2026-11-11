import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ShieldCheck, ShieldAlert } from 'lucide-react'
import { proposalStore, PROPOSAL_STATUS_LABEL } from '../../lib/proposals'
import { formatDateTime } from '../../lib/utils'

type Result = Awaited<ReturnType<typeof proposalStore.verify>>

/** Public page reached by scanning the QR code on a printed packet. */
export function VerifyProposalPage() {
  const { reference = '' } = useParams()
  const [result, setResult] = useState<Result | undefined>(undefined)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    proposalStore.verify(reference).then(setResult).catch((e) => setError(e.message))
  }, [reference])

  if (error) return <Shell><p role="alert">{error}</p></Shell>
  if (result === undefined) return <Shell><p className="text-sm">Checking {reference}…</p></Shell>

  if (!result)
    return (
      <Shell>
        <ShieldAlert className="w-10 h-10 mb-3" />
        <h1 className="text-xl font-black">No record found</h1>
        <p className="text-sm text-[hsl(var(--muted))]">Reference <span className="font-mono">{reference}</span> does not match any filed proposal. Treat this document as invalid.</p>
      </Shell>
    )

  const valid = result.status === 'approved'
  return (
    <Shell>
      {valid ? <ShieldCheck className="w-10 h-10 mb-3" /> : <ShieldAlert className="w-10 h-10 mb-3" />}
      <p className="text-xs font-bold uppercase tracking-widest">{valid ? 'Verified: fully approved' : `Status: ${PROPOSAL_STATUS_LABEL[result.status]}`}</p>
      <h1 className="text-xl font-black">{result.title}</h1>
      <p className="text-sm text-[hsl(var(--muted))]">
        {result.organization} · <span className="font-mono">{result.reference_no}</span> · rev {result.revision}
      </p>
      <p className="text-sm mt-1">{formatDateTime(result.start_datetime)} – {formatDateTime(result.end_datetime)}</p>
      <ul className="mt-4 divide-y divide-[hsl(var(--line))] border border-[hsl(var(--line))] text-left">
        {result.steps.map((s) => (
          <li key={s.label} className="p-3 text-sm">
            <p className="font-bold">{s.label}: <span className="uppercase text-xs">{s.status}</span></p>
            {s.approver && <p>{s.approver} · {formatDateTime(s.acted_at)}</p>}
            {s.signature && <p className="font-mono text-xs break-all text-[hsl(var(--muted))]">SIG {s.signature}</p>}
          </li>
        ))}
      </ul>
    </Shell>
  )
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="panel p-8 max-w-lg w-full text-center flex flex-col items-center">
        {children}
        <Link to="/" className="btn-text text-xs mt-6">ONE Facility</Link>
      </div>
    </main>
  )
}
