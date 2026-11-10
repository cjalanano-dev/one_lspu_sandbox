import React, { useState, useEffect } from 'react'
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Building2,
  Users,
  AlertTriangle,
  Search,
  Filter,
  Calendar,
} from 'lucide-react'
import { dataStore } from '../../lib/dataStore'
import { useAuth } from '../../features/auth/AuthContext'
import { Dialog } from '../../components/ui/Dialog'
import { formatDateTime, getStatusBadgeClass } from '../../lib/utils'
import type { Reservation, Facility, Organization } from '../../types'

export function AdminDashboardPage() {
  const { user, isSystemAdmin } = useAuth()
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [facilities, setFacilities] = useState<Facility[]>([])
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [facilitiesMap, setFacilitiesMap] = useState<Record<string, Facility>>({})
  const [usersMap, setUsersMap] = useState<Record<string, { full_name: string; primary_role: string }>>({})
  const [rejectModalRes, setRejectModalRes] = useState<Reservation | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [actionError, setActionError] = useState('')
  const [actionSuccess, setActionSuccess] = useState('')
  const [activeTab, setActiveTab] = useState<'pending' | 'all'>('pending')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all')

  const loadAdminData = async () => {
    const resList = await dataStore.getReservations()
    setReservations(resList)

    const facList = await dataStore.getFacilities()
    setFacilities(facList)
    const fMap: Record<string, Facility> = {}
    facList.forEach((f) => {
      fMap[f.id] = f
    })
    setFacilitiesMap(fMap)

    const allUsers = await dataStore.getProfiles()
    const uMap: Record<string, { full_name: string; primary_role: string }> = {}
    allUsers.forEach((u) => {
      uMap[u.id] = { full_name: u.full_name, primary_role: u.primary_role }
    })
    setUsersMap(uMap)

    const orgList = await dataStore.getOrganizations()
    setOrganizations(orgList)
  }

  useEffect(() => {
    loadAdminData()
  }, [])

  const pendingRequests = reservations.filter((r) => r.status === 'pending')
  const approvedReservations = reservations.filter((r) => r.status === 'approved')
  const totalFacilities = facilities.length
  const totalReservations = reservations.length

  const filteredPending = pendingRequests.filter((res) => {
    const matchesSearch =
      !searchQuery ||
      res.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      res.purpose.toLowerCase().includes(searchQuery.toLowerCase()) ||
      facilitiesMap[res.facility_id]?.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'all' || res.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const handleApprove = async (resId: string) => {
    setActionError('')
    setActionSuccess('')
    if (!user?.id) return
    try {
      await dataStore.approveReservation(resId, user.id)
      setActionSuccess(`Reservation "${resId.slice(0, 8)}..." approved and requester notified.`)
      await loadAdminData()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'An error occurred.')
    }
  }

  const handleReject = async (e: React.FormEvent) => {
    e.preventDefault()
    setActionError('')
    setActionSuccess('')
    if (!rejectModalRes) return
    if (!user?.id) return
    try {
      await dataStore.rejectReservation(rejectModalRes.id, user.id, rejectReason)
      setRejectModalRes(null)
      setRejectReason('')
      setActionSuccess(`Reservation "${rejectModalRes.title}" declined. Requester notified.`)
      await loadAdminData()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'An error occurred.')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <ShieldCheck className="w-8 h-8 text-amber-600" />
            {isSystemAdmin ? 'System Administrator Command Center' : 'Facility Administrator Command Center'}
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            {isSystemAdmin
              ? 'Manage platform-wide facilities, users, organizations, and campus resources.'
              : 'Review incoming reservation requests, enforce conflict prevention, and monitor campus utilization.'}
          </p>
        </div>
      </div>

      {/* Action Feedback (inline, always visible) */}
      {actionError || actionSuccess ? (
        <div
          className={`p-4 rounded-2xl border flex items-start gap-3 text-xs ${
            actionError
              ? 'bg-rose-50 border-rose-200 text-rose-700'
              : 'bg-emerald-50 border-emerald-200 text-emerald-700'
          }`}
        >
          {actionError ? (
            <>
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{actionError}</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{actionSuccess}</span>
            </>
          )}
        </div>
      ) : null}

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Pending Review
            </span>
            <div className="text-2xl font-black text-slate-800 mt-1">{pendingRequests.length}</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Approved Bookings
            </span>
            <div className="text-2xl font-black text-slate-800 mt-1">{approvedReservations.length}</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Campus Facilities
            </span>
            <div className="text-2xl font-black text-slate-800 mt-1">{totalFacilities}</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
            <Building2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Active Organizations
            </span>
            <div className="text-2xl font-black text-slate-800 mt-1">{organizations.length}</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </div>
      </div>

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
            <Clock className="w-3 h-3" />
            Pending Approval Queue
            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
              {filteredPending.length}
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
            <Calendar className="w-3 h-3" />
            All Reservations Archive
            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold">
              {totalReservations}
            </span>
          </button>
        </div>

        {/* Pending Approval Queue */}
        {activeTab === 'pending' && (
          <div className="p-6">
            <div className="flex gap-3 mb-5">
              <div className="relative w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search title, purpose, or facility..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                  aria-label="Search pending reservations"
                />
              </div>
              <div>
                <Filter className="w-4 h-4 text-slate-400 mt-1" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="pl-2 pr-8 py-2 rounded-xl border border-slate-200 text-sm text-slate-700 bg-white focus:outline-none focus:ring-1 focus:ring-sky-500 appearance-none"
                >
                  <option value="all">All statuses</option>
                  <option value="pending">Pending only</option>
                  <option value="approved">Approved only</option>
                  <option value="rejected">Rejected only</option>
                </select>
              </div>
            </div>

            {filteredPending.length === 0 ? (
              <div className="py-16 text-center text-slate-400">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2 opacity-80" />
                <h4 className="font-bold text-slate-700 text-sm">Review Queue Empty</h4>
                <p className="text-xs text-slate-400 mt-1">
                  All reservation requests have been processed. Great job!
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredPending.map((res) => {
                  const fac = facilitiesMap[res.facility_id]
                  const requester = usersMap[res.requester_id]
                  return (
                    <div
                      key={res.id}
                      className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6"
                    >
                      <div className="space-y-2 flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                            AWAITING APPROVAL
                          </span>
                          <span className="text-xs font-semibold text-slate-900 truncate">
                            {fac?.name} ({fac?.facility_code})
                          </span>
                        </div>

                        <h3 className="text-base font-bold text-slate-900 truncate">{res.title}</h3>

                        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600">
                          <span className="flex items-center gap-1 font-medium">
                            <Clock className="w-3 h-3 text-slate-400" />
                            {formatDateTime(res.start_datetime)} -{' '}
                            {new Date(res.end_datetime).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3 text-slate-400" />
                            {res.attendee_count} Attendees
                          </span>
                          <span className="text-slate-400 truncate">
                            Requested by: <span className="font-semibold text-slate-700">{requester?.full_name || 'User'}</span>
                          </span>
                        </div>

                        <p className="text-xs text-slate-600 leading-relaxed bg-white p-3 rounded-xl border border-slate-100">
                          <span className="font-bold text-slate-700">Purpose: </span>
                          {res.purpose}
                        </p>

                        {res.requested_equipment?.length > 0 && (
                          <div className="text-[11px] text-slate-500 flex items-center gap-1 flex-wrap mt-2">
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
                          Decline
                        </button>
                        <button
                          onClick={() => handleApprove(res.id)}
                          className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition flex items-center gap-1.5"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          Approve
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
          <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto p-4">
            {reservations.length === 0 ? (
              <div className="py-8 text-center text-slate-400">
                No reservations yet.
              </div>
            ) : (
              reservations.map((res) => {
                const fac = facilitiesMap[res.facility_id]
                return (
                  <div key={res.id} className="p-3 sm:p-4 flex items-center justify-between text-xs hover:bg-slate-50 transition">
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadgeClass(res.status)}`}>
                          {res.status.toUpperCase()}
                        </span>
                        <span className="font-bold text-slate-900 truncate">{res.title}</span>
                      </div>
                      <div className="text-slate-500 flex items-center gap-3">
                        <span className="truncate">{fac?.name} ({fac?.facility_code})</span>
                        <span>•</span>
                        <span>{formatDateTime(res.start_datetime)}</span>
                      </div>
                    </div>
                    <span className="text-slate-500 text-[11px]">{res.id.slice(0, 8)}...</span>
                  </div>
                )
              })
            )}
          </div>
        )}
      </div>

      <Dialog
        isOpen={!!rejectModalRes}
        onClose={() => setRejectModalRes(null)}
        title="Decline Reservation Request"
        titleId="reject-dialog-title"
      >
        <p className="text-xs text-slate-500 mb-4" id="reject-dialog-desc">
          Please provide a clear reason for declining "{rejectModalRes?.title}". The requesting user will be notified immediately.
        </p>
        <form onSubmit={handleReject} className="space-y-4 text-xs" aria-describedby="reject-dialog-desc">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Rejection Reason *</label>
            <textarea
              rows={3}
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
      </Dialog>
    </div>
  )
}
