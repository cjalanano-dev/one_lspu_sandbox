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
import { useAuth } from '../../features/auth/AuthContext'
import { formatDateTime, getStatusBadgeClass } from '../../lib/utils'
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

// ---------- Time helpers ----------

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

  // Availability flow state
  const [formDate, setFormDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [selectedSlot, setSelectedSlot] = useState<{ start: string; end: string } | null>(null)
  const [availableSlots, setAvailableSlots] = useState<Array<{ start: string; end: string; available: boolean }>>([])

  // Details form state
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

  // Recompute available slots whenever date, schedules, reservations, or maintenance change
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

    // Deselect slot if date changed
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

      // Refresh reservations and recompute availability
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

  if (!facility) {
    return (
      <div className="py-12 text-center text-slate-400">
        Loading facility details...
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Back button & Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <button
          onClick={() => navigate('/explorer')}
          className="hover:text-slate-800 flex items-center gap-1 font-medium transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Campus Explorer
        </button>
        <ChevronRight className="w-3 h-3 text-slate-300" />
        <span>{building?.name}</span>
        <ChevronRight className="w-3 h-3 text-slate-300" />
        <span className="font-semibold text-slate-800">{facility.name}</span>
      </div>

      {/* Hero Facility Showcase */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm grid grid-cols-1 lg:grid-cols-12 gap-0">
        <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-slate-900 text-white">
                {facility.facility_code}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 capitalize">
                {facility.category.replace('_', ' ')}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                Active & Reservable
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">{facility.name}</h1>
            <p className="text-sm text-slate-600 mt-3 leading-relaxed">{facility.description}</p>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-6">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-xs text-slate-400 block">Capacity</span>
                <span className="text-sm font-bold text-slate-800 flex items-center gap-1.5 mt-0.5">
                  <Users className="w-4 h-4 text-sky-600" />
                  {facility.capacity} People
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-xs text-slate-400 block">Operating Hours</span>
                <span className="text-sm font-bold text-slate-800 flex items-center gap-1.5 mt-0.5">
                  <Clock className="w-4 h-4 text-indigo-600" />
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
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-xs text-slate-400 block">Location</span>
                <span className="text-sm font-bold text-slate-800 flex items-center gap-1.5 mt-0.5">
                  <Building2 className="w-4 h-4 text-emerald-600" />
                  {building?.code} Level
                </span>
              </div>
            </div>

            {/* Equipment specs */}
            <div className="mt-6">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5" />
                Available Built-in Equipment
              </h4>
              <div className="flex flex-wrap gap-2">
                {facility.equipment?.map((item, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-700"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {facility.rules && (
            <div className="mt-6 p-3 bg-amber-50/60 rounded-xl border border-amber-200/80 text-xs text-amber-800 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>{facility.rules}</span>
            </div>
          )}
        </div>

        <div className="lg:col-span-5 relative aspect-square lg:aspect-auto bg-slate-100">
          {facility.image_url ? (
            <img
              src={facility.image_url}
              alt={facility.name}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full bg-slate-200 flex items-center justify-center">
              <Building2 className="w-12 h-12 text-slate-400" />
            </div>
          )}
        </div>
      </div>

      {/* Two Column Layout: Reservation Form & Facility Calendar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Reservation Request Form */}
        <div className="lg:col-span-7 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm">
          {!user ? (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
              <Lock className="w-12 h-12 text-slate-400" />
              <h4 className="text-lg font-bold text-slate-900">Sign in to reserve this facility</h4>
              <p className="text-slate-600 text-sm max-w-sm">
                You must be logged in to submit a reservation request. Sign in or create an account to get started.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  to="/login"
                  className="px-6 py-3 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold shadow-lg shadow-sky-500/25 transition"
                >
                  Sign in
                </Link>
                <Link
                  to="/register"
                  className="px-6 py-3 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition"
                >
                  Create account
                </Link>
              </div>
            </div>
          ) : (
            <>
              <div className="border-b border-slate-100 pb-4 mb-6">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-sky-600" />
                  Submit Facility Reservation Request
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Choose a date and an available time slot, then describe your request.
                </p>
              </div>

              {errorMsg && (
                <div id="reservation-error" className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2" role="alert">
                  <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {successMsg && (
                <div id="reservation-success" className="mb-5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-700 flex items-start gap-2" role="status" aria-live="polite">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{successMsg}</span>
                </div>
              )}

              {/* Step 1: Date */}
              <div>
                <label htmlFor="reservation-date" className="block font-semibold text-slate-700 mb-1">
                  Date *
                </label>
                <input
                  id="reservation-date"
                  type="date"
                  value={formDate}
                  min={new Date().toISOString().slice(0, 10)}
                  onChange={(e) => setFormDate(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                />
              </div>

              {/* Step 2: Time slots */}
              <div className="mt-6">
                <label className="block font-semibold text-slate-700 mb-2">
                  Available Time Slots *
                </label>
                {availableSlots.length === 0 ? (
                  <div className="p-4 rounded-xl bg-rose-50 text-xs text-rose-700 border border-rose-100">
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
                        className={`px-3 py-2.5 rounded-lg text-xs font-medium border transition ${
                          selectedSlot?.start === slot.start && selectedSlot?.end === slot.end
                            ? 'bg-sky-500 border-sky-500 text-slate-950 shadow-sm'
                            : slot.available
                            ? 'bg-white border-sky-200 text-slate-700 hover:bg-sky-50 hover:border-sky-400'
                            : 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                        }`}
                      >
                        {slot.start} – {slot.end}
                        {!slot.available && (
                          <span className="ml-1 text-[9px] opacity-70">unavailable</span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
                {selectedSlot && (
                  <p className="mt-2 text-xs text-sky-600 font-medium">
                    Selected: {selectedSlot.start} – {selectedSlot.end} on {formDate}
                  </p>
                )}
              </div>

              {/* Step 3: Details (shown only after slot selected) */}
              {selectedSlot ? (
                <form onSubmit={handleReservationSubmit} className="mt-6 space-y-4 text-xs border-t border-slate-100 pt-6">
                  {/* Title */}
                  <div>
                    <label htmlFor="reservation-title" className="block font-semibold text-slate-700 mb-1">
                      Reservation Title *
                    </label>
                    <input
                      id="reservation-title"
                      type="text"
                      placeholder="e.g. ACM Annual Tech Summit 2026"
                      value={form.title}
                      onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                      aria-describedby="reservation-error"
                    />
                  </div>

                  {/* Purpose */}
                  <div>
                    <label htmlFor="reservation-purpose" className="block font-semibold text-slate-700 mb-1">
                      Purpose & Event Details *
                    </label>
                    <textarea
                      id="reservation-purpose"
                      rows={2}
                      placeholder="Provide a brief explanation of how the facility will be utilized..."
                      value={form.purpose}
                      onChange={(e) => setForm((prev) => ({ ...prev, purpose: e.target.value }))}
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                      aria-describedby="reservation-error"
                    />
                  </div>

                  {/* If Organization Officer: Associate Activity and Org */}
                  {isOfficer && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100">
                      <div>
                        <label className="block font-semibold text-indigo-950 mb-1">
                          Student Organization
                        </label>
                        <select
                          value={form.selectedOrgId}
                          onChange={(e) =>
                            setForm((prev) => ({ ...prev, selectedOrgId: e.target.value }))
                          }
                          className="w-full px-3 py-2 rounded-xl bg-white border border-indigo-200 text-slate-800 font-medium focus:ring-1 focus:ring-indigo-500"
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
                        <label className="block font-semibold text-indigo-950 mb-1">
                          Associated Org Activity
                        </label>
                        <select
                          value={form.selectedActivityId}
                          onChange={(e) =>
                            setForm((prev) => ({ ...prev, selectedActivityId: e.target.value }))
                          }
                          className="w-full px-3 py-2 rounded-xl bg-white border border-indigo-200 text-slate-800 font-medium focus:ring-1 focus:ring-indigo-500"
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
                  )}

                  {/* Expected Attendees */}
                  <div>
                    <label htmlFor="reservation-attendees" className="block font-semibold text-slate-700 mb-1">
                      Expected Attendees (Max Capacity: {facility.capacity})
                    </label>
                    <input
                      id="reservation-attendees"
                      type="number"
                      min="1"
                      max={facility.capacity}
                      value={form.attendeeCount}
                      onChange={(e) => setForm((prev) => ({ ...prev, attendeeCount: Number(e.target.value) || 1 }))}
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                      aria-describedby="reservation-error"
                    />
                  </div>

                  {/* Equipment Checklist */}
                  {facility.equipment && facility.equipment.length > 0 && (
                    <fieldset className="border rounded-lg p-3">
                      <legend className="block font-semibold text-slate-700 mb-2 px-2">
                        Request Specific Equipment Setup:
                      </legend>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2" role="group" aria-label="Equipment options">
                        {facility.equipment.map((item) => {
                          const checked = form.selectedEquipment.includes(item)
                          const id = `equipment-${item.replace(/\s+/g, '-')}`
                          return (
                            <div key={item} className="flex items-center gap-2 p-2 rounded-xl border cursor-pointer transition hover:bg-slate-50">
                              <input
                                id={id}
                                type="checkbox"
                                checked={checked}
                                onChange={() => toggleEquipment(item)}
                                className="w-4 h-4 rounded text-sky-600 focus:ring-2 focus:ring-sky-500 border-slate-300"
                                aria-label={item}
                              />
                              <label htmlFor={id} className="text-xs truncate cursor-pointer select-none">
                                {item}
                              </label>
                            </div>
                          )
                        })}
                      </div>
                    </fieldset>
                  )}

                  {/* Submit Action */}
                  <div className="pt-3">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold shadow-md transition disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {submitting ? 'Validating Conflicts...' : 'Confirm & Request Reservation'}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="mt-6 p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <p className="text-sm text-slate-600">
                    Select an available time slot above to continue with your reservation details.
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Facility Schedule & Availability Calendar List */}
        <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <Clock className="w-4 h-4 text-sky-600" />
              Existing Schedule & Bookings
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Approved slots block new bookings. Pending slots are queued for review.
            </p>
          </div>

          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
            {existingReservations.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                No active reservations for this facility. All standard operating hours are open.
              </div>
            ) : (
              existingReservations.map((res) => (
                <div
                  key={res.id}
                  className="p-3.5 rounded-2xl border border-slate-100 bg-slate-50/70 flex flex-col gap-1.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-bold text-slate-900 text-xs">{res.title}</span>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getStatusBadgeClass(
                        res.status
                      )}`}
                    >
                      {res.status.toUpperCase()}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    <span>{formatDateTime(res.start_datetime)}</span>
                    <span>→</span>
                    <span>{new Date(res.end_datetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  {res.purpose && (
                    <p className="text-[11px] text-slate-600 line-clamp-1 italic">
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
