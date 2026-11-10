import React from 'react'
import { Link } from 'react-router-dom'
import { 
  Building2, 
  Compass, 
  CalendarCheck, 
  ShieldCheck, 
  ArrowRight, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  Sparkles,
  Users
} from 'lucide-react'
import { useAuth } from '../../features/auth/AuthContext'

export function LandingPage() {
  const { user, switchUser, allUsers } = useAuth()

  return (
    <div className="space-y-12 pb-12">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white p-8 sm:p-14 shadow-2xl border border-slate-800">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 -mb-12 -ml-12 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-400 text-xs font-semibold uppercase tracking-wider mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            Unified University Facility Platform
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
            Campus spaces, effortlessly <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-indigo-400">discovered and reserved.</span>
          </h1>

          <p className="mt-5 text-base sm:text-lg text-slate-300 leading-relaxed font-normal">
            Centralizing university auditoriums, laboratories, lecture halls, and arenas. Explore interactive SVG floor plans, eliminate double-bookings, and track real-time approval status for students and student organizations.
          </p>

          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              to="/explorer"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold shadow-lg shadow-sky-500/25 transition active:scale-95"
            >
              <Compass className="w-5 h-5" />
              Launch Campus Explorer
              <ArrowRight className="w-4 h-4 ml-1" />
            </Link>

            <Link
              to="/organization"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium border border-slate-700 transition"
            >
              <Users className="w-5 h-5 text-indigo-400" />
              Organization Hub
            </Link>
          </div>
        </div>
      </section>

      {/* Quick Interactive Role Tour Card */}
      <section className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-200">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Experience the Full Hackathon Flow</h2>
            <p className="text-sm text-slate-500 mt-1">
              Select any pre-configured persona below to test each step of the user journey.
            </p>
          </div>
          <span className="text-xs font-medium text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
            Active: <span className="text-sky-600 font-bold">{user?.full_name}</span>
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {allUsers.map((persona) => {
            const isSelected = user?.id === persona.id
            return (
              <div
                key={persona.id}
                onClick={() => switchUser(persona.id)}
                className={`p-4 rounded-xl border-2 cursor-pointer transition flex flex-col justify-between ${
                  isSelected
                    ? 'border-sky-500 bg-sky-50/50 shadow-md ring-1 ring-sky-500'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <img
                    src={persona.avatar_url}
                    alt={persona.full_name}
                    className="w-12 h-12 rounded-full object-cover ring-2 ring-white shadow-sm"
                  />
                  <div>
                    <h3 className="font-semibold text-slate-900 text-sm">{persona.full_name}</h3>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 capitalize mt-1 inline-block">
                      {persona.primary_role.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500">
                  {persona.primary_role === 'officer' && (
                    <span className="text-indigo-600 font-medium">
                      ✓ Create activity & book auditorium for ACM
                    </span>
                  )}
                  {persona.primary_role === 'facility_admin' && (
                    <span className="text-amber-600 font-medium">
                      ✓ Review & approve pending reservation requests
                    </span>
                  )}
                  {persona.primary_role === 'student' && (
                    <span className="text-sky-600 font-medium">
                      ✓ Reserve study rooms and defense venues
                    </span>
                  )}
                  {persona.primary_role === 'system_admin' && (
                    <span className="text-emerald-600 font-medium">
                      ✓ Manage all campus buildings & facilities
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* Feature Highlights */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition">
          <div className="w-12 h-12 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center mb-4">
            <Compass className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">Interactive SVG Floor Plans</h3>
          <p className="text-sm text-slate-600 mt-2 leading-relaxed">
            Navigate through campus buildings and floor levels. Click directly onto interactive rooms to inspect capacities, AV equipment, and rules.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition">
          <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center mb-4">
            <CalendarCheck className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">Zero Conflict Scheduling</h3>
          <p className="text-sm text-slate-600 mt-2 leading-relaxed">
            Transactional conflict checking verifies operating hours, approved reservations, and maintenance downtime before confirming requests.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition">
          <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center mb-4">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">Admin & Officer Lifecycle</h3>
          <p className="text-sm text-slate-600 mt-2 leading-relaxed">
            Complete approval lifecycle from student organization event linkage to administrator approval, rejection reasons, and live notifications.
          </p>
        </div>
      </section>
    </div>
  )
}
