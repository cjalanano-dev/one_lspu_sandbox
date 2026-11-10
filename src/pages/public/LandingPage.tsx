import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Building2,
  Compass,
  Calendar,
  CalendarCheck,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  Clock,
  MapPin,
  Users,
  LogOut,
} from 'lucide-react'
import { useAuth } from '../../features/auth/AuthContext'

const FACILITIES = [
  {
    name: 'Grand Innovation Auditorium',
    code: 'TIC-A101',
    capacity: 280,
    status: 'available',
  },
  {
    name: 'Executive Conference Suite',
    code: 'TIC-C102',
    capacity: 24,
    status: 'reserved',
  },
  {
    name: 'AI & Robotics Lab',
    code: 'TIC-L201',
    capacity: 45,
    status: 'maintenance',
  },
]

export function LandingPage() {
  const { user, signOut, isLoading, isStudent, isOfficer, isAdmin } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-sm border border-black bg-black flex items-center justify-center">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <p className="text-xs text-[var(--muted)] uppercase tracking-widest font-medium">Loading</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-0 pb-12">
      {/* Hero — wayfinding board */}
      <section className="bg-black text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-12 items-start">
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-sm border border-white/20 text-white/60 text-xs font-semibold uppercase tracking-wider mb-2">
                <Compass className="w-3.5 h-3.5" />
                Unified Campus Facility Platform
              </div>
              <h1 className="text-5xl lg:text-6xl font-black leading-none tracking-tighter">
                Campus spaces,<br />
                discovered and reserved.
              </h1>
              <p className="mt-4 text-base text-white/70 leading-relaxed max-w-xl">
                Centralizing university auditoriums, laboratories, lecture halls, and arenas. Explore
                interactive floor plans, eliminate double-bookings, and track approval status for
                students and student organizations.
              </p>
              {user ? (
                <div className="mt-8 flex flex-wrap gap-3">
                  <Link
                    to="/explorer"
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-sm bg-white text-black font-semibold text-sm hover:bg-white/90 transition"
                  >
                    <Compass className="w-4 h-4" />
                    Campus Explorer
                    <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </Link>
                  {isOfficer && (
                    <Link
                      to="/organization"
                      className="inline-flex items-center gap-2 px-5 py-3 rounded-sm border border-white text-white font-semibold text-sm hover:bg-white/5 transition"
                    >
                      <Users className="w-4 h-4" />
                      Org Dashboard
                      <ArrowRight className="w-3.5 h-3.5 ml-1" />
                    </Link>
                  )}
                  {(isAdmin || isOfficer || isStudent) && (
                    <Link
                      to="/my-reservations"
                      className="inline-flex items-center gap-2 px-5 py-3 rounded-sm border border-white text-white font-semibold text-sm hover:bg-white/5 transition"
                    >
                      <Calendar className="w-4 h-4" />
                      My Reservations
                    </Link>
                  )}
                  {isAdmin && (
                    <Link
                      to="/admin"
                      className="inline-flex items-center gap-2 px-5 py-3 rounded-sm border border-white text-white font-semibold text-sm hover:bg-white/5 transition"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      Admin Panel
                      <ArrowRight className="w-3.5 h-3.5 ml-1" />
                    </Link>
                  )}
                  <button
                    onClick={handleSignOut}
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-sm border border-white/20 text-white/80 font-semibold text-sm hover:bg-white/5 transition"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign out
                  </button>
                </div>
              ) : (
                <div className="mt-8 flex flex-wrap gap-3">
                  <Link
                    to="/login"
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-sm bg-white text-black font-semibold text-sm hover:bg-gray-900 transition"
                  >
                    <Compass className="w-4 h-4" />
                    Sign in
                    <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </Link>
                  <Link
                    to="/register"
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-sm border border-white text-white font-semibold text-sm hover:bg-white/5 transition"
                  >
                    <Users className="w-4 h-4" />
                    Create account
                  </Link>
                </div>
              )}
            </div>

            <div className="lg:col-span-5 space-y-6">
              <div className="rounded-sm border border-white/10 bg-white/5 p-5 shadow-xl">
                <h3 className="text-[var(--muted)] text-xs font-semibold uppercase tracking-widest mb-4">
                  Availability board
                </h3>
                <div className="space-y-3">
                  {FACILITIES.map((f) => {
                    const active = f.status === 'available'
                    return (
                      <div key={f.code} className="flex items-center justify-between px-4 py-3 border border-white/10 rounded-sm">
                        <div className="flex flex-col">
                          <p className="text-white font-medium text-sm">{f.name}</p>
                          <span className="text-[11px] text-white/40 uppercase tracking-wider">{f.code}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-2 h-2 rounded-full ${active ? 'bg-white' : 'bg-white/20'}`}
                          />
                          <span className="text-xs text-white/70 font-medium capitalize">{f.status}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {[
                  ['03', 'Campus buildings'],
                  ['05', 'Reservable facilities'],
                  ['05', 'User roles'],
                  ['LIVE', 'Availability derived'],
                ].map(([big, small]) => (
                  <div key={small} className="rounded-sm border border-white/10 bg-white/5 p-4">
                    <div className="text-xl font-black text-white">{big}</div>
                    <div className="mt-1 text-[10px] text-white/50 uppercase tracking-wider font-medium">{small}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-10">
            <h2 className="text-2xl font-black tracking-tight">How it works</h2>
          </div>
          <ol className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[0, 1, 2, 3].map((i) => {
              const steps = [
                ['Explorer', 'Open the campus map and pick a building and floor.'],
                ['Facility', 'Tap any room on the plan to inspect capacity and schedule.'],
                ['Request', 'Choose an available slot and submit your reservation.'],
                ['Decision', 'An administrator reviews and you are notified.'],
              ]
              const [title, desc] = steps[i]
              return (
                <li key={i} className="space-y-4">
                  <div className="flex items-start gap-3">
                    <span className="shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-sm border border-black bg-black text-white font-black text-[10px] uppercase">
                      0{i + 1}
                    </span>
                    <div>
                      <h3 className="font-bold text-[var(--ink)]">{title}</h3>
                      <p className="text-sm text-[var(--muted)] leading-relaxed">{desc}</p>
                    </div>
                  </div>
                </li>
              )
            })}
          </ol>
        </div>
      </section>

      {/* Campus directory */}
      <section className="bg-[var(--surface-2)] py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-black tracking-tight">Campus directory</h2>
          </div>
          <div className="rounded-sm border border-[var(--line)] bg-white">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-[var(--line)]">
                  <th className="px-6 py-4 text-[11px] font-bold text-[var(--muted)] uppercase tracking-wider">Building</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-[var(--muted)] uppercase tracking-wider">Floor plan</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-[var(--muted)] uppercase tracking-wider">Facilities</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-[var(--muted)] uppercase tracking-wider text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {[
                  {
                    name: 'TIC',
                    full: 'Technology & Innovation Center',
                    floors: 'Levels 1–2',
                    facilities: 3,
                    path: '/explorer?building=TIC',
                  },
                  {
                    name: 'SAC',
                    full: 'Student Activity Center',
                    floors: 'Levels 1–2',
                    facilities: 1,
                    path: '/explorer?building=SAC',
                  },
                  {
                    name: 'SRH',
                    full: 'Student Recreation Hall',
                    floors: 'Levels 1–2',
                    facilities: 1,
                    path: '/explorer?building=SRH',
                  },
                ].map((b) => (
                  <tr key={b.name} className="border-b border-[var(--line)] last:border-0">
                    <td className="px-6 py-4">
                      <div className="font-medium text-[var(--ink)]">{b.name}</div>
                      <div className="text-xs text-[var(--muted)]">{b.full}</div>
                    </td>
                    <td className="px-6 py-4 text-xs text-[var(--muted)]">{b.floors}</td>
                    <td className="px-6 py-4 text-right">
                      <span className="font-mono font-bold text-[var(--ink)]">{b.facilities}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        to={b.path}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--ink)] hover:underline uppercase tracking-wider"
                      >
                        View building <ArrowRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Closing band */}
      <section className="bg-black text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-sm border border-white/10 bg-white/5 p-10 text-center md:text-left md:p-12">
            <h2 className="text-2xl md:text-3xl font-black mb-4">Run the full reservation lifecycle</h2>
            <p className="text-white/70 text-sm leading-relaxed mb-6 max-w-2xl mx-auto md:mx-0">
              Discover a facility, verify availability, submit a request, receive a reviewed decision,
              and see the approved booking reflected on the facility calendar.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-4">
              <Link
                to="/login"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-sm bg-white text-black font-semibold hover:bg-gray-900 transition"
              >
                <Compass className="w-5 h-5" />
                Sign in and explore
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
