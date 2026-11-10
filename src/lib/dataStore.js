import { INITIAL_SEED } from './seedData'
import { isSupabaseConfigured, supabase } from './supabase'

const STORAGE_KEYS = {
  BUILDINGS: 'onefacility_buildings',
  FLOORS: 'onefacility_floors',
  FACILITIES: 'onefacility_facilities',
  RESERVATIONS: 'onefacility_reservations',
  ACTIVITIES: 'onefacility_activities',
  ORGANIZATIONS: 'onefacility_organizations',
  MAINTENANCE: 'onefacility_maintenance',
  NOTIFICATIONS: 'onefacility_notifications',
  CURRENT_USER: 'onefacility_current_user',
}

// Initialize local storage store if not present
function initializeLocalStore() {
  if (!localStorage.getItem(STORAGE_KEYS.BUILDINGS)) {
    localStorage.setItem(STORAGE_KEYS.BUILDINGS, JSON.stringify(INITIAL_SEED.buildings))
  }
  if (!localStorage.getItem(STORAGE_KEYS.FLOORS)) {
    localStorage.setItem(STORAGE_KEYS.FLOORS, JSON.stringify(INITIAL_SEED.floors))
  }
  if (!localStorage.getItem(STORAGE_KEYS.FACILITIES)) {
    localStorage.setItem(STORAGE_KEYS.FACILITIES, JSON.stringify(INITIAL_SEED.facilities))
  }
  if (!localStorage.getItem(STORAGE_KEYS.RESERVATIONS)) {
    localStorage.setItem(STORAGE_KEYS.RESERVATIONS, JSON.stringify(INITIAL_SEED.reservations))
  }
  if (!localStorage.getItem(STORAGE_KEYS.ACTIVITIES)) {
    localStorage.setItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify(INITIAL_SEED.activities))
  }
  if (!localStorage.getItem(STORAGE_KEYS.ORGANIZATIONS)) {
    localStorage.setItem(STORAGE_KEYS.ORGANIZATIONS, JSON.stringify(INITIAL_SEED.organizations))
  }
  if (!localStorage.getItem(STORAGE_KEYS.MAINTENANCE)) {
    localStorage.setItem(STORAGE_KEYS.MAINTENANCE, JSON.stringify(INITIAL_SEED.maintenance))
  }
  if (!localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS)) {
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(INITIAL_SEED.notifications))
  }
  if (!localStorage.getItem(STORAGE_KEYS.CURRENT_USER)) {
    // Default logged in user: Officer Marcus Chen for instant testing of the required workflow!
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(INITIAL_SEED.users[1]))
  }
}

initializeLocalStore()

// Helper to get from local store
function getStore(key) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : []
  } catch (e) {
    console.error('Error reading local storage:', e)
    return []
  }
}

function setStore(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
}

export const dataStore = {
  // Current user management & Switcher
  getCurrentUser() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.CURRENT_USER)
      return raw ? JSON.parse(raw) : INITIAL_SEED.users[1]
    } catch {
      return INITIAL_SEED.users[1]
    }
  },

  setCurrentUser(user) {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user))
    window.dispatchEvent(new Event('onefacility_auth_changed'))
  },

  getAllUsers() {
    return INITIAL_SEED.users
  },

  // BUILDINGS
  async getBuildings() {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase.from('buildings').select('*')
      if (!error && data?.length) return data
    }
    return getStore(STORAGE_KEYS.BUILDINGS)
  },

  async getBuildingById(id) {
    const buildings = await this.getBuildings()
    return buildings.find((b) => b.id === id) || null
  },

  // FLOORS
  async getFloors(buildingId = null) {
    if (isSupabaseConfigured()) {
      let query = supabase.from('floors').select('*')
      if (buildingId) query = query.eq('building_id', buildingId)
      const { data, error } = await query
      if (!error && data?.length) return data
    }
    const floors = getStore(STORAGE_KEYS.FLOORS)
    return buildingId ? floors.filter((f) => f.building_id === buildingId) : floors
  },

  // FACILITIES
  async getFacilities(filters = {}) {
    if (isSupabaseConfigured()) {
      let query = supabase.from('facilities').select('*')
      if (filters.buildingId) query = query.eq('building_id', filters.buildingId)
      if (filters.floorId) query = query.eq('floor_id', filters.floorId)
      if (filters.category && filters.category !== 'all') query = query.eq('category', filters.category)
      const { data, error } = await query
      if (!error && data?.length) return data
    }

    let list = getStore(STORAGE_KEYS.FACILITIES)
    if (filters.buildingId) list = list.filter((f) => f.building_id === filters.buildingId)
    if (filters.floorId) list = list.filter((f) => f.floor_id === filters.floorId)
    if (filters.category && filters.category !== 'all') list = list.filter((f) => f.category === filters.category)
    if (filters.search) {
      const term = filters.search.toLowerCase()
      list = list.filter(
        (f) =>
          f.name.toLowerCase().includes(term) ||
          f.facility_code.toLowerCase().includes(term) ||
          f.description.toLowerCase().includes(term)
      )
    }
    return list
  },

  async getFacilityById(id) {
    const facilities = await this.getFacilities()
    return facilities.find((f) => f.id === id) || null
  },

  // RESERVATIONS
  async getReservations(filters = {}) {
    if (isSupabaseConfigured()) {
      let query = supabase.from('reservations').select('*')
      if (filters.facilityId) query = query.eq('facility_id', filters.facilityId)
      if (filters.requesterId) query = query.eq('requester_id', filters.requesterId)
      if (filters.status) query = query.eq('status', filters.status)
      const { data, error } = await query
      if (!error && data) return data
    }

    let list = getStore(STORAGE_KEYS.RESERVATIONS)
    if (filters.facilityId) list = list.filter((r) => r.facility_id === filters.facilityId)
    if (filters.requesterId) list = list.filter((r) => r.requester_id === filters.requesterId)
    if (filters.organizationId) list = list.filter((r) => r.organization_id === filters.organizationId)
    if (filters.status && filters.status !== 'all') list = list.filter((r) => r.status === filters.status)
    return list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  },

  // Create Reservation with Conflict Checking
  async createReservation(payload) {
    const reservations = getStore(STORAGE_KEYS.RESERVATIONS)
    const maintenance = getStore(STORAGE_KEYS.MAINTENANCE)

    const newStart = new Date(payload.start_datetime).getTime()
    const newEnd = new Date(payload.end_datetime).getTime()

    if (newEnd <= newStart) {
      throw new Error('End time must be after start time.')
    }

    // 1. Check Approved Conflicts
    const conflict = reservations.find((r) => {
      if (r.facility_id !== payload.facility_id || r.status !== 'approved') return false
      const exStart = new Date(r.start_datetime).getTime()
      const exEnd = new Date(r.end_datetime).getTime()
      return Math.max(newStart, exStart) < Math.min(newEnd, exEnd)
    })

    if (conflict) {
      throw new Error(`Schedule conflict: Another approved reservation ("${conflict.title}") exists for this time slot.`)
    }

    // 2. Check Maintenance Conflicts
    const maintConflict = maintenance.find((m) => {
      if (m.facility_id !== payload.facility_id) return false
      const mStart = new Date(m.start_datetime).getTime()
      const mEnd = new Date(m.end_datetime).getTime()
      return Math.max(newStart, mStart) < Math.min(newEnd, mEnd)
    })

    if (maintConflict) {
      throw new Error(`Facility Unavailable: Facility is undergoing "${maintConflict.title}" at this time.`)
    }

    const newReservation = {
      id: `res-${Date.now()}`,
      ...payload,
      status: 'pending',
      rejection_reason: null,
      reviewed_by: null,
      reviewed_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    reservations.unshift(newReservation)
    setStore(STORAGE_KEYS.RESERVATIONS, reservations)

    // Notify user
    this.addNotification({
      user_id: payload.requester_id,
      title: 'Reservation Request Submitted',
      message: `Your reservation request for "${payload.title}" has been submitted and is awaiting administrator review.`,
      notification_type: 'reservation_submitted',
      related_reservation_id: newReservation.id,
    })

    return newReservation
  },

  // Approve Reservation with transactional re-check
  async approveReservation(reservationId, adminId) {
    const reservations = getStore(STORAGE_KEYS.RESERVATIONS)
    const target = reservations.find((r) => r.id === reservationId)
    if (!target) throw new Error('Reservation not found.')
    if (target.status !== 'pending') throw new Error('Only pending reservations can be approved.')

    // Conflict Recheck
    const tStart = new Date(target.start_datetime).getTime()
    const tEnd = new Date(target.end_datetime).getTime()

    const conflict = reservations.find((r) => {
      if (r.id === target.id || r.facility_id !== target.facility_id || r.status !== 'approved') return false
      const exStart = new Date(r.start_datetime).getTime()
      const exEnd = new Date(r.end_datetime).getTime()
      return Math.max(tStart, exStart) < Math.min(tEnd, exEnd)
    })

    if (conflict) {
      throw new Error(`Cannot approve: Overlaps with already approved reservation "${conflict.title}".`)
    }

    target.status = 'approved'
    target.reviewed_by = adminId
    target.reviewed_at = new Date().toISOString()
    target.updated_at = new Date().toISOString()

    setStore(STORAGE_KEYS.RESERVATIONS, reservations)

    // Add In-App Notification to requester
    this.addNotification({
      user_id: target.requester_id,
      title: 'Reservation Approved! 🎉',
      message: `Your reservation "${target.title}" has been approved by the Facility Administrator.`,
      notification_type: 'reservation_approved',
      related_reservation_id: target.id,
    })

    return target
  },

  // Reject Reservation
  async rejectReservation(reservationId, adminId, reason) {
    const reservations = getStore(STORAGE_KEYS.RESERVATIONS)
    const target = reservations.find((r) => r.id === reservationId)
    if (!target) throw new Error('Reservation not found.')

    target.status = 'rejected'
    target.rejection_reason = reason || 'No specific reason provided.'
    target.reviewed_by = adminId
    target.reviewed_at = new Date().toISOString()
    target.updated_at = new Date().toISOString()

    setStore(STORAGE_KEYS.RESERVATIONS, reservations)

    // Add Notification
    this.addNotification({
      user_id: target.requester_id,
      title: 'Reservation Request Declined',
      message: `Your reservation "${target.title}" was declined: ${target.rejection_reason}`,
      notification_type: 'reservation_rejected',
      related_reservation_id: target.id,
    })

    return target
  },

  // Cancel reservation
  async cancelReservation(reservationId, userId) {
    const reservations = getStore(STORAGE_KEYS.RESERVATIONS)
    const target = reservations.find((r) => r.id === reservationId)
    if (!target) throw new Error('Reservation not found.')

    target.status = 'cancelled'
    target.updated_at = new Date().toISOString()
    setStore(STORAGE_KEYS.RESERVATIONS, reservations)

    this.addNotification({
      user_id: userId,
      title: 'Reservation Cancelled',
      message: `You have successfully cancelled "${target.title}".`,
      notification_type: 'reservation_cancelled',
      related_reservation_id: target.id,
    })

    return target
  },

  // ORGANIZATIONS & ACTIVITIES
  async getOrganizations() {
    return getStore(STORAGE_KEYS.ORGANIZATIONS)
  },

  async getActivities(orgId = null) {
    const acts = getStore(STORAGE_KEYS.ACTIVITIES)
    return orgId ? acts.filter((a) => a.organization_id === orgId) : acts
  },

  async createActivity(payload) {
    const acts = getStore(STORAGE_KEYS.ACTIVITIES)
    const newAct = {
      id: `act-${Date.now()}`,
      ...payload,
      status: 'planned',
      created_at: new Date().toISOString(),
    }
    acts.unshift(newAct)
    setStore(STORAGE_KEYS.ACTIVITIES, acts)
    return newAct
  },

  // NOTIFICATIONS
  async getNotifications(userId) {
    const notifs = getStore(STORAGE_KEYS.NOTIFICATIONS)
    return notifs.filter((n) => n.user_id === userId).sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  },

  addNotification(notif) {
    const list = getStore(STORAGE_KEYS.NOTIFICATIONS)
    list.unshift({
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      is_read: false,
      created_at: new Date().toISOString(),
      ...notif,
    })
    setStore(STORAGE_KEYS.NOTIFICATIONS, list)
    window.dispatchEvent(new Event('onefacility_notif_updated'))
  },

  async markNotificationRead(id) {
    const list = getStore(STORAGE_KEYS.NOTIFICATIONS)
    const target = list.find((n) => n.id === id)
    if (target) {
      target.is_read = true
      setStore(STORAGE_KEYS.NOTIFICATIONS, list)
    }
  },

  // RESET TO DEFAULT SEED
  resetData() {
    localStorage.clear()
    initializeLocalStore()
    window.location.reload()
  },
}
