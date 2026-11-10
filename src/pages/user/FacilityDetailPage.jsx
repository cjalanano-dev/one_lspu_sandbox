import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  Building2, 
  Users, 
  Cpu, 
  Calendar, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowLeft, 
  Check, 
  ChevronRight,
  ShieldAlert
} from 'lucide-react'
import { dataStore } from '../../lib/dataStore'
import { useAuth } from '../../features/auth/AuthContext'
import { formatDateTime, getStatusBadgeClass } from '../../lib/utils'

export function FacilityDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, isOfficer } = useAuth()

  const [facility, setFacility] = useState(null)
  const [building, setBuilding] = useState(null)
  const [existingReservations, setExistingReservations] = useState([])
  const [orgActivities, setOrgActivities] = useState([])
  const [organizations, setOrganizations] = useState([])

  // Reservation form state
  const [title, setTitle] = useState('')
  const [purpose, setPurpose] = useState('')
  const [date, setDate] = useState('2026-11-16')
  const [startTime, setStartTime] = useState('09:00')
  const [endTime, setEndTime] = useState('11:00')
  const [attendeeCount, setAttendeeCount] = useState(30)
  const [selectedActivityId, setSelectedActivityId] = useState('')
  const [selectedOrgId, setSelectedOrgId] = useState(user?.organization_id || 'org-acm')
  const [selectedEquipment, setSelectedEquipment] = useState([])

  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  useEffect(() => {
    async function loadData() {
      const fac = await dataStore.getFacilityById(id)
      if (fac) {
        setFacility(fac)
        const b = await dataStore.getBuildingById(fac.building_id)
        setBuilding(b)
        const resList = await dataStore.getReservations({ facilityId: fac.id })
        setExistingReservations(resList)
      }

      const orgs = await dataStore.getOrganizations()
      setOrganizations(orgs)

      const acts = await dataStore.getActivities()
      setOrgActivities(acts)
    }
    loadData()
  }, [id])

  const toggleEquipment = (item) => {
    if (selectedEquipment.includes(item)) {
      setSelectedEquipment(selectedEquipment.filter((i) => i !== item))
    } else {
      setSelectedEquipment([...selectedEquipment, item])
    }
  }

  const handleReservationSubmit = async (e) => {
    e.preventDefault()
    setErrorMsg('')
    setSuccessMsg('')
    setSubmitting(true)

    try {
      if (!title || !purpose || !date || !startTime || !endTime) {
        throw new Error('Please fill in all required fields.')
      }

      if (attendeeCount > (facility.capacity || 100)) {
        throw new Error(`Attendee count (${attendeeCount}) exceeds facility capacity (${facility.capacity}).`)
      }

      const startDateTimeStr = `${date}T${startTime}:00Z`
      const endDateTimeStr = `${date}T${endTime}:00Z`

      await dataStore.createReservation({
        facility_id: facility.id,
        requester_id: user?.id || 'usr-officer-01',
        organization_id: isOfficer ? selectedOrgId : null,
        activity_id: isOfficer && selectedActivityId ? selectedActivityId : null,
        title,
        purpose,
        start_datetime: startDateTimeStr,
        end_datetime: endDateTimeStr,
        attendee_count: Number(attendeeCount),
        requested_equipment: selectedEquipment,
      })

      setSuccessMsg('Reservation request submitted successfully! Awaiting administrator approval.')
      // Refresh reservations
      const refreshed = await dataStore.getReservations({ facilityId: facility.id })
      setExistingReservations(refreshed)

      // Reset form fields
      setTitle('')
      setPurpose('')
      setTimeout(() => {
        navigate('/my-reservations')
      }, 1500)
    } catch (err) {
      setErrorMsg(err.message)
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
                  08:00 AM - 08:00 PM
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
          <img
            src={facility.image_url}
            alt={facility.name}
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      {/* Two Column Layout: Reservation Form & Facility Calendar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Reservation Request Form */}
        <div className="lg:col-span-7 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm">
          <div className="border-b border-slate-100 pb-4 mb-6">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-sky-600" />
              Submit Facility Reservation Request
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              All reservations are automatically validated for scheduling conflicts before submission.
            </p>
          </div>

          {errorMsg && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-700 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleReservationSubmit} className="space-y-4 text-xs">
            {/* Title */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Reservation Title *
              </label>
              <input
                type="text"
                placeholder="e.g. ACM Annual Tech Summit 2026"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
              />
            </div>

            {/* Purpose */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Purpose & Event Details *
              </label>
              <textarea
                rows="2"
                placeholder="Provide a brief explanation of how the facility will be utilized..."
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
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
                    value={selectedOrgId}
                    onChange={(e) => setSelectedOrgId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-indigo-200 text-slate-800 font-medium focus:ring-1 focus:ring-indigo-500"
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
                    value={selectedActivityId}
                    onChange={(e) => setSelectedActivityId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-indigo-200 text-slate-800 font-medium focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="">-- Standalone Reservation --</option>
                    {orgActivities
                      .filter((a) => !selectedOrgId || a.organization_id === selectedOrgId)
                      .map((act) => (
                        <option key={act.id} value={act.id}>
                          {act.title} ({act.activity_date})
                        </option>
                      ))}
                  </select>
                </div>
              </div>
            )}

            {/* Date and Time slots */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Date *</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Start Time *</label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">End Time *</label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                />
              </div>
            </div>

            {/* Expected Attendees */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Expected Attendees (Max Capacity: {facility.capacity})
              </label>
              <input
                type="number"
                min="1"
                max={facility.capacity}
                value={attendeeCount}
                onChange={(e) => setAttendeeCount(e.target.value)}
                required
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
              />
            </div>

            {/* Equipment Checklist */}
            {facility.equipment && facility.equipment.length > 0 && (
              <div>
                <label className="block font-semibold text-slate-700 mb-2">
                  Request Specific Equipment Setup:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {facility.equipment.map((item, idx) => {
                    const checked = selectedEquipment.includes(item)
                    return (
                      <div
                        key={idx}
                        onClick={() => toggleEquipment(item)}
                        className={`p-2.5 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                          checked
                            ? 'bg-sky-50/70 border-sky-400 text-sky-950 font-medium'
                            : 'bg-slate-50 border-slate-200 text-slate-700'
                        }`}
                      >
                        <span className="text-xs truncate">{item}</span>
                        <div
                          className={`w-4 h-4 rounded flex items-center justify-center shrink-0 ml-2 ${
                            checked ? 'bg-sky-600 text-white' : 'border border-slate-300'
                          }`}
                        >
                          {checked && <Check className="w-3 h-3" />}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
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
