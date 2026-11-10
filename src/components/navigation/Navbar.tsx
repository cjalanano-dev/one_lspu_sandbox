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
} from 'lucide-react'
import { useAuth } from '../../features/auth/AuthContext'
import { dataStore } from '../../lib/dataStore'

export function Navbar() {
  const { user, signOut, isAdmin, isOfficer, isLoading } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState<any[]>([])
  const [showNotifs, setShowNotifs] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)

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
    return location.pathname === path || location.pathname.startsWith(path + '/')
  }

  if (isLoading) return null

  const navItem = (path: string, label: string, icon: React.ReactNode, extra?: string) => {
    const active = isActive(path)
    return (
      <Link
        to={path}
        className={`px-3 py-2 rounded-[var(--radius)] text-sm font-medium transition flex items-center gap-2 border border-transparent ${
          active
            ? 'bg-black text-white border-black font-bold'
            : 'text-[var(--muted)] hover:bg-[var(--surface-2)] hover:text-[var(--ink)] hover:border-[var(--line-strong)]'
        } ${extra || ''}`}
      >
        {icon}
        {label}
      </Link>
    )
  }

  const guestLinks = (
    <>
      {navItem('/explorer', 'Campus Explorer', <Compass className="w-4 h-4" />)}
      {navItem('/facilities', 'Facilities', <Building2 className="w-4 h-4" />)}
    </>
  )

  const authedLinks = (
    <>
      {navItem('/explorer', 'Campus Explorer', <Compass className="w-4 h-4" />)}
      {navItem('/facilities', 'Facilities', <Building2 className="w-4 h-4" />)}
      {navItem('/my-reservations', 'My Reservations', <Calendar className="w-4 h-4" />)}
      {isOfficer && navItem('/organization', 'Org Dashboard', <Users className="w-4 h-4" />)}
      {isAdmin && navItem('/admin', 'Admin Panel', <ShieldCheck className="w-4 h-4" />)}
    </>
  )

  const mobileGuestActions = (
    <>
      <Link
        to="/login"
        className="w-full py-3 px-4 border border-[var(--line-strong)] rounded-[var(--radius)] text-center text-sm font-medium text-[var(--ink)] hover:bg-[var(--surface-2)] transition"
      >
        Sign in
      </Link>
      <Link
        to="/register"
        className="w-full py-3 px-4 border border-[var(--line)] rounded-[var(--radius)] text-center text-sm font-medium text-[var(--muted)] hover:bg-[var(--surface-2)] transition"
      >
        Create account
      </Link>
    </>
  )

  const mobileAuthedActions = (
    <>
      <button
        onClick={handleSignOut}
        className="w-full py-3 px-4 border border-[var(--line)] rounded-[var(--radius)] text-center text-sm font-medium text-[var(--muted)] hover:bg-[var(--surface-2)] transition"
      >
        Sign out
      </button>
    </>
  )

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-[var(--line)] shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-[var(--radius)] border border-[var(--line-strong)] bg-black flex items-center justify-center group-hover:bg-[var(--surface-2)] transition">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div className="text-[var(--ink)] font-bold tracking-tight text-lg flex items-center gap-0.5 group-hover:text-black transition">
              ONE FACILITY
            </div>
          </Link>

          {/* Desktop navigation */}
          <nav className="hidden lg:flex items-center space-x-2">
            {user ? authedLinks : guestLinks}
          </nav>

          {/* Right section */}
          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                {/* Notification Bell */}
                <div className="relative">
                  <button
                    onClick={() => setShowNotifs(!showNotifs)}
                    className="relative p-3 rounded-[var(--radius)] border border-[var(--line)] text-[var(--ink)] hover:bg-[var(--surface-2)] transition"
                    aria-label="View notifications"
                    aria-expanded={showNotifs}
                    aria-controls="notifications-dropdown"
                  >
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 w-4 h-4 bg-[var(--line-strong)] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                        {unreadCount}
                      </span>
                    )}
                  </button>

                  {showNotifs && (
                    <div id="notifications-dropdown" className="absolute right-0 mt-2 w-80 sm:w-96 bg-white text-[var(--ink)] rounded-[var(--radius)] shadow-lg border border-[var(--line)] py-2 z-50">
                      <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--line)]">
                        <span className="font-semibold text-sm text-[var(--ink)]">Notifications</span>
                        <span className="text-xs text-[var(--faint)]">{notifications.length} total</span>
                      </div>

                      <div className="max-h-80 overflow-y-auto divide-y divide-[var(--line)]">
                        {notifications.length === 0 ? (
                          <div className="p-6 text-center text-[var(--muted)] text-sm">
                            No notifications yet.
                          </div>
                        ) : (
                          notifications.map((n) => (
                            <div
                              key={n.id}
                              onClick={() => handleMarkRead(n.id)}
                              className={`p-3 text-xs cursor-pointer transition hover:bg-[var(--surface-2)] flex items-start gap-3 ${
                                !n.is_read ? 'bg-[var(--surface-2)]' : ''
                              }`}
                            >
                              <div className="mt-0.5">
                                {n.notification_type === 'reservation_approved' ? (
                                  <CheckCircle2 className="w-4 h-4 text-[var(--ink)]" />
                                ) : n.notification_type === 'reservation_rejected' ? (
                                  <Clock className="w-4 h-4 text-[var(--muted)]" />
                                ) : (
                                  <Clock className="w-4 h-4 text-[var(--muted)]" />
                                )}
                              </div>
                              <div className="flex-1">
                                <p className="font-semibold text-[var(--ink)]">{n.title}</p>
                                <p className="text-[var(--muted)] mt-0.5 leading-relaxed">{n.message}</p>
                                <span className="text-[10px] text-[var(--faint)] mt-1 block">
                                  {new Date(n.created_at).toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </span>
                              </div>
                              {!n.is_read && (
                                <span className="w-2 h-2 rounded-full bg-[var(--line-strong)] mt-1.5 shrink-0" />
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Profile Avatar & Dropdown */}
                <div className="relative flex items-center gap-2 pl-2 border-l border-[var(--line)]">
                  <img
                    src={user?.avatar_url || '/user-placeholder.svg'}
                    alt={user?.full_name || 'User'}
                    className="w-9 h-9 rounded-full object-cover border border-[var(--line)]"
                    loading="lazy"
                  />
                  <div className="hidden lg:block text-left text-xs cursor-pointer" onClick={() => setProfileMenuOpen(!profileMenuOpen)}>
                    <div className="font-medium text-[var(--ink)]">{user?.full_name}</div>
                    <div className="text-[var(--muted)] capitalize">
                      {user?.primary_role?.replace('_', ' ')}
                    </div>
                  </div>

                  {profileMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white text-[var(--ink)] rounded-[var(--radius)] shadow-lg border border-[var(--line)] py-2 z-50">
                      <Link
                        to="/my-reservations"
                        onClick={() => setProfileMenuOpen(false)}
                        className="px-4 py-2.5 text-xs text-[var(--muted)] hover:bg-[var(--surface-2)] hover:text-[var(--ink)] flex items-center gap-2"
                      >
                        <Calendar className="w-4 h-4 text-[var(--faint)] mr-2" />
                        My Reservations
                      </Link>
                      <div className="h-px bg-[var(--line)] my-1" />
                      <button
                        onClick={handleSignOut}
                        className="w-full px-4 py-2.5 text-xs text-left text-[var(--muted)] hover:bg-[var(--surface-2)] hover:text-[var(--ink)] flex items-center gap-2"
                      >
                        <LogOut className="w-4 h-4 text-[var(--ink)] mr-2" />
                        Sign out
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-3 py-2 rounded-[var(--radius)] text-sm font-medium text-[var(--muted)] hover:text-[var(--ink)] transition"
                >
                  Sign in
                </Link>
                <Link
                  to="/register"
                  className="px-3 py-2 rounded-[var(--radius)] text-sm font-medium transition text-[var(--ink)] hover:bg-[var(--surface-2)]"
                >
                  Create account
                </Link>
              </div>
            )}

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-[var(--radius)] border border-[var(--line)] text-[var(--ink)] hover:bg-[var(--surface-2)] transition"
              aria-label="Toggle navigation menu"
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-menu"
            >
              {mobileMenuOpen ? (
                <CloseIcon className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu panel */}
      {mobileMenuOpen && (
        <div id="mobile-menu" className="fixed inset-0 z-40 bg-white">
          <div className="absolute top-0 right-0 p-4">
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="p-2 rounded-[var(--radius)] border border-[var(--line)] text-[var(--ink)] hover:bg-[var(--surface-2)] transition"
              aria-label="Close menu"
            >
              <CloseIcon className="w-6 h-6" />
            </button>
          </div>
          <div className="max-w-md w-full mx-auto pt-20 pb-12 px-6 space-y-6">
            <nav className="space-y-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-4">
                Explore
              </h2>
              {user ? authedLinks : guestLinks}
            </nav>
            <div className="space-y-3 pt-6 border-t border-[var(--line)]">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-4">
                Account
              </h2>
              {user ? mobileAuthedActions : mobileGuestActions}
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
