import React, { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { 
  Building2, 
  Compass, 
  Calendar, 
  Users, 
  ShieldCheck, 
  Bell, 
  RotateCcw, 
  UserCheck, 
  Layers, 
  CheckCircle2, 
  Clock, 
  X
} from 'lucide-react'
import { useAuth } from '../../features/auth/AuthContext'
import { dataStore } from '../../lib/dataStore'

export function Navbar() {
  const { user, allUsers, switchUser, isAdmin, isOfficer } = useAuth()
  const location = useLocation()
  const [notifications, setNotifications] = useState([])
  const [showNotifs, setShowNotifs] = useState(false)

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

  const unreadCount = notifications.filter((n) => !n.is_read).length

  const handleMarkRead = async (id) => {
    await dataStore.markNotificationRead(id)
    fetchNotifs()
  }

  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/')
  }

  return (
    <header className="sticky top-0 z-50 bg-slate-900 border-b border-slate-800 text-white shadow-md">
      {/* Top Demo Helper Bar for Easy Role Switching */}
      <div className="bg-slate-950 px-4 py-1.5 text-xs border-b border-slate-800 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-slate-400">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="font-semibold text-slate-300">ONE Facility Demo Mode:</span>
          <span>Switch perspective to test end-to-end hackathon workflow</span>
        </div>
        <div className="flex items-center gap-3">
          <label className="text-slate-400 flex items-center gap-1.5">
            <UserCheck className="w-3.5 h-3.5 text-sky-400" />
            <span>Simulate Role:</span>
          </label>
          <select
            value={user?.id || ''}
            onChange={(e) => switchUser(e.target.value)}
            className="bg-slate-800 text-sky-300 border border-slate-700 rounded px-2 py-0.5 text-xs focus:ring-1 focus:ring-sky-500 font-medium cursor-pointer"
          >
            {allUsers.map((u) => (
              <option key={u.id} value={u.id}>
                {u.full_name} ({u.primary_role.toUpperCase()})
              </option>
            ))}
          </select>
          <button
            onClick={() => dataStore.resetData()}
            className="flex items-center gap-1 text-slate-400 hover:text-white hover:underline transition ml-2"
            title="Reset to fresh demo seed"
          >
            <RotateCcw className="w-3 h-3" />
            Reset Seed Data
          </button>
        </div>
      </div>

      {/* Main Navbar */}
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
              <p className="text-[10px] text-slate-400 -mt-1 font-mono tracking-wider">CAMPUS MANAGEMENT</p>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1">
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
              <Layers className="w-4 h-4" />
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
          </nav>

          {/* Right Section: Notifications & User profile */}
          <div className="flex items-center gap-3">
            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotifs(!showNotifs)}
                className="relative p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition"
                aria-label="View notifications"
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
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white text-slate-900 rounded-xl shadow-2xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2">
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
                              {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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

            {/* Profile Avatar & Info */}
            <div className="flex items-center gap-3 pl-2 border-l border-slate-800">
              <img
                src={user?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=128&q=80'}
                alt={user?.full_name}
                className="w-8 h-8 rounded-full object-cover ring-2 ring-sky-500/50"
              />
              <div className="hidden lg:block text-left text-xs">
                <div className="font-medium text-slate-200">{user?.full_name}</div>
                <div className="text-slate-400 capitalize">{user?.primary_role?.replace('_', ' ')}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
