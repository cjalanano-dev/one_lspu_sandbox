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
import { formatDateTime } from '../../lib/utils'
import type { Reservation, Facility, Organization } from '../../types'

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
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--ink)] tracking-tight flex items-center gap-2.5">
            <ShieldCheck className="w-8 h-8 text-[var(--ink)]" />
            {isSystemAdmin ? 'System Administrator Command Center' : 'Facility Administrator Command Center'}
          </h1>
          <p className="text-sm text-[var(--muted)] mt-1">
            {isSystemAdmin
              ? 'Manage platform-wide facilities, users, organizations, and campus resources.'
              : 'Review incoming reservation requests, enforce conflict prevention, and monitor campus utilization.'}
          </p>
        </div>
      </div>

      {/* Action Feedback */}
      {actionError || actionSuccess ? (
        <div className="p-3 border border-[var(--line-strong)] bg-[var(--ink)] text-[var(--paper)] text-xs flex items-start gap-2" role="status" aria-live="polite">
          {actionError ? (
            <>
              <AlertTriangle className="w-4 h-4 text-[var(--paper)] shrink-0 mt-0.5" />
              <span>{actionError}</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4 text-[var(--paper)] shrink-0 mt-0.5" />
              <span>{actionSuccess}</span>
            </>
          )}
        </div>
      ) : null}

      {/* Overview — ruled stat strip instead of floating cards */}
      <div className="border border-[var(--line)] rounded-sm bg-[var(--paper)] overflow-hidden grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {[{
          label: 'Pending Review',
          value: pendingRequests.length,
          icon: <Clock className="w-5 h-5" />,
        }, {
          label: 'Approved Bookings',
          value: approvedReservations.length,
          icon: <CheckCircle2 className="w-5 h-5" />,
        }, {
          label: 'Campus Facilities',
          value: totalFacilities,
          icon: <Building2 className="w-5 h-5" />,
        }, {
          label: 'Active Organizations',
          value: organizations.length,
          icon: <Users className="w-5 h-5" />,
        }].map((cell, i) => (
          <div key={cell.label} className="p-5 border-r border-b border-[var(--line)] last:col-start-1 last:border-r-0 last:border-b-0 lg:last:border-r-0 lg:border-r border-[var(--line)] sm:border-r-0 lg:border-b-0 lg:border-r border-[var(--line)]">
            <span className="text-xs font-bold text-[var(--muted)] uppercase tracking-wider block">{cell.label}</span>
            <div className="mt-1 flex items-center gap-2">
              <div className="text-2xl font-black text-[var(--ink)]">{cell.value}</div>
              <div className="w-8 h-8 rounded-sm border border-[var(--ink)] flex items-center justify-center text-[var(--ink)] flex-shrink-0 ml-auto">
                {cell.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Review Section Tabs */}
      <div className="border border-[var(--line)] rounded-sm bg-[var(--paper)] overflow-hidden">
        <div className="border-b border-[var(--line)] px-6 pt-4 flex items-center gap-6">
          <button
            onClick={() => setActiveTab('pending')}
            className={`pb-4 text-xs font-bold transition border-b-2 flex items-center gap-2 ${
              activeTab === 'pending'
                ? 'border-[var(--line-strong)] text-[var(--ink)]'
                : 'border-transparent text-[var(--muted)] hover:text-[var(--ink)]'
            }`}
          >
            <Clock className="w-3 h-3" />
            Pending Approval Queue
            <span className={`tag ${activeTab === 'pending' ? 'tag-available' : 'tag-pending'} ml-2`}>
              {filteredPending.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('all')}
            className={`pb-4 text-xs font-bold transition border-b-2 flex items-center gap-2 ${
              activeTab === 'all'
                ? 'border-[var(--line-strong)] text-[var(--ink)]'
                : 'border-transparent text-[var(--muted)] hover:text-[var(--ink)]'
            }`}
          >
            <Calendar className="w-3 h-3" />
            All Reservations Archive
            <span className="tag tag-pending ml-2">{totalReservations}</span>
          </button>
        </div>

        {/* Pending Approval Queue */}
        {activeTab === 'pending' && (
          <div className="p-6">
            <div className="flex gap-3 mb-5">
              <div className="relative flex-1 sm:w-80">
                <Search className="w-4 h-4 text-[var(--faint)] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search title, purpose, or facility..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-[var(--line)] rounded-sm bg-[var(--paper)] focus:border-[var(--line-strong)]"
                  aria-label="Search pending reservations"
                />
              </div>
              <div className="flex items-end gap-1.5">
                <Filter className="w-3.5 h-3.5 text-[var(--faint)]" />
                <label htmlFor="admin-status-filter" className="text-xs font-bold text-[var(--ink)] uppercase tracking-widest mb-1 block">Status filter</label>
                <select
                  id="admin-status-filter"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="border border-[var(--line)] rounded-sm text-xs py-2 px-3 font-bold text-[var(--ink)] bg-[var(--paper)] focus:border-[var(--line-strong)] appearance-none"
                >
                  <option value="all">All statuses</option>
                  <option value="pending">Pending only</option>
                  <option value="approved">Approved only</option>
                  <option value="rejected">Rejected only</option>
                </select>
              </div>
            </div>

            {filteredPending.length === 0 ? (
              <div className="py-16 text-center text-[var(--muted)] text-xs">
                <CheckCircle2 className="w-10 h-10 text-[var(--ink)] mx-auto mb-3" />
                <h4 className="font-bold text-[var(--ink)] text-sm">Review Queue Empty</h4>
                <p className="text-[var(--muted)] mt-1">
                  All reservation requests have been processed.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredPending.map((res) => {
                  const fac = facilitiesMap[res.facility_id]
                  const requester = usersMap[res.requester_id]
                  return (
                    <div
                      key={res.id}
                      className="p-4 rounded-sm border border-[var(--line)] bg-[var(--paper)] flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4"
                    >
                      <div className="space-y-2 flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-[var(--ink)] uppercase tracking-widest">
                            AWAITING APPROVAL
                          </span>
                          <span className="font-medium text-[var(--ink)] truncate">
                            {fac?.name} ({fac?.facility_code})
                          </span>
                        </div>

                        <h3 className="font-bold text-[var(--ink)] text-base truncate">{res.title}</h3>

                        <div className="flex flex-wrap items-center gap-4 text-xs text-[var(--muted)]">
                          <span className="flex items-center gap-1 font-medium text-[var(--ink)]">
                            <Clock className="w-3 h-3" />
                            {formatDateTime(res.start_datetime)} -{' '}
                            {new Date(res.end_datetime).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {res.attendee_count} Attendees
                          </span>
                          <span className="text-[var(--muted)] truncate">
                            Requested by: <span className="font-bold text-[var(--ink)]">{requester?.full_name || 'User'}</span>
                          </span>
                        </div>

                        <p className="text-xs text-[var(--muted)] pt-2 leading-relaxed">
                          <span className="font-bold text-[var(--ink)]">Purpose: </span>
                          {res.purpose}
                        </p>

                        {res.requested_equipment?.length > 0 && (
                          <div className="text-xs text-[var(--muted)] flex items-center gap-1 flex-wrap mt-3 uppercase tracking-widest font-bold">
                            Equipment Setup:
                            {res.requested_equipment.map((eq, i) => (
                              <span key={i} className="px-2 py-0.5 rounded-sm border border-[var(--line)] text-[var(--ink)] bg-[var(--paper)] text-xs">
                                {eq}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-3 w-full lg:w-auto justify-end border-t lg:border-t-0 pt-3 lg:pt-0 border-[var(--line)]">
                        <button
                          onClick={() => setRejectModalRes(res)}
                          className="px-4 py-2.5 rounded-sm border border-[var(--ink)] text-[var(--ink)] text-xs font-bold hover:bg-[var(--surface-2)] transition flex items-center gap-1.5"
                        >
                          <XCircle className="w-4 h-4" />
                          Decline
                        </button>
                        <button
                          onClick={() => handleApprove(res.id)}
                          className="px-5 py-2.5 rounded-sm bg-[var(--accent)] text-[var(--accent-ink)] text-xs font-bold  transition flex items-center gap-1.5"
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
          <div className="divide-y divide-[var(--line)] max-h-[600px] overflow-y-auto p-4">
            {reservations.length === 0 ? (
              <div className="py-8 text-center text-[var(--muted)] text-xs">
                No reservations yet.
              </div>
            ) : (
              reservations.map((res) => {
                const fac = facilitiesMap[res.facility_id]
                return (
                  <div key={res.id} className="p-3 sm:p-4 flex items-center justify-between text-xs hover:bg-[var(--surface-2)] transition">
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`tag ${statusTagClass(res.status)} text-xs`}>
                          {res.status.toUpperCase()}
                        </span>
                        <span className="font-bold text-[var(--ink)] truncate">{res.title}</span>
                      </div>
                      <div className="text-[var(--muted)] flex items-center gap-3">
                        <span className="truncate">{fac?.name} ({fac?.facility_code})</span>
                        <span>•</span>
                        <span>{formatDateTime(res.start_datetime)}</span>
                      </div>
                    </div>
                    <span className="font-mono text-xs text-[var(--faint)]">{res.id.slice(0, 8)}...</span>
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
        <p className="text-xs text-[var(--muted)] mb-4" id="reject-dialog-desc">
          Provide a clear reason for declining "{rejectModalRes?.title}". The requesting user will be notified immediately.
        </p>
        <form onSubmit={handleReject} className="space-y-4 text-[var(--ink)]" aria-describedby="reject-dialog-desc">
          <div>
            <label htmlFor="reject-reason" className="block text-sm font-medium text-[var(--ink)] mb-1">Rejection Reason *</label>
            <textarea
              id="reject-reason"
              rows={3}
              placeholder="e.g. Facility is scheduled for university inspection, or capacity limits exceeded."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-sm border border-[var(--line)] bg-[var(--paper)] text-[var(--ink)] focus:border-[var(--line-strong)]"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--line)]">
            <button
              type="button"
              onClick={() => setRejectModalRes(null)}
              className="px-4 py-2 rounded-sm text-[var(--muted)] font-medium hover:bg-[var(--surface-2)] transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-sm bg-[var(--accent)] text-[var(--accent-ink)] font-semibold hover:bg-[var(--accent-strong)] transition"
            >
              Confirm Decline
            </button>
          </div>
        </form>
      </Dialog>
    </div>
  )
}
