-- ONE Facility Database Schema & Migrations
-- Compatible with Supabase PostgreSQL

-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES (Extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  avatar_url TEXT,
  primary_role TEXT NOT NULL DEFAULT 'student' CHECK (primary_role IN ('student', 'faculty', 'officer', 'facility_admin', 'system_admin')),
  account_status TEXT NOT NULL DEFAULT 'active' CHECK (account_status IN ('active', 'suspended', 'pending')),
  department TEXT,
  student_or_employee_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. ORGANIZATIONS
CREATE TABLE IF NOT EXISTS public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  acronym TEXT NOT NULL,
  description TEXT,
  logo_url TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'probationary')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. ORGANIZATION MEMBERS
CREATE TABLE IF NOT EXISTS public.organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  organization_role TEXT NOT NULL DEFAULT 'member' CHECK (organization_role IN ('president', 'vice_president', 'secretary', 'treasurer', 'officer', 'member')),
  membership_status TEXT NOT NULL DEFAULT 'active' CHECK (membership_status IN ('active', 'pending', 'inactive')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  UNIQUE(organization_id, user_id)
);

-- 4. BUILDINGS
CREATE TABLE IF NOT EXISTS public.buildings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  location_description TEXT,
  map_coordinates JSONB, -- { x: number, y: number, campus_zone: string }
  total_floors INT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 5. FLOORS
CREATE TABLE IF NOT EXISTS public.floors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  building_id UUID NOT NULL REFERENCES public.buildings(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  floor_number INT NOT NULL,
  floor_plan_url TEXT,
  svg_data TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  UNIQUE(building_id, floor_number)
);

-- 6. FACILITIES
CREATE TABLE IF NOT EXISTS public.facilities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  building_id UUID NOT NULL REFERENCES public.buildings(id) ON DELETE CASCADE,
  floor_id UUID NOT NULL REFERENCES public.floors(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  facility_code TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL CHECK (category IN ('auditorium', 'lecture_hall', 'laboratory', 'conference_room', 'multipurpose', 'sports_gym', 'study_lounge', 'outdoor_field')),
  description TEXT,
  capacity INT NOT NULL DEFAULT 1,
  equipment JSONB DEFAULT '[]'::jsonb, -- Array of string equipment or structured objects
  map_position JSONB, -- { svg_id, x, y, width, height, polygon }
  reservation_enabled BOOLEAN NOT NULL DEFAULT true,
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'reserved', 'occupied', 'maintenance', 'unavailable')),
  image_url TEXT,
  rules TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 7. FACILITY SCHEDULES (Default weekly hours)
CREATE TABLE IF NOT EXISTS public.facility_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id UUID NOT NULL REFERENCES public.facilities(id) ON DELETE CASCADE,
  day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Sunday, 6=Saturday
  opening_time TIME NOT NULL DEFAULT '08:00:00',
  closing_time TIME NOT NULL DEFAULT '20:00:00',
  is_available BOOLEAN NOT NULL DEFAULT true,
  UNIQUE(facility_id, day_of_week)
);

-- 8. MAINTENANCE PERIODS
CREATE TABLE IF NOT EXISTS public.maintenance_periods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id UUID NOT NULL REFERENCES public.facilities(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  start_datetime TIMESTAMPTZ NOT NULL,
  end_datetime TIMESTAMPTZ NOT NULL,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CHECK (start_datetime < end_datetime)
);

-- 9. ACTIVITIES (Student Organization Events)
CREATE TABLE IF NOT EXISTS public.activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  activity_date DATE NOT NULL,
  expected_attendees INT NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('draft', 'planned', 'approved', 'ongoing', 'completed', 'cancelled')),
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 10. RESERVATIONS
CREATE TABLE IF NOT EXISTS public.reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id UUID NOT NULL REFERENCES public.facilities(id) ON DELETE CASCADE,
  requester_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  activity_id UUID REFERENCES public.activities(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  purpose TEXT NOT NULL,
  start_datetime TIMESTAMPTZ NOT NULL,
  end_datetime TIMESTAMPTZ NOT NULL,
  attendee_count INT NOT NULL DEFAULT 1,
  requested_equipment JSONB DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled', 'completed', 'no_show')),
  rejection_reason TEXT,
  reviewed_by UUID REFERENCES public.profiles(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CHECK (start_datetime < end_datetime)
);

-- 11. NOTIFICATIONS
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  notification_type TEXT NOT NULL DEFAULT 'info' CHECK (notification_type IN ('reservation_submitted', 'reservation_approved', 'reservation_rejected', 'reservation_cancelled', 'maintenance_alert', 'info')),
  related_reservation_id UUID REFERENCES public.reservations(id) ON DELETE SET NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 12. AUDIT LOGS
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 13. FACILITY ADMINISTRATORS ASSIGNMENTS
CREATE TABLE IF NOT EXISTS public.facility_administrators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id UUID NOT NULL REFERENCES public.facilities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  UNIQUE(facility_id, user_id)
);

-- INDEXES FOR PERFORMANCE & CONFLICT LOOKUPS
CREATE INDEX IF NOT EXISTS idx_reservations_facility_time ON public.reservations (facility_id, start_datetime, end_datetime);
CREATE INDEX IF NOT EXISTS idx_reservations_status ON public.reservations (status);
CREATE INDEX IF NOT EXISTS idx_reservations_requester ON public.reservations (requester_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_facility_time ON public.maintenance_periods (facility_id, start_datetime, end_datetime);
CREATE INDEX IF NOT EXISTS idx_facilities_building_floor ON public.facilities (building_id, floor_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications (user_id, is_read);

-- ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.buildings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.floors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.facilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.facility_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.facility_administrators ENABLE ROW LEVEL SECURITY;

-- Helper function to check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND primary_role IN ('facility_admin', 'system_admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Profiles: Public read, user can update self
CREATE POLICY "Profiles readable by authenticated users" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

-- Campus & Facilities: Publicly readable for all authenticated users
CREATE POLICY "Public read for buildings" ON public.buildings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Public read for floors" ON public.floors FOR SELECT TO authenticated USING (true);
CREATE POLICY "Public read for facilities" ON public.facilities FOR SELECT TO authenticated USING (true);
CREATE POLICY "Public read for schedules" ON public.facility_schedules FOR SELECT TO authenticated USING (true);
CREATE POLICY "Public read for maintenance" ON public.maintenance_periods FOR SELECT TO authenticated USING (true);

-- Admins can manage facilities
CREATE POLICY "Admins can manage facilities" ON public.facilities FOR ALL TO authenticated USING (public.is_admin());
CREATE POLICY "Admins can manage buildings" ON public.buildings FOR ALL TO authenticated USING (public.is_admin());
CREATE POLICY "Admins can manage floors" ON public.floors FOR ALL TO authenticated USING (public.is_admin());

-- Organizations: Read by everyone, editable by officers/admins
CREATE POLICY "Organizations are viewable by all" ON public.organizations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Members viewable by all" ON public.organization_members FOR SELECT TO authenticated USING (true);
CREATE POLICY "Activities viewable by all" ON public.activities FOR SELECT TO authenticated USING (true);

-- Reservations: Users can view all reservations (to know availability), can create own, admins can update
CREATE POLICY "Reservations viewable by all authenticated users" ON public.reservations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can create own reservation" ON public.reservations FOR INSERT TO authenticated WITH CHECK (auth.uid() = requester_id);
CREATE POLICY "Requesters can cancel own pending reservation" ON public.reservations FOR UPDATE TO authenticated USING (auth.uid() = requester_id AND status = 'pending');
CREATE POLICY "Admins can update any reservation" ON public.reservations FOR UPDATE TO authenticated USING (public.is_admin());

-- Notifications: Private to recipient
CREATE POLICY "Users view own notifications" ON public.notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users update own notifications" ON public.notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- FUNCTION TO PREVENT CONFLICTS AND APPROVE RESERVATION TRANSACTIONALLY
CREATE OR REPLACE FUNCTION public.approve_reservation(target_reservation_id UUID)
RETURNS JSONB AS $$
DECLARE
  target_res RECORD;
  conflict_count INT;
  maintenance_count INT;
BEGIN
  -- Verify permission
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access denied: only administrators can approve reservations.';
  END IF;

  -- Fetch target reservation
  SELECT * INTO target_res FROM public.reservations WHERE id = target_reservation_id FOR UPDATE;
  
  IF target_res IS NULL THEN
    RAISE EXCEPTION 'Reservation not found.';
  END IF;

  IF target_res.status != 'pending' THEN
    RAISE EXCEPTION 'Only pending reservations can be approved.';
  END IF;

  -- Check conflict with existing approved reservations
  SELECT COUNT(*) INTO conflict_count
  FROM public.reservations
  WHERE facility_id = target_res.facility_id
    AND id != target_res.id
    AND status = 'approved'
    AND (
      (start_datetime, end_datetime) OVERLAPS (target_res.start_datetime, target_res.end_datetime)
    );

  IF conflict_count > 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Conflicting approved reservation already exists for this time slot.');
  END IF;

  -- Check conflict with maintenance periods
  SELECT COUNT(*) INTO maintenance_count
  FROM public.maintenance_periods
  WHERE facility_id = target_res.facility_id
    AND (
      (start_datetime, end_datetime) OVERLAPS (target_res.start_datetime, target_res.end_datetime)
    );

  IF maintenance_count > 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Facility is under scheduled maintenance during this time.');
  END IF;

  -- Approve reservation
  UPDATE public.reservations
  SET status = 'approved',
      reviewed_by = auth.uid(),
      reviewed_at = timezone('utc'::text, now()),
      updated_at = timezone('utc'::text, now())
  WHERE id = target_reservation_id;

  -- Trigger notification
  INSERT INTO public.notifications (user_id, title, message, notification_type, related_reservation_id)
  VALUES (
    target_res.requester_id,
    'Reservation Approved',
    'Your reservation "' || target_res.title || '" has been approved.',
    'reservation_approved',
    target_res.id
  );

  RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

