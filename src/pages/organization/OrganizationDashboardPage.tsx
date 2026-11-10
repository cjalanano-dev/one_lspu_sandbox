import React, { useState, useEffect } from 'react'
import {
  Plus,
  Calendar,
  Clock,
  CheckCircle2,
  Compass,
  CalendarDays,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { dataStore } from '../../lib/dataStore'
import { useAuth } from '../../features/auth/AuthContext'
import { Dialog } from '../../components/ui/Dialog'
import { formatDateTime } from '../../lib/utils'
import type { Organization, Activity, Reservation, Facility } from '../../types'

const statusTagClass = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'approved':
    case 'available':
      return 'tag tag-available'
    case 'pending':
      return 'tag tag-pending'
    case 'rejected':
    case 'cancelled':
    case 'unavailable':
      return 'tag tag-rejected'
    case 'maintenance':
      return 'tag tag-maintenance'
    case 'occupied':
    case 'reserved':
      return 'tag tag-reserved'
    default:
      return 'tag tag-pending'
  }
}

export function OrganizationDashboardPage() {
  const { user } = useAuth()
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null)
  const [activities, setActivities] = useState<Activity[]>([])
  const [orgReservations, setOrgReservations] = useState<Reservation[]>([])
  const [facilitiesMap, setFacilitiesMap] = useState<Record<string, Facility>>({})

  const [showNewActivityModal, setShowNewActivityModal] = useState(false)
  const [actTitle, setActTitle] = useState('')
  const [actDesc, setActDesc] = useState('')
  const [actDate, setActDate] = useState('2026-11-20')
  const [actAttendees, setActAttendees] = useState(60)

  const loadData = async () => {
    const orgs = await dataStore.getMyOrganizations(user?.id ?? null)
    setOrganizations(orgs)
    const currentOrg = orgs.find((o) => o.id === user?.organization_id) || orgs[0] || null
    setSelectedOrg(currentOrg)

    if (currentOrg) {
      const acts = await dataStore.getActivities(currentOrg.id)
      setActivities(acts)

      const resList = await dataStore.getReservations({ organizationId: currentOrg.id })
      setOrgReservations(resList)
    }

    const facList = await dataStore.getFacilities()
    const map: Record<string, Facility> = {}
    facList.forEach((f) => {
      map[f.id] = f
    })
    setFacilitiesMap(map)
  }

  useEffect(() => {
    loadData()
  }, [user?.organization_id])

  const handleCreateActivity = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!actTitle || !actDate || !selectedOrg) return

    await dataStore.createActivity({
      organization_id: selectedOrg.id,
      title: actTitle,
      description: actDesc,
      activity_date: actDate,
      expected_attendees: actAttendees,
      created_by: (user as { id: string })?.id || '',
    })

    setShowNewActivityModal(false)
    setActTitle('')
    setActDesc('')
    await loadData()
  }

  return (
    <div className="space-y-8">
      <div className="bg-[var(--ink)] text-white rounded-sm border border-[var(--ink)] p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          {selectedOrg?.logo_url ? (
            <img
              src={selectedOrg.logo_url}
              alt={selectedOrg.name}
              className="w-14 h-14 rounded-sm object-cover border border-white/10 grayscale"
            />
          ) : (
            <div className="w-14 h-14 rounded-sm bg-white/10 flex items-center justify-center border border-white/10 grayscale">
              <Compass className="w-8 h-8 text-white" />
            </div>
          )}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded-sm border border-white text-xs font-mono font-bold uppercase bg-white text-[var(--ink)]">
                {selectedOrg?.acronym}
              </span>
              <span className="text-xs text-white/50 font-medium uppercase tracking-widest">Student Organization</span>
            </div>
            <h1 className="text-2xl font-black text-white">{selectedOrg?.name}</h1>
            <p className="text-xs text-white/60 mt-1 max-w-2xl leading-relaxed uppercase tracking-wider font-medium">
              {selectedOrg?.description}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <button
            onClick={() => setShowNewActivityModal(true)}
            className="px-5 py-3 rounded-sm bg-white text-[var(--ink)] font-bold text-sm flex items-center gap-2 hover:bg-[#1a1a1a] transition"
          >
            <Plus className="w-4 h-4" />
            New Organization Activity
          </button>
          <Link
            to="/explorer"
            className="px-5 py-3 rounded-sm border border-white text-white font-medium text-sm flex items-center gap-2 hover:bg-white/5 transition"
          >
            <Compass className="w-4 h-4 text-white" />
            Explore Spaces
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-6 bg-white rounded-sm border border-[var(--line)] p-6 space-y-4">
          <div className="border-b border-[var(--line)] pb-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-bold text-[var(--ink)] text-base flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-[var(--ink)]" />
                  Organization Activities
                </h3>
                <p className="text-xs text-[var(--muted)] mt-0.5 uppercase tracking-wider font-medium">
                  Planned university events, hackathons, and workshops
                </p>
              </div>
              <button
                onClick={() => setShowNewActivityModal(true)}
                className="p-2 rounded-sm border border-[var(--ink)] text-[var(--ink)] hover:bg-[var(--surface-2)] transition"
                title="Add Activity"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {activities.length === 0 ? (
              <div className="p-8 text-center text-[var(--muted)] text-xs">
                No activities planned. Click 'New Organization Activity' to create one.
              </div>
            ) : (
              activities.map((act) => (
                <div
                  key={act.id}
                  className="p-3 rounded-sm border border-[var(--line)] bg-[var(--surface)] space-y-2 hover:border-black transition"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-bold text-[var(--ink)] text-sm">{act.title}</h4>
                    <span className={`tag ${statusTagClass(act.status)}`}>{act.status.toUpperCase()}</span>
                  </div>
                  <p className="text-xs text-[var(--muted)]">{act.description}</p>
                  <div className="flex items-center justify-between pt-2 border-t border-[var(--line)] text-xs text-[var(--muted)]">
                    <span className="flex items-center gap-1 font-medium text-[var(--ink)]">
                      <Calendar className="w-3 h-3" />
                      Date: {act.activity_date}
                    </span>
                    <span>Expected: {act.expected_attendees} pax</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="lg:col-span-6 bg-white rounded-sm border border-[var(--line)] p-6 space-y-4">
          <div className="border-b border-[var(--line)] pb-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-bold text-[var(--ink)] text-base flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[var(--ink)]" />
                  Organization Facility Reservations
                </h3>
                <p className="text-xs text-[var(--muted)] mt-0.5 uppercase tracking-wider font-medium">
                  Live status of venues requested on behalf of {selectedOrg?.acronym}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {orgReservations.length === 0 ? (
              <div className="p-8 text-center text-[var(--muted)] text-xs">
                No facility reservations submitted for this organization yet.
              </div>
            ) : (
              orgReservations.map((res) => {
                const fac = facilitiesMap[res.facility_id]
                return (
                  <div
                    key={res.id}
                    className="p-3 rounded-sm border border-[var(--line)] bg-white space-y-2 hover:border-black transition"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-xs font-bold text-[var(--ink)] uppercase tracking-widest">
                          {fac?.name || 'Facility'} ({fac?.facility_code})
                        </span>
                        <h4 className="font-bold text-[var(--ink)] text-sm mt-0.5">{res.title}</h4>
                      </div>
                      <span className={`tag ${statusTagClass(res.status)}`}>
                        {res.status.toUpperCase()}
                      </span>
                    </div>
                    <div className="text-xs text-[var(--muted)] flex items-center gap-1.5">
                      <Clock className="w-3 h-3 text-[var(--faint)]" />
                      <span>{formatDateTime(res.start_datetime)}</span>
                    </div>
                    {res.status === 'approved' && (
                      <div className="text-xs text-[var(--ink)] font-medium flex items-center gap-1 pt-1">
                        <CheckCircle2 className="w-3 h-3" />
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

      <Dialog
        isOpen={showNewActivityModal}
        onClose={() => setShowNewActivityModal(false)}
        title="Create Organization Activity"
        titleId="create-activity-dialog-title"
      >
        <p className="text-xs text-[var(--muted)] mb-4" id="create-activity-dialog-desc">
          Add a new official activity to associate with facility reservations.
        </p>
        <form onSubmit={handleCreateActivity} className="space-y-4 text-[var(--ink)]" aria-describedby="create-activity-dialog-desc">
          <div>
            <label htmlFor="org-activity-title" className="block text-sm font-medium text-[var(--ink)] mb-1">Activity Title *</label>
            <input
              id="org-activity-title"
              type="text"
              placeholder="e.g. CodeCamp: Full-Stack Web Sprint"
              value={actTitle}
              onChange={(e) => setActTitle(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-sm border border-[var(--line)] bg-white text-[var(--ink)] focus:border-[var(--line-strong)]"
            />
          </div>
          <div>
            <label htmlFor="org-activity-desc" className="block text-sm font-medium text-[var(--ink)] mb-1">Description</label>
            <textarea
              id="org-activity-desc"
              rows={2}
              placeholder="Event agenda and target outcomes..."
              value={actDesc}
              onChange={(e) => setActDesc(e.target.value)}
              className="w-full px-3 py-2 rounded-sm border border-[var(--line)] bg-white text-[var(--ink)] focus:border-[var(--line-strong)]"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="org-activity-date" className="block text-sm font-medium text-[var(--ink)] mb-1">Target Date *</label>
              <input
                id="org-activity-date"
                type="date"
                value={actDate}
                onChange={(e) => setActDate(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-sm border border-[var(--line)] bg-white text-[var(--ink)] focus:border-[var(--line-strong)]"
              />
            </div>
            <div>
              <label htmlFor="org-activity-attendees" className="block text-sm font-medium text-[var(--ink)] mb-1">Expected Attendees</label>
              <input
                id="org-activity-attendees"
                type="number"
                value={actAttendees}
                onChange={(e) => setActAttendees(Number(e.target.value) || 0)}
                className="w-full px-3 py-2 rounded-sm border border-[var(--line)] bg-white text-[var(--ink)] focus:border-[var(--line-strong)]"
              />
            </div>
          </div>
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--line)]">
            <button
              type="button"
              onClick={() => setShowNewActivityModal(false)}
              className="px-4 py-2 rounded-sm text-[var(--muted)] font-medium hover:bg-[var(--surface-2)] transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-sm bg-[var(--ink)] text-white font-semibold hover:bg-[#1a1a1a] transition"
            >
              Save Activity
            </button>
          </div>
        </form>
      </Dialog>
    </div>
  )
}
