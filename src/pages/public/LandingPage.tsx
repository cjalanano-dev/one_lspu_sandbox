import { useState, useEffect, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Building2,
  Compass,
  Calendar,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  Clock,
  MapPin,
  Users,
  LogOut,
} from 'lucide-react'
import { useAuth } from '../../features/auth/AuthContext'
import { dataStore } from '../../lib/dataStore'
import type { Facility, Building } from '../../types'

const STEPS = [
  {
    number: '01',
    title: 'Explore',
    description: 'Browse campus buildings and discover available facilities through the interactive campus explorer.',
    icon: Compass,
  },
  {
    number: '02',
    title: 'Discover',
    description: 'Select a facility to inspect its location, capacity, features, and availability.',
    icon: Building2,
  },
  {
    number: '03',
    title: 'Reserve',
    description: 'Choose your preferred schedule and submit a facility reservation request.',
    icon: Calendar,
  },
  {
    number: '04',
    title: 'Confirm',
    description: 'Track your request and receive updates once your reservation is reviewed.',
    icon: CheckCircle2,
  },
]

export function LandingPage() {
  const { user, signOut, isLoading, isStudent, isOfficer, isAdmin } = useAuth()
  const navigate = useNavigate()

  const [buildings, setBuildings] = useState<Building[]>([])
  const [facilities, setFacilities] = useState<Facility[]>([])
  const [dataLoading, setDataLoading] = useState(true)
  const [dataError, setDataError] = useState<string | null>(null)

  useEffect(() => {
    async function loadData() {
      setDataLoading(true)
      setDataError(null)
      try {
        const [bList, fList] = await Promise.all([
          dataStore.getBuildings(),
          dataStore.getFacilities(),
        ])
        setBuildings(bList)
        setFacilities(fList)
      } catch (err) {
        setDataError(err instanceof Error ? err.message : 'Failed to load campus data.')
      } finally {
        setDataLoading(false)
      }
    }
    loadData()
  }, [])

  const facilityCount = facilities.length
  const buildingCount = buildings.length
  const reservableCount = facilities.filter((f) => f.reservation_enabled).length
  const facilitiesByBuilding = useMemo(() => {
    const map = new Map<string, number>()
    facilities.forEach((f) => {
      map.set(f.building_id, (map.get(f.building_id) ?? 0) + 1)
    })
    return map
  }, [facilities])

  const reservableFacilities = facilities.filter((f) => f.reservation_enabled)

  const statusPill = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-[var(--accent)] text-[var(--accent-ink)] border-[var(--accent)]'
      case 'reserved':
      case 'occupied':
        return 'bg-[var(--surface-2)] text-[var(--ink)] border-[var(--line-strong)]'
      case 'maintenance':
        return 'bg-[var(--surface-2)] text-[var(--muted)] border-[var(--line)]'
      default:
        return 'bg-[var(--surface-2)] text-[var(--muted)] border-[var(--line)]'
    }
  }

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--paper)]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-sm border-[var(--accent)] bg-[var(--accent)] flex items-center justify-center">
            <Building2 className="w-6 h-6 text-[var(--paper)]" />
          </div>
          <p className="text-xs text-[var(--muted)] uppercase tracking-widest font-medium">Loading</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-0 pb-12">
      {/* Hero — wayfinding board */}
      <section className="bg-[var(--accent-deep)] text-[var(--paper)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-12 items-start">
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-sm border-[var(--paper)]/20 text-[var(--paper)]/60 text-xs font-semibold uppercase tracking-wider mb-2">
                <Compass className="w-3.5 h-3.5" />
                ONE LSPU · Unified Campus Platform
              </div>
              <h1 className="text-5xl lg:text-6xl font-black leading-none tracking-tighter">
                Campus spaces,<br />
                discovered and reserved.
              </h1>
              <p className="mt-4 text-base text-[var(--paper)]/70 leading-relaxed max-w-xl">
                Centralizing university auditoriums, laboratories, lecture halls, and arenas. Explore
                interactive floor plans, eliminate double-bookings, and track approval status for
                students and student organizations.
              </p>
              {user ? (
                <div className="mt-8 flex flex-wrap gap-3">
                  <Link
                    to="/explorer"
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-sm bg-[var(--paper)] text-[var(--ink)] font-semibold text-sm hover:bg-[var(--paper)]/90 transition"
                  >
                    <Compass className="w-4 h-4" />
                    Campus Explorer
                    <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </Link>
                  {isOfficer && (
                    <Link
                      to="/organization"
                      className="inline-flex items-center gap-2 px-5 py-3 rounded-sm border-[var(--paper)] text-[var(--paper)] font-semibold text-sm hover:bg-[var(--paper)]/5 transition"
                    >
                      <Users className="w-4 h-4" />
                      Org Dashboard
                      <ArrowRight className="w-3.5 h-3.5 ml-1" />
                    </Link>
                  )}
                  {(isAdmin || isOfficer || isStudent) && (
                    <Link
                      to="/my-reservations"
                      className="inline-flex items-center gap-2 px-5 py-3 rounded-sm border-[var(--paper)] text-[var(--paper)] font-semibold text-sm hover:bg-[var(--paper)]/5 transition"
                    >
                      <Calendar className="w-4 h-4" />
                      My Reservations
                    </Link>
                  )}
                  {isAdmin && (
                    <Link
                      to="/admin"
                      className="inline-flex items-center gap-2 px-5 py-3 rounded-sm border-[var(--paper)] text-[var(--paper)] font-semibold text-sm hover:bg-[var(--paper)]/5 transition"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      Admin Panel
                      <ArrowRight className="w-3.5 h-3.5 ml-1" />
                    </Link>
                  )}
                </div>
              ) : (
                <div className="mt-8 flex flex-wrap gap-3">
                  <Link
                    to="/login"
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-sm bg-[var(--paper)] text-[var(--ink)] font-semibold text-sm hover:bg-[var(--accent)] hover:text-[var(--accent-ink)] transition"
                  >
                    <Compass className="w-4 h-4" />
                    Sign in
                    <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </Link>
                </div>
              )}
            </div>

            <div className="lg:col-span-5 space-y-6">
              {dataError ? (
                <div className="rounded-sm border border-[var(--line)] bg-[var(--paper)] p-5 text-center">
                  <p className="text-xs text-[var(--muted)]">{dataError}</p>
                </div>
              ) : (
                <>
                  {/* Availability board — live Supabase data */}
                  <div className="rounded-sm border border-[var(--line)] bg-[var(--paper)] p-5">
                    <h3 className="text-[var(--muted)] text-xs font-semibold uppercase tracking-widest mb-4">
                      Availability board
                    </h3>
                    <div className="space-y-3">
                      {reservableFacilities.slice(0, 4).map((f) => (
                        <div key={f.id} className="flex items-center justify-between px-4 py-3 border border-[var(--line)] rounded-sm">
                          <div className="flex flex-col">
                            <p className="text-[var(--paper)] font-medium text-sm">{f.name}</p>
                            <span className="text-xs text-[var(--muted)] uppercase tracking-widest">
                              {f.facility_code}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span
                              className={`w-2 h-2 rounded-sm ${statusPill(f.status)}`}
                            />
                            <span className="text-xs text-[var(--muted)] font-medium capitalize">
                              {f.status}
                            </span>
                          </div>
                        </div>
                      ))}
                      {reservableFacilities.length === 0 && (
                        <p className="text-xs text-[var(--muted)] text-center py-2">
                          No reservable facilities loaded.
                        </p>
                      )}
                    </div>
                    <Link
                      to="/facilities"
                      className="block text-[10px] font-bold uppercase tracking-widest text-[var(--accent-text)] hover:text-[var(--accent-deep)] mt-3 flex items-center gap-1"
                    >
                      View all {facilityCount} facilities <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>

                  {/* Live stats */}
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { label: 'Campus buildings', value: buildingCount },
                      { label: 'Reservable facilities', value: reservableCount },
                      { label: 'User roles', value: 5 },
                      { label: 'Availability derived', value: 'LIVE' },
                    ].map((stat) => (
                      <div key={stat.label} className="rounded-sm border border-[var(--line)] bg-[var(--paper)] p-4">
                        <div className="text-xl font-black text-[var(--ink)]">{stat.value}</div>
                        <div className="mt-1 text-[10px] text-[var(--muted)] uppercase tracking-widest font-medium">
                          {stat.label}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
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
              const step = STEPS[i]
              const Icon = step.icon
              return (
                <li key={i} className="space-y-4">
                  <div className="flex items-start gap-3">
                    <span className="shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-sm border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-ink)] font-black text-xs uppercase">
                      {step.number}
                    </span>
                    <div>
                      <h3 className="font-bold text-[var(--ink)]">{step.title}</h3>
                      <p className="text-sm text-[var(--muted)] leading-relaxed">
                        {step.description}
                      </p>
                    </div>
                  </div>
                </li>
              )
            })}
          </ol>
        </div>
      </section>

      {/* Campus directory — live buildings */}
      <section className="bg-[var(--surface-2)] py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-black tracking-tight">Campus directory</h2>
            <p className="text-xs text-[var(--muted)] uppercase tracking-widest font-medium">
              {buildingCount} buildings · {facilityCount} facilities
            </p>
          </div>
          {dataError ? (
            <div className="rounded-sm border border-[var(--line)] bg-[var(--paper)] p-6 text-center">
              <p className="text-xs text-[var(--muted)]">{dataError}</p>
            </div>
          ) : (
            <div className="rounded-sm border border-[var(--line)] bg-[var(--paper)]">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-[var(--line)]">
                    <th className="px-6 py-4 text-xs font-bold text-[var(--muted)] uppercase tracking-wider">
                      Building
                    </th>
                    <th className="px-6 py-4 text-xs font-bold text-[var(--muted)] uppercase tracking-wider">
                      Floors
                    </th>
                    <th className="px-6 py-4 text-xs font-bold text-[var(--muted)] uppercase tracking-wider text-right">
                      Facilities
                    </th>
                    <th className="px-6 py-4 text-xs font-bold text-[var(--muted)] uppercase tracking-wider text-right">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {buildings.map((b) => (
                    <tr key={b.id} className="border-b border-[var(--line)] last:border-0">
                      <td className="px-6 py-4">
                        <div className="font-medium text-[var(--ink)]">{b.name}</div>
                        <div className="text-xs text-[var(--muted)]">{b.location_description}</div>
                      </td>
                      <td className="px-6 py-4 text-xs text-[var(--muted)]">
                        {b.total_floors}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="font-mono font-bold text-[var(--ink)]">
                          {facilitiesByBuilding.get(b.id) ?? 0}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          to={`/explorer?building=${b.code}`}
                          className="inline-flex items-center gap-1 text-xs font-bold text-[var(--accent-text)] hover:text-[var(--accent-deep)] uppercase tracking-wider"
                        >
                          View building <ArrowRight className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {/* Closing band */}
      <section className="bg-[var(--accent-deep)] text-[var(--paper)] py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-sm border-[var(--paper)]/10 bg-[var(--paper)]/5 p-10 text-center md:text-left md:p-12">
            <h2 className="text-2xl md:text-3xl font-black mb-4">Run the full reservation lifecycle</h2>
            <p className="text-[var(--paper)]/70 text-sm leading-relaxed mb-6 max-w-2xl mx-auto md:mx-0">
              Discover a facility, verify availability, submit a request, receive a reviewed decision,
              and see the approved booking reflected on the facility calendar.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-4">
              <Link
                to="/login"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-sm bg-[var(--paper)] text-[var(--ink)] font-semibold transition"
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
