import { useState, useEffect } from 'react'
import {
  Calendar,
  Building2,
  Clock,
  AlertCircle,
  ArrowUpRight,
  CheckCircle2,
  Trash2,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { dataStore } from '../../lib/dataStore'
import { useAuth } from '../../features/auth/AuthContext'
import { formatDateTime, formatDate } from '../../lib/utils'
import type { Reservation, Facility } from '../../types'

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

export function MyReservationsPage() {
  const { user } = useAuth()
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [facilitiesMap, setFacilitiesMap] = useState<Record<string, Facility>>({})
  const [cancellingId, setCancellingId] = useState<string | null>(null)
  const [confirmCancelId, setConfirmCancelId] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState<'all' | 'upcoming' | 'past'>('all')
  const [actionMsg, setActionMsg] = useState({ text: '', type: 'success' as 'success' | 'error' })

  const loadReservations = async () => {
    if (!user?.id) return
    const list = await dataStore.getReservations({ requesterId: user.id })
    setReservations(list)

    const allFacs = await dataStore.getFacilities()
    const map: Record<string, Facility> = {}
    allFacs.forEach((f) => {
      map[f.id] = f
    })
    setFacilitiesMap(map)
  }

  useEffect(() => {
    loadReservations()
  }, [user?.id])

  const now = new Date()

  const upcoming = reservations.filter((r) => new Date(r.end_datetime) > now)
  const past = reservations.filter((r) => new Date(r.end_datetime) <= now)

  const getGroup = () => {
    if (filterStatus === 'upcoming') return upcoming
    if (filterStatus === 'past') return past
    return reservations
  }

  const handleCancel = async (id: string) => {
    if (!user?.id) return
    setCancellingId(id)
    try {
      await dataStore.cancelReservation(id, user.id)
      setActionMsg({ text: 'Reservation cancelled successfully.', type: 'success' })
      await loadReservations()
    } catch (err) {
      setActionMsg({ text: err instanceof Error ? err.message : 'An error occurred.', type: 'error' })
    } finally {
      setCancellingId(null)
      setConfirmCancelId(null)
    }
  }

  const handleConfirmCancel = (id: string) => {
    setConfirmCancelId(null)
    handleCancel(id)
  }

  const filtered = getGroup()

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--ink)] tracking-tight flex items-center gap-2.5">
            <Calendar className="w-7 h-7 text-[var(--ink)]" />
            My Reservations
          </h1>
          <p className="text-sm text-[var(--muted)] mt-1">
            Track submission status, review feedback, or manage your requests.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {['all', 'upcoming', 'past'].map((st) => {
            const label = st === 'all' ? 'All' : st === 'upcoming' ? 'Upcoming' : 'Past'
            return (
              <button
                key={st}
                onClick={() => setFilterStatus(st as any)}
                className={`px-3 py-1.5 rounded-sm text-xs font-bold capitalize transition ${
                  filterStatus === st
                    ? 'bg-[var(--accent)] text-[var(--accent-ink)]'
                    : 'border border-[var(--line)] text-[var(--muted)] hover:bg-[var(--surface-2)]'
                }`}
              >
                {label}
              </button>
            )
          })}
        </div>
      </div>

      {actionMsg.text && (
        <div className="p-3 border border-[var(--line-strong)] bg-[var(--ink)] text-[var(--paper)] text-xs flex items-start gap-2" role="status" aria-live="polite">
          {actionMsg.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-[var(--paper)] shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-4 h-4 text-[var(--paper)] shrink-0 mt-0.5" />
          )}
          <span>{actionMsg.text}</span>
        </div>
      )}

      <div className="space-y-6">
        {filtered.length === 0 ? (
          <div className="border border-[var(--line)] rounded-sm bg-[var(--paper)] p-12 text-center">
            <Calendar className="w-12 h-12 text-[var(--faint)] mx-auto mb-3" />
            <h3 className="font-bold text-[var(--ink)] text-base">
              {filterStatus === 'upcoming' ? 'No Upcoming Reservations' : filterStatus === 'past' ? 'No Past Reservations' : 'No Reservations Found'}
            </h3>
            <p className="text-xs text-[var(--muted)] mt-1 max-w-sm mx-auto">
              {filterStatus === 'all'
                ? 'You haven\'t submitted any reservations yet.'
                : `You don't have any ${filterStatus} reservations.`}
            </p>
            {filterStatus === 'all' && (
              <Link
                to="/explorer"
                className="mt-4 inline-flex items-center gap-2 px-5 py-3 rounded-sm border border-[var(--ink)] text-[var(--ink)] font-semibold text-sm hover:bg-[var(--surface-2)] transition"
              >
                Explore Facilities
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((res) => {
              const fac = facilitiesMap[res.facility_id]
              const isPast = new Date(res.end_datetime) <= now
              return (
                <div
                  key={res.id}
                  className="border border-[var(--line)] rounded-sm bg-[var(--paper)] p-5 sm:p-6 transition hover:border-[var(--line-strong)] flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
                >
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className={`tag ${statusTagClass(res.status)}`}>
                        {res.status.toUpperCase()}
                      </span>
                      {isPast && (
                        <span className="text-xs font-bold text-[var(--muted)] uppercase tracking-widest bg-[var(--surface-2)] px-2 py-0.5 rounded-sm">
                          Past
                        </span>
                      )}
                    </div>

                    <h3 className="font-bold text-[var(--ink)] text-lg">{res.title}</h3>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-[var(--muted)]">
                      <span className="flex items-center gap-1.5 font-medium text-[var(--ink)]">
                        <Building2 className="w-4 h-4" />
                        {fac?.name || 'Facility'} ({fac?.facility_code})
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4" />
                        {formatDateTime(res.start_datetime)} -{' '}
                        {new Date(res.end_datetime).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="text-[var(--ink)]">{formatDate(res.start_datetime)}</span>
                      </span>
                    </div>

                    <p className="text-xs text-[var(--muted)] pt-1 leading-relaxed">
                      <span className="font-bold text-[var(--ink)]">Purpose: </span>
                      {res.purpose}
                    </p>

                    {res.status === 'rejected' && res.rejection_reason && (
                      <div className="mt-3 p-3 border-l-4 border-[var(--ink)] bg-[var(--surface-2)] text-[var(--ink)] text-xs flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-[var(--ink)] shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold">Rejection Note: </span>
                          {res.rejection_reason}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-3 w-full md:w-auto justify-end border-t border-[var(--line)] pt-3 md:pt-0">
                    {res.status === 'pending' && !isPast && (
                      <>
                        {confirmCancelId === res.id ? (
                          <div className="flex items-center gap-2 text-xs text-[var(--ink)]">
                            <span>Cancel this request?</span>
                            <button
                              onClick={() => handleConfirmCancel(res.id)}
                              className="ml-2 px-3 py-1.5 rounded-sm bg-[var(--accent)] text-[var(--accent-ink)] text-xs font-bold hover:bg-[var(--accent-strong)] transition"
                            >
                              Yes
                            </button>
                            <button
                              onClick={() => setConfirmCancelId(null)}
                              className="ml-2 px-3 py-1.5 rounded-sm text-[var(--muted)] text-xs font-bold hover:bg-[var(--surface-2)] transition"
                            >
                              No
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmCancelId(res.id)}
                            disabled={cancellingId === res.id}
                            className="px-3.5 py-2 rounded-sm text-xs font-bold border border-[var(--ink)] text-[var(--ink)] hover:bg-[var(--surface-2)] transition flex items-center gap-1.5"
                          >
                            <Trash2 className="w-3 h-3" />
                            Cancel Request
                          </button>
                        )}
                        </>
                    )}

                    {fac && (
                      <Link
                        to={`/facilities/${fac.id}`}
                        className="px-4 py-2 rounded-sm border border-[var(--ink)] text-xs font-bold text-[var(--ink)] hover:bg-[var(--surface-2)] transition flex items-center gap-1.5"
                      >
                        Facility Details
                        <ArrowUpRight className="w-3 h-3" />
                      </Link>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
