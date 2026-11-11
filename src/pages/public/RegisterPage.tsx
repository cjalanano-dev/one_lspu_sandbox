import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, Lock, User, ArrowRight, Eye, EyeOff } from 'lucide-react'
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
    label: 'Org President / Secretary',
    description: 'Manage student organization activities and draft event proposals',
  },
]

export function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
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
    <div className="min-h-screen flex">
      {/* Left — black panel */}
      <div className="hidden lg:flex w-1/2 bg-[var(--ink-dark)] flex-col justify-between p-12 lg:p-16">
        <div>
          <div className="w-10 h-10 rounded-sm border-[var(--line-strong)] bg-[var(--ink-dark)] flex items-center justify-center mb-6">
            <BuildingIcon className="w-6 h-6 text-[var(--paper)]" />
          </div>
          <h1 className="text-3xl font-black text-[var(--paper)] leading-tight">
            Create your campus<br />
            account.
          </h1>
          <p className="mt-6 text-[var(--paper)]/60 text-sm leading-relaxed max-w-md">
            Register as a student, faculty member, or organization officer to reserve facilities
            on behalf of yourself or your organization.
          </p>
        </div>
        <div className="mt-12">
          <p className="text-xs text-[var(--paper)]/40 uppercase tracking-widest font-semibold mb-2">
            Roles
          </p>
          <ul className="space-y-2 text-sm text-[var(--paper)]/70 leading-relaxed">
            <li>
              <span className="font-mono font-bold text-[var(--paper)]">Student</span>
              <span className="ml-2 font-normal text-[var(--paper)]/50">· Personal reservations</span>
            </li>
            <li>
              <span className="font-mono font-bold text-[var(--paper)]">Faculty</span>
              <span className="ml-2 font-normal text-[var(--paper)]/50">· Personal reservations</span>
            </li>
            <li>
              <span className="font-mono font-bold text-[var(--paper)]">Organization officer</span>
              <span className="ml-2 font-normal text-[var(--paper)]/50">· Activity-linked reservations</span>
            </li>
            <li className="mt-3">
              <span className="font-mono font-bold text-[var(--paper)]">Facility administrator</span>
              <span className="ml-2 font-normal text-[var(--paper)]/50">· Created manually by IT</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Right — white form */}
      <div className="flex-1 flex items-center justify-center bg-[var(--paper)] p-8 sm:p-12">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <h1 className="text-2xl font-extrabold text-[var(--ink)]">Create account</h1>
            <p className="text-[var(--muted)] mt-1">Join ONE LSPU as a campus user</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="full_name" className="block text-sm font-medium text-[var(--ink)]">
                Full name
              </label>
              <input
                id="full_name"
                type="text"
                autoComplete="name"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-sm border border-[var(--line)] bg-[var(--paper)] text-[var(--ink)] focus:border-[var(--line-strong)]"
                placeholder="e.g. johndoe"
                aria-describedby={error ? 'register-error' : undefined}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium text-[var(--ink)]">
                Email address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-sm border border-[var(--line)] bg-[var(--paper)] text-[var(--ink)] focus:border-[var(--line-strong)]"
                placeholder="e.g. student@campus.edu"
                aria-describedby={error ? 'register-error' : undefined}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-medium text-[var(--ink)]">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-sm border border-[var(--line)] bg-[var(--paper)] text-[var(--ink)] focus:border-[var(--line-strong)] pr-10"
                  placeholder="••••••••"
                  aria-describedby={error ? 'register-error' : undefined}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[var(--muted)] hover:text-[var(--ink)]"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <legend className="block text-sm font-medium text-[var(--ink)] mb-1">
                Account role
              </legend>
              <div
                className="grid grid-cols-1 sm:grid-cols-3 gap-2"
                role="radiogroup"
                aria-labelledby="register-role-label"
              >
                {ROLE_OPTIONS.map((opt) => {
                  const selected = role.value === opt.value
                  return (
                    <div
                      key={opt.value}
                      className={`flex flex-col items-start gap-1 w-full rounded-sm border px-3 py-2 text-sm font-medium transition ${
                        selected
                          ? 'bg-[var(--ink-dark)] border-[var(--line-strong)] text-[var(--paper)]'
                          : 'border-[var(--line)] text-[var(--ink)] hover:border-[var(--line-strong)] hover:bg-[var(--surface-2)]'
                      }`}
                    >
                      <input
                        type="radio"
                        name="account_role"
                        value={opt.value}
                        checked={selected}
                        onChange={() => setRole(opt)}
                        className="sr-only peer"
                      />
                      <div
                        role="radio"
                        aria-checked={selected}
                        tabIndex={0}
                        onClick={() => setRole(opt)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault()
                            setRole(opt)
                          }
                        }}
                      >
                        <div className="font-semibold">{opt.label}</div>
                        <div className="text-xs text-[var(--muted)] mt-0.5">{opt.description}</div>
                      </div>
                    </div>
                  )
                })}
              </div>
              
            </div>

            {error && (
              <div id="register-error" className="rounded-sm border-[var(--line-strong)] p-3.5 bg-[var(--ink-dark)] text-[var(--paper)] text-xs flex items-start gap-2" role="alert">
                <span className="text-[var(--paper)] shrink-0 mt-0.5">✕</span>
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-sm border border-[var(--line-strong)] bg-[var(--ink-dark)] hover:bg-[var(--ink-dark)] hover:border-[var(--ink)] text-[var(--paper)] font-semibold text-sm  transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/60 border-t-transparent rounded-full animate-spin"></span>
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

          <div className="text-center text-xs text-[var(--muted)]">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-[var(--ink)] hover:underline">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

function BuildingIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M3 4V21h18V4h-6v3h-6V4z" />
    </svg>
  )
}
