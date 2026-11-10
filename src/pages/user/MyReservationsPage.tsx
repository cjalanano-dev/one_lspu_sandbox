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
import { formatDateTime, formatDate, getStatusBadgeClass } from '../../lib/utils'
import type { Reservation, Facility } from '../../types'

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
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Calendar className="w-7 h-7 text-sky-600" />
            My Reservations
          </h1>
          <p className="text-sm text-slate-600 mt-1">
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
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition ${
                  filterStatus === st
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {label}
              </button>
            )
          })}
        </div>
      </div>

      {actionMsg.text && (
        <div
          className={`p-4 rounded-2xl border flex items-start gap-3 text-xs ${
            actionMsg.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
              : 'bg-rose-50 border-rose-200 text-rose-700'
          }`}
        >
          {actionMsg.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          )}
          <span>{actionMsg.text}</span>
        </div>
      )}

      {/* Reservation Cards List */}
      <div className="space-y-6">
        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
            <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="font-bold text-slate-800 text-base">
              {filterStatus === 'upcoming' ? 'No Upcoming Reservations' : filterStatus === 'past' ? 'No Past Reservations' : 'No Reservations Found'}
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {filterStatus === 'all'
                ? 'You haven\'t submitted any reservations yet.'
                : `You don't have any ${filterStatus} reservations.`}
            </p>
            {filterStatus === 'all' && (
              <Link
                to="/explorer"
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-600 text-white text-xs font-semibold hover:bg-sky-500 transition shadow-sm"
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
                  className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm hover:shadow transition flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
                >
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span
                        className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${getStatusBadgeClass(res.status)}`}
                      >
                        {res.status.toUpperCase()}
                      </span>
                      {isPast && (
                        <span className="text-xs font-medium text-slate-400 bg-slate-50 px-2 py-0.5 rounded">
                          Past
                        </span>
                      )}
                    </div>

                    <h3 className="text-lg font-bold text-slate-900">{res.title}</h3>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                      <span className="flex items-center gap-1.5 font-medium text-slate-700">
                        <Building2 className="w-4 h-4 text-sky-600" />
                        {fac?.name || 'Facility'} ({fac?.facility_code})
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-indigo-600" />
                        {formatDateTime(res.start_datetime)} -{' '}
                        {new Date(res.end_datetime).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="text-slate-700">{formatDate(res.start_datetime)}</span>
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 pt-1 leading-relaxed">
                      <span className="font-semibold text-slate-700">Purpose: </span>
                      {res.purpose}
                    </p>

                    {/* Rejection notice if declined */}
                    {res.status === 'rejected' && res.rejection_reason && (
                      <div className="mt-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold">Rejection Note: </span>
                          {res.rejection_reason}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-3 w-full md:w-auto justify-end border-t md:border-t-0 pt-3 md:pt-0 border-slate-100">
                    {res.status === 'pending' && !isPast && (
                      <>
                        {confirmCancelId === res.id ? (
                          <div className="flex items-center gap-2 text-xs text-rose-600">
                            <span>Cancel this request?</span>
                            <button
                              onClick={() => handleConfirmCancel(res.id)}
                              className="ml-2 px-3 py-1.5 rounded-xl bg-rose-600 text-white text-xs font-semibold hover:bg-rose-500 transition"
                            >
                              Yes
                            </button>
                            <button
                              onClick={() => setConfirmCancelId(null)}
                              className="ml-2 px-3 py-1.5 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-semibold transition"
                            >
                              No
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmCancelId(res.id)}
                            disabled={cancellingId === res.id}
                            className="px-3.5 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 transition flex items-center gap-1.5"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Cancel Request
                          </button>
                        )}
                      </>
                    )}

                    {fac && (
                      <Link
                        to={`/facilities/${fac.id}`}
                        className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 transition flex items-center gap-1.5"
                      >
                        Facility Details
                        <ArrowUpRight className="w-3.5 h-3.5" />
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
