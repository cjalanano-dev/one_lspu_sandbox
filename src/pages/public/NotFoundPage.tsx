import { Link } from 'react-router-dom'
import { Compass } from 'lucide-react'

export function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="w-full max-w-md p-6 text-center">
        <div className="w-16 h-16 rounded-sm bg-black flex items-center justify-center mx-auto mb-6">
          <Compass className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl font-extrabold text-[var(--ink)] mb-2">Page not found</h1>
        <p className="text-[var(--muted)] mb-8">
          The page you're looking for doesn't exist.
        </p>
        <Link
          to="/"
          className="px-6 py-3 rounded-sm bg-[var(--line-strong)] text-white font-medium hover:bg-[#1a1a1a] transition"
        >
          Back to home
        </Link>
      </div>
    </div>
  )
}
