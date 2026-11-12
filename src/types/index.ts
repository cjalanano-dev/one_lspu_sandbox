// Shared TypeScript types for ONE LSPU

export type UserRole =
  | 'student'
  | 'faculty'
  | 'officer'
  | 'adviser'
  | 'college_dean'
  | 'osas'
  | 'campus_director'
  | 'university_president'
  | 'osa_staff'
  | 'facility_admin'
  | 'system_admin'
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
  | 'proposal_action_required'
  | 'proposal_progress'
  | 'proposal_returned'
  | 'proposal_approved'
  | 'proposal_rejected'
  | 'proposal_overdue'
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
  college?: string | null
  org_type?: 'college_mother' | 'program_sub_org' | 'university_wide' | string | null
  parent_org_id?: string | null
  adviser_id?: string | null
  created_at: string
  /**
   * The current user's role in this organization, populated by
   * dataStore.getMyOrganizations. Mirrors public.is_org_officer(), which only
   * lets 'president' and 'secretary' file and manage proposals.
   */
  organization_role?: string | null
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
  related_proposal_id?: string | null
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

// ---------------------------------------------------------------------------
// Event proposals & approval routing
// ---------------------------------------------------------------------------
export type ProposalStatus = 'draft' | 'in_review' | 'returned' | 'approved' | 'rejected' | 'cancelled'
export type EventType =
  | 'academic'
  | 'seminar'
  | 'competition'
  | 'social'
  | 'outreach'
  | 'sports'
  | 'meeting'
  | 'other'
export type ApprovalStepRole =
  | 'adviser'
  | 'college_dean'
  | 'osas'
  | 'campus_director'
  | 'university_president'
  | 'osa_staff'
  | 'facility_admin'
export type ApprovalStepStatus = 'waiting' | 'pending' | 'approved' | 'returned' | 'rejected'
export type FundSource = 'org_funds' | 'student_fees' | 'sponsorship' | 'school_subsidy' | 'other'
export type AttachmentType =
  | 'proposal_letter'
  | 'program_flow'
  | 'budget_breakdown'
  | 'parental_waiver'
  | 'other'
export type ProposalAction = 'approve' | 'return' | 'reject'

export interface Proposal {
  id: string
  reference_no?: string | null
  organization_id: string
  submitted_by: string
  title: string
  event_type: EventType
  description?: string | null
  objectives?: string | null
  start_datetime?: string | null
  end_datetime?: string | null
  expected_attendees: number
  facility_id?: string | null
  requested_equipment: string[]
  reservation_id?: string | null
  status: ProposalStatus
  current_step?: number | null
  revision: number
  submitted_at?: string | null
  decided_at?: string | null
  created_at: string
  updated_at: string
}

export interface BudgetItem {
  id?: string
  proposal_id?: string
  description: string
  quantity: number
  unit_cost: number
  source_of_funds: FundSource
  position?: number
}

export interface ProposalAttachment {
  id: string
  proposal_id: string
  doc_type: AttachmentType
  file_name: string
  storage_path: string
  size_bytes?: number | null
  uploaded_by?: string | null
  created_at: string
}

export interface ApprovalStep {
  id: string
  proposal_id: string
  step_order: number
  step_role: ApprovalStepRole
  label: string
  status: ApprovalStepStatus
  acted_by?: string | null
  acted_at?: string | null
  comment?: string | null
  due_at?: string | null
  signature?: string | null
}

export interface ProposalEvent {
  id: string
  proposal_id: string
  actor_id?: string | null
  action: string
  from_status?: string | null
  to_status?: string | null
  step_order?: number | null
  revision?: number | null
  comment?: string | null
  created_at: string
}

export interface ProposalPacket {
  proposal: Proposal
  organization: Organization | null
  facility: Facility | null
  budget: BudgetItem[]
  attachments: ProposalAttachment[]
  steps: ApprovalStep[]
  events: ProposalEvent[]
  people: Record<string, { full_name: string; primary_role: string }>
}
