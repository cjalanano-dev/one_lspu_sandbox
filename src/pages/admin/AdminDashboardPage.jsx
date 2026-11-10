import React, { useState, useEffect } from 'react'
import { 
  ShieldCheck, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Building2, 
  Users, 
  AlertTriangle, 
  BarChart3, 
  Layers, 
  Calendar,
  Search,
  Filter
} from 'lucide-react'
import { dataStore } from '../../lib/dataStore'
import { useAuth } from '../../features/auth/AuthContext'
import { formatDateTime, getStatusBadgeClass } from '../../lib/utils'

export function AdminDashboardPage() {
  const { user } = useAuth()
  const [reservations, setReservations] = useState([])
  const [facilities, setFacilities] = useState([])
  const [organizations, setOrganizations] = useState([])
  const [facilitiesMap, setFacilitiesMap] = useState({})
  const [usersMap, setUsersMap] = useState({})

  // Reviewing modal or quick actions
  const [rejectModalRes, setRejectModalRes] = useState(null)
  const [rejectReason, setRejectReason] = useState('')
  const [actionError, setActionError] = useState('')
  const [actionSuccess, setActionSuccess] = useState('')
  const [activeTab, setActiveTab] = useState('pending') // 'pending', 'all', 'analytics'

  const loadAdminData = async () => {
    const resList = await dataStore.getReservations()
    setReservations(resList)

    const facList = await dataStore.getFacilities()
    setFacilities(facList)
    const fMap = {}
    facList.forEach((f) => {
      fMap[f.id] = f
    })
    setFacilitiesMap(fMap)

    const allUsers = dataStore.getAllUsers()
    const uMap = {}
    allUsers.forEach((u) => {
      uMap[u.id] = u
    })
    setUsersMap(uMap)

    const orgList = await dataStore.getOrganizations()
    setOrganizations(orgList)
  }

  useEffect(() => {
    loadAdminData()
  }, [])

  const handleApprove = async (resId) => {
    setActionError('')
    setActionSuccess('')
    try {
      await dataStore.approveReservation(resId, user.id)
      setActionSuccess('Reservation approved successfully and user notified!')
      await loadAdminData()
    } catch (err) {
      setActionError(err.message)
    }
  }

  const handleReject = async (e) => {
    e.preventDefault()
    if (!rejectModalRes) return
    setActionError('')
    setActionSuccess('')
    try {
      await dataStore.rejectReservation(rejectModalRes.id, user.id, rejectReason)
      setRejectModalRes(null)
      setRejectReason('')
      setActionSuccess('Reservation declined with reason noted.')
      await loadAdminData()
    } catch (err) {
      setActionError(err.message)
    }
  }

  // Dashboard Metrics
  const totalFacilities = facilities.length
  const totalReservations = reservations.length
  const pendingRequests = reservations.filter((r) => r.status === 'pending')
  const approvedReservations = reservations.filter((r) => r.status === 'approved')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <ShieldCheck className="w-8 h-8 text-amber-600" />
            Facility Administrator Command Center
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Review incoming reservation requests, enforce conflict prevention, and monitor campus utilization.
          </p>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Pending Review</span>
            <div className="text-2xl font-black text-amber-600 mt-1">{pendingRequests.length}</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Approved Bookings</span>
            <div className="text-2xl font-black text-emerald-600 mt-1">{approvedReservations.length}</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Campus Facilities</span>
            <div className="text-2xl font-black text-sky-600 mt-1">{totalFacilities}</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
            <Building2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Organizations</span>
            <div className="text-2xl font-black text-indigo-600 mt-1">{organizations.length}</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Action Alerts */}
      {actionError && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {actionSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-700 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Main Review Section Tabs */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="border-b border-slate-200 px-6 pt-4 flex items-center gap-6">
          <button
            onClick={() => setActiveTab('pending')}
            className={`pb-4 text-xs font-bold transition border-b-2 flex items-center gap-2 ${
              activeTab === 'pending'
                ? 'border-amber-500 text-amber-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Pending Approval Queue
            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px]">
              {pendingRequests.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('all')}
            className={`pb-4 text-xs font-bold transition border-b-2 flex items-center gap-2 ${
              activeTab === 'all'
                ? 'border-sky-500 text-sky-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            All Reservations Archive
            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px]">
              {totalReservations}
            </span>
          </button>
        </div>

        {/* Pending Approval Table */}
        {activeTab === 'pending' && (
          <div className="p-6">
            {pendingRequests.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2 opacity-80" />
                <h4 className="font-bold text-slate-700 text-sm">Review Queue Empty</h4>
                <p className="text-xs text-slate-400 mt-1">
                  All reservation requests have been processed. Great job!
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingRequests.map((res) => {
                  const fac = facilitiesMap[res.facility_id]
                  const requester = usersMap[res.requester_id]
                  return (
                    <div
                      key={res.id}
                      className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6"
                    >
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                            AWAITING APPROVAL
                          </span>
                          <span className="text-xs font-semibold text-slate-900">
                            {fac?.name} ({fac?.facility_code})
                          </span>
                        </div>

                        <h3 className="text-base font-bold text-slate-900">{res.title}</h3>

                        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600">
                          <span className="flex items-center gap-1 font-medium">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            {formatDateTime(res.start_datetime)} -{' '}
                            {new Date(res.end_datetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="w-3.5 h-3.5 text-slate-400" />
                            {res.attendee_count} Attendees
                          </span>
                          <span className="text-slate-400">
                            Requested by: <span className="font-semibold text-slate-700">{requester?.full_name || 'User'}</span>
                          </span>
                        </div>

                        <p className="text-xs text-slate-600 leading-relaxed bg-white p-3 rounded-xl border border-slate-100">
                          <span className="font-bold text-slate-700">Purpose: </span>
                          {res.purpose}
                        </p>

                        {res.requested_equipment?.length > 0 && (
                          <div className="text-[11px] text-slate-500 flex items-center gap-1 flex-wrap">
                            <span className="font-semibold text-slate-600">Equipment Setup:</span>
                            {res.requested_equipment.map((eq, i) => (
                              <span key={i} className="px-2 py-0.5 rounded bg-slate-200/70 text-slate-700">
                                {eq}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Admin Decision Actions */}
                      <div className="flex items-center gap-3 w-full lg:w-auto justify-end border-t lg:border-t-0 pt-3 lg:pt-0 border-slate-200">
                        <button
                          onClick={() => setRejectModalRes(res)}
                          className="px-4 py-2.5 rounded-xl border border-rose-300 text-rose-700 hover:bg-rose-50 text-xs font-bold transition flex items-center gap-1.5"
                        >
                          <XCircle className="w-4 h-4 text-rose-600" />
                          Decline Request
                        </button>
                        <button
                          onClick={() => handleApprove(res.id)}
                          className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition flex items-center gap-1.5"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          Approve Reservation
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* All Reservations Archive */}
        {activeTab === 'all' && (
          <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
            {reservations.map((res) => {
              const fac = facilitiesMap[res.facility_id]
              return (
                <div key={res.id} className="p-4 sm:p-5 flex items-center justify-between text-xs hover:bg-slate-50">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadgeClass(res.status)}`}>
                        {res.status.toUpperCase()}
                      </span>
                      <span className="font-bold text-slate-900">{res.title}</span>
                    </div>
                    <div className="text-slate-500 flex items-center gap-3">
                      <span>{fac?.name} ({fac?.facility_code})</span>
                      <span>•</span>
                      <span>{formatDateTime(res.start_datetime)}</span>
                    </div>
                  </div>
                  <span className="text-slate-400 font-mono text-[11px]">{res.id}</span>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Reject Modal */}
      {rejectModalRes && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-1">
              Decline Reservation Request
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Please provide a clear reason for declining "{rejectModalRes.title}". The requesting user will be notified immediately.
            </p>

            <form onSubmit={handleReject} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Rejection Reason *</label>
                <textarea
                  rows="3"
                  placeholder="e.g. Facility is scheduled for university inspection, or capacity limits exceeded."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:ring-1 focus:ring-rose-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setRejectModalRes(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold shadow-md shadow-rose-600/20"
                >
                  Confirm Decline
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
