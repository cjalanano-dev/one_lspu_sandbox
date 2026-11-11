// Shared TypeScript types for ONE Facility

export type UserRole = 'student' | 'faculty' | 'officer' | 'facility_admin' | 'system_admin'
export type AccountStatus = 'active' | 'suspended' | 'pending'

export interface User {
  id: string
  email: string
  full_name: string
  avatar_url?: string | null
  primary_role: UserRole
  account_status: AccountStatus
  department?: string | null
  student_or_employee_id?: string | null
  organization_id?: string | null
  organization_role?: string | null
}
export type FacilityCategory =
  | 'auditorium'
  | 'lecture_hall'
  | 'laboratory'
  | 'conference_room'
  | 'multipurpose'
  | 'sports_gym'
  | 'study_lounge'
  | 'outdoor_field'
export type FacilityStatus = 'available' | 'reserved' | 'occupied' | 'maintenance' | 'unavailable'
export type ReservationStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'cancelled'
  | 'completed'
  | 'no_show'
export type OrgStatus = 'active' | 'inactive' | 'probationary'
export type ActivityStatus = 'draft' | 'planned' | 'approved' | 'ongoing' | 'completed' | 'cancelled'
export type NotificationType =
  | 'reservation_submitted'
  | 'reservation_approved'
  | 'reservation_rejected'
  | 'reservation_cancelled'
  | 'maintenance_alert'
  | 'info'
export type MembershipStatus = 'active' | 'pending' | 'inactive'
export type OrgRole = 'president' | 'vice_president' | 'secretary' | 'treasurer' | 'officer' | 'member'

export interface Profile {
  id: string
  full_name: string
  email: string
  avatar_url?: string | null
  primary_role: UserRole
  account_status: AccountStatus
  department?: string | null
  student_or_employee_id?: string | null
  created_at: string
  updated_at: string
}

export interface Organization {
  id: string
  name: string
  acronym: string
  description?: string | null
  logo_url?: string | null
  status: OrgStatus
  created_at: string
}

export interface OrganizationMember {
  id: string
  organization_id: string
  user_id: string
  organization_role: OrgRole
  membership_status: MembershipStatus
  created_at: string
}

export interface Building {
  id: string
  name: string
  code: string
  description?: string | null
  location_description?: string | null
  map_coordinates?: any
  total_floors: number
  image_url?: string | null
  created_at: string
}

export interface Floor {
  id: string
  building_id: string
  name: string
  floor_number: number
  floor_plan_url?: string | null
  svg_data?: string | null
  created_at: string
}

export interface Facility {
  id: string
  building_id: string
  floor_id: string
  name: string
  facility_code: string
  category: FacilityCategory
  description?: string | null
  capacity: number
  equipment: string[]
  map_position?: any
  reservation_enabled: boolean
  status: FacilityStatus
  image_url?: string | null
  rules?: string | null
  created_at: string
  updated_at: string
}

export interface FacilitySchedule {
  id: string
  facility_id: string
  day_of_week: number
  opening_time: string
  closing_time: string
  is_available: boolean
}

export interface MaintenancePeriod {
  id: string
  facility_id: string
  title: string
  description?: string | null
  start_datetime: string
  end_datetime: string
  created_by?: string | null
  created_at: string
}

export interface Activity {
  id: string
  organization_id: string
  title: string
  description?: string | null
  activity_date: string
  expected_attendees: number
  status: ActivityStatus
  created_by?: string | null
  created_at: string
}

export interface Reservation {
  id: string
  facility_id: string
  requester_id: string
  organization_id?: string | null
  activity_id?: string | null
  title: string
  purpose: string
  start_datetime: string
  end_datetime: string
  attendee_count: number
  requested_equipment: string[]
  status: ReservationStatus
  rejection_reason?: string | null
  reviewed_by?: string | null
  reviewed_at?: string | null
  created_at: string
  updated_at: string
}

export interface Notification {
  id: string
  user_id: string
  title: string
  message: string
  notification_type: NotificationType
  related_reservation_id?: string | null
  is_read: boolean
  created_at: string
}

export interface AuditLog {
  id: string
  actor_id?: string | null
  action: string
  entity_type: string
  entity_id?: string | null
  details?: any
  created_at: string
}

export interface FacilityAdministrator {
  id: string
  facility_id: string
  user_id: string
  created_at: string
}

export interface MapPosition {
  svg_id?: string
  x: number
  y: number
  width: number
  height: number
  polygon?: number[][]
  label?: string
}

export interface MapCoordinates {
  x: number
  y: number
  zone?: string
  campus_zone?: string
}
