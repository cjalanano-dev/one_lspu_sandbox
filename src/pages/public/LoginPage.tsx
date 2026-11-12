import React, { useState } from 'react'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import { ArrowRight, Eye, EyeOff } from 'lucide-react'
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
          : ['adviser', 'college_dean', 'osas', 'campus_director', 'university_president', 'osa_staff'].includes(role)
            ? '/approvals'
            : ['facility_admin', 'system_admin'].includes(role)
              ? '/admin'
              : '/'

      const from = (location.state as { from?: { pathname: string } })?.from?.pathname || defaultPath
      navigate(from)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed. Please verify your institutional credentials.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[var(--paper)]">
      {/* Left — Architectural Carbon Identity Panel (50%) */}
      <div className="lg:w-1/2 bg-[var(--ink)] text-[var(--paper)] flex flex-col justify-between p-10 sm:p-16 border-b lg:border-b-0 lg:border-r border-[var(--ink-soft)]">
        <div>
          <Link to="/" className="inline-flex items-center gap-3 group">
            <img src="/logo.png" alt="ONE LSPU logo" className="w-11 h-11 object-contain shrink-0" />
            <div>
              <span className="font-bold tracking-tight text-lg text-[var(--paper)] flex items-center gap-1.5">
                ONE LSPU
              </span>
            </div>
          </Link>
        </div>

        <div className="my-12 lg:my-0 max-w-md space-y-5">
          <h1 className="text-3xl sm:text-4xl font-bold text-[var(--paper)] tracking-tight leading-tight">
            Unified Student Organization &amp; Facility Governance Portal
          </h1>
          <p className="text-sm text-[var(--paper)]/70 leading-relaxed">
            Sign in with your provisioned institutional credentials to access your role-isolated workspace, inspect schematic building plans, and manage reservations or digital signatory clearances.
          </p>
        </div>

        <div className="flex items-center justify-between text-xs text-[var(--paper)]/55 border-t border-[var(--ink-soft)] pt-6 font-mono">
          <span>© 2026 ONE LSPU</span>
          <Link to="/" className="text-[var(--accent-line)] hover:underline font-sans font-medium">
            Return to public directory →
          </Link>
        </div>
      </div>

      {/* Right — Pure Paper Sign-In Form (50%) */}
      <div className="lg:w-1/2 flex items-center justify-center bg-[var(--paper)] p-8 sm:p-16">
        <div className="w-full max-w-sm space-y-8">
          <div className="space-y-2 border-b border-[var(--line)] pb-4">
            <h2 className="text-2xl font-bold text-[var(--ink)] tracking-tight">
              Sign in to your account
            </h2>
            <p className="text-xs text-[var(--muted)]">
              Enter your institutional email address and password to continue.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="field-label">
                Email address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="field-input font-mono text-xs"
                placeholder="name@campus.edu"
                aria-describedby={error ? 'login-error' : undefined}
              />
            </div>

            <div>
              <label htmlFor="password" className="field-label">
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
                  className="field-input pr-10"
                  placeholder="••••••••"
                  aria-describedby={error ? 'login-error' : undefined}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[var(--muted)] hover:text-[var(--accent-text)] cursor-pointer"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div
                id="login-error"
                className="rounded-[var(--radius)] border border-[var(--line-strong)] p-3.5 bg-[var(--ink-dark)] text-[var(--paper)] text-xs flex items-start gap-2 font-medium"
                role="alert"
              >
                <span className="shrink-0 font-mono">ERR</span>
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-[var(--radius)] bg-[var(--accent)] hover:bg-[var(--accent-strong)] text-[var(--accent-ink)] font-semibold text-xs uppercase tracking-wider transition disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              {isLoading ? (
                <span>Authenticating session…</span>
              ) : (
                <>
                  Sign in to workspace
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
