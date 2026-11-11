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
  FlaskConical,
  GraduationCap,
  Layers3,
  Sparkles,
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

const BUILDINGS = [
  {
    name: 'TIC',
    full: 'Technology & Innovation Center',
    floors: 'Levels 1–2',
    facilities: 3,
    path: '/explorer?building=TIC',
    icon: Building2,
  },
  {
    name: 'SAC',
    full: 'Student Activity Center',
    floors: 'Levels 1–2',
    facilities: 1,
    path: '/explorer?building=SAC',
    icon: Users,
  },
  {
    name: 'SRH',
    full: 'Student Recreation Hall',
    floors: 'Levels 1–2',
    facilities: 1,
    path: '/explorer?building=SRH',
    icon: GraduationCap,
  },
]

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

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#08151C]">
        <div className="flex flex-col items-center gap-3">
          <Building2 className="w-9 h-9 text-[#95A790]" />
          <p className="text-xs text-[#95A790] uppercase tracking-[0.3em]">
            Loading ONE LSPU
          </p>
        </div>
      </div>
    )
  }

  return (
    <main className="bg-[#08151C] text-[#F1F3EF] overflow-hidden">

      {/* ================= HERO SECTION ================= */}

      <section className="relative min-h-[650px] flex items-center">

        {/* Atmospheric gradient background */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `
              radial-gradient(ellipse at 78% 15%, rgba(183,194,157,0.20), transparent 35%),
              radial-gradient(ellipse at 15% 65%, rgba(98,123,108,0.30), transparent 45%),
              radial-gradient(ellipse at 90% 90%, rgba(20,39,45,0.95), transparent 50%),
              linear-gradient(135deg, #08151C 0%, #14272D 50%, #08151C 100%)
            `,
          }}
        />

        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.07] pointer-events-none"
          style={{
            backgroundImage: `
              linear-gradient(rgba(183,194,157,0.4) 1px, transparent 1px),
              linear-gradient(90deg, rgba(183,194,157,0.4) 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px',
            maskImage: 'linear-gradient(to bottom, black, transparent)',
          }}
        />

        {/* Decorative glow */}
        <div className="absolute right-[5%] top-[15%] w-72 h-72 bg-[#627B6C]/20 blur-[120px] rounded-full pointer-events-none" />

        <div className="relative z-10 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-20 lg:py-28">

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-14 items-center">

            {/* Hero content */}
            <div className="lg:col-span-7 space-y-7">

              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#627B6C]/50 bg-[#14272D]/70 backdrop-blur-md text-[#B7C29D] text-xs font-semibold tracking-[0.15em] uppercase">
                <Sparkles className="w-4 h-4" />
                ONE LSPU · Unified Campus Platform
              </div>

              <div className="space-y-4">
                <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black leading-[1.05] tracking-tight">
                  Every space.
                  <br />
                  <span
                    className="text-transparent bg-clip-text"
                    style={{
                      backgroundImage: 'linear-gradient(100deg, #B7C29D, #95A790, #627B6C)',
                    }}
                  >
                    One campus.
                  </span>
                  <br />
                  <span className="text-[#F1F3EF]">One platform.</span>
                </h1>

                <p className="text-[#A1ADA5] text-base sm:text-lg leading-relaxed max-w-xl">
                  Discover campus facilities, explore building layouts,
                  check availability, and reserve spaces — all in one
                  connected university platform.
                </p>
              </div>

              {/* Action buttons */}
              <div className="flex flex-wrap gap-3 pt-2">

                <Link
                  to="/explorer"
                  className="group inline-flex items-center gap-3 px-6 py-3.5 rounded-lg bg-[#95A790] text-[#08151C] font-bold text-sm hover:bg-[#B7C29D] transition-all duration-300 shadow-lg shadow-[#95A790]/10"
                >
                  <Compass className="w-4 h-4" />
                  Explore Campus
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>

                {!user ? (
                  <Link
                    to="/login"
                    className="inline-flex items-center gap-3 px-6 py-3.5 rounded-lg border border-[#627B6C]/60 bg-[#14272D]/60 text-[#F1F3EF] font-semibold text-sm hover:bg-[#22383C] transition"
                  >
                    Sign in
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                ) : (
                  <Link
                    to="/my-reservations"
                    className="inline-flex items-center gap-3 px-6 py-3.5 rounded-lg border border-[#627B6C]/60 bg-[#14272D]/60 text-[#F1F3EF] font-semibold text-sm hover:bg-[#22383C] transition"
                  >
                    <Calendar className="w-4 h-4" />
                    My Reservations
                  </Link>
                )}

                {user && isOfficer && (
                  <Link
                    to="/organization"
                    className="inline-flex items-center gap-2 px-5 py-3.5 rounded-lg border border-[#627B6C]/60 text-[#F1F3EF] text-sm hover:bg-[#22383C] transition"
                  >
                    <Users className="w-4 h-4" />
                    Organization
                  </Link>
                )}

                {user && isAdmin && (
                  <Link
                    to="/admin"
                    className="inline-flex items-center gap-2 px-5 py-3.5 rounded-lg border border-[#627B6C]/60 text-[#F1F3EF] text-sm hover:bg-[#22383C] transition"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    Admin Panel
                  </Link>
                )}

                {user && (isStudent || isOfficer || isAdmin) && (
                  <button
                    onClick={handleSignOut}
                    className="inline-flex items-center gap-2 px-5 py-3.5 rounded-lg text-[#A1ADA5] text-sm hover:text-[#F1F3EF] hover:bg-[#22383C] transition"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign out
                  </button>
                )}

                {!user && (
                  <Link
                    to="/register"
                    className="inline-flex items-center gap-2 px-5 py-3.5 rounded-lg text-[#A1ADA5] text-sm hover:text-[#F1F3EF] transition"
                  >
                    Create account
                  </Link>
                )}

              </div>

              <div className="flex items-center gap-3 pt-5 text-xs text-[#95A790]">
                <div className="w-8 h-px bg-[#627B6C]" />
                A smarter way to navigate university spaces.
              </div>

            </div>

            {/* Hero availability panel */}
            <div className="lg:col-span-5">

              <div
                className="relative rounded-2xl p-6 sm:p-7 border border-[#627B6C]/30 backdrop-blur-xl shadow-2xl"
                style={{
                  background: `
                    radial-gradient(ellipse at top right, rgba(183,194,157,0.12), transparent 60%),
                    linear-gradient(145deg, rgba(20,39,45,0.95), rgba(8,21,28,0.98))
                  `,
                }}
              >

                <div className="flex justify-between items-start mb-7">
                  <div>
                    <p className="text-[#95A790] text-xs uppercase tracking-[0.2em] font-semibold">
                      Campus overview
                    </p>
                    <h2 className="text-xl font-bold mt-2">
                      Facility availability
                    </h2>
                  </div>

                  <div className="w-10 h-10 rounded-xl bg-[#627B6C]/20 flex items-center justify-center">
                    <Layers3 className="w-5 h-5 text-[#B7C29D]" />
                  </div>
                </div>

                <div className="space-y-3">

                  {FACILITIES.map((facility) => {
                    const available = facility.status === 'available'

                    return (
                      <div
                        key={facility.code}
                        className="flex items-center justify-between gap-3 p-4 rounded-xl border border-[#627B6C]/20 bg-[#08151C]/50 hover:bg-[#22383C]/70 transition"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-[#F1F3EF]">
                            {facility.name}
                          </p>
                          <p className="text-xs text-[#95A790] mt-1">
                            {facility.code} · {facility.capacity} capacity
                          </p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              available
                                ? 'bg-[#B7C29D]'
                                : facility.status === 'reserved'
                                ? 'bg-[#95A790]'
                                : 'bg-[#A1ADA5]'
                            }`}
                          />
                          <span className="text-[10px] sm:text-xs font-semibold capitalize text-[#B7C29D]">
                            {facility.status}
                          </span>
                        </div>
                      </div>
                    )
                  })}

                </div>

                <Link
                  to="/facilities"
                  className="flex items-center justify-between mt-5 pt-5 border-t border-[#627B6C]/30 text-sm text-[#B7C29D] hover:text-white transition"
                >
                  Browse all facilities
                  <ArrowRight className="w-4 h-4" />
                </Link>

              </div>

              {/* Statistics */}
              <div className="grid grid-cols-3 gap-3 mt-4">

                {[
                  ['03', 'Buildings'],
                  ['05', 'Facilities'],
                  ['05', 'User roles'],
                ].map(([number, label]) => (
                  <div
                    key={label}
                    className="p-4 rounded-xl border border-[#627B6C]/20 bg-[#14272D]/70 text-center"
                  >
                    <p className="text-2xl font-black text-[#B7C29D]">
                      {number}
                    </p>
                    <p className="text-[10px] sm:text-xs text-[#A1ADA5] uppercase tracking-wider mt-1">
                      {label}
                    </p>
                  </div>
                ))}

              </div>

            </div>
          </div>
        </div>

      </section>

      {/* ================= HOW IT WORKS ================= */}

      <section className="relative py-24 bg-[#08151C]">

        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-[#627B6C]/50 to-transparent" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-5 mb-12">

            <div>
              <p className="text-[#95A790] text-xs font-bold uppercase tracking-[0.25em] mb-3">
                Simple. Connected. Convenient.
              </p>
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
                How it works
              </h2>
            </div>

            <p className="text-sm text-[#A1ADA5] max-w-sm leading-relaxed">
              From discovering a campus space to securing your reservation,
              everything happens in one place.
            </p>

          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

            {STEPS.map((step, index) => {
              const Icon = step.icon

              return (
                <div
                  key={step.number}
                  className="group relative p-6 rounded-2xl border border-[#627B6C]/20 bg-gradient-to-br from-[#14272D] to-[#0B1B22] hover:border-[#95A790]/60 hover:-translate-y-1 transition-all duration-300"
                >

                  <div className="flex items-center justify-between mb-8">
                    <div className="w-11 h-11 rounded-xl bg-[#627B6C]/20 flex items-center justify-center group-hover:bg-[#627B6C]/40 transition">
                      <Icon className="w-5 h-5 text-[#B7C29D]" />
                    </div>

                    <span className="text-3xl font-black text-[#627B6C]/30">
                      {step.number}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold mb-2">
                    {step.title}
                  </h3>

                  <p className="text-sm text-[#A1ADA5] leading-relaxed">
                    {step.description}
                  </p>

                  {index !== 3 && (
                    <div className="hidden lg:block absolute -right-2 top-11 w-4 h-px bg-[#627B6C]/60 z-10" />
                  )}

                </div>
              )
            })}

          </div>

        </div>
      </section>

      {/* ================= CAMPUS DIRECTORY ================= */}

      <section className="relative py-24 overflow-hidden">

        {/* Gradient atmosphere */}
        <div
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(ellipse at 15% 50%, rgba(98,123,108,0.17), transparent 45%),
              radial-gradient(ellipse at 85% 20%, rgba(183,194,157,0.09), transparent 40%),
              linear-gradient(180deg, #14272D, #08151C)
            `,
          }}
        />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-5 mb-12">

            <div>
              <p className="text-[#95A790] text-xs font-bold uppercase tracking-[0.25em] mb-3">
                Find your destination
              </p>
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
                Campus directory
              </h2>
              <p className="text-sm text-[#A1ADA5] mt-3 max-w-lg">
                Explore the different buildings and discover the facilities
                available throughout the campus.
              </p>
            </div>

            <Link
              to="/explorer"
              className="inline-flex items-center gap-2 text-sm font-semibold text-[#B7C29D] hover:text-white transition"
            >
              Open campus explorer
              <ArrowRight className="w-4 h-4" />
            </Link>

          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

            {BUILDINGS.map((building, index) => {
              const Icon = building.icon

              return (
                <Link
                  key={building.name}
                  to={building.path}
                  className="group relative overflow-hidden rounded-2xl border border-[#627B6C]/30 bg-[#08151C]/70 hover:border-[#95A790]/70 transition-all duration-300"
                >

                  {/* Card gradient */}
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{
                      background: `
                        radial-gradient(circle at 80% 10%, rgba(183,194,157,0.16), transparent 50%),
                        linear-gradient(145deg, rgba(98,123,108,0.12), transparent)
                      `,
                    }}
                  />

                  <div className="relative p-7">

                    <div className="flex items-start justify-between mb-10">

                      <div className="w-14 h-14 rounded-2xl border border-[#627B6C]/40 bg-[#14272D] flex items-center justify-center group-hover:bg-[#627B6C]/30 transition">
                        <Icon className="w-7 h-7 text-[#B7C29D]" />
                      </div>

                      <span className="text-xs font-bold tracking-widest text-[#627B6C]">
                        0{index + 1}
                      </span>

                    </div>

                    <p className="text-3xl font-black text-[#B7C29D] mb-2">
                      {building.name}
                    </p>

                    <h3 className="text-sm font-semibold text-[#F1F3EF]">
                      {building.full}
                    </h3>

                    <div className="flex flex-wrap items-center gap-4 mt-6 pt-5 border-t border-[#627B6C]/30">

                      <span className="flex items-center gap-2 text-xs text-[#A1ADA5]">
                        <MapPin className="w-3.5 h-3.5 text-[#95A790]" />
                        {building.floors}
                      </span>

                      <span className="flex items-center gap-2 text-xs text-[#A1ADA5]">
                        <Building2 className="w-3.5 h-3.5 text-[#95A790]" />
                        {building.facilities} facilities
                      </span>

                    </div>

                    <div className="flex items-center justify-between mt-7 text-sm font-semibold text-[#B7C29D]">
                      Explore building
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
                    </div>

                  </div>

                </Link>
              )
            })}

          </div>

        </div>
      </section>

      {/* ================= CLOSING CTA ================= */}

      <section className="relative px-4 sm:px-6 lg:px-8 pb-24">

        <div
          className="relative max-w-7xl mx-auto overflow-hidden rounded-3xl border border-[#95A790]/30"
          style={{
            background: `
              radial-gradient(ellipse at 85% 0%, rgba(183,194,157,0.30), transparent 45%),
              radial-gradient(ellipse at 10% 100%, rgba(98,123,108,0.45), transparent 55%),
              linear-gradient(120deg, #14272D, #22383C, #08151C)
            `,
          }}
        >

          <div className="relative z-10 px-7 py-14 sm:px-12 sm:py-16 flex flex-col md:flex-row items-center justify-between gap-10">

            <div className="max-w-2xl">

              <div className="flex items-center gap-2 text-[#B7C29D] text-xs font-bold uppercase tracking-[0.25em] mb-4">
                <Sparkles className="w-4 h-4" />
                Your campus, connected
              </div>

              <h2 className="text-3xl sm:text-4xl font-black leading-tight">
                Your next campus destination starts here.
              </h2>

              <p className="text-[#C2CDC4] text-sm leading-relaxed mt-4 max-w-xl">
                Discover facilities, explore spaces, and make campus
                reservations easier with ONE LSPU.
              </p>

            </div>

            <Link
              to="/explorer"
              className="shrink-0 inline-flex items-center gap-3 px-7 py-4 rounded-xl bg-[#B7C29D] text-[#08151C] font-bold text-sm hover:bg-[#F1F3EF] transition shadow-xl"
            >
              Start exploring
              <ArrowRight className="w-5 h-5" />
            </Link>

          </div>

        </div>

      </section>

    </main>
  )
}