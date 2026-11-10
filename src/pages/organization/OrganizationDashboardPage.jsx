import React, { useState, useEffect } from 'react'
import { 
  Users, 
  Plus, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  Compass, 
  ArrowRight, 
  Sparkles,
  CalendarDays
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { dataStore } from '../../lib/dataStore'
import { useAuth } from '../../features/auth/AuthContext'
import { formatDateTime, getStatusBadgeClass } from '../../lib/utils'

export function OrganizationDashboardPage() {
  const { user } = useAuth()
  const [organizations, setOrganizations] = useState([])
  const [selectedOrg, setSelectedOrg] = useState(null)
  const [activities, setActivities] = useState([])
  const [orgReservations, setOrgReservations] = useState([])
  const [facilitiesMap, setFacilitiesMap] = useState({})

  // Modal / form for new activity
  const [showNewActivityModal, setShowNewActivityModal] = useState(false)
  const [actTitle, setActTitle] = useState('')
  const [actDesc, setActDesc] = useState('')
  const [actDate, setActDate] = useState('2026-11-20')
  const [actAttendees, setActAttendees] = useState(60)

  const loadData = async () => {
    const orgs = await dataStore.getOrganizations()
    setOrganizations(orgs)
    const currentOrg = orgs.find((o) => o.id === (user?.organization_id || 'org-acm')) || orgs[0]
    setSelectedOrg(currentOrg)

    if (currentOrg) {
      const acts = await dataStore.getActivities(currentOrg.id)
      setActivities(acts)

      const resList = await dataStore.getReservations({ organizationId: currentOrg.id })
      setOrgReservations(resList)
    }

    const facList = await dataStore.getFacilities()
    const map = {}
    facList.forEach((f) => {
      map[f.id] = f
    })
    setFacilitiesMap(map)
  }

  useEffect(() => {
    loadData()
  }, [user?.organization_id])

  const handleCreateActivity = async (e) => {
    e.preventDefault()
    if (!actTitle || !actDate) return

    await dataStore.createActivity({
      organization_id: selectedOrg.id,
      title: actTitle,
      description: actDesc,
      activity_date: actDate,
      expected_attendees: Number(actAttendees),
      created_by: user.id,
    })

    setShowNewActivityModal(false)
    setActTitle('')
    setActDesc('')
    await loadData()
  }

  return (
    <div className="space-y-8">
      {/* Org Profile Header */}
      {selectedOrg && (
        <div className="bg-gradient-to-r from-slate-900 to-indigo-950 rounded-3xl p-6 sm:p-8 text-white border border-slate-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <img
              src={selectedOrg.logo_url}
              alt={selectedOrg.name}
              className="w-16 h-16 rounded-2xl object-cover ring-4 ring-white/10 shadow-lg"
            />
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-sky-500/20 text-sky-300 border border-sky-400/30">
                  {selectedOrg.acronym}
                </span>
                <span className="text-xs text-slate-300 font-medium">Student Organization</span>
              </div>
              <h1 className="text-2xl font-extrabold text-white">{selectedOrg.name}</h1>
              <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                {selectedOrg.description}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <button
              onClick={() => setShowNewActivityModal(true)}
              className="px-4 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-sky-500/20 transition active:scale-95"
            >
              <Plus className="w-4 h-4" />
              New Organization Activity
            </button>
            <Link
              to="/explorer"
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium text-xs flex items-center gap-2 border border-white/10 transition"
            >
              <Compass className="w-4 h-4 text-sky-400" />
              Explore Spaces
            </Link>
          </div>
        </div>
      )}

      {/* Two Column Section: Scheduled Activities & Org Reservations */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Organization Activities */}
        <div className="lg:col-span-6 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-indigo-600" />
                Organization Activities
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Planned university events, hackathons, and workshops
              </p>
            </div>
            <button
              onClick={() => setShowNewActivityModal(true)}
              className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition"
              title="Add Activity"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-3">
            {activities.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                No activities planned. Click "+ New Organization Activity" to create one.
              </div>
            ) : (
              activities.map((act) => (
                <div
                  key={act.id}
                  className="p-4 rounded-2xl border border-slate-100 bg-slate-50/70 space-y-2 hover:border-indigo-200 transition"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-bold text-slate-900 text-sm">{act.title}</h4>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 uppercase">
                      {act.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600">{act.description}</p>
                  <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 text-xs text-slate-500">
                    <span className="flex items-center gap-1 font-medium text-slate-700">
                      <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                      Date: {act.activity_date}
                    </span>
                    <span>Expected: {act.expected_attendees} pax</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Organization Associated Facility Reservations */}
        <div className="lg:col-span-6 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <Calendar className="w-4 h-4 text-sky-600" />
              Organization Facility Reservations
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Live status of venues requested on behalf of {selectedOrg?.acronym}
            </p>
          </div>

          <div className="space-y-3">
            {orgReservations.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                No facility reservations submitted for this organization yet.
              </div>
            ) : (
              orgReservations.map((res) => {
                const fac = facilitiesMap[res.facility_id]
                return (
                  <div
                    key={res.id}
                    className="p-4 rounded-2xl border border-slate-100 bg-slate-50/70 space-y-2 hover:border-sky-200 transition"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-xs font-bold text-sky-700">
                          {fac?.name || 'Facility'} ({fac?.facility_code})
                        </span>
                        <h4 className="font-bold text-slate-900 text-sm mt-0.5">{res.title}</h4>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${getStatusBadgeClass(
                          res.status
                        )}`}
                      >
                        {res.status.toUpperCase()}
                      </span>
                    </div>

                    <div className="text-xs text-slate-500 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{formatDateTime(res.start_datetime)}</span>
                    </div>

                    {res.status === 'approved' && (
                      <div className="text-xs text-emerald-700 font-semibold flex items-center gap-1 pt-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Approved by Administrator
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>

      {/* New Activity Modal */}
      {showNewActivityModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <h3 className="text-lg font-bold text-slate-900 mb-1">Create Organization Activity</h3>
            <p className="text-xs text-slate-500 mb-4">
              Add a new official activity to associate with facility reservations.
            </p>

            <form onSubmit={handleCreateActivity} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Activity Title *</label>
                <input
                  type="text"
                  placeholder="e.g. CodeCamp: Full-Stack Web Sprint"
                  value={actTitle}
                  onChange={(e) => setActTitle(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  rows="2"
                  placeholder="Event agenda and target outcomes..."
                  value={actDesc}
                  onChange={(e) => setActDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Target Date *</label>
                  <input
                    type="date"
                    value={actDate}
                    onChange={(e) => setActDate(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Expected Attendees</label>
                  <input
                    type="number"
                    value={actAttendees}
                    onChange={(e) => setActAttendees(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowNewActivityModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-md shadow-indigo-600/20"
                >
                  Save Activity
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
