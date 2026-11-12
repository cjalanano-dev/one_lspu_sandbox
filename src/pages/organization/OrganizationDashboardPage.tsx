import React, { useState, useEffect } from 'react'
import {
  Plus,
  Calendar,
  Clock,
  CheckCircle2,
  Compass,
  CalendarDays,
  FileText,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { dataStore, canFileForOrganization } from '../../lib/dataStore'
import { useAuth } from '../../features/auth/AuthContext'
import { Dialog } from '../../components/ui/Dialog'
import { StudentOrgEventsCalendar } from '../../components/calendar/StudentOrgEventsCalendar'
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
  const [filingOrg, setFilingOrg] = useState<Organization | null>(null)
  const [activities, setActivities] = useState<Activity[]>([])
  const [orgReservations, setOrgReservations] = useState<Reservation[]>([])
  const [facilitiesMap, setFacilitiesMap] = useState<Record<string, Facility>>({})
  const [adviserName, setAdviserName] = useState<string | null>(null)

  const [showNewActivityModal, setShowNewActivityModal] = useState(false)
  const [activityError, setActivityError] = useState<string | null>(null)
  const [actTitle, setActTitle] = useState('')
  const [actDesc, setActDesc] = useState('')
  const [actDate, setActDate] = useState('2026-11-20')
  const [actAttendees, setActAttendees] = useState(60)

  const loadData = async () => {
    const orgs = await dataStore.getMyOrganizations(user?.id ?? null)
    setOrganizations(orgs)
    const currentOrg = orgs.find((o) => o.id === user?.organization_id) || orgs[0] || null
    setSelectedOrg(currentOrg)

    // Only a president or secretary may file proposals for an organization.
    // Point the button at one of those, otherwise the insert is rejected by
    // the database's row-level security policy.
    setFilingOrg(orgs.find((o) => canFileForOrganization(o)) ?? null)

    if (currentOrg) {
      const acts = await dataStore.getActivities(currentOrg.id)
      setActivities(acts)

      const resList = await dataStore.getReservations({ organizationId: currentOrg.id })
      setOrgReservations(resList)

      if (currentOrg.adviser_id) {
        const advProfile = await dataStore.getProfile(currentOrg.adviser_id)
        setAdviserName(advProfile?.full_name ?? null)
      } else {
        setAdviserName(null)
      }
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
    if (!canFileForOrganization(selectedOrg)) {
      setActivityError('Only a president or secretary can record activities for this organization.')
      return
    }

    try {
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
      setActivityError(null)
      await loadData()
    } catch (err) {
      setActivityError((err as Error).message)
    }
  }

  return (
    <div className="space-y-8">
      <div className="bg-[var(--ink)] text-[var(--paper)] rounded-[var(--radius)] border border-[var(--line-strong)] p-6 sm:p-8 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 min-w-0">
          {selectedOrg?.logo_url ? (
            <img
              src={selectedOrg.logo_url}
              alt={selectedOrg.name}
              className="w-12 h-12 sm:w-14 sm:h-14 rounded-[var(--radius)] object-cover border border-[var(--paper)]/15 grayscale shrink-0"
            />
          ) : (
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-[var(--radius)] bg-[var(--ink-soft)] flex items-center justify-center border border-[var(--paper)]/15 shrink-0">
              <Compass className="w-7 h-7 text-[var(--accent-line)]" />
            </div>
          )}
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className="px-2 py-0.5 rounded-[var(--radius)] text-xs font-mono font-bold uppercase bg-[var(--paper)] text-[var(--ink)]">
                {selectedOrg?.acronym}
              </span>
              {selectedOrg?.college && (
                <span className="px-2 py-0.5 rounded-[var(--radius)] border border-[var(--paper)]/20 text-xs font-mono uppercase bg-[var(--ink-soft)] text-[var(--paper)]">
                  {selectedOrg.college}
                </span>
              )}
              {selectedOrg?.parent_org_id && (
                <span className="text-xs text-[var(--paper)]/65 font-mono uppercase">
                  · Sub-org under OCTA
                </span>
              )}
              {adviserName && (
                <span className="px-2 py-0.5 rounded-[var(--radius)] border border-[var(--accent)]/40 text-xs font-mono bg-[var(--ink-soft)] text-[var(--accent-line)]">
                  Adviser: {adviserName}
                </span>
              )}
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-[var(--paper)] tracking-tight">{selectedOrg?.name}</h1>
            <p className="text-xs text-[var(--paper)]/70 mt-1 max-w-2xl leading-relaxed">
              {selectedOrg?.description}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto shrink-0">
          {filingOrg && (
            <Link
              to={`/proposals/new?org=${filingOrg.id}`}
              className="flex-1 sm:flex-none justify-center btn-accent text-xs gap-2"
            >
              <FileText className="w-4 h-4" />
              File Event Proposal
            </Link>
          )}
          {!filingOrg && (
            <p className="text-xs text-[var(--paper)]/65">
              Only a president or secretary can file proposals for an organization.
            </p>
          )}
          <Link
            to="/proposals"
            className="flex-1 sm:flex-none justify-center px-4 py-2.5 rounded-[var(--radius)] border border-[var(--paper)]/25 bg-[var(--ink-soft)] text-[var(--paper)] font-semibold text-xs flex items-center gap-2 hover:border-[var(--accent)] transition"
          >
            View Proposals
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-6 bg-[var(--paper)] rounded-sm border border-[var(--line)] p-6 space-y-4">
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
                disabled={!canFileForOrganization(selectedOrg ?? {})}
                className="p-2 rounded-sm border border-[var(--ink)] text-[var(--ink)] hover:bg-[var(--accent-tint)] transition disabled:opacity-40 disabled:pointer-events-none"
                title={
                  canFileForOrganization(selectedOrg ?? {})
                    ? 'Add Activity'
                    : 'Only a president or secretary can record activities for this organization'
                }
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
                  className="p-3 rounded-sm border border-[var(--line)] bg-[var(--surface)] space-y-2 hover:border-[var(--accent-line)] transition"
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

        <div className="lg:col-span-6 bg-[var(--paper)] rounded-sm border border-[var(--line)] p-6 space-y-4">
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
                    className="p-3 rounded-sm border border-[var(--line)] bg-[var(--paper)] space-y-2 hover:border-[var(--accent-line)] transition"
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

      {/* University-Wide Student Organization Events Calendar */}
      <StudentOrgEventsCalendar />

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
          {activityError && (
            <p role="alert" className="border border-[var(--line-strong)] bg-[var(--ink-dark)] text-[var(--paper)] text-xs p-3">
              {activityError}
            </p>
          )}
          <div>
            <label htmlFor="org-activity-title" className="block text-sm font-medium text-[var(--ink)] mb-1">Activity Title *</label>
            <input
              id="org-activity-title"
              type="text"
              placeholder="e.g. CodeCamp: Full-Stack Web Sprint"
              value={actTitle}
              onChange={(e) => setActTitle(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-sm border border-[var(--line)] bg-[var(--paper)] text-[var(--ink)] focus:border-[var(--line-strong)]"
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
              className="w-full px-3 py-2 rounded-sm border border-[var(--line)] bg-[var(--paper)] text-[var(--ink)] focus:border-[var(--line-strong)]"
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
                className="w-full px-3 py-2 rounded-sm border border-[var(--line)] bg-[var(--paper)] text-[var(--ink)] focus:border-[var(--line-strong)]"
              />
            </div>
            <div>
              <label htmlFor="org-activity-attendees" className="block text-sm font-medium text-[var(--ink)] mb-1">Expected Attendees</label>
              <input
                id="org-activity-attendees"
                type="number"
                value={actAttendees}
                onChange={(e) => setActAttendees(Number(e.target.value) || 0)}
                className="w-full px-3 py-2 rounded-sm border border-[var(--line)] bg-[var(--paper)] text-[var(--ink)] focus:border-[var(--line-strong)]"
              />
            </div>
          </div>
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--line)]">
            <button
              type="button"
              onClick={() => setShowNewActivityModal(false)}
              className="px-4 py-2 rounded-sm text-[var(--muted)] font-medium hover:bg-[var(--accent-tint)] transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-sm bg-[var(--accent)] text-[var(--accent-ink)] font-semibold hover:bg-[var(--accent-strong)] transition"
            >
              Save Activity
            </button>
          </div>
        </form>
      </Dialog>
    </div>
  )
}
