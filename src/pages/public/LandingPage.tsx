import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Building2,
  Compass,
  Calendar,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  Clock,
  Users,
  FileText,
  Inbox,
  Plus,
  AlertTriangle,
  Layers,
  Lock,
} from 'lucide-react'
import { useAuth } from '../../features/auth/AuthContext'
import { dataStore, canFileForOrganization } from '../../lib/dataStore'
import { proposalStore, isOverdue, PROPOSAL_STATUS_LABEL, proposalTagClass, type InboxItem } from '../../lib/proposals'
import { StudentOrgEventsCalendar } from '../../components/calendar/StudentOrgEventsCalendar'
import { formatDateTime } from '../../lib/utils'
import type { Facility, Building, Reservation, Proposal, Organization } from '../../types'

const ROLE_TITLES: Record<string, { badge: string; title: string; subtitle: string }> = {
  student: {
    badge: 'Student Portal Workspace',
    title: 'Campus Facility Discovery & Reservations',
    subtitle: 'Locate study lounges, lecture halls, and laboratories across campus buildings and track your personal booking requests.',
  },
  faculty: {
    badge: 'Faculty Portal Workspace',
    title: 'Academic Venue & Laboratory Scheduling',
    subtitle: 'Inspect instructional spaces, verify equipment availability, and manage academic room reservations.',
  },
  officer: {
    badge: 'Student Organization Executive Hub',
    title: 'Organization Event Proposals',
    subtitle: 'Draft digital event packets, monitor multi-stage signatory routing, and coordinate official organization bookings.',
  },
  adviser: {
    badge: 'Step 1 Signatory · Organization Adviser',
    title: 'Adviser Endorsement & Review Desk',
    subtitle: 'Review student organization event proposals, verify activity objectives and budgets, and issue Step 1 digital signatures.',
  },
  college_dean: {
    badge: 'Step 2 Signatory · Office of the College Dean',
    title: 'Academic & College Clearance Desk',
    subtitle: 'Evaluate college-endorsed student organization proposals and grant academic unit clearance.',
  },
  osas: {
    badge: 'Step 3 Signatory · Office of Student Affairs & Services',
    title: 'OSAS Compliance & Welfare Clearance Desk',
    subtitle: 'Audit student activity attachments, waivers, and institutional compliance prior to executive routing.',
  },
  osa_staff: {
    badge: 'Step 3 Signatory · Office of Student Affairs',
    title: 'Student Affairs Clearance Desk',
    subtitle: 'Audit student activity packets, program flows, and compliance requirements.',
  },
  campus_director: {
    badge: 'Step 4 Signatory · Office of the Campus Director',
    title: 'Campus Operations & Executive Review Desk',
    subtitle: 'Review campus-wide event clearances, venue allocations, and operational readiness.',
  },
  university_president: {
    badge: 'Step 5 Signatory · Office of the University President',
    title: 'Presidential Final Authorization Desk',
    subtitle: 'Grant final institutional authorization for university-wide and major student organization events.',
  },
  facility_admin: {
    badge: 'Facility Administration Command',
    title: 'Venue Scheduling & Reservation Control',
    subtitle: 'Process direct facility reservation requests, enforce conflict prevention, and oversee building utilization.',
  },
  system_admin: {
    badge: 'Institutional System Administration',
    title: 'Platform Governance & Operations Command',
    subtitle: 'Full visibility across campus buildings, facility reservations, student organizations, and signatory workflows.',
  },
}

export function LandingPage() {
  const { user, isLoading, isOfficer, isApprover, isAdmin } = useAuth()

  const [buildings, setBuildings] = useState<Building[]>([])
  const [facilities, setFacilities] = useState<Facility[]>([])
  const [myReservations, setMyReservations] = useState<Reservation[]>([])
  const [allPendingReservations, setAllPendingReservations] = useState<Reservation[]>([])
  const [orgProposals, setOrgProposals] = useState<Proposal[]>([])
  const [myOrgs, setMyOrgs] = useState<Organization[]>([])
  const [advisedOrgs, setAdvisedOrgs] = useState<Organization[]>([])
  const [inboxItems, setInboxItems] = useState<InboxItem[]>([])
  const [dataLoading, setDataLoading] = useState(true)

  const isPureSignatory = isApprover && !isAdmin

  useEffect(() => {
    async function loadRoleScopedData() {
      setDataLoading(true)
      try {
        const [bList, fList] = await Promise.all([
          dataStore.getBuildings(),
          dataStore.getFacilities(),
        ])
        setBuildings(bList)
        setFacilities(fList)

        if (!user) {
          setDataLoading(false)
          return
        }

        if (user.primary_role === 'student' || user.primary_role === 'faculty') {
          const res = await dataStore.getReservations({ requesterId: user.id })
          setMyReservations(res)
        } else if (user.primary_role === 'officer') {
          const [orgs, res] = await Promise.all([
            dataStore.getMyOrganizations(user.id),
            dataStore.getReservations({ requesterId: user.id }),
          ])
          setMyOrgs(orgs)
          setMyReservations(res)
          const filing = orgs.find((o) => canFileForOrganization(o)) || orgs[0]
          if (filing) {
            const props = await proposalStore.listForOrganization(filing.id)
            setOrgProposals(props)
          }
        } else if (isPureSignatory) {
          const [inbox, advised] = await Promise.all([
            proposalStore.getInbox(user.primary_role, user.id),
            user.primary_role === 'adviser'
              ? dataStore.getAdvisedOrganizations(user.id)
              : Promise.resolve([] as Organization[]),
          ])
          setInboxItems(inbox)
          setAdvisedOrgs(advised)
        } else if (isAdmin) {
          const [allRes, inbox] = await Promise.all([
            dataStore.getReservations({ status: 'pending' }),
            proposalStore.getInbox(user.primary_role, user.id),
          ])
          setAllPendingReservations(allRes)
          setInboxItems(inbox)
        }
      } catch {
        // Keep partial state if any query fails
      } finally {
        setDataLoading(false)
      }
    }
    loadRoleScopedData()
  }, [user, isPureSignatory, isAdmin])

  const facilitiesMap = useMemo(() => {
    const map: Record<string, Facility> = {}
    facilities.forEach((f) => {
      map[f.id] = f
    })
    return map
  }, [facilities])

  const facilitiesByBuilding = useMemo(() => {
    const map = new Map<string, number>()
    facilities.forEach((f) => {
      map.set(f.building_id, (map.get(f.building_id) ?? 0) + 1)
    })
    return map
  }, [facilities])

  const reservableFacilities = useMemo(
    () => facilities.filter((f) => f.reservation_enabled),
    [facilities],
  )

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-[var(--radius)] bg-[var(--ink)] border border-[var(--accent)] flex items-center justify-center">
            <Building2 className="w-5 h-5 text-[var(--paper)]" />
          </div>
          <p className="text-xs text-[var(--muted)] font-mono uppercase tracking-widest">
            Initializing Workspace…
          </p>
        </div>
      </div>
    )
  }

  // ============================================================================
  // 1. UNAUTHENTICATED INSTITUTIONAL PORTAL VIEW
  // ============================================================================
  if (!user) {
    return (
      <div className="space-y-10">
        {/* Architectural Split-Frame Ledger Hero */}
        <section className="rounded-[var(--radius)] bg-[var(--ink)] text-[var(--paper)] border border-[var(--line-strong)] overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-[var(--ink-soft)]">
            <div className="lg:col-span-7 p-8 sm:p-12 flex flex-col justify-between space-y-8">
              <div className="space-y-5">
                <h1 className="text-3xl sm:text-5xl font-bold tracking-tight leading-[1.08] text-[var(--paper)]">
                  Unified campus facilities &amp; role-based event governance.
                </h1>
                <p className="text-sm sm:text-base text-[var(--paper)]/75 leading-relaxed max-w-2xl">
                  ONE LSPU unifies campus facility management and student event governance through interactive schematic floor plans, real-time availability, automated conflict detection, and a five-stage digital signatory workflow—eliminating manual paperwork, preventing double bookings, and delivering faster, transparent approvals across dedicated role-based workspaces.
                </p>
              </div>

              <div className="pt-2 flex flex-wrap items-center gap-3">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-[var(--radius)] bg-[var(--accent)] text-[var(--accent-ink)] font-semibold text-xs uppercase tracking-wider hover:bg-[var(--accent-strong)] transition"
                >
                  <Lock className="w-3.5 h-3.5" />
                  Sign In to Role Workspace
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <Link
                  to="/explorer"
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-[var(--radius)] bg-[var(--ink-soft)] text-[var(--paper)] border border-[var(--paper)]/20 font-semibold text-xs uppercase tracking-wider hover:border-[var(--accent)] transition"
                >
                  <Compass className="w-3.5 h-3.5 text-[var(--accent-line)]" />
                  Public Campus Map
                </Link>
              </div>
            </div>

            {/* Live Campus Availability Ledger Column */}
            <div className="lg:col-span-5 bg-[var(--ink-dark)] flex flex-col justify-between">
              <div className="px-6 py-4 border-b border-[var(--ink-soft)] flex items-center justify-between">
                <span className="text-xs font-mono uppercase tracking-wider text-[var(--paper)]/80 font-semibold">
                  Campus Availability Ledger
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs font-mono text-[var(--accent-line)]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
                  LIVE
                </span>
              </div>

              <div className="grid grid-cols-2 divide-x divide-[var(--ink-soft)] border-b border-[var(--ink-soft)]">
                <div className="p-5">
                  <div className="text-2xl font-bold font-mono text-[var(--paper)]">{buildings.length}</div>
                  <div className="text-xs font-mono uppercase tracking-wider text-[var(--paper)]/60 mt-1">
                    Buildings Mapped
                  </div>
                </div>
                <div className="p-5">
                  <div className="text-2xl font-bold font-mono text-[var(--paper)]">{reservableFacilities.length}</div>
                  <div className="text-xs font-mono uppercase tracking-wider text-[var(--paper)]/60 mt-1">
                    Reservable Spaces
                  </div>
                </div>
              </div>

              <div className="divide-y divide-[var(--ink-soft)]">
                {reservableFacilities.slice(0, 3).map((f) => (
                  <Link
                    key={f.id}
                    to={`/facilities/${f.id}`}
                    className="flex items-center justify-between px-6 py-3.5 hover:bg-[var(--ink-soft)] transition group"
                  >
                    <div className="min-w-0 pr-3">
                      <p className="text-xs font-semibold text-[var(--paper)] truncate group-hover:text-[var(--accent-line)]">
                        {f.name}
                      </p>
                      <span className="text-xs font-mono text-[var(--paper)]/60 uppercase">
                        {f.facility_code} · {f.capacity} seats
                      </span>
                    </div>
                    <span className="text-xs font-mono uppercase px-2 py-0.5 rounded-[var(--radius)] bg-[var(--ink-soft)] text-[var(--accent-line)] border border-[var(--accent)]/40 shrink-0">
                      {f.status}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Institutional Role Directory — Ruled Architectural Matrix */}
        <section className="panel overflow-hidden">
          <div className="px-6 py-4 border-b border-[var(--line)] bg-[var(--surface)] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h2 className="text-base font-bold text-[var(--ink)] tracking-tight">
              Dedicated Workspaces by Institutional Role
            </h2>
            <p className="text-xs text-[var(--muted)] font-mono">
              Each account only sees the tools, queues, and actions relevant to its authority
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-[var(--line)]">
            {[
              {
                code: 'ROLE-01',
                role: 'Students & Faculty',
                desc: 'Explore interactive building floor plans, check live room schedules, and submit personal or academic reservation requests.',
                scope: 'Discovery & Booking',
              },
              {
                code: 'ROLE-02',
                role: 'Student Org Officers',
                desc: 'Manage student organization activities, compile event proposal packets with budgets, and track signatory clearances.',
                scope: 'Proposal Filing',
              },
              {
                code: 'ROLE-03',
                role: 'Approval Signatories',
                desc: 'Advisers, College Deans, OSAS, Campus Directors, and the University President access a focused digital signature queue.',
                scope: 'Steps 1–5 Governance',
              },
              {
                code: 'ROLE-04',
                role: 'Facility & System Admins',
                desc: 'Audit venue utilization, approve or decline direct room bookings, and oversee institutional spaces.',
                scope: 'Venue Command',
              },
            ].map((item) => (
              <div key={item.role} className="p-6 flex flex-col justify-between space-y-5 bg-[var(--paper)] hover:bg-[var(--surface)] transition">
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between border-b border-[var(--line)] pb-2">
                    <span className="text-xs font-mono font-semibold text-[var(--accent-text)]">
                      {item.code}
                    </span>
                    <span className="text-xs font-mono uppercase text-[var(--muted)]">
                      {item.scope}
                    </span>
                  </div>
                  <h3 className="font-bold text-sm text-[var(--ink)] pt-1">{item.role}</h3>
                  <p className="text-xs text-[var(--muted)] leading-relaxed">{item.desc}</p>
                </div>
                <Link
                  to="/login"
                  className="text-xs font-semibold text-[var(--accent-text)] hover:text-[var(--accent-strong)] inline-flex items-center gap-1.5 pt-2"
                >
                  Authenticate workspace <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ))}
          </div>
        </section>

        {/* Campus Buildings Table */}
        <section className="panel overflow-hidden">
          <div className="px-6 py-4 border-b border-[var(--line)] bg-[var(--ink)] text-[var(--paper)] flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider">Campus Building Directory</h2>
              <p className="text-xs text-[var(--paper)]/70 mt-0.5">
                Public schematic directory of university buildings and mapped rooms
              </p>
            </div>
            <Link
              to="/explorer"
              className="text-xs font-mono text-[var(--accent-line)] hover:underline flex items-center gap-1"
            >
              Open Interactive Map <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[var(--line)] bg-[var(--surface)] text-[var(--muted)] font-mono uppercase">
                  <th className="px-6 py-3">Code</th>
                  <th className="px-6 py-3">Building Name</th>
                  <th className="px-6 py-3">Levels</th>
                  <th className="px-6 py-3 text-right">Facilities</th>
                  <th className="px-6 py-3 text-right">Explorer</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--line)]">
                {buildings.map((b) => (
                  <tr key={b.id} className="hover:bg-[var(--accent-tint)] transition">
                    <td className="px-6 py-3.5 font-mono font-bold text-[var(--accent-text)]">{b.code}</td>
                    <td className="px-6 py-3.5">
                      <div className="font-semibold text-[var(--ink)]">{b.name}</div>
                      <div className="text-[var(--muted)]">{b.location_description}</div>
                    </td>
                    <td className="px-6 py-3.5 font-mono text-[var(--muted)]">{b.total_floors} Floors</td>
                    <td className="px-6 py-3.5 text-right font-mono font-bold text-[var(--ink)]">
                      {facilitiesByBuilding.get(b.id) ?? 0}
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <Link
                        to={`/explorer?building=${b.code}`}
                        className="inline-flex items-center gap-1 font-semibold text-[var(--accent-text)] hover:text-[var(--accent-strong)]"
                      >
                        Inspect Plan <ArrowRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* University-Wide Student Organization Events Calendar */}
        <StudentOrgEventsCalendar />
      </div>
    )
  }

  // ============================================================================
  // AUTHENTICATED ROLE-SCOPED WORKSPACE HEADER
  // ============================================================================
  const roleMeta = ROLE_TITLES[user.primary_role] ?? {
    badge: 'Institutional Workspace',
    title: 'Campus Portal',
    subtitle: 'Access your role-authorized tools below.',
  }

  return (
    <div className="space-y-8">
      {/* Architectural Role Command Header */}
      <section className="rounded-[var(--radius)] bg-[var(--ink)] text-[var(--paper)] border border-[var(--line-strong)] p-6 sm:p-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-[var(--radius)] bg-[var(--ink-soft)] border border-[var(--accent)]/40 text-xs font-mono uppercase tracking-wider text-[var(--accent-line)]">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
                {roleMeta.badge}
              </span>
              {user.primary_role === 'adviser' &&
                advisedOrgs.map((org) => (
                  <span
                    key={org.id}
                    className="px-2.5 py-0.5 rounded-[var(--radius)] bg-[var(--accent)] text-[var(--accent-ink)] text-xs font-mono font-bold uppercase tracking-wider"
                  >
                    Assigned Adviser: {org.acronym}
                  </span>
                ))}
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--paper)]">
              {user.primary_role === 'adviser' && advisedOrgs.length > 0
                ? `${advisedOrgs.map((o) => o.acronym).join(' / ')} Adviser Endorsement Desk`
                : roleMeta.title}
            </h1>
            <p className="text-xs sm:text-sm text-[var(--paper)]/75 leading-relaxed">
              {user.primary_role === 'adviser' && advisedOrgs.length > 0
                ? `Review student organization event proposals submitted by ${advisedOrgs.map((o) => (o.name === o.acronym ? o.name : `${o.name} (${o.acronym})`)).join(', ')} and issue Step 1 digital signatures.`
                : roleMeta.subtitle}
            </p>
          </div>

          {/* Role-Specific Primary Quick Actions */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {(user.primary_role === 'student' || user.primary_role === 'faculty') && (
              <>
                <Link to="/explorer" className="btn-accent text-xs gap-2">
                  <Compass className="w-4 h-4" /> Explore Floor Plans
                </Link>
                <Link
                  to="/my-reservations"
                  className="px-4 py-2.5 rounded-[var(--radius)] bg-[var(--ink-soft)] text-[var(--paper)] border border-[var(--paper)]/20 text-xs font-semibold hover:border-[var(--accent)] transition flex items-center gap-2"
                >
                  <Calendar className="w-4 h-4 text-[var(--accent-line)]" /> My Reservations
                </Link>
              </>
            )}

            {isOfficer && (
              <>
                <Link to="/proposals/new" className="btn-accent text-xs gap-2">
                  <Plus className="w-4 h-4" /> File Event Proposal
                </Link>
                <Link
                  to="/organization"
                  className="px-4 py-2.5 rounded-[var(--radius)] bg-[var(--ink-soft)] text-[var(--paper)] border border-[var(--paper)]/20 text-xs font-semibold hover:border-[var(--accent)] transition flex items-center gap-2"
                >
                  <Users className="w-4 h-4 text-[var(--accent-line)]" /> Organization Hub
                </Link>
              </>
            )}

            {isPureSignatory && (
              <Link to="/approvals" className="btn-accent text-xs gap-2">
                <Inbox className="w-4 h-4" /> Open Signatory Queue ({inboxItems.length})
              </Link>
            )}

            {isAdmin && (
              <>
                <Link to="/admin" className="btn-accent text-xs gap-2">
                  <ShieldCheck className="w-4 h-4" /> Open Command Center
                </Link>
                <Link
                  to="/approvals"
                  className="px-4 py-2.5 rounded-[var(--radius)] bg-[var(--ink-soft)] text-[var(--paper)] border border-[var(--paper)]/20 text-xs font-semibold hover:border-[var(--accent)] transition flex items-center gap-2"
                >
                  <Inbox className="w-4 h-4 text-[var(--accent-line)]" /> Proposal Clearances ({inboxItems.length})
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* ========================================================================
          ROLE VIEW A: STUDENT & FACULTY WORKSPACE
          ======================================================================== */}
      {(user.primary_role === 'student' || user.primary_role === 'faculty') && (
        <div className="space-y-8">
          <div className="ledger-strip grid-cols-2 sm:grid-cols-4">
            <div className="ledger-cell">
              <p className="kpi-value">{myReservations.filter((r) => r.status === 'approved').length}</p>
              <p className="kpi-label">Approved Bookings</p>
            </div>
            <div className="ledger-cell">
              <p className="kpi-value">{myReservations.filter((r) => r.status === 'pending').length}</p>
              <p className="kpi-label">Pending Requests</p>
            </div>
            <div className="ledger-cell">
              <p className="kpi-value">{reservableFacilities.filter((f) => f.status === 'available').length}</p>
              <p className="kpi-label">Available Venues Now</p>
            </div>
            <div className="ledger-cell">
              <p className="kpi-value">{buildings.length}</p>
              <p className="kpi-label">Campus Buildings</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Personal Reservations Feed */}
            <div className="lg:col-span-7 panel overflow-hidden">
              <div className="px-5 py-4 border-b border-[var(--line)] bg-[var(--surface)] flex items-center justify-between">
                <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--ink)] flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[var(--accent)]" />
                  Your Recent Facility Requests
                </h2>
                <Link to="/my-reservations" className="text-xs font-semibold text-[var(--accent-text)] hover:underline">
                  View all ({myReservations.length})
                </Link>
              </div>
              <div className="divide-y divide-[var(--line)]">
                {dataLoading ? (
                  <p className="p-6 text-xs text-[var(--muted)]">Loading your reservations…</p>
                ) : myReservations.length === 0 ? (
                  <div className="p-8 text-center space-y-2">
                    <p className="text-sm font-semibold text-[var(--ink)]">No personal reservations yet</p>
                    <p className="text-xs text-[var(--muted)]">
                      Select a room on the Campus Explorer or Directory to submit a booking request.
                    </p>
                    <Link to="/explorer" className="btn-primary text-xs mt-2">
                      Browse Campus Spaces
                    </Link>
                  </div>
                ) : (
                  myReservations.slice(0, 5).map((r) => {
                    const fac = facilitiesMap[r.facility_id]
                    return (
                      <div key={r.id} className="p-4 flex items-center justify-between gap-4 hover:bg-[var(--accent-tint)] transition">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={`tag ${r.status === 'approved' ? 'tag-approved' : r.status === 'pending' ? 'tag-pending' : 'tag-rejected'}`}>
                              {r.status}
                            </span>
                            <span className="text-xs font-mono text-[var(--muted)]">
                              {fac?.facility_code ?? 'VENUE'}
                            </span>
                          </div>
                          <p className="font-bold text-sm text-[var(--ink)] mt-1 truncate">{r.title}</p>
                          <p className="text-xs text-[var(--muted)]">
                            {fac?.name} · {formatDateTime(r.start_datetime)}
                          </p>
                        </div>
                        {fac && (
                          <Link to={`/facilities/${fac.id}`} className="btn-outline text-xs shrink-0">
                            Inspect
                          </Link>
                        )}
                      </div>
                    )
                  })
                )}
              </div>
            </div>

            {/* Quick Building Directory for Students/Faculty */}
            <div className="lg:col-span-5 panel overflow-hidden">
              <div className="px-5 py-4 border-b border-[var(--line)] bg-[var(--surface)] flex items-center justify-between">
                <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--ink)] flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[var(--accent)]" />
                  Quick Building Access
                </h2>
                <Link to="/facilities" className="text-xs font-semibold text-[var(--accent-text)] hover:underline">
                  Full Directory
                </Link>
              </div>
              <div className="divide-y divide-[var(--line)]">
                {buildings.map((b) => (
                  <Link
                    key={b.id}
                    to={`/explorer?building=${b.code}`}
                    className="p-4 flex items-center justify-between hover:bg-[var(--accent-tint)] transition group"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-[var(--accent-text)]">{b.code}</span>
                        <span className="font-bold text-sm text-[var(--ink)] group-hover:text-[var(--accent-text)]">
                          {b.name}
                        </span>
                      </div>
                      <p className="text-xs text-[var(--muted)] mt-0.5 font-mono">
                        {b.total_floors} floors · {facilitiesByBuilding.get(b.id) ?? 0} rooms
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-[var(--muted)] group-hover:text-[var(--accent-text)]" />
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================
          ROLE VIEW B: STUDENT ORGANIZATION OFFICER WORKSPACE
          ======================================================================== */}
      {isOfficer && (
        <div className="space-y-8">
          <div className="ledger-strip grid-cols-2 sm:grid-cols-4">
            <div className="ledger-cell">
              <p className="kpi-value">{orgProposals.filter((p) => p.status === 'in_review').length}</p>
              <p className="kpi-label">Proposals In Signatory Routing</p>
            </div>
            <div className="ledger-cell">
              <p className="kpi-value">{orgProposals.filter((p) => p.status === 'returned').length}</p>
              <p className="kpi-label">Returned for Revision</p>
            </div>
            <div className="ledger-cell">
              <p className="kpi-value">{orgProposals.filter((p) => p.status === 'approved').length}</p>
              <p className="kpi-label">Cleared &amp; Approved Events</p>
            </div>
            <div className="ledger-cell">
              <p className="kpi-value">{myOrgs.length}</p>
              <p className="kpi-label">Active Officer Seats</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-8 panel overflow-hidden">
              <div className="px-5 py-4 border-b border-[var(--line)] bg-[var(--surface)] flex items-center justify-between">
                <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--ink)] flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[var(--accent)]" />
                  Organization Event Proposals
                </h2>
                <Link to="/proposals" className="text-xs font-semibold text-[var(--accent-text)] hover:underline">
                  Manage All Proposals
                </Link>
              </div>
              <div className="divide-y divide-[var(--line)]">
                {orgProposals.length === 0 ? (
                  <div className="p-8 text-center space-y-2">
                    <p className="text-sm font-semibold text-[var(--ink)]">No event proposals filed yet</p>
                    <p className="text-xs text-[var(--muted)]">
                      Start a digital proposal packet to route your activity through the Adviser, Dean, OSAS, Director, and President.
                    </p>
                    <Link to="/proposals/new" className="btn-primary text-xs mt-2">
                      Create First Proposal
                    </Link>
                  </div>
                ) : (
                  orgProposals.slice(0, 5).map((p) => (
                    <Link
                      key={p.id}
                      to={p.status === 'draft' || p.status === 'returned' ? `/proposals/${p.id}/edit` : `/proposals/${p.id}`}
                      className="p-4 flex items-center justify-between gap-4 hover:bg-[var(--accent-tint)] transition"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={proposalTagClass(p.status)}>{PROPOSAL_STATUS_LABEL[p.status]}</span>
                          {p.reference_no && (
                            <span className="text-xs font-mono text-[var(--muted)]">{p.reference_no}</span>
                          )}
                        </div>
                        <p className="font-bold text-sm text-[var(--ink)] mt-1 truncate">{p.title}</p>
                        <p className="text-xs text-[var(--muted)] font-mono">
                          {p.start_datetime ? formatDateTime(p.start_datetime) : 'Schedule TBD'}
                        </p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-[var(--muted)] shrink-0" />
                    </Link>
                  ))
                )}
              </div>
            </div>

            <div className="lg:col-span-4 panel p-5 space-y-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--ink)] flex items-center gap-2">
                <Users className="w-4 h-4 text-[var(--accent)]" />
                Your Organization Seats
              </h2>
              {myOrgs.length === 0 ? (
                <p className="text-xs text-[var(--muted)]">No active organization memberships found.</p>
              ) : (
                <div className="space-y-3">
                  {myOrgs.map((o) => (
                    <div key={o.id} className="p-3.5 rounded-[var(--radius)] bg-[var(--surface)] border border-[var(--line)] space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold text-[var(--accent-text)]">{o.acronym}</span>
                        <span className="text-xs font-mono uppercase px-2 py-0.5 rounded-[var(--radius)] bg-[var(--paper)] border border-[var(--line)] text-[var(--ink)]">
                          {o.organization_role}
                        </span>
                      </div>
                      {o.name !== o.acronym && (
                        <p className="font-bold text-xs text-[var(--ink)]">{o.name}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
              <Link to="/organization" className="btn-outline w-full text-xs">
                Open Full Organization Dashboard
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================
          ROLE VIEW C: INSTITUTIONAL SIGNATORY DESK
          ======================================================================== */}
      {isPureSignatory && (
        <div className="space-y-6">
          <div className="ledger-strip grid-cols-1 sm:grid-cols-3">
            <div className="ledger-cell">
              <p className="kpi-value">{inboxItems.length}</p>
              <p className="kpi-label">Packets Awaiting Your Signature</p>
            </div>
            <div className="ledger-cell">
              <p className="kpi-value">{inboxItems.filter((i) => isOverdue(i.step)).length}</p>
              <p className="kpi-label">Overdue SLA (&gt;48 Hours)</p>
            </div>
            <div className="ledger-cell">
              <p className="kpi-value">48h</p>
              <p className="kpi-label">Standard Institutional SLA</p>
            </div>
          </div>

          <div className="panel overflow-hidden">
            <div className="px-6 py-4 border-b border-[var(--line)] bg-[var(--ink)] text-[var(--paper)] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Inbox className="w-4 h-4 text-[var(--accent-line)]" />
                <h2 className="text-xs font-bold uppercase tracking-wider">
                  Pending Signatory Queue
                </h2>
              </div>
              <Link to="/approvals" className="text-xs font-mono text-[var(--accent-line)] hover:underline">
                Open Full Inbox →
              </Link>
            </div>

            {dataLoading ? (
              <p className="p-6 text-xs text-[var(--muted)]">Loading signatory queue…</p>
            ) : inboxItems.length === 0 ? (
              <div className="p-10 text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-[var(--accent)] mx-auto" />
                <p className="text-sm font-bold text-[var(--ink)]">Signatory Queue Clear</p>
                <p className="text-xs text-[var(--muted)]">
                  No student organization event proposals are currently waiting on your office.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-[var(--line)]">
                {inboxItems.map(({ proposal: p, step, organization, facility }) => {
                  const late = isOverdue(step)
                  return (
                    <Link
                      key={step.id}
                      to={`/proposals/${p.id}`}
                      className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[var(--accent-tint)] transition"
                    >
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="tag tag-approved">
                            Step {step.step_order} · {step.label}
                          </span>
                          <span className="text-xs font-mono text-[var(--muted)]">{p.reference_no}</span>
                          {late && (
                            <span className="tag tag-maintenance inline-flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" /> Overdue
                            </span>
                          )}
                        </div>
                        <p className="font-bold text-sm text-[var(--ink)]">{p.title}</p>
                        <p className="text-xs text-[var(--muted)]">
                          {organization?.acronym ?? organization?.name} · Venue: {facility?.name ?? 'TBD'} ·{' '}
                          <span className="font-mono">{formatDateTime(p.start_datetime)}</span>
                        </p>
                      </div>
                      <span className="btn-primary text-xs shrink-0">
                        Review &amp; Sign →
                      </span>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================
          ROLE VIEW D: FACILITY ADMIN & SYSTEM ADMIN COMMAND OVERVIEW
          ======================================================================== */}
      {isAdmin && (
        <div className="space-y-8">
          <div className="ledger-strip grid-cols-2 sm:grid-cols-4">
            <div className="ledger-cell">
              <p className="kpi-value">{allPendingReservations.length}</p>
              <p className="kpi-label">Pending Venue Bookings</p>
            </div>
            <div className="ledger-cell">
              <p className="kpi-value">{inboxItems.length}</p>
              <p className="kpi-label">Proposal Venue Clearances</p>
            </div>
            <div className="ledger-cell">
              <p className="kpi-value">{facilities.length}</p>
              <p className="kpi-label">Managed Facilities</p>
            </div>
            <div className="ledger-cell">
              <p className="kpi-value">{buildings.length}</p>
              <p className="kpi-label">Campus Buildings</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="panel overflow-hidden">
              <div className="px-5 py-4 border-b border-[var(--line)] bg-[var(--surface)] flex items-center justify-between">
                <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--ink)] flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[var(--accent)]" />
                  Direct Facility Reservation Queue
                </h2>
                <Link to="/admin" className="text-xs font-semibold text-[var(--accent-text)] hover:underline">
                  Open Command Queue →
                </Link>
              </div>
              <div className="divide-y divide-[var(--line)]">
                {allPendingReservations.length === 0 ? (
                  <p className="p-6 text-xs text-[var(--muted)]">No pending direct reservations.</p>
                ) : (
                  allPendingReservations.slice(0, 4).map((r) => (
                    <Link
                      key={r.id}
                      to="/admin"
                      className="p-4 flex items-center justify-between hover:bg-[var(--accent-tint)] transition"
                    >
                      <div>
                        <p className="font-bold text-sm text-[var(--ink)]">{r.title}</p>
                        <p className="text-xs text-[var(--muted)]">
                          {facilitiesMap[r.facility_id]?.name} · <span className="font-mono">{formatDateTime(r.start_datetime)}</span>
                        </p>
                      </div>
                      <span className="tag tag-pending">Review</span>
                    </Link>
                  ))
                )}
              </div>
            </div>

            <div className="panel overflow-hidden">
              <div className="px-5 py-4 border-b border-[var(--line)] bg-[var(--surface)] flex items-center justify-between">
                <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--ink)] flex items-center gap-2">
                  <Inbox className="w-4 h-4 text-[var(--accent)]" />
                  Event Proposal Signatory Queue
                </h2>
                <Link to="/approvals" className="text-xs font-semibold text-[var(--accent-text)] hover:underline">
                  Open Clearances →
                </Link>
              </div>
              <div className="divide-y divide-[var(--line)]">
                {inboxItems.length === 0 ? (
                  <p className="p-6 text-xs text-[var(--muted)]">No event proposals awaiting clearance.</p>
                ) : (
                  inboxItems.slice(0, 4).map(({ proposal: p, step }) => (
                    <Link
                      key={step.id}
                      to={`/proposals/${p.id}`}
                      className="p-4 flex items-center justify-between hover:bg-[var(--accent-tint)] transition"
                    >
                      <div>
                        <p className="font-bold text-sm text-[var(--ink)]">{p.title}</p>
                        <p className="text-xs text-[var(--muted)] font-mono">
                          Step {step.step_order}: {step.label} · {p.reference_no}
                        </p>
                      </div>
                      <span className="tag tag-approved">Inspect</span>
                    </Link>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* University-Wide Student Organization Events Calendar */}
      <StudentOrgEventsCalendar />
    </div>
  )
}
