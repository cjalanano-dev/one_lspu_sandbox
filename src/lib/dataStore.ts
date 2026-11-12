import { supabase } from './supabase'
import type {
  Building,
  Floor,
  Facility,
  FacilitySchedule,
  Reservation,
  Organization,
  Activity,
  MaintenancePeriod,
  Notification,
  User,
} from '../types'

// Map Supabase facility row to our Facility type
function mapFacility(row: any): Facility {
  return {
    id: row.id,
    building_id: row.building_id,
    floor_id: row.floor_id,
    name: row.name,
    facility_code: row.facility_code,
    category: row.category,
    description: row.description ?? null,
    capacity: row.capacity,
    equipment: row.equipment || [],
    map_position: row.map_position ?? null,
    reservation_enabled: row.reservation_enabled ?? true,
    status: row.status,
    image_url: row.image_url ?? null,
    rules: row.rules ?? null,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }
}

// Map Supabase reservation row to our Reservation type
function mapReservation(row: any): Reservation {
  return {
    id: row.id,
    facility_id: row.facility_id,
    requester_id: row.requester_id,
    organization_id: row.organization_id ?? null,
    activity_id: row.activity_id ?? null,
    title: row.title,
    purpose: row.purpose,
    start_datetime: row.start_datetime,
    end_datetime: row.end_datetime,
    attendee_count: row.attendee_count,
    requested_equipment: row.requested_equipment || [],
    status: row.status,
    rejection_reason: row.rejection_reason ?? null,
    reviewed_by: row.reviewed_by ?? null,
    reviewed_at: row.reviewed_at ?? null,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }
}

// Map Supabase building row to our Building type
function mapBuilding(row: any): Building {
  return {
    id: row.id,
    name: row.name,
    code: row.code,
    description: row.description ?? null,
    location_description: row.location_description ?? null,
    map_coordinates: row.map_coordinates ?? null,
    total_floors: row.total_floors,
    image_url: row.image_url ?? null,
    created_at: row.created_at,
  }
}

// Map Supabase floor row to our Floor type
function mapFloor(row: any): Floor {
  return {
    id: row.id,
    building_id: row.building_id,
    name: row.name,
    floor_number: row.floor_number,
    floor_plan_url: row.floor_plan_url ?? null,
    svg_data: row.svg_data ?? null,
    created_at: row.created_at,
  }
}

const ORG_NAME_OVERRIDES: Record<string, string> = {
  OCTA: 'Organization for Computing and Technology Advancements',
  ALGO: 'Association for Leadership, Governance, and Organization',
  BSIT: 'BSIT',
  COESC: 'College of Engineering Student Council',
}

// Map Supabase organization row to our Organization type
function mapOrganization(row: any): Organization {
  const acronym = row.acronym ? String(row.acronym).toUpperCase() : row.acronym
  return {
    id: row.id,
    name: (acronym && ORG_NAME_OVERRIDES[acronym]) || row.name,
    acronym: row.acronym,
    description: row.description ?? null,
    logo_url: row.logo_url ?? null,
    status: row.status,
    college: row.college ?? null,
    org_type: row.org_type ?? null,
    parent_org_id: row.parent_org_id ?? null,
    adviser_id: row.adviser_id ?? null,
    created_at: row.created_at,
    organization_role: row.organization_role ?? null,
  }
}

/**
 * The membership roles that may file and manage event proposals.
 * Mirrors public.is_org_officer() in the database.
 */
export const PROPOSAL_FILING_ROLES = ['president', 'secretary'] as const

/** True when the user may file proposals for this organization. */
export function canFileForOrganization(org: Pick<Organization, 'organization_role'>): boolean {
  return !!org.organization_role && (PROPOSAL_FILING_ROLES as readonly string[]).includes(org.organization_role)
}

// Map Supabase activity row to our Activity type
function mapActivity(row: any): Activity {
  return {
    id: row.id,
    organization_id: row.organization_id,
    title: row.title,
    description: row.description ?? null,
    activity_date: row.activity_date,
    expected_attendees: row.expected_attendees,
    status: row.status,
    created_by: row.created_by ?? null,
    created_at: row.created_at,
  }
}

// Map Supabase maintenance row to our MaintenancePeriod type
function mapMaintenance(row: any): MaintenancePeriod {
  return {
    id: row.id,
    facility_id: row.facility_id,
    title: row.title,
    description: row.description ?? null,
    start_datetime: row.start_datetime,
    end_datetime: row.end_datetime,
    created_by: row.created_by ?? null,
    created_at: row.created_at,
  }
}

// Map Supabase notification row to our Notification type
function mapNotification(row: any): Notification {
  return {
    id: row.id,
    user_id: row.user_id,
    title: row.title,
    message: row.message,
    notification_type: row.notification_type,
    related_reservation_id: row.related_reservation_id ?? null,
    is_read: row.is_read,
    created_at: row.created_at,
  }
}

// Map Supabase profiles row to our User type
function mapProfile(row: any): User {
  return {
    id: row.id,
    email: row.email,
    full_name: row.full_name,
    avatar_url: row.avatar_url ?? undefined,
    primary_role: row.primary_role,
    account_status: row.account_status,
    department: row.department ?? undefined,
    student_or_employee_id: row.student_or_employee_id ?? undefined,
    organization_id: undefined,
    organization_role: undefined,
  }
}

export const dataStore = {
  // PROFILES (real Supabase auth users)
  async getProfiles(): Promise<User[]> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at')
    if (error) throw new Error(error.message)
    return (data ?? []).map(mapProfile)
  },

  async getProfile(id: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single()
    if (error || !data) return null
    return mapProfile(data)
  },

  // BUILDINGS
  async getBuildings(): Promise<Building[]> {
    const { data, error } = await supabase
      .from('buildings')
      .select('*')
      .order('created_at')
    if (error) throw new Error(error.message)
    return (data ?? []).map(mapBuilding)
  },

  async getBuildingById(id: string): Promise<Building | null> {
    const { data, error } = await supabase
      .from('buildings')
      .select('*')
      .eq('id', id)
      .single()
    if (error || !data) return null
    return mapBuilding(data)
  },

  // FLOORS
  async getFloors(buildingId?: string | null): Promise<Floor[]> {
    let query = supabase.from('floors').select('*').order('floor_number')
    if (buildingId) query = query.eq('building_id', buildingId)
    const { data, error } = await query
    if (error) throw new Error(error.message)
    return (data ?? []).map(mapFloor)
  },

  // FACILITIES
  async getFacilities(filters: {
    buildingId?: string
    floorId?: string
    category?: string
    search?: string
  } = {}): Promise<Facility[]> {
    let query = supabase.from('facilities').select('*').order('name')
    if (filters.buildingId) query = query.eq('building_id', filters.buildingId)
    if (filters.floorId) query = query.eq('floor_id', filters.floorId)
    if (filters.category && filters.category !== 'all') {
      query = query.eq('category', filters.category)
    }
    const { data, error } = await query
    if (error) throw new Error(error.message)
    let list = (data ?? []).map(mapFacility)
    if (filters.search) {
      const term = filters.search.toLowerCase()
      list = list.filter(
        (f) =>
          f.name.toLowerCase().includes(term) ||
          f.facility_code.toLowerCase().includes(term) ||
          f.description?.toLowerCase().includes(term),
      )
    }
    return list
  },

  async getFacilityById(id: string): Promise<Facility | null> {
    const { data, error } = await supabase
      .from('facilities')
      .select('*')
      .eq('id', id)
      .single()
    if (error || !data) return null
    return mapFacility(data)
  },

  // RESERVATIONS
  async getReservations(filters: {
    facilityId?: string
    requesterId?: string
    organizationId?: string
    status?: string
  } = {}): Promise<Reservation[]> {
    let query = supabase
      .from('reservations')
      .select('*')
      .order('created_at', { ascending: false })
    if (filters.facilityId) query = query.eq('facility_id', filters.facilityId)
    if (filters.requesterId) query = query.eq('requester_id', filters.requesterId)
    if (filters.organizationId) query = query.eq('organization_id', filters.organizationId)
    if (filters.status && filters.status !== 'all') query = query.eq('status', filters.status)
    const { data, error } = await query
    if (error) throw new Error(error.message)
    return (data ?? []).map(mapReservation)
  },

  // Create Reservation with Conflict Checking
  async createReservation(payload: {
    facility_id: string
    requester_id: string
    organization_id?: string | null
    activity_id?: string | null
    title: string
    purpose: string
    start_datetime: string
    end_datetime: string
    attendee_count: number
    requested_equipment?: string[]
  }): Promise<Reservation> {
    const reservations = await this.getReservations()
    const maintenance = await this.getMaintenance()

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
      throw new Error(
        `Schedule conflict: Another approved reservation ("${conflict.title}") exists for this time slot.`,
      )
    }

    // 2. Check Maintenance Conflicts
    const maintConflict = maintenance.find((m) => {
      if (m.facility_id !== payload.facility_id) return false
      const mStart = new Date(m.start_datetime).getTime()
      const mEnd = new Date(m.end_datetime).getTime()
      return Math.max(newStart, mStart) < Math.min(newEnd, mEnd)
    })

    if (maintConflict) {
      throw new Error(
        `Facility Unavailable: Facility is undergoing "${maintConflict.title}" at this time.`,
      )
    }

    const { data, error } = await supabase
      .from('reservations')
      .insert([
        {
          facility_id: payload.facility_id,
          requester_id: payload.requester_id,
          organization_id: payload.organization_id,
          activity_id: payload.activity_id,
          title: payload.title,
          purpose: payload.purpose,
          start_datetime: payload.start_datetime,
          end_datetime: payload.end_datetime,
          attendee_count: payload.attendee_count,
          requested_equipment: payload.requested_equipment || [],
          status: 'pending',
        },
      ])
      .select()

    if (error) throw new Error(error.message || 'Failed to create reservation')
    if (!data || data.length === 0) throw new Error('The reservation could not be created.')
    const created = mapReservation(data[0])

    await this.addNotification({
      user_id: payload.requester_id,
      title: 'Reservation Request Submitted',
      message: `Your reservation request for "${payload.title}" has been submitted and is awaiting administrator review.`,
      notification_type: 'reservation_submitted',
      related_reservation_id: created.id,
    })

    return created
  },

  // Approve Reservation (server-side transactional check via approve_reservation)
  async approveReservation(reservationId: string, adminId: string): Promise<Reservation> {
    const { data, error } = await supabase
      .rpc('approve_reservation', { target_reservation_id: reservationId })
    if (error) throw new Error(error.message)

    const result = data as any
    if (!result.success) {
      throw new Error(result.error || 'Failed to approve reservation')
    }

    const { data: resRows, error: resError } = await supabase
      .from('reservations')
      .select('*')
      .eq('id', reservationId)
    if (resError) throw new Error(resError.message)
    if (!resRows || resRows.length === 0) throw new Error('Approved reservation not found')
    return mapReservation(resRows[0])
  },

  // Reject Reservation
  async rejectReservation(
    reservationId: string,
    adminId: string,
    reason: string,
  ): Promise<Reservation> {
    const reservations = await this.getReservations()
    const target = reservations.find((r) => r.id === reservationId)
    if (!target) throw new Error('Reservation not found.')
    if (target.status !== 'pending') throw new Error('Only pending reservations can be rejected.')

    const { data, error } = await supabase
      .from('reservations')
      .update({
        status: 'rejected',
        rejection_reason: reason || 'No specific reason provided.',
        reviewed_by: adminId,
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', reservationId)
      .select()

    if (error) throw new Error(error.message)
    if (!data || data.length === 0) {
      throw new Error('Reservation not found, or it is no longer pending.')
    }
    const rejected = mapReservation(data[0])

    await this.addNotification({
      user_id: target.requester_id,
      title: 'Reservation Request Declined',
      message: `Your reservation "${target.title}" was declined: ${rejected.rejection_reason}`,
      notification_type: 'reservation_rejected',
      related_reservation_id: target.id,
    })

    return rejected
  },

  // Cancel reservation
  async cancelReservation(reservationId: string, userId: string): Promise<Reservation> {
    const reservations = await this.getReservations()
    const target = reservations.find((r) => r.id === reservationId)
    if (!target) throw new Error('Reservation not found.')

    const { data, error } = await supabase
      .from('reservations')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString(),
      })
      .eq('id', reservationId)
      .select()

    if (error) throw new Error(error.message)
    if (!data || data.length === 0) throw new Error('Reservation not found.')
    const cancelled = mapReservation(data[0])

    await this.addNotification({
      user_id: userId,
      title: 'Reservation Cancelled',
      message: `You have successfully cancelled "${cancelled.title}".`,
      notification_type: 'reservation_cancelled',
      related_reservation_id: target.id,
    })

    return cancelled
  },

  // ORGANIZATIONS & ACTIVITIES
  async getOrganizations(): Promise<Organization[]> {
    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .order('name')
    if (error) throw new Error(error.message)
    return (data ?? []).map(mapOrganization)
  },

  async getActivities(orgId?: string | null): Promise<Activity[]> {
    let query = supabase.from('activities').select('*').order('created_at', { ascending: false })
    if (orgId) query = query.eq('organization_id', orgId)
    const { data, error } = await query
    if (error) throw new Error(error.message)
    return (data ?? []).map(mapActivity)
  },

  async createActivity(payload: {
    organization_id: string
    title: string
    description?: string
    activity_date: string
    expected_attendees: number
    created_by: string
  }): Promise<Activity> {
    const { data, error } = await supabase
      .from('activities')
      .insert([
        {
          organization_id: payload.organization_id,
          title: payload.title,
          description: payload.description,
          activity_date: payload.activity_date,
          expected_attendees: payload.expected_attendees,
          status: 'planned',
          created_by: payload.created_by,
        },
      ])
      .select()

    if (error) throw new Error(error.message || 'Failed to create activity')
    if (!data || data.length === 0) throw new Error('The activity could not be created.')
    return mapActivity(data[0])
  },

  // MAINTENANCE
  async getMaintenance(): Promise<MaintenancePeriod[]> {
    const { data, error } = await supabase
      .from('maintenance_periods')
      .select('*')
    if (error) throw new Error(error.message)
    return (data ?? []).map(mapMaintenance)
  },

  // FACILITY SCHEDULES (operating hours per day of week)
  async getSchedules(facilityId?: string | null): Promise<FacilitySchedule[]> {
    let query = supabase.from('facility_schedules').select('*').order('day_of_week')
    if (facilityId) query = query.eq('facility_id', facilityId)
    const { data, error } = await query
    if (error) throw new Error(error.message)
    return (data ?? []).map((row) => ({
      id: row.id,
      facility_id: row.facility_id,
      day_of_week: row.day_of_week,
      opening_time: row.opening_time,
      closing_time: row.closing_time,
      is_available: row.is_available,
    }))
  },

  // NOTIFICATIONS
  async getNotifications(userId: string): Promise<Notification[]> {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    if (error) throw new Error(error.message)
    return (data ?? []).map(mapNotification)
  },

  async addNotification(notif: {
    user_id: string
    title: string
    message: string
    notification_type: string
    related_reservation_id?: string
  }) {
    const { error } = await supabase.from('notifications').insert([
      {
        user_id: notif.user_id,
        title: notif.title,
        message: notif.message,
        notification_type: notif.notification_type,
        related_reservation_id: notif.related_reservation_id ?? null,
        is_read: false,
      },
    ])
    if (error) throw new Error(error.message)
  },

  async markNotificationRead(id: string) {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id)
    if (error) throw new Error(error.message)
  },

  // ORGANIZATION MEMBERSHIPS (real, from organization_members table)
  async getMyOrganizations(userId?: string | null): Promise<Organization[]> {
    if (!userId) return []
    const { data, error } = await supabase
      .from('organization_members')
      .select('organization_id, organization_role')
      .eq('user_id', userId)
      .eq('membership_status', 'active')
    if (error) throw new Error(error.message)
    const roleByOrg = new Map<string, string>(
      (data ?? []).map((row) => [row.organization_id as string, row.organization_role as string]),
    )
    if (roleByOrg.size === 0) return []
    const { data: orgs, error: orgError } = await supabase
      .from('organizations')
      .select('*')
      .order('name')
    if (orgError) throw new Error(orgError.message)
    return (orgs ?? [])
      .filter((o) => roleByOrg.has(o.id))
      .map((o) => mapOrganization({ ...o, organization_role: roleByOrg.get(o.id) }))
  },

  /** Organizations the user may file and manage event proposals for. */
  async getFilingOrganizations(userId?: string | null): Promise<Organization[]> {
    const orgs = await this.getMyOrganizations(userId)
    return orgs.filter(canFileForOrganization)
  },

  /** Organizations where the given user is the designated faculty adviser. */
  async getAdvisedOrganizations(userId?: string | null): Promise<Organization[]> {
    if (!userId) return []
    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .eq('adviser_id', userId)
      .order('name')
    if (error) throw new Error(error.message)
    return (data ?? []).map(mapOrganization)
  },

  /** Check if the user is an active president or secretary of an organization */
  async isOrgExecutive(userId: string | null | undefined, orgId?: string | null): Promise<boolean> {
    if (!userId) return false
    let q = supabase
      .from('organization_members')
      .select('id, organization_role')
      .eq('user_id', userId)
      .eq('membership_status', 'active')
      .in('organization_role', ['president', 'secretary'])
    if (orgId) {
      q = q.eq('organization_id', orgId)
    }
    const { data, error } = await q
    if (error || !data) return false
    return data.length > 0
  },
}
