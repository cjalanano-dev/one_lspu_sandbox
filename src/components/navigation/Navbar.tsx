
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
            ? 'bg-[#425C56] text-[#F1F3EF] border-[#5E7769] font-bold shadow-[0_0_16px_rgba(130,151,122,0.15)]'
            : 'text-[#A1ADA5] hover:bg-[#22383C] hover:text-[#F1F3EF] hover:border-[#425C56]'
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
      {isOfficer && navItem('/proposals', 'Proposals', <FileText className="w-4 h-4" />)}
      {isApprover && navItem('/approvals', 'Approvals', <Inbox className="w-4 h-4" />)}
      {isOfficer && navItem('/organization', 'Org Dashboard', <Users className="w-4 h-4" />)}
      {isAdmin && navItem('/admin', 'Admin Panel', <ShieldCheck className="w-4 h-4" />)}
    </>
  )

  const mobileGuestActions = (
    <>
      <Link
        to="/login"
        className="w-full py-3 px-4 border border-[#5E7769] rounded-[var(--radius)] text-center text-sm font-medium text-[#F1F3EF] hover:bg-[#22383C] transition"
      >
        Sign in
      </Link>

      <Link
        to="/register"
        className="w-full py-3 px-4 border border-[#344D4C] rounded-[var(--radius)] text-center text-sm font-medium text-[#A1ADA5] hover:bg-[#22383C] transition"
      >
        Create account
      </Link>
    </>
  )

  const mobileAuthedActions = (
    <>
      <button
        onClick={handleSignOut}
        className="w-full py-3 px-4 border border-[#344D4C] rounded-[var(--radius)] text-center text-sm font-medium text-[#A1ADA5] hover:bg-[#22383C] transition"
      >
        Sign out
      </button>
    </>
  )

  return (
    <header className="sticky top-0 z-50 border-b border-[#425C56]/50 bg-[radial-gradient(ellipse_at_18%_10%,rgba(112,143,117,0.25),transparent_45%),radial-gradient(ellipse_at_85%_100%,rgba(183,194,157,0.10),transparent_40%),linear-gradient(110deg,#08151C_0%,#14272D_50%,#08151C_100%)] backdrop-blur-xl shadow-[0_8px_30px_rgba(0,0,0,0.20)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-[var(--radius)] border border-[#82977A]/50 bg-[linear-gradient(145deg,#627B6C,#22383C)] shadow-[0_0_18px_rgba(130,151,122,0.18)] flex items-center justify-center group-hover:shadow-[0_0_22px_rgba(130,151,122,0.35)] transition">
              <Building2 className="w-6 h-6 text-[#F1F3EF]" />
            </div>

            <div className="text-[#F1F3EF] font-bold tracking-tight text-lg flex items-center gap-0.5 group-hover:text-[#95A790] transition">
              ONE LSPU
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
                    className="relative p-3 rounded-[var(--radius)] text-[#F1F3EF] hover:bg-[#22383C] transition"
                    aria-label="View notifications"
                    aria-expanded={showNotifs}
                    aria-controls="notifications-dropdown"
                  >
                    <Bell className="w-5 h-5" />

                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 w-2 h-2 bg-[#B36B65] rounded-full" />
                    )}
                  </button>

                  {showNotifs && (
                    <div
                      id="notifications-dropdown"
                      className="absolute right-0 mt-2 w-80 sm:w-96 bg-[radial-gradient(ellipse_at_top_left,rgba(112,143,117,0.18),transparent_55%),linear-gradient(145deg,#14272D,#08151C)] text-[#F1F3EF] rounded-[var(--radius)] border border-[#425C56]/70 py-2 z-50 shadow-[0_15px_45px_rgba(0,0,0,0.35)] backdrop-blur-xl"
                    >
                      <div className="flex items-center justify-between px-4 py-2 border-b border-[#344D4C]">
                        <span className="font-semibold text-sm text-[#F1F3EF]">
                          Notifications
                        </span>

                        <span className="text-xs text-[#95A790]">
                          {notifications.length} total
                        </span>
                      </div>

                      <div className="max-h-80 overflow-y-auto divide-y divide-[#344D4C]">
                        {notifications.length === 0 ? (
                          <div className="p-6 text-center text-[#A1ADA5] text-sm">
                            No notifications yet.
                          </div>
                        ) : (
                          notifications.map((n) => (
                            <div
                              key={n.id}
                              onClick={() => handleMarkRead(n.id)}
                              className={`p-3 text-xs cursor-pointer transition hover:bg-[#22383C] flex items-start gap-3 ${
                                !n.is_read ? 'bg-[#22383C]' : ''
                              }`}
                            >
                              <div className="mt-0.5">
                                {n.notification_type === 'reservation_approved' ? (
                                  <CheckCircle2 className="w-4 h-4 text-[#82977A]" />
                                ) : n.notification_type === 'reservation_rejected' ? (
                                  <Clock className="w-4 h-4 text-[#B36B65]" />
                                ) : (
                                  <Clock className="w-4 h-4 text-[#A1ADA5]" />
                                )}
                              </div>

                              <div className="flex-1">
                                <p className="font-semibold text-[#F1F3EF]">
                                  {n.title}
                                </p>

                                <p className="text-[#A1ADA5] mt-0.5 leading-relaxed">
                                  {n.message}
                                </p>

                                <span className="text-xs text-[#95A790] mt-1 block">
                                  {new Date(n.created_at).toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </span>
                              </div>

                              {!n.is_read && (
                                <span className="w-2 h-2 rounded-sm bg-[#95A790] mt-1.5 shrink-0" />
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Profile Avatar & Dropdown */}
                <div className="relative flex items-center gap-2 pl-2 border-l border-[#344D4C]">
                  <img
                    src={user?.avatar_url || '/user-placeholder.svg'}
                    alt={user?.full_name || 'User'}
                    className="w-9 h-9 rounded-sm object-cover border border-[#344D4C]"
                    loading="lazy"
                  />

                  <div
                    className="hidden lg:block text-left text-xs cursor-pointer"
                    onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                  >
                    <div className="font-medium text-[#F1F3EF]">
                      {user?.full_name}
                    </div>

                    <div className="text-[#A1ADA5] capitalize">
                      {user?.primary_role?.replace('_', ' ')}
                    </div>
                  </div>

                  {profileMenuOpen && (
                    <div className="absolute right-0 mt-5 w-48 bg-[radial-gradient(ellipse_at_top_left,rgba(112,143,117,0.18),transparent_60%),linear-gradient(145deg,#14272D,#08151C)] text-[#F1F3EF] rounded-[var(--radius)] border border-[#425C56]/70 py-2 z-50 shadow-[0_15px_45px_rgba(0,0,0,0.35)]">
                      <Link
                        to="/my-reservations"
                        onClick={() => setProfileMenuOpen(false)}
                        className="px-4 py-2.5 text-xs text-[#A1ADA5] hover:bg-[#22383C] hover:text-[#F1F3EF] flex items-center gap-2"
                      >
                        <Calendar className="w-4 h-4 text-[#95A790] mr-2" />
                        My Reservations
                      </Link>

                      {isOfficer && (
                        <Link
                          to="/proposals"
                          onClick={() => setProfileMenuOpen(false)}
                          className="px-4 py-2.5 text-xs text-[#A1ADA5] hover:bg-[#22383C] hover:text-[#F1F3EF] flex items-center gap-2"
                        >
                          <FileText className="w-4 h-4 text-[#95A790] mr-2" />
                          Event Proposals
                        </Link>
                      )}

                      {isApprover && (
                        <Link
                          to="/approvals"
                          onClick={() => setProfileMenuOpen(false)}
                          className="px-4 py-2.5 text-xs text-[#A1ADA5] hover:bg-[#22383C] hover:text-[#F1F3EF] flex items-center gap-2"
                        >
                          <Inbox className="w-4 h-4 text-[#95A790] mr-2" />
                          Approvals Inbox
                        </Link>
                      )}

                      <div className="border-b border-[#344D4C] my-1" />

                      <button
                        onClick={handleSignOut}
                        className="w-full px-4 py-2.5 text-xs text-left text-[#A1ADA5] hover:bg-[#22383C] hover:text-[#F1F3EF] flex items-center gap-2"
                      >
                        <LogOut className="w-4 h-4 text-[#B36B65] mr-2" />
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
                  className="px-3 py-2 rounded-[var(--radius)] text-sm font-medium text-[#F1F3EF] border border-[#5E7769] hover:bg-[#22383C] transition"
                >
                  Sign in
                </Link>

                <Link
                  to="/register"
                  className="px-3 py-2 rounded-[var(--radius)] text-sm font-medium text-[#F1F3EF] border border-[#5E7769] hover:bg-[#22383C] transition"
                >
                  Create account
                </Link>
              </div>
            )}

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-[var(--radius)] border border-[#344D4C] text-[#F1F3EF] hover:bg-[#22383C] transition"
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
        <div
          id="mobile-menu"
          className="fixed inset-0 z-40 bg-[radial-gradient(ellipse_at_15%_15%,rgba(112,143,117,0.30),transparent_45%),radial-gradient(ellipse_at_90%_85%,rgba(183,194,157,0.12),transparent_40%),linear-gradient(145deg,#08151C,#14272D_55%,#08151C)]"
        >
          <div className="absolute top-0 right-0 p-4">
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="p-2 rounded-[var(--radius)] border border-[#344D4C] text-[#F1F3EF] hover:bg-[#22383C] transition"
              aria-label="Close menu"
            >
              <CloseIcon className="w-6 h-6" />
            </button>
          </div>

          <div className="max-w-md w-full mx-auto pt-20 pb-12 px-6 space-y-6">
            <nav className="space-y-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#95A790] mb-4">
                Explore
              </h2>

              {user ? authedLinks : guestLinks}
            </nav>

            <div className="space-y-3 pt-6 border-t border-[#344D4C]">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#95A790] mb-4">
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
