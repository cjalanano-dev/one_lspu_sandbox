
import React, { useState } from 'react'

import { Link, useLocation, useNavigate } from 'react-router-dom'

import {
  Mail,
  Lock,
  ArrowRight,
  Eye,
  EyeOff,
  ShieldCheck,
  Compass,
  Building2,
  Sparkles,
} from 'lucide-react'

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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')

    try {
      setIsLoading(true)
      await signIn(email, password)

      // Retrieve the user's role for the correct redirect.
      let role = 'student'

      try {
        const { data } = await supabase
          .from('profiles')
          .select('primary_role')
          .eq('email', email)
          .single()

        role = data?.primary_role ?? 'student'
      } catch {
        // Default to student if profile lookup fails.
      }

      const defaultPath =
        role === 'officer'
          ? '/proposals'
          : [
              'adviser',
              'college_dean',
              'osas',
              'campus_director',
              'university_president',
              'osa_staff',
              'facility_admin',
              'system_admin',
            ].includes(role)
            ? '/approvals'
            : '/explorer'

      const from = (
        location.state as { from?: { pathname: string } }
      )?.from?.pathname || defaultPath

      navigate(from)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Login failed. Please try again.'
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F4F8FC] flex">

      {/* LEFT PANEL */}
      <section className="hidden lg:flex relative overflow-hidden w-1/2 min-h-screen flex-col justify-between p-12 xl:p-16 bg-gradient-to-br from-[#0B2438] via-[#123B5A] to-[#1C4F73]">

        {/* Decorative gradient lighting */}
        <div className="absolute -top-32 -right-20 w-96 h-96 bg-[#7DAACB]/20 rounded-full blur-[100px] pointer-events-none" />

        <div className="absolute bottom-0 -left-20 w-96 h-96 bg-[#B8D2E8]/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="absolute top-1/2 right-0 w-64 h-64 bg-[#4F83A8]/15 rounded-full blur-[90px] pointer-events-none" />

        {/* Subtle grid texture */}
        <div
          className="absolute inset-0 opacity-[0.06] pointer-events-none"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
            backgroundSize: '55px 55px',
          }}
        />

        {/* BRAND */}
        <div className="relative z-10">
          <Link to="/" className="inline-flex items-center gap-3 group">

            <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 backdrop-blur-md flex items-center justify-center transition duration-300 group-hover:bg-white/20 group-hover:scale-105">
              <img
                src="/logo.png"
                alt="ONE LSPU Logo"
                className="w-9 h-9 object-contain"
              />
            </div>

            <div>
              <h2 className="text-white font-extrabold text-xl tracking-tight">
                ONE LSPU
              </h2>

              <p className="text-[#D5E5F2]/70 text-[10px] uppercase tracking-[0.25em] font-semibold">
                Unified Campus Platform
              </p>
            </div>

          </Link>
        </div>

        {/* HERO CONTENT */}
        <div className="relative z-10 max-w-xl py-12">

          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#D5E5F2]/20 bg-white/10 backdrop-blur-md text-[#E3EDF6] text-xs font-semibold mb-8">
            <Sparkles className="w-4 h-4 text-[#C4D9EB]" />
            Your campus, connected.
          </div>

          <h1 className="text-5xl xl:text-6xl font-black text-white leading-[1.12] tracking-tight">
            One campus.
            <br />

            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#B8D1E5] via-[#E6EFF7] to-white">
              Endless
              <br />
              possibilities.
            </span>
          </h1>

          <p className="mt-7 text-[#D5E5F2]/75 text-base xl:text-lg leading-relaxed max-w-md">
            Discover campus facilities, explore available spaces,
            and manage reservations — all in one connected platform
            built for the LSPU community.
          </p>

          {/* FEATURE ITEMS */}
          <div className="grid grid-cols-2 gap-4 mt-12 max-w-md">

            <div className="group flex items-center gap-3 p-4 rounded-2xl bg-white/[0.07] border border-white/10 backdrop-blur-md transition duration-300 hover:bg-white/[0.14] hover:-translate-y-1 hover:border-[#B8D1E5]/40">

              <div className="w-10 h-10 rounded-xl bg-[#A9C6DF]/20 flex items-center justify-center">
                <Compass className="w-5 h-5 text-[#D5E5F2]" />
              </div>

              <div>
                <p className="text-white text-sm font-bold">Explore</p>
                <p className="text-[#D5E5F2]/55 text-xs">Campus spaces</p>
              </div>

            </div>

            <div className="group flex items-center gap-3 p-4 rounded-2xl bg-white/[0.07] border border-white/10 backdrop-blur-md transition duration-300 hover:bg-white/[0.14] hover:-translate-y-1 hover:border-[#B8D1E5]/40">

              <div className="w-10 h-10 rounded-xl bg-[#A9C6DF]/20 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-[#D5E5F2]" />
              </div>

              <div>
                <p className="text-white text-sm font-bold">Discover</p>
                <p className="text-[#D5E5F2]/55 text-xs">Campus facilities</p>
              </div>

            </div>

          </div>
        </div>

        {/* DEMO ACCOUNTS */}
        <div className="relative z-10 border-t border-white/10 pt-6">

          <details className="group">

            <summary className="cursor-pointer list-none flex items-center justify-between text-[#D5E5F2]/70 hover:text-white transition text-xs font-semibold uppercase tracking-widest">

              <span className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" />
                Demo & Testing Accounts
              </span>

              <span className="text-[#D5E5F2] transition-transform duration-300 group-open:rotate-180">
                ↓
              </span>

            </summary>

            <div className="mt-5 space-y-4 text-xs text-[#D5E5F2]/70">

              <div>
                <p className="text-[#C3D8EA] font-bold uppercase tracking-wider mb-2">
                  Organization Officer
                </p>

                <p className="font-mono text-white">officer@campus.edu</p>
                <p>OCTA President / Org Officer</p>
              </div>

              <div>
                <p className="text-[#C3D8EA] font-bold uppercase tracking-wider mb-2">
                  Approval Hierarchy
                </p>

                <div className="grid grid-cols-2 gap-3">

                  <div>
                    <p className="font-mono text-white">adviser@campus.edu</p>
                    <p>1. Org Adviser</p>
                  </div>

                  <div>
                    <p className="font-mono text-white">dean@campus.edu</p>
                    <p>2. College Dean</p>
                  </div>

                  <div>
                    <p className="font-mono text-white">osas@campus.edu</p>
                    <p>3. OSAS Staff</p>
                  </div>

                  <div>
                    <p className="font-mono text-white">director@campus.edu</p>
                    <p>4. Campus Director</p>
                  </div>

                  <div>
                    <p className="font-mono text-white">president@campus.edu</p>
                    <p>5. University President</p>
                  </div>

                  <div>
                    <p className="font-mono text-white">admin@campus.edu</p>
                    <p>Facility / System Admin</p>
                  </div>

                </div>
              </div>

              <p className="border-t border-white/10 pt-3">
                Default demo password:{' '}
                <span className="font-mono text-white font-bold">
                  Demo1234!
                </span>
              </p>

            </div>
          </details>

          <p className="text-[#D5E5F2]/35 text-[10px] mt-5">
            © 2026 ONE LSPU · Unified Campus Platform
          </p>

        </div>
      </section>


      {/* RIGHT PANEL */}
      <section className="relative flex-1 flex items-center justify-center px-6 py-10 sm:px-12 overflow-hidden bg-gradient-to-br from-[#F7FAFD] via-white to-[#E8F0F7]">

        {/* Background lighting */}
        <div className="absolute -top-32 right-0 w-80 h-80 bg-[#B8D1E5]/40 rounded-full blur-[100px] pointer-events-none" />

        <div className="absolute -bottom-32 left-0 w-80 h-80 bg-[#D5E3F0]/50 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative z-10 w-full max-w-md">

          {/* MOBILE BRAND */}
          <Link to="/" className="lg:hidden flex items-center justify-center gap-3 mb-10 group">

            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#102F49] via-[#244F70] to-[#547C9C] flex items-center justify-center shadow-lg transition duration-300 group-hover:scale-105">
              <img
                src="/logo.png"
                alt="ONE LSPU Logo"
                className="w-9 h-9 object-contain"
              />
            </div>

            <div>
              <h2 className="text-[#102F49] font-extrabold text-xl">
                ONE LSPU
              </h2>

              <p className="text-[#7890A6] text-[10px] uppercase tracking-[0.2em]">
                Unified Campus Platform
              </p>
            </div>

          </Link>

          {/* LOGIN CARD */}
          <div className="bg-white/90 backdrop-blur-xl border border-[#E2EAF2] rounded-[28px] shadow-[0_25px_80px_-25px_rgba(16,47,73,0.18)] p-7 sm:p-10 transition duration-500 hover:shadow-[0_30px_90px_-25px_rgba(16,47,73,0.25)]">

            {/* CARD HEADER */}
            <div className="mb-9">

              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#102F49] via-[#244F70] to-[#527B9B] flex items-center justify-center shadow-lg shadow-[#102F49]/20 mb-7">
                <Lock className="w-6 h-6 text-white" />
              </div>

              <p className="text-[#426C8E] text-xs font-bold uppercase tracking-[0.2em] mb-3">
                Welcome to ONE LSPU
              </p>

              <h1 className="text-3xl sm:text-4xl font-black text-[#102F49] tracking-tight">
                Welcome back.
              </h1>

              <p className="text-[#718397] text-sm mt-3 leading-relaxed">
                Sign in to access your campus account and
                explore everything ONE LSPU has to offer.
              </p>

            </div>


            {/* LOGIN FORM */}
            <form onSubmit={handleSubmit} className="space-y-6">

              {/* EMAIL */}
              <div className="space-y-2">

                <label
                  htmlFor="email"
                  className="block text-sm font-bold text-[#203D58]"
                >
                  Email address
                </label>

                <div className="relative group">

                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#91A3B5] transition duration-300 group-focus-within:text-[#285B7D]" />

                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@campus.edu"
                    aria-describedby={error ? 'login-error' : undefined}
                    className="w-full pl-12 pr-4 py-4 rounded-xl border border-[#DCE5EE] bg-[#F7F9FC] text-[#102F49] text-sm outline-none transition duration-300 placeholder:text-[#9AAABB] hover:border-[#9AB5CC] focus:bg-white focus:border-[#285B7D] focus:ring-4 focus:ring-[#285B7D]/10"
                  />

                </div>
              </div>


              {/* PASSWORD */}
              <div className="space-y-2">

                <label
                  htmlFor="password"
                  className="block text-sm font-bold text-[#203D58]"
                >
                  Password
                </label>

                <div className="relative group">

                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#91A3B5] transition duration-300 group-focus-within:text-[#285B7D]" />

                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    aria-describedby={error ? 'login-error' : undefined}
                    className="w-full pl-12 pr-12 py-4 rounded-xl border border-[#DCE5EE] bg-[#F7F9FC] text-[#102F49] text-sm outline-none transition duration-300 placeholder:text-[#9AAABB] hover:border-[#9AB5CC] focus:bg-white focus:border-[#285B7D] focus:ring-4 focus:ring-[#285B7D]/10"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#91A3B5] hover:text-[#173F60] transition duration-300 hover:scale-110"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>

                </div>
              </div>


              {/* ERROR MESSAGE */}
              {error && (
                <div
                  id="login-error"
                  role="alert"
                  className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700 text-sm flex items-start gap-3 animate-in fade-in slide-in-from-top-2"
                >
                  <span className="font-bold shrink-0">!</span>
                  <span>{error}</span>
                </div>
              )}


              {/* LOGIN BUTTON */}
              <button
                type="submit"
                disabled={isLoading}
                aria-busy={isLoading}
                className="group relative overflow-hidden w-full py-4 px-5 rounded-xl bg-gradient-to-r from-[#102F49] via-[#1D496A] to-[#315F80] text-white font-bold text-sm shadow-lg shadow-[#102F49]/20 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-[#102F49]/30 hover:brightness-110 active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0"
              >

                <span className="relative z-10 flex items-center justify-center gap-3">

                  {isLoading ? (
                    <>
                      <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    <>
                      Log in to your account
                      <ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
                    </>
                  )}

                </span>
              </button>

            </form>


            {/* FOOTER */}
            <div className="mt-9 pt-6 border-t border-[#E8EEF4] text-center">

              <div className="flex items-center justify-center gap-2 text-[#8293A5] text-xs">
                <ShieldCheck className="w-4 h-4 text-[#426C8E]" />
                Secure campus access
              </div>

              <p className="text-[11px] text-[#9AAABB] mt-4">
                ONE LSPU · Unified Campus Platform
              </p>

            </div>

          </div>


          {/* BOTTOM LINK */}
          <div className="text-center mt-7">

            <Link
              to="/"
              className="inline-flex items-center gap-2 text-sm text-[#718397] hover:text-[#173F60] transition duration-300 group"
            >
              <ArrowRight className="w-4 h-4 rotate-180 transition-transform duration-300 group-hover:-translate-x-1" />
              Back to homepage
            </Link>

          </div>

        </div>
      </section>

    </div>
  )
}
