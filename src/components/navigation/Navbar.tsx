import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  Building2,
  Compass,
  Calendar,
  Users,
  ShieldCheck,
  Bell,
  LogOut,
  CheckCircle2,
  Clock,
  X as CloseIcon,
  Menu,
  FileText,
  Inbox,
  LayoutDashboard,
  CalendarDays,
} from 'lucide-react'
import { useAuth } from '../../features/auth/AuthContext'
import { dataStore } from '../../lib/dataStore'

const ROLE_DISPLAY_NAMES: Record<string, string> = {
  student: 'Student Account',
  faculty: 'Faculty Member',
  officer: 'Org Executive Officer',
  adviser: 'Organization Adviser',
  college_dean: 'College Dean',
  osas: 'OSAS Signatory',
  osa_staff: 'OSA Staff',
  campus_director: 'Campus Director',
  university_president: 'University President',
  facility_admin: 'Facility Administrator',
  system_admin: 'System Administrator',
}

export function Navbar() {
  const { user, signOut, isAdmin, isOfficer, isApprover, isLoading } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState<any[]>([])
  const [showNotifs, setShowNotifs] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)

  const isPureSignatory = isApprover && !isAdmin
  const canBookPersonal = !isPureSignatory

  const fetchNotifs = async () => {
    if (user?.id) {
      const list = await dataStore.getNotifications(user.id)
      setNotifications(list)
    }
  }

  useEffect(() => {
    fetchNotifs()
    window.addEventListener('onefacility_notif_updated', fetchNotifs)
    return () => window.removeEventListener('onefacility_notif_updated', fetchNotifs)
  }, [user?.id])

  useEffect(() => {
    setMobileMenuOpen(false)
    setShowNotifs(false)
    setProfileMenuOpen(false)

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMobileMenuOpen(false)
        setShowNotifs(false)
        setProfileMenuOpen(false)
      }
    }
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node
      if (!target) return
      if (!(target as Element).closest('header')) {
        setMobileMenuOpen(false)
        setShowNotifs(false)
        setProfileMenuOpen(false)
      }
    }
    window.addEventListener('keydown', handleEscape)
    window.addEventListener('mousedown', handleClickOutside)
    return () => {
      window.removeEventListener('keydown', handleEscape)
      window.removeEventListener('mousedown', handleClickOutside)
    }
  }, [location.pathname])

  const unreadCount = notifications.filter((n) => !n.is_read).length

  const handleMarkRead = async (id: string) => {
    await dataStore.markNotificationRead(id)
    fetchNotifs()
  }

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
    setMobileMenuOpen(false)
    setShowNotifs(false)
  }

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/'
    return location.pathname === path || location.pathname.startsWith(path + '/')
  }

  if (isLoading) return null

  const navItem = (path: string, label: string, icon: React.ReactNode, extra?: string) => {
    const active = isActive(path)
    return (
      <Link
        key={path}
        to={path}
        className={`px-3 py-2 rounded-[var(--radius)] text-xs font-semibold transition flex items-center gap-2 border ${
          active
            ? 'bg-[var(--ink-soft)] text-[var(--paper)] border-[var(--accent)]'
            : 'text-[var(--paper)]/75 border-transparent hover:bg-[var(--ink-soft)] hover:text-[var(--paper)]'
        } ${extra || ''}`}
      >
        <span className={active ? 'text-[var(--accent-line)]' : 'text-[var(--paper)]/65'}>{icon}</span>
        {label}
      </Link>
    )
  }

  const getRoleNavigation = () => {
    if (!user) {
      return (
        <>
          {navItem('/calendar', 'Events Calendar', <CalendarDays className="w-4 h-4" />)}
          {navItem('/explorer', 'Campus Map', <Compass className="w-4 h-4" />)}
          {navItem('/facilities', 'Facilities Directory', <Building2 className="w-4 h-4" />)}
        </>
      )
    }

    const role = user.primary_role

    if (role === 'student' || role === 'faculty') {
      return (
        <>
          {navItem('/', 'Overview', <LayoutDashboard className="w-4 h-4" />)}
          {navItem('/calendar', 'Events Calendar', <CalendarDays className="w-4 h-4" />)}
          {navItem('/explorer', 'Campus Explorer', <Compass className="w-4 h-4" />)}
          {navItem('/facilities', 'Facilities', <Building2 className="w-4 h-4" />)}
          {navItem('/my-reservations', 'My Reservations', <Calendar className="w-4 h-4" />)}
        </>
      )
    }

    if (role === 'officer') {
      return (
        <>
          {navItem('/', 'Exec Hub', <LayoutDashboard className="w-4 h-4" />)}
          {navItem('/calendar', 'Events Calendar', <CalendarDays className="w-4 h-4" />)}
          {navItem('/organization', 'Organization', <Users className="w-4 h-4" />)}
          {navItem('/proposals', 'Event Proposals', <FileText className="w-4 h-4" />)}
          {navItem('/explorer', 'Campus Map', <Compass className="w-4 h-4" />)}
          {navItem('/my-reservations', 'Venue Bookings', <Calendar className="w-4 h-4" />)}
        </>
      )
    }

    if (isPureSignatory) {
      return (
        <>
          {navItem('/', 'Signatory Desk', <LayoutDashboard className="w-4 h-4" />)}
          {navItem('/approvals', 'Approvals Inbox', <Inbox className="w-4 h-4" />)}
          {navItem('/calendar', 'Events Calendar', <CalendarDays className="w-4 h-4" />)}
          {navItem('/facilities', 'Venue Reference', <Building2 className="w-4 h-4" />)}
        </>
      )
    }

    return (
      <>
        {navItem('/', 'Command Overview', <LayoutDashboard className="w-4 h-4" />)}
        {navItem('/admin', 'Admin Command', <ShieldCheck className="w-4 h-4" />)}
        {navItem('/approvals', 'Proposal Clearances', <Inbox className="w-4 h-4" />)}
        {navItem('/calendar', 'Events Calendar', <CalendarDays className="w-4 h-4" />)}
        {navItem('/explorer', 'Floor Plans', <Compass className="w-4 h-4" />)}
        {navItem('/facilities', 'Facilities', <Building2 className="w-4 h-4" />)}
      </>
    )
  }

  return (
    <header className="sticky top-0 z-50 bg-[var(--ink)] text-[var(--paper)] border-b border-[var(--ink-soft)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Institutional Brand Identity */}
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center gap-3 group">
              <img src="/logo.png" alt="ONE LSPU logo" className="w-8 h-8 object-contain shrink-0" />
              <div className="flex items-baseline gap-2">
                <span className="text-[var(--paper)] font-bold tracking-tight text-sm leading-none">
                  ONE LSPU
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Role-Scoped Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {getRoleNavigation()}
          </nav>

          {/* Right section */}
          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-2.5">
                {/* Notification Bell */}
                <div className="relative">
                  <button
                    onClick={() => setShowNotifs(!showNotifs)}
                    className="relative p-2 rounded-[var(--radius)] text-[var(--paper)]/80 hover:text-[var(--paper)] hover:bg-[var(--ink-soft)] transition cursor-pointer"
                    aria-label="View notifications"
                    aria-expanded={showNotifs}
                    aria-controls="notifications-dropdown"
                  >
                    <Bell className="w-4 h-4" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[var(--accent)] rounded-full" />
                    )}
                  </button>

                  {showNotifs && (
                    <div
                      id="notifications-dropdown"
                      className="fixed sm:absolute left-3 right-3 sm:left-auto sm:right-0 top-16 sm:top-full mt-2 sm:w-96 bg-[var(--paper)] text-[var(--ink)] rounded-[var(--radius)] border border-[var(--line-strong)] py-2 z-50"
                    >
                      <div className="flex items-center justify-between px-4 py-2.5 border-b border-[var(--line)]">
                        <span className="font-bold text-xs uppercase tracking-wider text-[var(--ink)]">
                          Institutional Notices
                        </span>
                        <span className="text-xs font-mono text-[var(--muted)]">
                          {unreadCount} unread
                        </span>
                      </div>

                      <div className="max-h-80 overflow-y-auto divide-y divide-[var(--line)]">
                        {notifications.length === 0 ? (
                          <div className="p-6 text-center text-[var(--muted)] text-xs">
                            No notifications recorded.
                          </div>
                        ) : (
                          notifications.map((n) => (
                            <div
                              key={n.id}
                              onClick={() => handleMarkRead(n.id)}
                              className={`p-3.5 text-xs cursor-pointer transition hover:bg-[var(--accent-tint)] flex items-start gap-3 ${
                                !n.is_read ? 'bg-[var(--surface)]' : ''
                              }`}
                            >
                              <div className="mt-0.5">
                                {n.notification_type === 'reservation_approved' ||
                                n.notification_type === 'proposal_approved' ? (
                                  <CheckCircle2 className="w-4 h-4 text-[var(--accent)]" />
                                ) : (
                                  <Clock className="w-4 h-4 text-[var(--muted)]" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-[var(--ink)]">{n.title}</p>
                                <p className="text-[var(--muted)] mt-0.5 leading-relaxed">
                                  {n.message}
                                </p>
                                <span className="text-xs font-mono text-[var(--faint)] mt-1 block">
                                  {new Date(n.created_at).toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </span>
                              </div>
                              {!n.is_read && (
                                <span className="w-2 h-2 rounded-full bg-[var(--accent)] mt-1.5 shrink-0" />
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Profile Avatar & Role Dropdown */}
                <div className="relative flex items-center gap-2.5 pl-2 border-l border-[var(--paper)]/15">
                  <button
                    type="button"
                    onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                    className="flex items-center gap-2.5 text-left py-1 px-2 rounded-[var(--radius)] hover:bg-[var(--ink-soft)] transition cursor-pointer"
                  >
                    <div className="w-7 h-7 rounded-[var(--radius)] bg-[var(--ink-soft)] border border-[var(--paper)]/20 flex items-center justify-center text-xs font-mono font-bold text-[var(--paper)] uppercase">
                      {user.full_name?.slice(0, 2) || 'US'}
                    </div>
                    <div className="hidden md:block text-xs">
                      <div className="font-semibold text-[var(--paper)] leading-tight">
                        {user?.full_name}
                      </div>
                      <div className="text-xs font-mono text-[var(--accent-line)]">
                        {ROLE_DISPLAY_NAMES[user.primary_role] ?? user.primary_role}
                      </div>
                    </div>
                  </button>

                  {profileMenuOpen && (
                    <div className="fixed sm:absolute left-3 right-3 sm:left-auto sm:right-0 top-16 sm:top-full mt-2 sm:w-64 bg-[var(--paper)] text-[var(--ink)] rounded-[var(--radius)] border border-[var(--line-strong)] py-1.5 z-50">
                      <div className="px-4 py-2.5 border-b border-[var(--line)] bg-[var(--surface)]">
                        <p className="text-xs font-bold text-[var(--ink)] truncate">{user.full_name}</p>
                        <p className="text-xs font-mono text-[var(--muted)] truncate">{user.email}</p>
                        <span className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-[var(--radius)] bg-[var(--accent-tint)] text-[var(--accent-text)] border border-[var(--accent-line)] text-xs font-mono font-bold uppercase tracking-wider">
                          {ROLE_DISPLAY_NAMES[user.primary_role] ?? user.primary_role}
                        </span>
                      </div>

                      {canBookPersonal && (
                        <Link
                          to="/my-reservations"
                          onClick={() => setProfileMenuOpen(false)}
                          className="px-4 py-2 text-xs font-medium text-[var(--ink)] hover:bg-[var(--accent-tint)] hover:text-[var(--accent-text)] flex items-center gap-2.5"
                        >
                          <Calendar className="w-3.5 h-3.5 text-[var(--muted)]" />
                          My Reservations
                        </Link>
                      )}
                      {isOfficer && (
                        <>
                          <Link
                            to="/organization"
                            onClick={() => setProfileMenuOpen(false)}
                            className="px-4 py-2 text-xs font-medium text-[var(--ink)] hover:bg-[var(--accent-tint)] hover:text-[var(--accent-text)] flex items-center gap-2.5"
                          >
                            <Users className="w-3.5 h-3.5 text-[var(--muted)]" />
                            Organization Workspace
                          </Link>
                          <Link
                            to="/proposals"
                            onClick={() => setProfileMenuOpen(false)}
                            className="px-4 py-2 text-xs font-medium text-[var(--ink)] hover:bg-[var(--accent-tint)] hover:text-[var(--accent-text)] flex items-center gap-2.5"
                          >
                            <FileText className="w-3.5 h-3.5 text-[var(--muted)]" />
                            Event Proposals
                          </Link>
                        </>
                      )}
                      {isApprover && (
                        <Link
                          to="/approvals"
                          onClick={() => setProfileMenuOpen(false)}
                          className="px-4 py-2 text-xs font-medium text-[var(--ink)] hover:bg-[var(--accent-tint)] hover:text-[var(--accent-text)] flex items-center gap-2.5"
                        >
                          <Inbox className="w-3.5 h-3.5 text-[var(--muted)]" />
                          Approvals Inbox
                        </Link>
                      )}
                      {isAdmin && (
                        <Link
                          to="/admin"
                          onClick={() => setProfileMenuOpen(false)}
                          className="px-4 py-2 text-xs font-medium text-[var(--ink)] hover:bg-[var(--accent-tint)] hover:text-[var(--accent-text)] flex items-center gap-2.5"
                        >
                          <ShieldCheck className="w-3.5 h-3.5 text-[var(--muted)]" />
                          Admin Command Center
                        </Link>
                      )}
                      <div className="border-t border-[var(--line)] my-1" />
                      <button
                        onClick={handleSignOut}
                        className="w-full px-4 py-2 text-xs font-semibold text-left text-[var(--danger-text)] hover:bg-[var(--danger)] hover:text-[var(--danger-ink)] transition flex items-center gap-2.5 cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        Sign out of session
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-4 py-2 rounded-[var(--radius)] text-xs font-semibold bg-[var(--accent)] text-[var(--accent-ink)] hover:bg-[var(--accent-strong)] transition"
                >
                  Institutional Sign In
                </Link>
              </div>
            )}

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-[var(--radius)] border border-[var(--paper)]/20 text-[var(--paper)] hover:bg-[var(--ink-soft)] transition"
              aria-label="Toggle navigation menu"
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-menu"
            >
              {mobileMenuOpen ? <CloseIcon className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu panel */}
      {mobileMenuOpen && (
        <div id="mobile-menu" className="lg:hidden border-t border-[var(--ink-soft)] bg-[var(--ink)] px-4 pt-4 pb-6 space-y-4 max-h-[calc(100vh-4rem)] overflow-y-auto">
          {user && (
            <div className="px-3 py-2.5 rounded-[var(--radius)] bg-[var(--ink-dark)] border border-[var(--ink-soft)] flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-xs font-bold text-[var(--paper)] truncate">{user.full_name}</p>
                <p className="text-xs font-mono text-[var(--accent-line)] truncate">
                  {ROLE_DISPLAY_NAMES[user.primary_role] ?? user.primary_role}
                </p>
              </div>
              <span className="text-xs font-mono text-[var(--paper)]/60 truncate max-w-[9rem]">
                {user.email}
              </span>
            </div>
          )}
          <nav className="flex flex-col space-y-1">
            {getRoleNavigation()}
          </nav>
          <div className="pt-4 border-t border-[var(--ink-soft)]">
            {user ? (
              <button
                onClick={handleSignOut}
                className="w-full py-2.5 px-4 rounded-[var(--radius)] bg-[var(--ink-soft)] text-xs font-semibold text-[var(--paper)] hover:bg-[var(--danger)] hover:text-[var(--danger-ink)] transition flex items-center justify-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Sign out ({user.full_name})
              </button>
            ) : (
              <Link
                to="/login"
                className="block w-full py-2.5 px-4 rounded-[var(--radius)] bg-[var(--accent)] text-center text-xs font-semibold text-[var(--accent-ink)]"
              >
                Institutional Sign In
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
