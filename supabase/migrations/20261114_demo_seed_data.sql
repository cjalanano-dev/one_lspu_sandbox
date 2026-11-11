-- ONE Facility demo seed data
-- Populates activities, reservations, maintenance periods, and notifications
-- so dashboards show real data instead of empty states.
-- IDs are resolved by lookup to avoid hardcoding UUIDs.

-- 1. ACTIVITIES (officer-created org events)
INSERT INTO public.activities (organization_id, title, description, activity_date, expected_attendees, status, created_by)
SELECT
  o.id,
  'ACM CodeCamp 2026: Full-Stack Web Sprint',
  '48-hour hackathon focused on building smart campus IoT & AI tools. Open to all students.',
  (CURRENT_DATE + INTERVAL '14 days')::date,
  120,
  'planned',
  p.id
FROM public.organizations o
JOIN public.profiles p ON p.email = 'officer@campus.edu'
WHERE o.acronym = 'ACM'
ON CONFLICT DO NOTHING;

INSERT INTO public.activities (organization_id, title, description, activity_date, expected_attendees, status, created_by)
SELECT
  o.id,
  'Weekly Lightning Talk Series',
  'Student-led tech talks every Friday evening. Topics rotate weekly.',
  (CURRENT_DATE + INTERVAL '7 days')::date,
  35,
  'planned',
  p.id
FROM public.organizations o
JOIN public.profiles p ON p.email = 'officer@campus.edu'
WHERE o.acronym = 'ACM'
ON CONFLICT DO NOTHING;

INSERT INTO public.activities (organization_id, title, description, activity_date, expected_attendees, status, created_by)
SELECT
  o.id,
  'USSC General Assembly',
  'Monthly student council meeting to review campus welfare initiatives.',
  (CURRENT_DATE + INTERVAL '3 days')::date,
  60,
  'planned',
  p.id
FROM public.organizations o
JOIN public.profiles p ON p.email = 'officer@campus.edu'
WHERE o.acronym = 'USSC'
ON CONFLICT DO NOTHING;

-- 2. RESERVATIONS (mix of pending, approved, rejected, cancelled)
INSERT INTO public.reservations (facility_id, requester_id, organization_id, title, purpose, start_datetime, end_datetime, attendee_count, requested_equipment, status, rejection_reason, reviewed_by, reviewed_at)
SELECT
  f.id,
  p.id,
  NULL,
  'Welcome Week Orientation',
  'Freshman orientation session for new CS students.',
  (CURRENT_DATE + INTERVAL '5 days' + INTERVAL '9 hours')::timestamptz,
  (CURRENT_DATE + INTERVAL '5 days' + INTERVAL '11 hours')::timestamptz,
  200,
  '[]'::jsonb,
  'pending',
  NULL,
  NULL,
  NULL
FROM public.facilities f
JOIN public.profiles p ON p.email = 'student@campus.edu'
WHERE f.facility_code = 'TIC-A101'
ON CONFLICT DO NOTHING;

INSERT INTO public.reservations (facility_id, requester_id, organization_id, title, purpose, start_datetime, end_datetime, attendee_count, requested_equipment, status, rejection_reason, reviewed_by, reviewed_at)
SELECT
  f.id,
  p.id,
  o.id,
  'ACM Executive Board Meeting',
  'Monthly board meeting to plan upcoming events.',
  (CURRENT_DATE + INTERVAL '3 days' + INTERVAL '14 hours')::timestamptz,
  (CURRENT_DATE + INTERVAL '3 days' + INTERVAL '15 hours')::timestamptz,
  12,
  '["Polycom Video Bar"]'::jsonb,
  'approved',
  NULL,
  a.id,
  timezone('utc'::text, now())
FROM public.facilities f
JOIN public.profiles p ON p.email = 'officer@campus.edu'
JOIN public.organizations o ON o.acronym = 'ACM'
JOIN public.profiles a ON a.email = 'admin@campus.edu'
WHERE f.facility_code = 'TIC-C102'
ON CONFLICT DO NOTHING;

INSERT INTO public.reservations (facility_id, requester_id, organization_id, title, purpose, start_datetime, end_datetime, attendee_count, requested_equipment, status, rejection_reason, reviewed_by, reviewed_at)
SELECT
  f.id,
  p.id,
  NULL,
  'AI Lab Access Request',
  'Final project testing for robotics course.',
  (CURRENT_DATE + INTERVAL '2 days' + INTERVAL '10 hours')::timestamptz,
  (CURRENT_DATE + INTERVAL '2 days' + INTERVAL '13 hours')::timestamptz,
  30,
  '["3x Bambu 3D Printers"]'::jsonb,
  'rejected',
  'Lab is reserved for faculty-supervised research only during this window.',
  a.id,
  timezone('utc'::text, now())
FROM public.facilities f
JOIN public.profiles p ON p.email = 'student@campus.edu'
JOIN public.profiles a ON a.email = 'admin@campus.edu'
WHERE f.facility_code = 'TIC-L201'
ON CONFLICT DO NOTHING;

INSERT INTO public.reservations (facility_id, requester_id, organization_id, title, purpose, start_datetime, end_datetime, attendee_count, requested_equipment, status, rejection_reason, reviewed_by, reviewed_at)
SELECT
  f.id,
  p.id,
  o.id,
  'USSC Cultural Night',
  'Annual cultural showcase with performances and food stalls.',
  (CURRENT_DATE - INTERVAL '10 days' + INTERVAL '17 hours')::timestamptz,
  (CURRENT_DATE - INTERVAL '10 days' + INTERVAL '20 hours')::timestamptz,
  300,
  '["Mobile Bleachers", "PA Announcement System"]'::jsonb,
  'cancelled',
  NULL,
  NULL,
  NULL
FROM public.facilities f
JOIN public.profiles p ON p.email = 'officer@campus.edu'
JOIN public.organizations o ON o.acronym = 'USSC'
WHERE f.facility_code = 'SAC-MP101'
ON CONFLICT DO NOTHING;

-- 3. MAINTENANCE PERIODS
INSERT INTO public.maintenance_periods (facility_id, title, description, start_datetime, end_datetime, created_by)
SELECT
  f.id,
  'HVAC System Service',
  'Scheduled maintenance for lecture hall climate control.',
  (CURRENT_DATE + INTERVAL '1 day' + INTERVAL '8 hours')::timestamptz,
  (CURRENT_DATE + INTERVAL '1 day' + INTERVAL '12 hours')::timestamptz,
  p.id
FROM public.facilities f
JOIN public.profiles p ON p.email = 'admin@campus.edu'
WHERE f.facility_code = 'TIC-LH202'
ON CONFLICT DO NOTHING;

-- 4. NOTIFICATIONS
INSERT INTO public.notifications (user_id, title, message, notification_type, related_reservation_id, is_read)
SELECT
  p.id,
  'Reservation Approved! 🎉',
  'Your reservation "ACM Executive Board Meeting" has been approved by the Facility Administrator.',
  'reservation_approved',
  (SELECT id FROM public.reservations WHERE title = 'ACM Executive Board Meeting' LIMIT 1),
  false
FROM public.profiles p
WHERE p.email = 'officer@campus.edu'
ON CONFLICT DO NOTHING;

INSERT INTO public.notifications (user_id, title, message, notification_type, related_reservation_id, is_read)
SELECT
  p.id,
  'Reservation Request Declined',
  'Your reservation "AI Lab Access Request" was declined: Lab is reserved for faculty-supervised research only during this window.',
  'reservation_rejected',
  (SELECT id FROM public.reservations WHERE title = 'AI Lab Access Request' LIMIT 1),
  false
FROM public.profiles p
WHERE p.email = 'student@campus.edu'
ON CONFLICT DO NOTHING;

INSERT INTO public.notifications (user_id, title, message, notification_type, related_reservation_id, is_read)
SELECT
  p.id,
  'Reservation Request Submitted',
  'Your reservation request for "Welcome Week Orientation" has been submitted and is awaiting administrator review.',
  'reservation_submitted',
  (SELECT id FROM public.reservations WHERE title = 'Welcome Week Orientation' LIMIT 1),
  false
FROM public.profiles p
WHERE p.email = 'student@campus.edu'
ON CONFLICT DO NOTHING;
