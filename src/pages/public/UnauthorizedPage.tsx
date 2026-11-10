import { Link } from 'react-router-dom'
import { ShieldAlert } from 'lucide-react'

export function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="w-full max-w-md p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-rose-50 flex items-center justify-center mx-auto mb-6">
          <ShieldAlert className="w-8 h-8 text-rose-600" />
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900 mb-2">Not authorized</h1>
        <p className="text-slate-600 mb-8">
          Your account role is not permitted to view this page.
        </p>
        <Link
          to="/"
          className="px-6 py-3 rounded-xl bg-slate-900 text-white font-medium hover:bg-slate-800 transition"
        >
          Back to home
        </Link>
      </div>
    </div>
  )
}
