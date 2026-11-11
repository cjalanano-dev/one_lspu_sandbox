import { Link } from 'react-router-dom'
import { ShieldAlert } from 'lucide-react'

export function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--paper)]">
      <div className="w-full max-w-md p-6 text-center">
        <div className="w-16 h-16 rounded-sm bg-[var(--ink-dark)] flex items-center justify-center mx-auto mb-6">
          <ShieldAlert className="w-8 h-8 text-[var(--paper)]" />
        </div>
        <h1 className="text-2xl font-extrabold text-[var(--ink)] mb-2">Not authorized</h1>
        <p className="text-[var(--muted)] mb-8">
          Your account doesn't have permission to open this page.
        </p>
        <Link
          to="/"
          className="px-6 py-3 rounded-sm bg-[var(--line-strong)] text-[var(--paper)] font-medium hover:bg-[var(--ink-dark)] transition"
        >
          Back to home
        </Link>
      </div>
    </div>
  )
}
