import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  Building2,
  Users,
  Cpu,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle2,
  ArrowLeft,
  ChevronRight,
  ShieldAlert,
  Lock,
} from 'lucide-react'
import { dataStore } from '../../lib/dataStore'
import { facilityImageUrl } from '../../lib/facilityImages'
import { useAuth } from '../../features/auth/AuthContext'
import { formatDateTime } from '../../lib/utils'
import type {
  Facility,
  Building,
  Reservation,
  Organization,
  Activity,
  User,
  MaintenancePeriod,
} from '../../types'

interface ReservationFormData {
  title: string
  purpose: string
  attendeeCount: number
  selectedActivityId: string
  selectedOrgId: string
  selectedEquipment: string[]
}

function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

function minutesToTime(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60)
    .toString()
    .padStart(2, '0')
  const m = (totalMinutes % 60).toString().padStart(2, '0')
  return `${h}:${m}`
}

function overlaps(aStart: number, aEnd: number, bStart: number, bEnd: number): boolean {
  return aStart < bEnd && aEnd > bStart
}

export function FacilityDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, isOfficer } = useAuth()

  const [facility, setFacility] = useState<Facility | null>(null)
  const [building, setBuilding] = useState<Building | null>(null)
  const [existingReservations, setExistingReservations] = useState<Reservation[]>([])
  const [orgActivities, setOrgActivities] = useState<Activity[]>([])
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [schedules, setSchedules] = useState<any[]>([])
  const [maintenance, setMaintenance] = useState<MaintenancePeriod[]>([])

  const [formDate, setFormDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [selectedSlot, setSelectedSlot] = useState<{ start: string; end: string } | null>(null)
  const [availableSlots, setAvailableSlots] = useState<Array<{ start: string; end: string; available: boolean }>>([])

  const [form, setForm] = useState<ReservationFormData>({
    title: '',
    purpose: '',
    attendeeCount: 30,
    selectedActivityId: '',
    selectedOrgId: user?.organization_id || '',
    selectedEquipment: [],
  })

  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  useEffect(() => {
    async function loadData() {
      if (!id) return
      const fac = await dataStore.getFacilityById(id)
      if (fac) {
        setFacility(fac)
        const b = await dataStore.getBuildingById(fac.building_id)
        setBuilding(b)
        const resList = await dataStore.getReservations({ facilityId: fac.id })
        setExistingReservations(resList)
        const schList = await dataStore.getSchedules(fac.id)
        setSchedules(schList)
        const maintList = await dataStore.getMaintenance()
        setMaintenance(maintList)
      }

      const orgs = await dataStore.getOrganizations()
      setOrganizations(orgs)

      const acts = await dataStore.getActivities()
      setOrgActivities(acts)
    }
    loadData()
  }, [id])

  useEffect(() => {
    if (!facility || !schedules.length) {
      setAvailableSlots([])
      return
    }

    const day = new Date(formDate)
    const dayOfWeek = day.getDay()
    const schedule = schedules.find((s) => s.day_of_week === dayOfWeek)

    if (!schedule || !schedule.is_available) {
      setAvailableSlots([])
      return
    }

    const opening = timeToMinutes(schedule.opening_time)
    const closing = timeToMinutes(schedule.closing_time)

    const sameDayReservations = existingReservations.filter((r) =>
      r.start_datetime.startsWith(formDate),
    )
    const sameDayMaintenance = maintenance.filter((m) =>
      m.start_datetime.startsWith(formDate),
    )

    const slots: Array<{ start: string; end: string; available: boolean }> = []
    for (let start = opening; start + 60 <= closing; start += 30) {
      const end = start + 60
      const startStr = minutesToTime(start)
      const endStr = minutesToTime(end)

      const conflict = sameDayReservations.some((r) => {
        if (r.status !== 'approved') return false
        const rStart = timeToMinutes(r.start_datetime.slice(11, 16))
        const rEnd = timeToMinutes(r.end_datetime.slice(11, 16))
        return overlaps(start, end, rStart, rEnd)
      })

      const maintConflict = sameDayMaintenance.some((m) => {
        const mStart = timeToMinutes(m.start_datetime.slice(11, 16))
        const mEnd = timeToMinutes(m.end_datetime.slice(11, 16))
        return overlaps(start, end, mStart, mEnd)
      })

      slots.push({ start: startStr, end: endStr, available: !conflict && !maintConflict })
    }

    setAvailableSlots(slots)
    setSelectedSlot(null)
  }, [formDate, facility, schedules, existingReservations, maintenance])

  const toggleEquipment = (item: string) => {
    setForm((prev) => {
      if (prev.selectedEquipment.includes(item)) {
        return { ...prev, selectedEquipment: prev.selectedEquipment.filter((i) => i !== item) }
      } else {
        return { ...prev, selectedEquipment: [...prev.selectedEquipment, item] }
      }
    })
  }

  const handleReservationSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')
    setSuccessMsg('')

    if (!selectedSlot) {
      setErrorMsg('Please select an available time slot.')
      return
    }

    if (!form.title || !form.purpose) {
      setErrorMsg('Please fill in all required fields.')
      return
    }

    if (!user) throw new Error('Please sign in to request a reservation.')
    if (!facility) throw new Error('Facility not found.')

    if (form.attendeeCount > facility.capacity) {
      setErrorMsg(
        `Attendee count (${form.attendeeCount}) exceeds facility capacity (${facility.capacity}).`,
      )
      return
    }

    setSubmitting(true)

    try {
      const startDateTimeStr = `${formDate}T${selectedSlot.start}:00Z`
      const endDateTimeStr = `${formDate}T${selectedSlot.end}:00Z`

      await dataStore.createReservation({
        facility_id: facility.id,
        requester_id: user.id,
        organization_id: isOfficer ? form.selectedOrgId : null,
        activity_id: isOfficer && form.selectedActivityId ? form.selectedActivityId : null,
        title: form.title,
        purpose: form.purpose,
        start_datetime: startDateTimeStr,
        end_datetime: endDateTimeStr,
        attendee_count: form.attendeeCount,
        requested_equipment: form.selectedEquipment,
      })

      setSuccessMsg(
        `Reservation request submitted successfully for ${formatDateTime(startDateTimeStr)}. Awaiting administrator approval.`,
      )

      if (facility) {
        const refreshed = await dataStore.getReservations({ facilityId: facility.id })
        setExistingReservations(refreshed)
      }

      setForm((prev) => ({ ...prev, title: '', purpose: '' }))
      setSelectedSlot(null)
      setTimeout(() => {
        navigate('/my-reservations')
      }, 1500)
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'An error occurred.')
    } finally {
      setSubmitting(false)
    }
  }

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

  if (!facility) {
    return (
      <div className="py-12 text-center text-[var(--muted)]">
        Loading facility details...
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-xs text-[var(--muted)]">
        <button
          onClick={() => navigate('/explorer')}
          className="hover:text-[var(--ink)] flex items-center gap-1 font-medium transition"
        >
          <ArrowLeft className="w-3 h-3" />
          Campus Explorer
        </button>
        <ChevronRight className="w-3 h-3 text-[var(--faint)]" />
        <span className="text-[var(--ink)]">{building?.name}</span>
        <ChevronRight className="w-3 h-3 text-[var(--faint)]" />
        <span className="font-semibold text-[var(--ink)]">{facility.name}</span>
      </div>

      <div className="rounded-sm border border-[var(--line)] bg-[var(--paper)] overflow-hidden grid grid-cols-1 lg:grid-cols-12 gap-0">
        <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="tag tag-available font-bold">{facility.facility_code}</span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm border border-[var(--accent)] text-xs font-bold uppercase bg-[var(--accent)] text-[var(--accent-ink)]">
                {facility.category.replace('_', ' ')}
              </span>
              <span className="tag tag-available font-bold">Active & Reservable</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--ink)]">{facility.name}</h1>
            <p className="text-sm text-[var(--muted)] mt-3 leading-relaxed">{facility.description}</p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-6">
              <div className="p-3 border border-[var(--line)] rounded-sm bg-[var(--surface)]">
                <span className="text-[var(--faint)] block font-medium text-xs uppercase tracking-wider">Capacity</span>
                <span className="font-bold text-[var(--ink)] text-sm flex items-center gap-1.5 mt-0.5">
                  <Users className="w-4 h-4 text-[var(--ink)]" />
                  {facility.capacity} People
                </span>
              </div>
              <div className="p-3 border border-[var(--line)] rounded-sm bg-[var(--surface)]">
                <span className="text-[var(--faint)] block font-medium text-xs uppercase tracking-wider">Operating Hours</span>
                <span className="font-bold text-[var(--ink)] text-sm flex items-center gap-1.5 mt-0.5">
                  <Clock className="w-4 h-4 text-[var(--ink)]" />
                  {schedules.length > 0 ? (
                    <>
                      {minutesToTime(timeToMinutes(schedules[0].opening_time))}
                      - {minutesToTime(timeToMinutes(schedules[0].closing_time))}
                    </>
                  ) : (
                    '08:00 AM - 08:00 PM'
                  )}
                </span>
              </div>
              <div className="p-3 border border-[var(--line)] rounded-sm bg-[var(--surface)]">
                <span className="text-[var(--faint)] block font-medium text-xs uppercase tracking-wider">Location</span>
                <span className="font-bold text-[var(--ink)] text-sm flex items-center gap-1.5 mt-0.5">
                  <Building2 className="w-4 h-4 text-[var(--ink)]" />
                  {building?.code} Level
                </span>
              </div>
            </div>

            <div className="mt-6">
              <h4 className="text-xs font-bold text-[var(--muted)] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Cpu className="w-3 h-3 text-[var(--ink)]" />
                Available Built-in Equipment
              </h4>
              <div className="flex flex-wrap gap-2">
                {facility.equipment?.map((item, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-sm border border-[var(--line)] text-xs font-medium text-[var(--ink)] bg-[var(--paper)]"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>

            {facility.rules && (
              <div className="mt-6 p-3 border-l-4 border-[var(--ink)] bg-[var(--surface-2)] text-xs text-[var(--ink)] flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-[var(--ink)] shrink-0 mt-0.5" />
                <span>{facility.rules}</span>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-5 relative aspect-square lg:aspect-auto bg-[var(--surface-2)]">
          <img
            src={facilityImageUrl(facility)}
            alt={facility.name}
            className="w-full h-full object-cover grayscale"
            loading="lazy"
            onError={(e) => {
              e.currentTarget.src = facilityImageUrl({
                image_url: null,
                category: 'multipurpose',
              })
            }}
          />
          <span className="absolute top-2 right-2 px-2 py-0.5 rounded-sm text-xs font-bold uppercase bg-[var(--accent)] text-[var(--accent-ink)] border border-[var(--accent)]">
            {facility.facility_code}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 bg-[var(--paper)] rounded-sm border border-[var(--line)] p-6 sm:p-8">
          {!user ? (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
              <Lock className="w-12 h-12 text-[var(--muted)]" />
              <h4 className="text-lg font-bold text-[var(--ink)]">Sign in to reserve this facility</h4>
              <p className="text-sm text-[var(--muted)] max-w-sm">
                You must be logged in to submit a reservation request. Sign in or create an account to get started.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  to="/login"
                  className="w-full sm:w-auto px-6 py-3 rounded-sm bg-[var(--accent)] text-[var(--accent-ink)] font-semibold text-sm hover:bg-[var(--accent-strong)] transition"
                >
                  Sign in
                </Link>
              </div>
            </div>
          ) : (
            <>
              <div className="border-b border-[var(--line)] pb-4 mb-6">
                <h3 className="text-lg font-bold text-[var(--ink)] flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-[var(--ink)]" />
                  Submit Facility Reservation Request
                </h3>
                <p className="text-xs text-[var(--muted)] mt-1 uppercase tracking-wider font-medium">
                  Choose a date and an available time slot, then describe your request.
                </p>
              </div>

              {errorMsg && (
                <div id="reservation-error" className="mb-5 p-3 border-[var(--line-strong)] bg-[var(--ink-dark)] text-[var(--paper)] text-xs flex items-start gap-2" role="alert">
                  <ShieldAlert className="w-4 h-4 text-[var(--paper)] shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {successMsg && (
                <div id="reservation-success" className="mb-5 p-3 border-[var(--accent-deep)] bg-[var(--accent-deep)] text-[var(--paper)] text-xs flex items-start gap-2" role="status" aria-live="polite">
                  <CheckCircle2 className="w-4 h-4 text-[var(--paper)] shrink-0 mt-0.5" />
                  <span>{successMsg}</span>
                </div>
              )}

              <div>
                <label htmlFor="reservation-date" className="block text-sm font-medium text-[var(--ink)] mb-1">
                  Date *
                </label>
                <input
                  id="reservation-date"
                  type="date"
                  value={formDate}
                  min={new Date().toISOString().slice(0, 10)}
                  onChange={(e) => setFormDate(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-sm border border-[var(--line)] bg-[var(--paper)] text-[var(--ink)] focus:border-[var(--line-strong)]"
                />
              </div>

              <div className="mt-6">
                <label className="block text-sm font-medium text-[var(--ink)] mb-2">
                  Available Time Slots *
                </label>
                {availableSlots.length === 0 ? (
                  <div className="p-4 rounded-sm border border-[var(--line-strong)] bg-[var(--paper)] text-[var(--ink)] text-xs">
                    No available time slots on this date. The facility may be closed, fully booked,
                    or under maintenance. Try another day.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2">
                    {availableSlots.map((slot) => (
                      <button
                        key={`${slot.start}-${slot.end}`}
                        onClick={() => setSelectedSlot(slot)}
                        disabled={!slot.available}
                        aria-pressed={selectedSlot?.start === slot.start && selectedSlot?.end === slot.end}
                        className={`px-3 py-2.5 rounded-sm text-xs font-medium border transition ${
                          selectedSlot?.start === slot.start && selectedSlot?.end === slot.end
                            ? 'bg-[var(--accent)] border-[var(--accent)] text-[var(--accent-ink)] '
                            : slot.available
                            ? 'bg-[var(--paper)] border-[var(--line-strong)] text-[var(--ink)] hover:bg-[var(--surface-2)] hover:border-[var(--ink)]'
                            : 'bg-[var(--surface-2)] border-[var(--line)] text-[var(--faint)] cursor-not-allowed'
                        }`}
                      >
                        {slot.start} – {slot.end}
                        {!slot.available && (
                          <span className="ml-1 text-xs text-[var(--faint)]">unavailable</span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
                {selectedSlot && (
                  <p className="mt-2 text-xs text-[var(--ink)] font-medium">
                    Selected: {selectedSlot.start} – {selectedSlot.end} on {formDate}
                  </p>
                )}
              </div>

              {selectedSlot ? (
                <form onSubmit={handleReservationSubmit} className="mt-6 space-y-4 text-[var(--ink)] border-t border-[var(--line)] pt-6">
                  <div>
                    <label htmlFor="reservation-title" className="block text-sm font-medium text-[var(--ink)] mb-1">
                      Reservation Title *
                    </label>
                    <input
                      id="reservation-title"
                      type="text"
                      placeholder="e.g. ACM Annual Tech Summit 2026"
                      value={form.title}
                      onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                      required
                      className="w-full px-3.5 py-2.5 rounded-sm border border-[var(--line)] bg-[var(--paper)] text-[var(--ink)] focus:border-[var(--line-strong)]"
                    />
                  </div>

                  <div>
                    <label htmlFor="reservation-purpose" className="block text-sm font-medium text-[var(--ink)] mb-1">
                      Purpose & Event Details *
                    </label>
                    <textarea
                      id="reservation-purpose"
                      rows={2}
                      placeholder="Provide a brief explanation of how the facility will be utilized..."
                      value={form.purpose}
                      onChange={(e) => setForm((prev) => ({ ...prev, purpose: e.target.value }))}
                      required
                      className="w-full px-3.5 py-2.5 rounded-sm border border-[var(--line)] bg-[var(--paper)] text-[var(--ink)] focus:border-[var(--line-strong)]"
                    />
                  </div>

                  {isOfficer && (
                    <div className="p-4 rounded-sm border border-[var(--line)] bg-[var(--surface-2)]">
                      <h4 className="text-xs font-bold text-[var(--muted)] uppercase tracking-wider mb-3">Organization</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="reservation-org" className="block text-xs font-bold text-[var(--ink)] mb-1 uppercase tracking-widest">
                            Student Organization
                          </label>
                          <select
                            id="reservation-org"
                            value={form.selectedOrgId}
                            onChange={(e) =>
                              setForm((prev) => ({ ...prev, selectedOrgId: e.target.value }))
                            }
                            className="w-full px-3 py-2 rounded-sm border border-[var(--line)] bg-[var(--paper)] text-[var(--ink)] font-medium focus:border-[var(--line-strong)]"
                            aria-label="Student Organization"
                          >
                            {organizations.map((org) => (
                              <option key={org.id} value={org.id}>
                                {org.name} ({org.acronym})
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label htmlFor="reservation-activity" className="block text-xs font-bold text-[var(--ink)] mb-1 uppercase tracking-widest">
                            Associated Org Activity
                          </label>
                          <select
                            id="reservation-activity"
                            value={form.selectedActivityId}
                            onChange={(e) =>
                              setForm((prev) => ({ ...prev, selectedActivityId: e.target.value }))
                            }
                            className="w-full px-3 py-2 rounded-sm border border-[var(--line)] bg-[var(--paper)] text-[var(--ink)] font-medium focus:border-[var(--line-strong)]"
                            aria-label="Associated Org Activity"
                          >
                            <option value="">-- Standalone Reservation --</option>
                            {orgActivities
                              .filter((a) => !form.selectedOrgId || a.organization_id === form.selectedOrgId)
                              .map((act) => (
                                <option key={act.id} value={act.id}>
                                  {act.title} ({act.activity_date})
                                </option>
                              ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  )}

                  <div>
                    <label htmlFor="reservation-attendees" className="block text-sm font-medium text-[var(--ink)] mb-1">
                      Expected Attendees (Max Capacity: {facility.capacity})
                    </label>
                    <input
                      id="reservation-attendees"
                      type="number"
                      min="1"
                      max={facility.capacity}
                      value={form.attendeeCount}
                      onChange={(e) => setForm((prev) => ({ ...prev, attendeeCount: Number(e.target.value) || 1 }))}
                      className="w-full px-3.5 py-2.5 rounded-sm border border-[var(--line)] bg-[var(--paper)] text-[var(--ink)] focus:border-[var(--line-strong)]"
                    />
                  </div>

                  {facility.equipment && facility.equipment.length > 0 && (
                    <fieldset className="border border-[var(--line)] rounded-sm p-3">
                      <legend className="block text-xs font-bold text-[var(--muted)] uppercase tracking-wider mb-3 px-2">
                        Request Specific Equipment Setup
                      </legend>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2" role="group" aria-label="Equipment options">
                        {facility.equipment.map((item) => {
                          const checked = form.selectedEquipment.includes(item)
                          const id = `equipment-${item.replace(/\s+/g, '-')}`
                          return (
                            <div key={item} className={`flex items-center gap-2 p-2 rounded-sm cursor-pointer transition border ${
                              checked ? 'border-[var(--accent)] bg-[var(--accent)]' : 'border-[var(--line)] hover:bg-[var(--surface-2)]'
                            }`}>
                              <input
                                id={id}
                                type="checkbox"
                                checked={checked}
                                onChange={() => toggleEquipment(item)}
                                className={`w-4 h-4 shrink-0 ${
                                  checked ? 'bg-[var(--accent)] text-[var(--accent-ink)] border-[var(--accent)]' : 'text-[var(--ink)] border-[var(--line)]'
                                } focus:ring-2 focus:ring-[var(--line-strong)]`}
                                aria-label={item}
                              />
                              <label htmlFor={id} className="text-xs truncate cursor-pointer select-none text-[var(--ink)]">
                                {item}
                              </label>
                            </div>
                          )
                        })}
                      </div>
                    </fieldset>
                  )}

                  <div className="pt-3">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full py-3 px-4 rounded-sm bg-[var(--accent)] hover:bg-[var(--accent-strong)] text-[var(--accent-ink)] font-semibold text-sm  transition disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {submitting ? 'Validating Conflicts...' : 'Confirm & Request Reservation'}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="mt-6 p-4 rounded-sm border border-[var(--line)] bg-[var(--surface-2)]">
                  <p className="text-sm text-[var(--muted)]">
                    Select an available time slot above to continue with your reservation details.
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        <div className="lg:col-span-5 bg-[var(--paper)] rounded-sm border border-[var(--line)] p-6 space-y-4">
          <div className="border-b border-[var(--line)] pb-3">
            <h3 className="font-bold text-[var(--ink)] text-base flex items-center gap-2">
              <Clock className="w-4 h-4 text-[var(--ink)]" />
              Existing Schedule & Bookings
            </h3>
            <p className="text-xs text-[var(--muted)] mt-0.5 uppercase tracking-wider font-medium">
              Approved slots block new bookings. Pending slots are queued for review.
            </p>
          </div>

          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
            {existingReservations.length === 0 ? (
              <div className="py-8 text-center text-[var(--muted)] text-xs">
                No active reservations for this facility. All standard operating hours are open.
              </div>
            ) : (
              existingReservations.map((res) => (
                <div
                  key={res.id}
                  className="p-3 rounded-sm border border-[var(--line)] bg-[var(--paper)] flex flex-col gap-1.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-bold text-[var(--ink)] text-xs">{res.title}</span>
                    <span className={`tag ${statusTagClass(res.status)}`}>
                      {res.status.toUpperCase()}
                    </span>
                  </div>
                  <div className="text-xs text-[var(--muted)] flex items-center gap-1.5">
                    <Calendar className="w-3 h-3 text-[var(--faint)]" />
                    <span>{formatDateTime(res.start_datetime)}</span>
                    <span>→</span>
                    <span>{new Date(res.end_datetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  {res.purpose && (
                    <p className="text-xs text-[var(--muted)] line-clamp-1 italic">
                      "{res.purpose}"
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
