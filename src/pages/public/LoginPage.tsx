import React, { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Mail, Lock, ArrowRight, User, Eye, EyeOff } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../features/auth/AuthContext'

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    try {
      setIsLoading(true)
      await signIn(email, password)

      // user profile is loaded asynchronously by the auth listener;
      // fetch it directly so the role-based redirect fires correctly.
      let role = 'student'
      try {
        const { data } = await supabase
          .from('profiles')
          .select('primary_role')
          .eq('email', email)
          .single()
        role = data?.primary_role ?? 'student'
      } catch {
        /* keep default student role if profile lookup fails */
      }
      const defaultPath =
        role === 'officer'
          ? '/proposals'
          : ['adviser', 'college_dean', 'osas', 'campus_director', 'university_president', 'osa_staff', 'facility_admin', 'system_admin'].includes(role)
            ? '/approvals'
            : '/explorer'
      const from = (location.state as { from?: { pathname: string } })?.from?.pathname || defaultPath
      navigate(from)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left — black panel */}
      <div className="hidden lg:flex w-1/2 bg-[var(--accent-deep)] flex-col justify-between p-12 lg:p-16">
        <div>
          <div className="w-10 h-10 rounded-sm border-[var(--accent)] bg-[var(--accent)] flex items-center justify-center mb-6">
            <BuildingIcon className="w-6 h-6 text-[var(--paper)]" />
          </div>
          <h1 className="text-3xl font-black text-[var(--paper)] leading-tight">
            ONE LSPU<br />
            Campus access,<br />
            from any screen.
          </h1>
          <p className="mt-6 text-[var(--paper)]/60 text-sm leading-relaxed max-w-md">
            Sign in to your ONE LSPU account to explore buildings, check floor-plan availability,
            and submit reservation requests.
          </p>
        </div>
        <div className="mt-8">
          <p className="text-xs text-[var(--paper)]/40 uppercase tracking-widest font-semibold mb-3">
            Active Demo & Testing Accounts
          </p>
          <div className="space-y-3 text-xs text-[var(--paper)]/80">
            <div>
              <p className="text-[var(--paper)]/40 font-semibold uppercase tracking-wider mb-1">Student Org Officers (Proposals & Org Dashboard)</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5">
                <div>
                  <span className="font-mono font-bold text-[var(--paper)]">octa.president@campus.edu</span>
                  <span className="text-[var(--paper)]/50 block">OCTA — Organization for Computing and Technology Advancements (+ octa.secretary@)</span>
                </div>
                <div>
                  <span className="font-mono font-bold text-[var(--paper)]">algo.president@campus.edu</span>
                  <span className="text-[var(--paper)]/50 block">ALGO — CS Sub-Org (+ algo.secretary@)</span>
                </div>
                <div>
                  <span className="font-mono font-bold text-[var(--paper)]">bsit.president@campus.edu</span>
                  <span className="text-[var(--paper)]/50 block">BSIT — IT Sub-Org (+ bsit.secretary@)</span>
                </div>
                <div>
                  <span className="font-mono font-bold text-[var(--paper)]">coesc.president@campus.edu</span>
                  <span className="text-[var(--paper)]/50 block">COESC — College of Engineering Student Council (+ coesc.secretary@)</span>
                </div>
                <div>
                  <span className="font-mono font-bold text-[var(--paper)]">officer@campus.edu</span>
                  <span className="text-[var(--paper)]/50 block">Generic Officer (OCTA Fallback)</span>
                </div>
              </div>
            </div>

            <div>
              <p className="text-[var(--paper)]/40 font-semibold uppercase tracking-wider mb-1">Approval Hierarchy (Steps 1–5)</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
                <div>
                  <span className="font-mono font-bold text-[var(--paper)]">adviser@campus.edu</span>
                  <span className="text-[var(--paper)]/50 block">1. Org Adviser</span>
                </div>
                <div>
                  <span className="font-mono font-bold text-[var(--paper)]">dean@campus.edu</span>
                  <span className="text-[var(--paper)]/50 block">2. College Dean (CCS)</span>
                </div>
                <div>
                  <span className="font-mono font-bold text-[var(--paper)]">osas@campus.edu</span>
                  <span className="text-[var(--paper)]/50 block">3. OSAS Staff</span>
                </div>
                <div>
                  <span className="font-mono font-bold text-[var(--paper)]">director@campus.edu</span>
                  <span className="text-[var(--paper)]/50 block">4. Campus Director</span>
                </div>
                <div>
                  <span className="font-mono font-bold text-[var(--paper)]">president@campus.edu</span>
                  <span className="text-[var(--paper)]/50 block">5. Univ. President</span>
                </div>
                <div>
                  <span className="font-mono font-bold text-[var(--paper)]">admin@campus.edu</span>
                  <span className="text-[var(--paper)]/50 block">Facility / Sys Admin</span>
                </div>
              </div>
            </div>
          </div>
          <p className="mt-3 text-xs text-[var(--paper)]/50">
            Default password for demo accounts: <span className="font-mono font-bold text-[var(--paper)]">Demo1234!</span>
          </p>
        </div>
      </div>

      {/* Right — white form */}
      <div className="flex-1 flex items-center justify-center bg-[var(--paper)] p-8 sm:p-12">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <h1 className="text-2xl font-extrabold text-[var(--ink)]">Welcome back</h1>
            <p className="text-[var(--muted)] mt-1">Sign in to your ONE LSPU account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
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
                aria-describedby={error ? 'login-error' : undefined}
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
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-sm border border-[var(--line)] bg-[var(--paper)] text-[var(--ink)] focus:border-[var(--line-strong)] pr-10"
                  placeholder="••••••••"
                  aria-describedby={error ? 'login-error' : undefined}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[var(--muted)] hover:text-[var(--accent-text)]"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div id="login-error" className="rounded-sm border-[var(--line-strong)] p-3.5 bg-[var(--ink-dark)] text-[var(--paper)] text-xs flex items-start gap-2" role="alert">
                <span className="text-[var(--paper)] shrink-0 mt-0.5">✕</span>
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-[var(--accent)] rounded-sm border border-[var(--accent)] hover:bg-[var(--accent-strong)] hover:border-[var(--accent-strong)] text-[var(--accent-ink)] font-semibold text-sm  transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/60 border-t-transparent rounded-full animate-spin"></span>
                  Signing in...
                </>
              ) : (
                <>
                  <ArrowRight className="w-4 h-4" />
                  Log in
                </>
              )}
            </button>
          </form>
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
