import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  Users,
  Filter,
  Building2,
  X,
} from 'lucide-react'
import { dataStore } from '../../lib/dataStore'
import { proposalStore } from '../../lib/proposals'
import type { Activity, Facility, Organization, Proposal, Reservation } from '../../types'

type CalendarViewMode = 'month' | 'week' | 'day'

export interface UnifiedOrgEvent {
  id: string
  title: string
  description: string | null
  organizationId: string
  organizationAcronym: string
  organizationName: string
  facilityId: string | null
  facilityName: string | null
  facilityCode: string | null
  start: Date
  end: Date
  allDay: boolean
  status: 'approved' | 'pending' | 'planned'
  attendees: number
  source: 'proposal' | 'reservation' | 'activity'
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0)
}

function endOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999)
}

function eventOccursOnDate(ev: UnifiedOrgEvent, targetDate: Date): boolean {
  const dayStart = startOfDay(targetDate).getTime()
  const dayEnd = endOfDay(targetDate).getTime()
  return ev.start.getTime() <= dayEnd && ev.end.getTime() >= dayStart
}

function formatTimeRange(ev: UnifiedOrgEvent): string {
  if (ev.allDay) return 'All Day Activity'
  const fmt = (d: Date) =>
    d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })
  return `${fmt(ev.start)} – ${fmt(ev.end)}`
}

export function StudentOrgEventsCalendar() {
  const [view, setView] = useState<CalendarViewMode>('month')
  const [cursorDate, setCursorDate] = useState<Date>(() => new Date())
  const [selectedOrgFilter, setSelectedOrgFilter] = useState<string>('all')
  const [selectedEvent, setSelectedEvent] = useState<UnifiedOrgEvent | null>(null)

  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [events, setEvents] = useState<UnifiedOrgEvent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function loadAllOrgEvents() {
      setLoading(true)
      try {
        const [orgs, facs, activities, reservations, proposals] = await Promise.all([
          dataStore.getOrganizations().catch(() => [] as Organization[]),
          dataStore.getFacilities().catch(() => [] as Facility[]),
          dataStore.getActivities().catch(() => [] as Activity[]),
          dataStore.getReservations().catch(() => [] as Reservation[]),
          proposalStore.listVisible().catch(() => [] as Proposal[]),
        ])

        if (cancelled) return

        setOrganizations(orgs)

        const orgMap = new Map<string, Organization>()
        orgs.forEach((o) => orgMap.set(o.id, o))

        const facMap = new Map<string, Facility>()
        facs.forEach((f) => facMap.set(f.id, f))

        const merged: UnifiedOrgEvent[] = []
        const seenKeys = new Set<string>()

        // 1. Organization-linked facility reservations (includes proposal-generated reservations & direct org bookings)
        reservations.forEach((r) => {
          if (!r.organization_id) return
          if (r.status === 'rejected' || r.status === 'cancelled') return

          const org = orgMap.get(r.organization_id)
          const fac = facMap.get(r.facility_id)
          const start = new Date(r.start_datetime)
          const end = new Date(r.end_datetime)
          const dedupeKey = `${r.organization_id}|${r.title.trim().toLowerCase()}|${start.toISOString().slice(0, 10)}`
          seenKeys.add(dedupeKey)

          merged.push({
            id: `res-${r.id}`,
            title: r.title,
            description: r.purpose || null,
            organizationId: r.organization_id,
            organizationAcronym: org?.acronym ?? 'ORG',
            organizationName: org?.name ?? 'Student Organization',
            facilityId: r.facility_id,
            facilityName: fac?.name ?? null,
            facilityCode: fac?.facility_code ?? null,
            start,
            end,
            allDay: false,
            status: r.status === 'approved' ? 'approved' : 'pending',
            attendees: r.attendee_count,
            source: 'reservation',
          })
        })

        // 2. Visible proposals with schedules not already represented by a reservation
        proposals.forEach((p) => {
          if (!p.start_datetime || !p.end_datetime) return
          if (p.status === 'rejected' || p.status === 'cancelled' || p.status === 'draft') return

          const start = new Date(p.start_datetime)
          const end = new Date(p.end_datetime)
          const dedupeKey = `${p.organization_id}|${p.title.trim().toLowerCase()}|${start.toISOString().slice(0, 10)}`
          if (seenKeys.has(dedupeKey)) return
          seenKeys.add(dedupeKey)

          const org = orgMap.get(p.organization_id)
          const fac = p.facility_id ? facMap.get(p.facility_id) : undefined

          merged.push({
            id: `prop-${p.id}`,
            title: p.title,
            description: p.description ?? null,
            organizationId: p.organization_id,
            organizationAcronym: org?.acronym ?? 'ORG',
            organizationName: org?.name ?? 'Student Organization',
            facilityId: p.facility_id ?? null,
            facilityName: fac?.name ?? null,
            facilityCode: fac?.facility_code ?? null,
            start,
            end,
            allDay: false,
            status: p.status === 'approved' ? 'approved' : 'pending',
            attendees: p.expected_attendees,
            source: 'proposal',
          })
        })

        // 3. Official Student Organization Activities (from public.activities)
        activities.forEach((a) => {
          if (a.status === 'cancelled' || a.status === 'draft') return
          const dateStr = a.activity_date.slice(0, 10)
          const dedupeKey = `${a.organization_id}|${a.title.trim().toLowerCase()}|${dateStr}`
          if (seenKeys.has(dedupeKey)) return
          seenKeys.add(dedupeKey)

          const org = orgMap.get(a.organization_id)
          const [y, m, d] = dateStr.split('-').map(Number)
          const start = new Date(y, (m || 1) - 1, d || 1, 9, 0, 0)
          const end = new Date(y, (m || 1) - 1, d || 1, 17, 0, 0)

          merged.push({
            id: `act-${a.id}`,
            title: a.title,
            description: a.description ?? null,
            organizationId: a.organization_id,
            organizationAcronym: org?.acronym ?? 'ORG',
            organizationName: org?.name ?? 'Student Organization',
            facilityId: null,
            facilityName: null,
            facilityCode: null,
            start,
            end,
            allDay: true,
            status: a.status === 'approved' ? 'approved' : 'planned',
            attendees: a.expected_attendees,
            source: 'activity',
          })
        })

        merged.sort((a, b) => a.start.getTime() - b.start.getTime())
        setEvents(merged)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadAllOrgEvents()
    return () => {
      cancelled = true
    }
  }, [])

  const filteredEvents = useMemo(() => {
    if (selectedOrgFilter === 'all') return events
    return events.filter((e) => e.organizationId === selectedOrgFilter)
  }, [events, selectedOrgFilter])

  // Navigation handlers
  const handlePrev = () => {
    setCursorDate((prev) => {
      const next = new Date(prev)
      if (view === 'month') next.setMonth(next.getMonth() - 1)
      else if (view === 'week') next.setDate(next.getDate() - 7)
      else next.setDate(next.getDate() - 1)
      return next
    })
  }

  const handleNext = () => {
    setCursorDate((prev) => {
      const next = new Date(prev)
      if (view === 'month') next.setMonth(next.getMonth() + 1)
      else if (view === 'week') next.setDate(next.getDate() + 7)
      else next.setDate(next.getDate() + 1)
      return next
    })
  }

  const handleToday = () => {
    setCursorDate(new Date())
  }

  // Compute grid days for Month view (42 cells)
  const monthDays = useMemo(() => {
    const year = cursorDate.getFullYear()
    const month = cursorDate.getMonth()
    const firstDayOfMonth = new Date(year, month, 1)
    const startOffset = firstDayOfMonth.getDay()
    const gridStart = new Date(year, month, 1 - startOffset)

    const cells: Date[] = []
    for (let i = 0; i < 42; i++) {
      const d = new Date(gridStart)
      d.setDate(gridStart.getDate() + i)
      cells.push(d)
    }
    return cells
  }, [cursorDate])

  // Compute 7 days for Week view
  const weekDays = useMemo(() => {
    const start = new Date(cursorDate)
    start.setDate(cursorDate.getDate() - cursorDate.getDay())
    const days: Date[] = []
    for (let i = 0; i < 7; i++) {
      const d = new Date(start)
      d.setDate(start.getDate() + i)
      days.push(d)
    }
    return days
  }, [cursorDate])

  // Header label based on view
  const periodLabel = useMemo(() => {
    if (view === 'month') {
      return cursorDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    }
    if (view === 'week') {
      const first = weekDays[0]
      const last = weekDays[6]
      const sameMonth = first.getMonth() === last.getMonth()
      if (sameMonth) {
        return `${first.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${last.getDate()}, ${last.getFullYear()}`
      }
      return `${first.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${last.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
    }
    return cursorDate.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })
  }, [cursorDate, view, weekDays])

  const today = new Date()

  const dayEvents = useMemo(
    () => filteredEvents.filter((ev) => eventOccursOnDate(ev, cursorDate)),
    [filteredEvents, cursorDate],
  )

  return (
    <section className="panel overflow-hidden">
      {/* Grayish-Black Institutional Calendar Header */}
      <div className="bg-[var(--ink)] text-[var(--paper)] px-4 sm:px-6 py-4 sm:py-5 border-b border-[var(--ink-soft)] flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg sm:text-xl font-bold tracking-tight text-[var(--paper)] flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-[var(--accent-line)] shrink-0" />
            <span>Student Organization Events Calendar</span>
          </h2>
          <p className="text-xs text-[var(--paper)]/65 mt-0.5 font-mono">
            University-wide schedule of approved activities and venue bookings
          </p>
        </div>

        {/* Controls: Organization Filter + View Switcher (Month | Week | Day) */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <div className="flex items-center gap-1.5 bg-[var(--ink-dark)] border border-[var(--ink-soft)] rounded-[var(--radius)] px-2.5 py-1.5 min-w-0">
            <Filter className="w-3.5 h-3.5 text-[var(--accent-line)] shrink-0" />
            <select
              aria-label="Filter by student organization"
              value={selectedOrgFilter}
              onChange={(e) => setSelectedOrgFilter(e.target.value)}
              className="bg-[var(--ink-dark)] text-[var(--paper)] text-xs font-medium focus:outline-none pr-1 w-full sm:w-auto truncate"
            >
              <option value="all">All Student Organizations ({events.length})</option>
              {organizations.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.acronym} — {org.name}
                </option>
              ))}
            </select>
          </div>

          {/* Month / Week / Day Segmented Switcher */}
          <div
            role="tablist"
            aria-label="Calendar view mode"
            className="grid grid-cols-3 sm:inline-flex rounded-[var(--radius)] bg-[var(--ink-dark)] p-1 border border-[var(--ink-soft)] shrink-0"
          >
            {(['month', 'week', 'day'] as CalendarViewMode[]).map((mode) => {
              const active = view === mode
              return (
                <button
                  key={mode}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setView(mode)}
                  className={`px-3.5 py-1.5 sm:py-1 rounded-[var(--radius)] text-xs font-bold uppercase tracking-wider transition cursor-pointer ${
                    active
                      ? 'bg-[var(--accent)] text-[var(--accent-ink)]'
                      : 'text-[var(--paper)]/70 hover:text-[var(--paper)]'
                  }`}
                >
                  {mode}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Sub-toolbar: Date Navigation & Status Legend */}
      <div className="px-4 sm:px-6 py-3.5 bg-[var(--surface)] border-b border-[var(--line)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center rounded-[var(--radius)] border border-[var(--line)] bg-[var(--paper)] p-0.5 shrink-0">
            <button
              type="button"
              onClick={handlePrev}
              aria-label="Previous period"
              className="p-1.5 rounded-[var(--radius)] text-[var(--ink)] hover:bg-[var(--accent-tint)] hover:text-[var(--accent-text)] transition cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleToday}
              className="px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-[var(--ink)] hover:bg-[var(--accent-tint)] hover:text-[var(--accent-text)] transition cursor-pointer"
            >
              Today
            </button>
            <button
              type="button"
              onClick={handleNext}
              aria-label="Next period"
              className="p-1.5 rounded-[var(--radius)] text-[var(--ink)] hover:bg-[var(--accent-tint)] hover:text-[var(--accent-text)] transition cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <h3 className="text-sm sm:text-base font-bold text-[var(--ink)] tracking-tight ml-1">
            {periodLabel}
          </h3>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-[var(--muted)]">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-[var(--radius)] bg-[var(--accent)]" />
            Approved Event
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-[var(--radius)] bg-[var(--ink)]" />
            Scheduled / In Review
          </span>
        </div>
      </div>

      {/* Calendar Body */}
      {loading ? (
        <div className="p-12 text-center">
          <p className="text-xs font-mono uppercase tracking-widest text-[var(--muted)]">
            Synchronizing Student Organization Schedules…
          </p>
        </div>
      ) : (
        <div className="bg-[var(--paper)]">
          {/* ================================================================
              1. MONTH VIEW (Scrollable grid on mobile + selected day agenda)
              ================================================================ */}
          {view === 'month' && (
            <div>
              <div className="overflow-x-auto">
                <div className="min-w-[38rem]">
                  <div className="grid grid-cols-7 border-b border-[var(--line)] bg-[var(--surface)]">
                    {WEEKDAYS.map((day) => (
                      <div
                        key={day}
                        className="py-2.5 px-2 text-center text-xs font-mono font-bold uppercase tracking-wider text-[var(--muted)] border-r border-[var(--line)] last:border-r-0"
                      >
                        {day}
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-7 divide-x divide-y divide-[var(--line)]">
                    {monthDays.map((cellDate) => {
                      const inCurrentMonth = cellDate.getMonth() === cursorDate.getMonth()
                      const isToday = isSameDay(cellDate, today)
                      const isSelectedDay = isSameDay(cellDate, cursorDate)
                      const cellEvents = filteredEvents.filter((ev) => eventOccursOnDate(ev, cellDate))

                      return (
                        <div
                          key={cellDate.toISOString()}
                          onClick={() => setCursorDate(cellDate)}
                          className={`min-h-[6.5rem] sm:min-h-[7rem] p-2 transition flex flex-col justify-between cursor-pointer ${
                            !inCurrentMonth
                              ? 'bg-[var(--surface)]/60 text-[var(--faint)]'
                              : isSelectedDay
                                ? 'bg-[var(--accent-tint)]/60'
                                : 'bg-[var(--paper)] hover:bg-[var(--surface)]/50'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                setCursorDate(cellDate)
                                setView('day')
                              }}
                              title="Inspect day schedule"
                              className={`w-6 h-6 rounded-[var(--radius)] text-xs font-mono font-bold flex items-center justify-center transition ${
                                isToday
                                  ? 'bg-[var(--accent)] text-[var(--accent-ink)]'
                                  : inCurrentMonth
                                    ? 'text-[var(--ink)] hover:bg-[var(--surface-2)]'
                                    : 'text-[var(--faint)]'
                              }`}
                            >
                              {cellDate.getDate()}
                            </button>
                            {cellEvents.length > 0 && (
                              <span className="text-xs font-mono text-[var(--muted)]">
                                {cellEvents.length}
                              </span>
                            )}
                          </div>

                          <div className="space-y-1 mt-1.5">
                            {cellEvents.slice(0, 3).map((ev) => (
                              <button
                                key={ev.id}
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setSelectedEvent(ev)
                                }}
                                className={`w-full text-left px-1.5 py-1 rounded-[var(--radius)] text-xs leading-tight truncate font-medium transition border cursor-pointer ${
                                  ev.status === 'approved'
                                    ? 'bg-[var(--accent-tint)] text-[var(--accent-text)] border-[var(--accent-line)] hover:bg-[var(--accent)] hover:text-[var(--accent-ink)]'
                                    : 'bg-[var(--ink)] text-[var(--paper)] border-[var(--ink)] hover:bg-[var(--ink-soft)]'
                                }`}
                              >
                                <span className="font-mono font-bold mr-1">[{ev.organizationAcronym}]</span>
                                {ev.title}
                              </button>
                            ))}
                            {cellEvents.length > 3 && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setCursorDate(cellDate)
                                  setView('day')
                                }}
                                className="w-full text-left px-1.5 py-0.5 text-xs font-mono font-bold text-[var(--accent-text)] hover:underline"
                              >
                                +{cellEvents.length - 3} more…
                              </button>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>

              {/* Mobile Selected Day Quick Agenda below Month Grid */}
              <div className="md:hidden border-t border-[var(--line)] bg-[var(--surface)] p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold uppercase text-[var(--ink)]">
                    {cursorDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                  </span>
                  <span className="text-xs font-mono text-[var(--muted)]">
                    {dayEvents.length} {dayEvents.length === 1 ? 'event' : 'events'}
                  </span>
                </div>
                {dayEvents.length === 0 ? (
                  <p className="text-xs text-[var(--muted)]">Tap any highlighted date above to inspect its events.</p>
                ) : (
                  <div className="space-y-2">
                    {dayEvents.map((ev) => (
                      <button
                        key={ev.id}
                        type="button"
                        onClick={() => setSelectedEvent(ev)}
                        className="w-full text-left p-3 rounded-[var(--radius)] bg-[var(--paper)] border border-[var(--line)] flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <span className="text-xs font-mono font-bold text-[var(--accent-text)]">
                            [{ev.organizationAcronym}]
                          </span>{' '}
                          <span className="text-xs font-bold text-[var(--ink)]">{ev.title}</span>
                          <p className="text-xs font-mono text-[var(--muted)] mt-0.5">{formatTimeRange(ev)}</p>
                        </div>
                        <span className={`tag shrink-0 ${ev.status === 'approved' ? 'tag-approved' : 'tag-pending'}`}>
                          {ev.status}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ================================================================
              2. WEEK VIEW
              ================================================================ */}
          {view === 'week' && (
            <div className="grid grid-cols-1 md:grid-cols-7 divide-y md:divide-y-0 md:divide-x divide-[var(--line)]">
              {weekDays.map((d) => {
                const isToday = isSameDay(d, today)
                const list = filteredEvents.filter((ev) => eventOccursOnDate(ev, d))

                return (
                  <div key={d.toISOString()} className="min-h-[18rem] flex flex-col">
                    <div
                      onClick={() => {
                        setCursorDate(d)
                        setView('day')
                      }}
                      className={`p-3 border-b border-[var(--line)] cursor-pointer transition ${
                        isToday ? 'bg-[var(--ink)] text-[var(--paper)]' : 'bg-[var(--surface)] hover:bg-[var(--accent-tint)]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-[10px] font-mono uppercase tracking-widest ${
                            isToday ? 'text-[var(--accent-line)]' : 'text-[var(--muted)]'
                          }`}
                        >
                          {WEEKDAYS[d.getDay()]}
                        </span>
                        {isToday && (
                          <span className="px-1.5 py-0.5 rounded-xs bg-[var(--accent)] text-[var(--accent-ink)] text-[9px] font-mono uppercase">
                            Today
                          </span>
                        )}
                      </div>
                      <div className={`text-lg font-extrabold font-mono mt-0.5 ${isToday ? 'text-[var(--paper)]' : 'text-[var(--ink)]'}`}>
                        {d.getDate()}
                      </div>
                    </div>

                    <div className="p-2.5 space-y-2 flex-1 bg-[var(--paper)]">
                      {list.length === 0 ? (
                        <p className="text-[11px] text-[var(--faint)] font-mono py-6 text-center">
                          No events
                        </p>
                      ) : (
                        list.map((ev) => (
                          <button
                            key={ev.id}
                            type="button"
                            onClick={() => setSelectedEvent(ev)}
                            className={`w-full text-left p-2.5 rounded-[var(--radius)] border transition space-y-1 cursor-pointer ${
                              ev.status === 'approved'
                                ? 'bg-[var(--accent-tint)]/70 border-[var(--accent-line)] hover:border-[var(--accent)]'
                                : 'bg-[var(--surface)] border-[var(--line)] hover:border-[var(--ink)]'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-1">
                              <span className="px-1.5 py-0.5 rounded-xs bg-[var(--ink)] text-[var(--accent-line)] text-[10px] font-mono font-bold uppercase">
                                {ev.organizationAcronym}
                              </span>
                              <span className="text-[10px] font-mono text-[var(--muted)] uppercase">
                                {ev.status}
                              </span>
                            </div>
                            <p className="text-xs font-bold text-[var(--ink)] leading-snug line-clamp-2">
                              {ev.title}
                            </p>
                            <p className="text-[10px] font-mono text-[var(--muted)] flex items-center gap-1">
                              <Clock className="w-3 h-3 shrink-0 text-[var(--accent)]" />
                              <span className="truncate">{formatTimeRange(ev)}</span>
                            </p>
                            {ev.facilityCode && (
                              <p className="text-[10px] font-mono text-[var(--ink)] flex items-center gap-1">
                                <MapPin className="w-3 h-3 shrink-0 text-[var(--accent)]" />
                                <span className="truncate">{ev.facilityCode}</span>
                              </p>
                            )}
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* ================================================================
              3. DAY VIEW
              ================================================================ */}
          {view === 'day' && (
            <div className="p-6 space-y-4">
              {dayEvents.length === 0 ? (
                <div className="py-12 text-center space-y-2 border border-dashed border-[var(--line)] rounded-[var(--radius)] bg-[var(--surface)]/50">
                  <CalendarIcon className="w-8 h-8 text-[var(--muted)] mx-auto" />
                  <p className="text-sm font-bold text-[var(--ink)]">
                    No student organization events scheduled on this day
                  </p>
                  <p className="text-xs text-[var(--muted)]">
                    Use the arrows above or switch to Month/Week view to inspect other dates.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {dayEvents.map((ev) => (
                    <div
                      key={ev.id}
                      onClick={() => setSelectedEvent(ev)}
                      className="p-4 sm:p-5 rounded-[var(--radius)] border border-[var(--line)] bg-[var(--paper)] hover:border-[var(--accent)] transition flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer"
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-28 shrink-0 p-2.5 rounded-[var(--radius)] bg-[var(--ink)] text-[var(--paper)] text-center border border-[var(--ink-soft)]">
                          <span className="block text-[10px] font-mono uppercase text-[var(--accent-line)]">
                            {ev.organizationAcronym}
                          </span>
                          <span className="block text-xs font-mono font-bold mt-0.5">
                            {ev.allDay
                              ? 'ALL DAY'
                              : ev.start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>

                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`tag ${
                                ev.status === 'approved' ? 'tag-approved' : 'tag-pending'
                              }`}
                            >
                              {ev.status}
                            </span>
                            <span className="text-xs font-semibold text-[var(--muted)]">
                              {ev.organizationName}
                            </span>
                          </div>
                          <h4 className="text-base font-extrabold text-[var(--ink)]">{ev.title}</h4>
                          {ev.description && (
                            <p className="text-xs text-[var(--muted)] line-clamp-2">{ev.description}</p>
                          )}
                          <div className="flex flex-wrap items-center gap-4 pt-1 text-xs text-[var(--muted)]">
                            <span className="inline-flex items-center gap-1 font-mono">
                              <Clock className="w-3.5 h-3.5 text-[var(--accent)]" />
                              {formatTimeRange(ev)}
                            </span>
                            {ev.facilityName && (
                              <span className="inline-flex items-center gap-1 font-medium text-[var(--ink)]">
                                <MapPin className="w-3.5 h-3.5 text-[var(--accent)]" />
                                {ev.facilityName} ({ev.facilityCode})
                              </span>
                            )}
                            <span className="inline-flex items-center gap-1">
                              <Users className="w-3.5 h-3.5 text-[var(--accent)]" />
                              {ev.attendees} expected
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Event Inspection Drawer / Banner when an event is clicked */}
      {selectedEvent && (
        <div className="border-t border-[var(--line)] bg-[var(--ink)] text-[var(--paper)] px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2 py-0.5 rounded-xs bg-[var(--accent)] text-[var(--accent-ink)] text-[10px] font-mono font-bold uppercase">
                {selectedEvent.organizationAcronym}
              </span>
              <span className="text-xs font-mono text-[var(--accent-line)]">
                {selectedEvent.organizationName}
              </span>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-xs bg-[var(--ink-soft)] border border-[var(--paper)]/15">
                {selectedEvent.status}
              </span>
            </div>
            <h4 className="text-base font-extrabold text-[var(--paper)]">{selectedEvent.title}</h4>
            {selectedEvent.description && (
              <p className="text-xs text-[var(--paper)]/70 max-w-2xl">{selectedEvent.description}</p>
            )}
            <div className="flex flex-wrap items-center gap-4 text-xs text-[var(--paper)]/80 pt-1 font-mono">
              <span className="inline-flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-[var(--accent)]" />
                {selectedEvent.start.toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}{' '}
                · {formatTimeRange(selectedEvent)}
              </span>
              {selectedEvent.facilityName && (
                <span className="inline-flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-[var(--accent)]" />
                  {selectedEvent.facilityName} ({selectedEvent.facilityCode})
                </span>
              )}
              <span className="inline-flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-[var(--accent)]" />
                {selectedEvent.attendees} pax
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {selectedEvent.facilityId && (
              <Link
                to={`/facilities/${selectedEvent.facilityId}`}
                className="btn-accent text-xs"
              >
                Inspect Venue
              </Link>
            )}
            <button
              type="button"
              onClick={() => setSelectedEvent(null)}
              aria-label="Close event details"
              className="p-2 rounded-[var(--radius)] bg-[var(--ink-soft)] text-[var(--paper)]/70 hover:text-[var(--paper)] cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </section>
  )
}

