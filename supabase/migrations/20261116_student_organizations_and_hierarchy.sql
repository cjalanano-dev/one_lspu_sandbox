-- Migration: 20261116_student_organizations_and_hierarchy.sql
-- Description: Adds parent/child organization hierarchy, college taxonomy, expanded roles,
-- updated approval step workflow with 5 stages (Adviser -> Dean -> OSAS -> Campus Director -> University President),
-- and restricts proposal/org management to organization presidents and secretaries.

-- 1. Extend organizations table with college and parent_org_id
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS parent_org_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS college TEXT,
  ADD COLUMN IF NOT EXISTS org_type TEXT NOT NULL DEFAULT 'college_mother';

CREATE INDEX IF NOT EXISTS idx_organizations_parent_org_id ON public.organizations(parent_org_id);
CREATE INDEX IF NOT EXISTS idx_organizations_college ON public.organizations(college);

-- 2. Seed Real LSPU Student Organizations
-- OCTA (College of Computer Studies - Mother Org)
-- ALGO (CCS - Computer Science Sub-org)
-- BSIT (CCS - Information Technology Sub-org)
-- COESC (College of Engineering - Student Body)
-- OCTA first so sub-organizations can resolve its id by acronym (no hardcoded ids).
INSERT INTO public.organizations (id, name, acronym, description, logo_url, status, college, org_type, parent_org_id)
VALUES (
  gen_random_uuid(),
  'Organization of Computer Total Achievers',
  'OCTA',
  'Mother student organization of the College of Computer Studies (CCS).',
  'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=128&q=80',
  'active',
  'College of Computer Studies (CCS)',
  'college_mother',
  NULL
)
ON CONFLICT (acronym) DO UPDATE SET
  name = EXCLUDED.name,
  acronym = EXCLUDED.acronym,
  description = EXCLUDED.description,
  college = EXCLUDED.college,
  org_type = EXCLUDED.org_type,
  parent_org_id = EXCLUDED.parent_org_id;

-- Sub-organizations resolve their parent by acronym (no hardcoded ids).
INSERT INTO public.organizations (id, name, acronym, description, logo_url, status, college, org_type, parent_org_id)
VALUES
  (
    gen_random_uuid(),
    'Alliance of Leaders in G-Software and Optimization',
    'ALGO',
    'Sub-organization of OCTA for Computer Science Students.',
    'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=128&q=80',
    'active',
    'College of Computer Studies (CCS)',
    'program_sub_org',
    (SELECT id FROM public.organizations WHERE acronym = 'OCTA')
  ),
  (
    gen_random_uuid(),
    'Bachelor of Science in Information Technology Student Society',
    'BSIT',
    'Sub-organization of OCTA for Information Technology Students.',
    'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=128&q=80',
    'active',
    'College of Computer Studies (CCS)',
    'program_sub_org',
    (SELECT id FROM public.organizations WHERE acronym = 'OCTA')
  ),
  (
    gen_random_uuid(),
    'College of Engineering Student Council',
    'COESC',
    'Apex student governing body of the College of Engineering.',
    'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=128&q=80',
    'active',
    'College of Engineering (COE)',
    'college_mother',
    NULL
  ),
  (
    gen_random_uuid(),
    'University Supreme Student Council',
    'USSC',
    'Apex governing student body for student welfare and activities across all colleges.',
    'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=128&q=80',
    'active',
    'University Wide',
    'university_wide',
    NULL
  )
ON CONFLICT (acronym) DO UPDATE SET
  name = EXCLUDED.name,
  acronym = EXCLUDED.acronym,
  description = EXCLUDED.description,
  college = EXCLUDED.college,
  org_type = EXCLUDED.org_type,
  parent_org_id = EXCLUDED.parent_org_id;

-- 3. Update is_org_officer helper to restrict proposal submission & org management
-- to organization president and secretary only.
CREATE OR REPLACE FUNCTION public.is_org_officer(p_org UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_id = p_org
      AND user_id = auth.uid()
      AND membership_status = 'active'
      AND organization_role IN ('president', 'secretary')
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

-- 4. Update can_act_as to support all approval stages:
-- org adviser, college dean, osas, campus director, university president (and system_admin).
CREATE OR REPLACE FUNCTION public.can_act_as(p_proposal UUID, p_step_role TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  v_role TEXT := public.current_role_name();
  v_adviser UUID;
BEGIN
  IF v_role IS NULL THEN RETURN false; END IF;
  IF v_role = 'system_admin' THEN RETURN true; END IF;

  -- Organization Adviser check
  IF p_step_role = 'adviser' THEN
    IF v_role <> 'adviser' THEN RETURN false; END IF;
    SELECT o.adviser_id INTO v_adviser
    FROM public.proposals p JOIN public.organizations o ON o.id = p.organization_id
    WHERE p.id = p_proposal;
    RETURN v_adviser IS NULL OR v_adviser = auth.uid();
  END IF;

  -- Support legacy role mapping: osa_staff maps to osas
  IF p_step_role IN ('osas', 'osa_staff') AND v_role IN ('osas', 'osa_staff') THEN
    RETURN true;
  END IF;

  RETURN v_role = p_step_role;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

-- 5. Update proposal submission workflow to populate the 5 approval steps:
-- 1. Org Adviser
-- 2. College Dean
-- 3. OSAS (Office of Student Affairs and Services)
-- 4. Campus Director
-- 5. University President
CREATE OR REPLACE FUNCTION public.submit_proposal(p_proposal_id UUID)
RETURNS public.proposals AS $$
DECLARE
  p public.proposals;
  v_reservation UUID;
  v_from TEXT;
  v_action TEXT;
  v_has_conflicts BOOLEAN;
BEGIN
  SELECT * INTO p FROM public.proposals WHERE id = p_proposal_id FOR UPDATE;
  IF p.id IS NULL THEN RAISE EXCEPTION 'Proposal not found'; END IF;
  IF p.status NOT IN ('draft', 'returned') THEN
    RAISE EXCEPTION 'Only draft or returned proposals can be submitted (current: %)', p.status;
  END IF;

  IF NOT public.is_org_officer(p.organization_id) THEN
    RAISE EXCEPTION 'Only active organization presidents or secretaries can submit proposals';
  END IF;

  IF p.title IS NULL OR length(trim(p.title)) < 5 THEN
    RAISE EXCEPTION 'Proposal title must be at least 5 characters';
  END IF;
  IF p.facility_id IS NULL OR p.start_datetime IS NULL OR p.end_datetime IS NULL THEN
    RAISE EXCEPTION 'A venue, start time, and end time are required to submit';
  END IF;
  IF p.end_datetime <= p.start_datetime THEN
    RAISE EXCEPTION 'End time must be after start time';
  END IF;

  v_has_conflicts := public.check_schedule_conflicts(p.facility_id, p.start_datetime, p.end_datetime, p_proposal_id);
  IF v_has_conflicts THEN
    RAISE EXCEPTION 'Cannot submit: The chosen venue has a scheduling conflict with another approved reservation or maintenance period.';
  END IF;

  v_reservation := p.reservation_id;
  IF v_reservation IS NULL THEN
    INSERT INTO public.reservations (
      facility_id, requester_id, organization_id, title, purpose,
      start_datetime, end_datetime, attendee_count, requested_equipment,
      status, reviewed_by, reviewed_at
    )
    VALUES (
      p.facility_id, p.submitted_by, p.organization_id, p.title,
      coalesce(nullif(p.description, ''), 'Event proposal reservation'),
      p.start_datetime, p.end_datetime, p.expected_attendees, p.requested_equipment,
      'pending', NULL, NULL
    )
    RETURNING id INTO v_reservation;
  ELSE
    UPDATE public.reservations
    SET facility_id = p.facility_id, title = p.title,
        purpose = coalesce(nullif(p.description, ''), purpose),
        start_datetime = p.start_datetime, end_datetime = p.end_datetime,
        attendee_count = p.expected_attendees, requested_equipment = p.requested_equipment,
        status = 'pending', rejection_reason = NULL, reviewed_by = NULL, reviewed_at = NULL,
        updated_at = timezone('utc'::text, now())
    WHERE id = v_reservation;
  END IF;

  -- Populate 5-step approval hierarchy if not present
  IF NOT EXISTS (SELECT 1 FROM public.approval_steps WHERE proposal_id = p.id) THEN
    INSERT INTO public.approval_steps (proposal_id, step_order, step_role, label) VALUES
      (p.id, 1, 'adviser', 'Organization Adviser'),
      (p.id, 2, 'college_dean', 'College Dean'),
      (p.id, 3, 'osas', 'Office of Student Affairs & Services (OSAS)'),
      (p.id, 4, 'campus_director', 'Campus Director'),
      (p.id, 5, 'university_president', 'University President');
  ELSE
    -- If proposal already has steps (e.g. from prior schema or resubmission), ensure step roles & labels are aligned
    DELETE FROM public.approval_steps WHERE proposal_id = p.id;
    INSERT INTO public.approval_steps (proposal_id, step_order, step_role, label) VALUES
      (p.id, 1, 'adviser', 'Organization Adviser'),
      (p.id, 2, 'college_dean', 'College Dean'),
      (p.id, 3, 'osas', 'Office of Student Affairs & Services (OSAS)'),
      (p.id, 4, 'campus_director', 'Campus Director'),
      (p.id, 5, 'university_president', 'University President');
  END IF;

  UPDATE public.approval_steps
  SET status = 'pending', due_at = now() + interval '48 hours'
  WHERE proposal_id = p.id AND step_order = 1;

  v_from := p.status;
  v_action := CASE WHEN p.status = 'returned' THEN 'resubmitted' ELSE 'submitted' END;

  UPDATE public.proposals
  SET status = 'in_review',
      current_step = 1,
      revision = CASE WHEN p.status = 'returned' THEN p.revision + 1 ELSE p.revision END,
      reference_no = coalesce(p.reference_no,
        'EP-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('public.proposal_reference_seq')::text, 4, '0')),
      reservation_id = v_reservation,
      submitted_at = now(),
      decided_at = NULL
  WHERE id = p.id
  RETURNING * INTO p;

  INSERT INTO public.proposal_events (proposal_id, step_id, actor_id, actor_role, action, from_status, to_status, note)
  VALUES (p.id, NULL, auth.uid(), public.current_role_name(), v_action, v_from, 'in_review', NULL);

  RETURN p;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ---------------------------------------------------------------------------
-- 6. LINK TEST ACCOUNTS TO ORGANIZATIONS & ROLES (if users exist in Auth/Profiles)
-- ---------------------------------------------------------------------------
-- Link officer@campus.edu to OCTA as President so default officer account can submit proposals
INSERT INTO public.organization_members (organization_id, user_id, organization_role, membership_status)
SELECT
  o.id,
  p.id,
  'president',
  'active'
FROM public.organizations o
JOIN public.profiles p ON p.email = 'officer@campus.edu'
WHERE o.acronym = 'OCTA'
ON CONFLICT (organization_id, user_id)
DO UPDATE SET organization_role = 'president', membership_status = 'active';

-- Support for dedicated test accounts if created:
-- 1. OCTA (CCS Mother Org)
INSERT INTO public.organization_members (organization_id, user_id, organization_role, membership_status)
SELECT o.id, p.id, 'president', 'active'
FROM public.organizations o JOIN public.profiles p ON p.email = 'octa.president@campus.edu'
WHERE o.acronym = 'OCTA'
ON CONFLICT (organization_id, user_id) DO UPDATE SET organization_role = 'president';

INSERT INTO public.organization_members (organization_id, user_id, organization_role, membership_status)
SELECT o.id, p.id, 'secretary', 'active'
FROM public.organizations o JOIN public.profiles p ON p.email = 'octa.secretary@campus.edu'
WHERE o.acronym = 'OCTA'
ON CONFLICT (organization_id, user_id) DO UPDATE SET organization_role = 'secretary';

-- 2. ALGO (CS Sub-Org of OCTA)
INSERT INTO public.organization_members (organization_id, user_id, organization_role, membership_status)
SELECT o.id, p.id, 'president', 'active'
FROM public.organizations o JOIN public.profiles p ON p.email = 'algo.president@campus.edu'
WHERE o.acronym = 'ALGO'
ON CONFLICT (organization_id, user_id) DO UPDATE SET organization_role = 'president';

INSERT INTO public.organization_members (organization_id, user_id, organization_role, membership_status)
SELECT o.id, p.id, 'secretary', 'active'
FROM public.organizations o JOIN public.profiles p ON p.email = 'algo.secretary@campus.edu'
WHERE o.acronym = 'ALGO'
ON CONFLICT (organization_id, user_id) DO UPDATE SET organization_role = 'secretary';

-- 3. BSIT (IT Sub-Org of OCTA)
INSERT INTO public.organization_members (organization_id, user_id, organization_role, membership_status)
SELECT o.id, p.id, 'president', 'active'
FROM public.organizations o JOIN public.profiles p ON p.email = 'bsit.president@campus.edu'
WHERE o.acronym = 'BSIT'
ON CONFLICT (organization_id, user_id) DO UPDATE SET organization_role = 'president';

INSERT INTO public.organization_members (organization_id, user_id, organization_role, membership_status)
SELECT o.id, p.id, 'secretary', 'active'
FROM public.organizations o JOIN public.profiles p ON p.email = 'bsit.secretary@campus.edu'
WHERE o.acronym = 'BSIT'
ON CONFLICT (organization_id, user_id) DO UPDATE SET organization_role = 'secretary';

-- 4. COESC (College of Engineering Student Council)
INSERT INTO public.organization_members (organization_id, user_id, organization_role, membership_status)
SELECT o.id, p.id, 'president', 'active'
FROM public.organizations o JOIN public.profiles p ON p.email = 'coesc.president@campus.edu'
WHERE o.acronym = 'COESC'
ON CONFLICT (organization_id, user_id) DO UPDATE SET organization_role = 'president';

INSERT INTO public.organization_members (organization_id, user_id, organization_role, membership_status)
SELECT o.id, p.id, 'secretary', 'active'
FROM public.organizations o JOIN public.profiles p ON p.email = 'coesc.secretary@campus.edu'
WHERE o.acronym = 'COESC'
ON CONFLICT (organization_id, user_id) DO UPDATE SET organization_role = 'secretary';

-- Set designated roles for demo approvers when accounts exist
UPDATE public.profiles SET primary_role = 'adviser' WHERE email = 'adviser@campus.edu';
UPDATE public.profiles SET primary_role = 'college_dean' WHERE email = 'dean@campus.edu';
UPDATE public.profiles SET primary_role = 'osas' WHERE email = 'osas@campus.edu' OR email = 'osa@campus.edu';
UPDATE public.profiles SET primary_role = 'campus_director' WHERE email = 'director@campus.edu';
UPDATE public.profiles SET primary_role = 'university_president' WHERE email = 'president@campus.edu';

-- Link OCTA adviser
UPDATE public.organizations o SET adviser_id = p.id
FROM public.profiles p
WHERE p.email = 'adviser@campus.edu' AND o.acronym = 'OCTA';

