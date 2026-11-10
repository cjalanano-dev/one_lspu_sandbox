import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, Lock, User, ArrowRight, Building2 } from 'lucide-react'
import { useAuth } from '../../features/auth/AuthContext'

interface RoleOption {
  value: string
  label: string
  description: string
}

const ROLE_OPTIONS: RoleOption[] = [
  {
    value: 'student',
    label: 'Student',
    description: 'Explore facilities and submit personal reservation requests',
  },
  {
    value: 'faculty',
    label: 'Faculty Member',
    description: 'Explore and request campus facilities',
  },
  {
    value: 'officer',
    label: 'Organization Officer',
    description: 'Manage organization activities and reservations',
  },
]

export function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [role, setRole] = useState<RoleOption>(ROLE_OPTIONS[0])
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { signUp } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      await signUp(email, password, {
        full_name: fullName,
        primary_role: role.value,
        department: '',
        student_or_employee_id: '',
      })
      navigate('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="w-full max-w-md space-y-8 p-6">
        <div className="text-center">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900">Create account</h1>
          <p className="text-slate-500 mt-1">Join ONE Facility as a campus user</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="full_name" className="block text-sm font-medium text-slate-700">
              Full name
            </label>
            <input
              id="full_name"
              type="text"
              autoComplete="name"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
              aria-describedby={error ? 'register-error' : undefined}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="email" className="block text-sm font-medium text-slate-700">
              Email address
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
              aria-describedby={error ? 'register-error' : undefined}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="block text-sm font-medium text-slate-700">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
              aria-describedby={error ? 'register-error' : undefined}
            />
          </div>

          <div className="space-y-2">
            <legend className="block text-sm font-medium text-slate-700 mb-1">
              Account role
            </legend>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2" role="radiogroup" aria-labelledby="register-role-label">
              {ROLE_OPTIONS.map((opt) => (
                <div
                  key={opt.value}
                  className="rounded-xl border p-3 transition flex flex-col items-start gap-1 cursor-pointer hover:bg-slate-50"
                >
                  <input
                    type="radio"
                    name="account_role"
                    value={opt.value}
                    checked={role.value === opt.value}
                    onChange={() => setRole(opt)}
                    className="sr-only peer"
                  />
                  <div
                    role="radio"
                    aria-checked={role.value === opt.value}
                    tabIndex={0}
                    onClick={() => setRole(opt)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        setRole(opt)
                      }
                    }}
                    className={`flex flex-col items-start gap-1 w-full rounded-xl border px-3 py-2 text-sm font-medium transition ${
                      role.value === opt.value
                        ? 'bg-sky-50 border-sky-200 text-sky-700'
                        : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 peer-focus-visible:ring-2 peer-focus-visible:ring-sky-500'
                    }`}
                  >
                    <div className="font-semibold">{opt.label}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{opt.description}</div>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Admin accounts cannot be self-registered.</p>
          </div>

          {error && (
            <div id="register-error" className="rounded-xl bg-rose-50 border border-rose-200 p-3.5 text-xs text-rose-700 flex items-start gap-2" role="alert">
              <span className="text-rose-600 shrink-0 mt-0.5">✕</span>
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold shadow-md transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <ArrowRight className="w-4 h-4 animate-spin" />
                Creating account...
              </>
            ) : (
              <>
                <ArrowRight className="w-4 h-4" />
                Create account
              </>
            )}
          </button>
        </form>

        <div className="text-center text-xs text-slate-500">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-sky-600 hover:underline">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  )
}
