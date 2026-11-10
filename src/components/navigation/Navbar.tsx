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
  X,
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

  // Close mobile menu, notifications, and profile menu on route change and Escape
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
      // crude check: if click isn't inside header, close overlays
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

  const guestLinks = (
    <>
      <Link
        to="/explorer"
        className={`px-3 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 ${
          isActive('/explorer')
            ? 'bg-slate-800 text-sky-400 shadow-sm'
            : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
        }`}
      >
        <Compass className="w-4 h-4" />
        Campus Explorer
      </Link>
      <Link
        to="/facilities"
        className={`px-3 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 ${
          isActive('/facilities')
            ? 'bg-slate-800 text-sky-400 shadow-sm'
            : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
        }`}
      >
        <Building2 className="w-4 h-4" />
        Facilities
      </Link>
    </>
  )

  const authedLinks = (
    <>
      <Link
        to="/explorer"
        className={`px-3 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 ${
          isActive('/explorer')
            ? 'bg-slate-800 text-sky-400 shadow-sm'
            : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
        }`}
      >
        <Compass className="w-4 h-4" />
        Campus Explorer
      </Link>
      <Link
        to="/facilities"
        className={`px-3 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 ${
          isActive('/facilities')
            ? 'bg-slate-800 text-sky-400 shadow-sm'
            : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
        }`}
      >
        <Building2 className="w-4 h-4" />
        Facilities
      </Link>
      <Link
        to="/my-reservations"
        className={`px-3 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 ${
          isActive('/my-reservations')
            ? 'bg-slate-800 text-sky-400 shadow-sm'
            : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
        }`}
      >
        <Calendar className="w-4 h-4" />
        My Reservations
      </Link>

      {isOfficer && (
        <Link
          to="/organization"
          className={`px-3 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 ${
            isActive('/organization')
              ? 'bg-slate-800 text-sky-400 shadow-sm'
              : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
          }`}
        >
          <Users className="w-4 h-4 text-indigo-400" />
          Org Dashboard
        </Link>
      )}

      {isAdmin && (
        <Link
          to="/admin"
          className={`px-3 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 ${
            isActive('/admin')
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              : 'text-amber-400 hover:bg-amber-500/10'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          Admin Panel
        </Link>
      )}
    </>
  )

  const mobileGuestActions = (
    <>
      <Link
        to="/login"
        className="w-full py-3 px-4 rounded-xl bg-sky-500 text-slate-950 font-semibold text-center shadow-lg shadow-sky-500/25 transition hover:bg-sky-400"
      >
        Sign in
      </Link>
      <Link
        to="/register"
        className="w-full py-3 px-4 rounded-xl border border-slate-200 text-slate-600 font-medium text-center hover:bg-slate-50 transition"
      >
        Create account
      </Link>
    </>
  )

  const mobileAuthedActions = (
    <>
      <button
        onClick={handleSignOut}
        className="w-full py-3 px-4 rounded-xl border border-slate-200 text-slate-600 font-medium text-center hover:bg-slate-50 transition"
      >
        Sign out
      </button>
    </>
  )

  return (
    <header className="sticky top-0 z-50 bg-slate-900 border-b border-slate-800 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-sky-500/20 group-hover:scale-105 transition-transform">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
                ONE <span className="text-sky-400 font-extrabold">Facility</span>
              </div>
            </div>
          </Link>

          {/* Desktop navigation (hidden below desktop; tablet uses the mobile pattern) */}
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
                    className="relative p-3 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition"
                    aria-label="View notifications"
                    aria-expanded={showNotifs}
                    aria-controls="notifications-dropdown"
                  >
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 w-4 h-4 bg-sky-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                        {unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Notification Dropdown */}
                  {showNotifs && (
                    <div id="notifications-dropdown" className="absolute right-0 mt-2 w-80 sm:w-96 bg-white text-slate-900 rounded-xl shadow-2xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2">
                      <div className="flex items-center justify-between px-4 py-2 border-b border-slate-100">
                        <span className="font-semibold text-sm text-slate-800">Notifications</span>
                        <span className="text-xs text-slate-500">{notifications.length} total</span>
                      </div>

                      <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                        {notifications.length === 0 ? (
                          <div className="p-6 text-center text-slate-400 text-sm">
                            No notifications yet.
                          </div>
                        ) : (
                          notifications.map((n) => (
                            <div
                              key={n.id}
                              onClick={() => handleMarkRead(n.id)}
                              className={`p-3 text-xs cursor-pointer transition hover:bg-slate-50 flex items-start gap-3 ${
                                !n.is_read ? 'bg-sky-50/60' : ''
                              }`}
                            >
                              <div className="mt-0.5">
                                {n.notification_type === 'reservation_approved' ? (
                                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                ) : n.notification_type === 'reservation_rejected' ? (
                                  <X className="w-4 h-4 text-rose-600" />
                                ) : (
                                  <Clock className="w-4 h-4 text-sky-600" />
                                )}
                              </div>
                              <div className="flex-1">
                                <p className="font-semibold text-slate-900">{n.title}</p>
                                <p className="text-slate-600 mt-0.5 leading-relaxed">{n.message}</p>
                                <span className="text-[10px] text-slate-400 mt-1 block">
                                  {new Date(n.created_at).toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </span>
                              </div>
                              {!n.is_read && (
                                <span className="w-2 h-2 rounded-full bg-sky-500 mt-1.5 shrink-0" />
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Profile Avatar & Dropdown */}
                <div className="relative flex items-center gap-3 pl-2 border-l border-slate-800">
                  <img
                    src={user?.avatar_url || '/assets/user-placeholder.svg'}
                    alt={user?.full_name || 'User'}
                    className="w-8 h-8 rounded-full object-cover ring-2 ring-sky-500/50"
                    loading="lazy"
                  />
                  <div className="hidden lg:block text-left text-xs cursor-pointer group" onClick={() => setProfileMenuOpen(!profileMenuOpen)}>
                    <div className="font-medium text-slate-200">{user?.full_name}</div>
                    <div className="text-slate-400 capitalize">
                      {user?.primary_role?.replace('_', ' ')}
                    </div>
                  </div>

                  {profileMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white text-slate-900 rounded-xl shadow-2xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2">
                      <Link
                        to="/my-reservations"
                        onClick={() => setProfileMenuOpen(false)}
                        className="px-4 py-2.5 text-xs text-slate-600 hover:bg-slate-50 flex items-center gap-2"
                      >
                        <Calendar className="w-4 h-4 text-slate-400 mr-2" />
                        My Reservations
                      </Link>
                      <div className="h-px bg-slate-100 my-1" />
                      <button
                        onClick={handleSignOut}
                        className="w-full px-4 py-2.5 text-xs text-left text-slate-600 hover:bg-slate-50 flex items-center gap-2"
                      >
                        <LogOut className="w-4 h-4 text-rose-600 mr-2" />
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
                  className="px-3 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white transition"
                >
                  Sign in
                </Link>
                <Link
                  to="/register"
                  className="px-3 py-2 rounded-lg text-sm font-medium transition text-sky-400 hover:text-sky-300"
                >
                  Create account
                </Link>
              </div>
            )}

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition"
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
        <div id="mobile-menu" className="fixed inset-0 z-40 bg-slate-900/95 backdrop-blur-sm">
          <div className="absolute top-0 right-0 p-4">
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/50 transition"
              aria-label="Close menu"
            >
              <CloseIcon className="w-6 h-6" />
            </button>
          </div>
          <div className="max-w-md w-full mx-auto pt-20 pb-12 px-6 space-y-6">
            <nav className="space-y-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">
                Explore
              </h2>
              {user ? authedLinks : guestLinks}
            </nav>
            <div className="space-y-3 pt-6 border-t border-slate-800">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">
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
