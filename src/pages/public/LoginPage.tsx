import React, { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
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
        role === 'officer' ? '/organization' : role === 'facility_admin' || role === 'system_admin' ? '/admin' : '/explorer'
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
      <div className="hidden lg:flex w-1/2 bg-black flex-col justify-between p-12 lg:p-16">
        <div>
          <div className="w-10 h-10 rounded-sm border border-white bg-black flex items-center justify-center mb-6">
            <BuildingIcon className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-3xl font-black text-white leading-tight">
            ONE FACILITY<br />
            Campus access,<br />
            from any screen.
          </h1>
          <p className="mt-6 text-white/60 text-sm leading-relaxed max-w-md">
            Sign in to your ONE Facility account to explore buildings, check floor-plan availability,
            and submit reservation requests.
          </p>
        </div>
        {/* <div className="mt-12">
          <p className="text-xs text-white/40 uppercase tracking-widest font-semibold mb-2">
            Demo accounts
          </p>
          <ul className="space-y-2 text-sm text-white/70 leading-relaxed">
            <li>
              <span className="font-mono font-bold text-white">student@campus.edu</span>
              <span className="ml-2 font-normal text-white/50">· Student</span>
            </li>
            <li>
              <span className="font-mono font-bold text-white">officer@campus.edu</span>
              <span className="ml-2 font-normal text-white/50">· Organization officer</span>
            </li>
            <li>
              <span className="font-mono font-bold text-white">admin@campus.edu</span>
              <span className="ml-2 font-normal text-white/50">· Facility administrator</span>
            </li>
            <li className="mt-3">
              <span className="font-mono font-bold text-white">Demo1234!</span>
              <span className="ml-2 font-normal text-white/50">· All accounts</span>
            </li>
          </ul>
        </div> */}
      </div>

      {/* Right — white form */}
      <div className="flex-1 flex items-center justify-center bg-white p-8 sm:p-12">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <h1 className="text-2xl font-extrabold text-[var(--ink)]">Welcome back</h1>
            <p className="text-[var(--muted)] mt-1">Sign in to your ONE Facility account</p>
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
                className="w-full px-3.5 py-2.5 rounded-sm border border-[var(--line)] bg-white text-[var(--ink)] focus:border-[var(--line-strong)]"
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
                  className="w-full px-3.5 py-2.5 rounded-sm border border-[var(--line)] bg-white text-[var(--ink)] focus:border-[var(--line-strong)] pr-10"
                  placeholder="••••••••"
                  aria-describedby={error ? 'login-error' : undefined}
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

            {error && (
              <div id="login-error" className="rounded-sm border border-black p-3.5 bg-black text-white text-xs flex items-start gap-2" role="alert">
                <span className="text-white shrink-0 mt-0.5">✕</span>
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-[#1a1a1a] rounded-sm border border-[var(--line-strong)] hover:bg-[#1a1a1a] hover:border-[var(--ink)] text-white font-semibold text-sm  transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/60 border-t-transparent rounded-full animate-spin"></span>
                  Signing in...
                </>
              ) : (
                <>
                  <ArrowRight className="w-4 h-4" />
                  Sign in
                </>
              )}
            </button>
          </form>

          <div className="text-center text-xs text-[var(--muted)]">
            Don't have an account?{' '}
            <Link to="/register" className="font-medium text-[var(--ink)] hover:underline">
              Create one
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
