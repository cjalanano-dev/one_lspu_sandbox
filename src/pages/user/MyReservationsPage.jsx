import React, { useState, useEffect } from 'react'
import { Calendar, Building2, Clock, CheckCircle2, XCircle, AlertCircle, Trash2, ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { dataStore } from '../../lib/dataStore'
import { useAuth } from '../../features/auth/AuthContext'
import { formatDateTime, getStatusBadgeClass } from '../../lib/utils'

export function MyReservationsPage() {
  const { user } = useAuth()
  const [reservations, setReservations] = useState([])
  const [facilitiesMap, setFacilitiesMap] = useState({})
  const [cancellingId, setCancellingId] = useState(null)
  const [filterStatus, setFilterStatus] = useState('all')

  const loadReservations = async () => {
    const list = await dataStore.getReservations({ requesterId: user?.id })
    setReservations(list)

    const allFacs = await dataStore.getFacilities()
    const map = {}
    allFacs.forEach((f) => {
      map[f.id] = f
    })
    setFacilitiesMap(map)
  }

  useEffect(() => {
    loadReservations()
  }, [user?.id])

  const handleCancel = async (id) => {
    if (window.confirm('Are you sure you want to cancel this reservation request?')) {
      setCancellingId(id)
      try {
        await dataStore.cancelReservation(id, user.id)
        await loadReservations()
      } catch (err) {
        alert(err.message)
      } finally {
        setCancellingId(null)
      }
    }
  }

  const filtered = reservations.filter((r) => {
    if (filterStatus === 'all') return true
    return r.status === filterStatus
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Calendar className="w-7 h-7 text-sky-600" />
            My Reservations
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Track submission status, review feedback, or manage your requests.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {['all', 'pending', 'approved', 'rejected'].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition ${
                filterStatus === st
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Reservation Cards List */}
      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
            <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="font-bold text-slate-800 text-base">No Reservations Found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              You haven't submitted any reservations in this filter category yet.
            </p>
            <Link
              to="/explorer"
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-600 text-white text-xs font-semibold hover:bg-sky-500 transition shadow-sm"
            >
              Explore Facilities
            </Link>
          </div>
        ) : (
          filtered.map((res) => {
            const fac = facilitiesMap[res.facility_id]
            return (
              <div
                key={res.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm hover:shadow transition flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span
                      className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${getStatusBadgeClass(
                        res.status
                      )}`}
                    >
                      {res.status.toUpperCase()}
                    </span>
                    <span className="text-xs font-mono font-medium text-slate-400">
                      ID: {res.id}
                    </span>
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
                      {new Date(res.end_datetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
                  {res.status === 'pending' && (
                    <button
                      onClick={() => handleCancel(res.id)}
                      disabled={cancellingId === res.id}
                      className="px-3.5 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 transition flex items-center gap-1.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Cancel Request
                    </button>
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
          })
        )}
      </div>
    </div>
  )
}
