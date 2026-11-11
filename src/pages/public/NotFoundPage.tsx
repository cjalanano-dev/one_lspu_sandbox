import { Link } from 'react-router-dom'
import { Compass } from 'lucide-react'

export function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--paper)]">
      <div className="w-full max-w-md p-6 text-center">
        <div className="w-16 h-16 rounded-sm bg-[var(--ink-dark)] flex items-center justify-center mx-auto mb-6">
          <Compass className="w-8 h-8 text-[var(--paper)]" />
        </div>
        <h1 className="text-2xl font-extrabold text-[var(--ink)] mb-2">Page not found</h1>
        <p className="text-[var(--muted)] mb-8">
          The page you're looking for doesn't exist.
        </p>
        <Link
          to="/"
          className="px-6 py-3 rounded-sm bg-[var(--accent)] text-[var(--accent-ink)] font-medium hover:bg-[var(--accent-strong)] transition"
        >
          Back to home
        </Link>
      </div>
    </div>
  )
}
