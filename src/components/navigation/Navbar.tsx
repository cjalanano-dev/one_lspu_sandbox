
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
} from 'lucide-react'

import { useAuth } from '../../features/auth/AuthContext'
import { dataStore } from '../../lib/dataStore'

export function Navbar() {
  const { user, signOut, isAdmin, isOfficer, isApprover, isLoading } = useAuth()

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

    return () => {
      window.removeEventListener('onefacility_notif_updated', fetchNotifs)
    }
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
    setProfileMenuOpen(false)
  }

  const isActive = (path: string) => {
    return (
      location.pathname === path ||
      location.pathname.startsWith(path + '/')
    )
  }

  if (isLoading) return null

  const navItem = (
    path: string,
    label: string,
    icon: React.ReactNode,
    extra?: string
  ) => {
    const active = isActive(path)

    return (
      <Link
        to={path}
        className={`relative px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 flex items-center gap-2 border
          ${
            active
              ? 'navy-gradient-button text-white border-transparent font-bold shadow-md shadow-blue-950/20'
              : 'border-transparent text-[var(--muted)] hover:bg-[var(--accent-tint)] hover:text-[var(--accent-text)] hover:border-[var(--accent-line)] hover:-translate-y-0.5'
          }
          ${extra || ''}`}
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
      {isOfficer && navItem('/proposals', 'Proposals', <FileText className="w-4 h-4" />)}
      {isApprover && navItem('/approvals', 'Approvals', <Inbox className="w-4 h-4" />)}
      {isOfficer && navItem('/organization', 'Org Dashboard', <Users className="w-4 h-4" />)}
      {isAdmin && navItem('/admin', 'Admin Panel', <ShieldCheck className="w-4 h-4" />)}
    </>
  )

  const mobileGuestActions = (
    <Link
      to="/login"
      className="block w-full py-3 px-4 border border-[var(--accent-line)] rounded-lg text-center text-sm font-semibold text-[var(--accent-text)] hover:navy-gradient-button hover:text-white hover:-translate-y-0.5 transition-all duration-300"
    >
      Sign in
    </Link>
  )

  const mobileAuthedActions = (
    <button
      onClick={handleSignOut}
      className="w-full py-3 px-4 border border-[var(--danger)] rounded-lg text-center text-sm font-medium text-[var(--danger-text)] hover:bg-[var(--danger)] hover:text-white transition-all duration-300"
    >
      Sign out
    </button>
  )

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-[var(--accent-line)] shadow-sm transition-all duration-300">

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="flex items-center justify-between h-16">

          {/* LOGO */}
          <Link to="/" className="flex items-center gap-3 group">

            <div className="relative w-11 h-11 flex items-center justify-center rounded-xl navy-gradient-button shadow-md overflow-hidden transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-blue-900/30">
              <img
                src="/logo.png"
                alt="ONE LSPU Logo"
                className="w-9 h-9 object-contain transition-transform duration-500 group-hover:rotate-6"
              />
            </div>

            <div className="flex flex-col leading-tight">
              <span className="text-[var(--accent-deep)] font-black tracking-tight text-lg transition-colors duration-300 group-hover:text-[var(--accent)]">
                ONE LSPU
              </span>

              <span className="text-[10px] font-semibold tracking-[0.2em] uppercase text-[var(--muted)]">
                Unified Campus Platform
              </span>
            </div>

          </Link>

          {/* DESKTOP NAVIGATION */}
          <nav className="hidden lg:flex items-center space-x-2">
            {user ? authedLinks : guestLinks}
          </nav>

          {/* RIGHT SECTION */}
          <div className="flex items-center gap-3">

            {user ? (
              <div className="flex items-center gap-3">

                {/* NOTIFICATIONS */}
                <div className="relative">

                  <button
                    onClick={() => setShowNotifs(!showNotifs)}
                    className="relative p-3 rounded-xl text-[var(--ink)] hover:bg-[var(--accent-tint)] hover:text-[var(--accent-text)] hover:-translate-y-0.5 transition-all duration-300"
                    aria-label="View notifications"
                    aria-expanded={showNotifs}
                    aria-controls="notifications-dropdown"
                  >
                    <Bell className="w-5 h-5" />

                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-[var(--accent)] rounded-full ring-2 ring-white animate-pulse" />
                    )}
                  </button>

                  {showNotifs && (
                    <div
                      id="notifications-dropdown"
                      className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white text-[var(--ink)] rounded-xl border border-[var(--accent-line)] py-2 z-50 shadow-xl shadow-blue-950/10 animate-in fade-in slide-in-from-top-2 duration-200"
                    >

                      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--line)]">
                        <span className="font-bold text-sm text-[var(--accent-deep)]">
                          Notifications
                        </span>

                        <span className="text-xs text-[var(--muted)]">
                          {notifications.length} total
                        </span>
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
                              className={`p-4 text-xs cursor-pointer transition-all duration-200 hover:bg-[var(--accent-tint)] flex items-start gap-3 ${
                                !n.is_read ? 'bg-blue-50/70' : ''
                              }`}
                            >

                              <div className="mt-0.5">
                                {n.notification_type === 'reservation_approved' ? (
                                  <CheckCircle2 className="w-4 h-4 text-[var(--accent-text)]" />
                                ) : (
                                  <Clock className="w-4 h-4 text-[var(--muted)]" />
                                )}
                              </div>

                              <div className="flex-1">
                                <p className="font-semibold text-[var(--ink)]">
                                  {n.title}
                                </p>

                                <p className="text-[var(--muted)] mt-1 leading-relaxed">
                                  {n.message}
                                </p>

                                <span className="text-xs text-[var(--faint)] mt-2 block">
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

                {/* PROFILE */}
                <div className="relative flex items-center gap-2 pl-2">

                  <img
                    src={user?.avatar_url || '/user-placeholder.svg'}
                    alt={user?.full_name || 'User'}
                    className="w-9 h-9 rounded-lg object-cover border border-[var(--accent-line)]"
                    loading="lazy"
                  />

                  <button
                    type="button"
                    className="hidden lg:block text-left text-xs cursor-pointer"
                    onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                    aria-expanded={profileMenuOpen}
                  >
                    <div className="font-semibold text-[var(--ink)] hover:text-[var(--accent-text)] transition-colors">
                      {user?.full_name}
                    </div>

                    <div className="text-[var(--muted)] capitalize">
                      {user?.primary_role?.replace('_', ' ')}
                    </div>
                  </button>

                  {profileMenuOpen && (
                    <div className="absolute right-0 top-full mt-2 w-52 bg-white text-[var(--ink)] rounded-xl border border-[var(--accent-line)] py-2 z-50 shadow-xl shadow-blue-950/10">

                      <Link
                        to="/my-reservations"
                        onClick={() => setProfileMenuOpen(false)}
                        className="px-4 py-3 text-xs text-[var(--muted)] hover:bg-[var(--accent-tint)] hover:text-[var(--accent-text)] flex items-center gap-3 transition-colors"
                      >
                        <Calendar className="w-4 h-4" />
                        My Reservations
                      </Link>

                      {isOfficer && (
                        <Link
                          to="/proposals"
                          onClick={() => setProfileMenuOpen(false)}
                          className="px-4 py-3 text-xs text-[var(--muted)] hover:bg-[var(--accent-tint)] hover:text-[var(--accent-text)] flex items-center gap-3 transition-colors"
                        >
                          <FileText className="w-4 h-4" />
                          Event Proposals
                        </Link>
                      )}

                      {isApprover && (
                        <Link
                          to="/approvals"
                          onClick={() => setProfileMenuOpen(false)}
                          className="px-4 py-3 text-xs text-[var(--muted)] hover:bg-[var(--accent-tint)] hover:text-[var(--accent-text)] flex items-center gap-3 transition-colors"
                        >
                          <Inbox className="w-4 h-4" />
                          Approvals Inbox
                        </Link>
                      )}

                      <div className="border-b border-[var(--line)] my-1" />

                      <button
                        onClick={handleSignOut}
                        className="group w-full px-4 py-3 text-xs text-left text-[var(--danger-text)] hover:bg-[var(--danger)] hover:text-white flex items-center gap-3 transition-colors"
                      >
                        <LogOut className="w-4 h-4 group-hover:text-white" />
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
                  className="px-4 py-2 rounded-lg text-sm font-semibold text-[var(--accent-deep)] border border-[var(--accent-line)] hover:navy-gradient-button hover:text-white hover:-translate-y-0.5 transition-all duration-300"
                >
                  Sign in
                </Link>
              </div>
            )}

            {/* MOBILE MENU TOGGLE */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg border border-[var(--accent-line)] text-[var(--accent-deep)] hover:navy-gradient-button hover:text-white transition-all duration-300"
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

      {/* MOBILE MENU */}
      {mobileMenuOpen && (
        <div
          id="mobile-menu"
          className="fixed inset-0 z-40 bg-white/95 backdrop-blur-xl"
        >

          <div className="absolute top-0 right-0 p-4">
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="p-2 rounded-lg border border-[var(--accent-line)] text-[var(--accent-deep)] hover:navy-gradient-button hover:text-white transition-all duration-300"
              aria-label="Close menu"
            >
              <CloseIcon className="w-6 h-6" />
            </button>
          </div>

          <div className="max-w-md w-full mx-auto pt-20 pb-12 px-6 space-y-8">

            {/* MOBILE BRAND */}
            <div className="flex items-center gap-3 pb-6 border-b border-[var(--accent-line)]">
              <div className="w-12 h-12 rounded-xl navy-gradient-button flex items-center justify-center shadow-md">
                <img
                  src="/logo.png"
                  alt="ONE LSPU Logo"
                  className="w-10 h-10 object-contain"
                />
              </div>

              <div>
                <p className="font-black text-lg text-[var(--accent-deep)]">
                  ONE LSPU
                </p>
                <p className="text-[10px] uppercase tracking-widest text-[var(--muted)]">
                  Unified Campus Platform
                </p>
              </div>
            </div>

            <nav className="space-y-3">
              <h2 className="text-xs font-bold uppercase tracking-widest text-[var(--muted)] mb-4">
                Explore
              </h2>

              <div className="flex flex-col gap-2">
                {user ? authedLinks : guestLinks}
              </div>
            </nav>

            <div className="space-y-3 pt-6 border-t border-[var(--accent-line)]">
              <h2 className="text-xs font-bold uppercase tracking-widest text-[var(--muted)] mb-4">
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
