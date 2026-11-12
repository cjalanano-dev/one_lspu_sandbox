-- ONE Facility: repair the event-proposals and organization-hierarchy schema
--
-- WHY THIS MIGRATION EXISTS
-- -----------------------
-- `supabase_migrations.schema_migrations` on the live project records only
-- 20261110 and 20261111. Everything after that was applied by hand, and
-- two migrations were skipped entirely:
--
--   * 20261115_event_proposals.sql
--   * 20261116_student_organizations_and_hierarchy.sql
--
-- The result was a half-built feature: `public.proposals` existed (created
-- by hand) but `proposal_budget_items`, `proposal_attachments`,
-- `approval_steps` and `proposal_events` did not, and none of the workflow
-- functions existed. The app surfaced this as:
--   "Could not find the table 'public.proposal_budget_items' in the schema cache"
--
-- The two skipped migrations also disagree with each other and with the app:
--
--   1. 20261116 calls public.check_schedule_conflicts(...), which no
--      migration ever defines -> submit_proposal would fail at runtime.
--   2. 20261116's submit_proposal inserts into proposal_events using the
--      columns (step_id, actor_role, note) while 20261115 -- and the app's
--      ProposalEvent type -- use (step_order, revision, comment).
--   3. 20261115 constrains approval_steps.step_role to
--      ('adviser','osa_staff','facility_admin') but 20261116 inserts five
--      different roles -> constraint violation on every submit.
--   4. 20261116 renames the submit_proposal parameter from `p_proposal` to
--      `p_proposal_id`; the app calls rpc('submit_proposal', { p_proposal })
--      so the call would no longer resolve.
--   5. 20261115's act_on_proposal only runs the venue conflict check when
--      the step role is 'facility_admin', a step the 5-stage flow never
--      creates -- so double-booking checks would silently never run.
--
-- This migration installs the reconciled schema in one place, matching what
-- the TypeScript types in src/types/index.ts and the RPC calls in
-- src/lib/proposals.ts actually expect:
--
--   * 5-stage approval chain: adviser -> college_dean -> osas ->
--     campus_director -> university_president
--   * submit_proposal(p_proposal UUID) -> JSONB {success, ...}
--   * proposal_events columns: step_order, revision, comment
--   * approval_steps.step_role accepts all seven roles
--
-- Idempotent: safe to re-run.

-- ===========================================================================
-- 1. COLUMNS
-- ===========================================================================

-- Organization hierarchy + adviser link.
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS parent_org_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS college TEXT,
  ADD COLUMN IF NOT EXISTS org_type TEXT NOT NULL DEFAULT 'college_mother',
  ADD COLUMN IF NOT EXISTS adviser_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_organizations_parent_org_id ON public.organizations(parent_org_id);
CREATE INDEX IF NOT EXISTS idx_organizations_college ON public.organizations(college);

-- 20261110 created organizations.acronym as a plain TEXT column, but both
-- supabase/seed.sql and 20261116 upsert on it with ON CONFLICT (acronym),
-- which needs a unique constraint. Without it every organisation upsert
-- fails with 42P10. Add it now, collapsing any duplicate acronyms first.
DELETE FROM public.organizations a
USING public.organizations b
WHERE a.acronym = b.acronym
  AND (a.created_at, a.id) > (b.created_at, b.id);

CREATE UNIQUE INDEX IF NOT EXISTS organizations_acronym_key ON public.organizations (acronym);

-- Proposal link on reservations (a proposal owns the booking it creates).
ALTER TABLE public.reservations
  ADD COLUMN IF NOT EXISTS proposal_id UUID REFERENCES public.proposals(id) ON DELETE SET NULL;

-- Proposal link on notifications.
ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS related_proposal_id UUID REFERENCES public.proposals(id) ON DELETE CASCADE;

-- ===========================================================================
-- 2. CONSTRAINTS
-- ===========================================================================

-- The app's UserRole type allows ten roles; the live check allowed only five.
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_primary_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_primary_role_check
  CHECK (primary_role IN (
    'student', 'faculty', 'officer', 'adviser', 'college_dean', 'osas',
    'campus_director', 'university_president', 'osa_staff',
    'facility_admin', 'system_admin'
  ));

-- Notification types must include the proposal_* family.
ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_notification_type_check;
ALTER TABLE public.notifications ADD CONSTRAINT notifications_notification_type_check
  CHECK (notification_type IN (
    'reservation_submitted', 'reservation_approved', 'reservation_rejected',
    'reservation_cancelled', 'maintenance_alert', 'info',
    'proposal_action_required', 'proposal_progress', 'proposal_returned',
    'proposal_approved', 'proposal_rejected', 'proposal_overdue'
  ));

-- ===========================================================================
-- 3. MISSING TABLES
-- ===========================================================================

CREATE SEQUENCE IF NOT EXISTS public.proposal_reference_seq;

-- approval_steps: step_role widened to every role the app can act as.
CREATE TABLE IF NOT EXISTS public.approval_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID NOT NULL REFERENCES public.proposals(id) ON DELETE CASCADE,
  step_order INT NOT NULL,
  step_role TEXT NOT NULL
    CHECK (step_role IN (
      'adviser', 'college_dean', 'osas', 'campus_director',
      'university_president', 'osa_staff', 'facility_admin'
    )),
  label TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'waiting'
    CHECK (status IN ('waiting', 'pending', 'approved', 'returned', 'rejected')),
  acted_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  acted_at TIMESTAMPTZ,
  comment TEXT,
  due_at TIMESTAMPTZ,
  reminded_at TIMESTAMPTZ,
  signature TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  UNIQUE (proposal_id, step_order)
);

-- Widen the constraint if the table already existed with the narrower one.
ALTER TABLE public.approval_steps DROP CONSTRAINT IF EXISTS approval_steps_step_role_check;
ALTER TABLE public.approval_steps ADD CONSTRAINT approval_steps_step_role_check
  CHECK (step_role IN (
    'adviser', 'college_dean', 'osas', 'campus_director',
    'university_president', 'osa_staff', 'facility_admin'
  ));

CREATE TABLE IF NOT EXISTS public.proposal_budget_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID NOT NULL REFERENCES public.proposals(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity NUMERIC(12, 2) NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_cost NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (unit_cost >= 0),
  source_of_funds TEXT NOT NULL DEFAULT 'org_funds'
    CHECK (source_of_funds IN (
      'org_funds', 'student_fees', 'sponsorship', 'school_subsidy', 'other'
    )),
  position INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.proposal_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID NOT NULL REFERENCES public.proposals(id) ON DELETE CASCADE,
  doc_type TEXT NOT NULL DEFAULT 'other'
    CHECK (doc_type IN (
      'proposal_letter', 'program_flow', 'budget_breakdown',
      'parental_waiver', 'other'
    )),
  file_name TEXT NOT NULL,
  storage_path TEXT NOT NULL UNIQUE,
  size_bytes BIGINT,
  uploaded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Column set matches the app's ProposalEvent type (step_order/revision/comment).
CREATE TABLE IF NOT EXISTS public.proposal_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID NOT NULL REFERENCES public.proposals(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL
    CHECK (action IN (
      'created', 'submitted', 'resubmitted', 'approved', 'returned',
      'rejected', 'cancelled', 'final_approved', 'reminder_sent'
    )),
  from_status TEXT,
  to_status TEXT,
  step_order INT,
  revision INT,
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_proposals_org ON public.proposals (organization_id, status);
CREATE INDEX IF NOT EXISTS idx_proposals_submitter ON public.proposals (submitted_by);
CREATE INDEX IF NOT EXISTS idx_approval_steps_pending ON public.approval_steps (step_role, status);
CREATE INDEX IF NOT EXISTS idx_proposal_events_proposal ON public.proposal_events (proposal_id, created_at);
CREATE INDEX IF NOT EXISTS idx_budget_items_proposal ON public.proposal_budget_items (proposal_id);
CREATE INDEX IF NOT EXISTS idx_attachments_proposal ON public.proposal_attachments (proposal_id);

-- ===========================================================================
-- 4. HELPER FUNCTIONS
-- ===========================================================================

CREATE OR REPLACE FUNCTION public.current_role_name()
RETURNS TEXT AS $$
  SELECT primary_role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

-- Proposal and organization management is limited to presidents and
-- secretaries, matching src/lib/dataStore.ts isOrgExecutive().
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

-- can_act_as reads public.proposals, so it must be VOLATILE (see can_view_proposal).
CREATE OR REPLACE FUNCTION public.can_act_as(p_proposal UUID, p_step_role TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  v_role TEXT := public.current_role_name();
  v_adviser UUID;
BEGIN
  IF v_role IS NULL THEN RETURN false; END IF;
  IF v_role = 'system_admin' THEN RETURN true; END IF;

  IF p_step_role = 'adviser' THEN
    IF v_role <> 'adviser' THEN RETURN false; END IF;
    SELECT o.adviser_id INTO v_adviser
    FROM public.proposals p JOIN public.organizations o ON o.id = p.organization_id
    WHERE p.id = p_proposal;
    RETURN v_adviser IS NULL OR v_adviser = auth.uid();
  END IF;

  -- osas and osa_staff are interchangeable.
  IF p_step_role IN ('osas', 'osa_staff') AND v_role IN ('osas', 'osa_staff') THEN
    RETURN true;
  END IF;

  RETURN v_role = p_step_role;
END;
$$ LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public;

-- VOLATILE, not STABLE: these functions read public.proposals, the very
-- table their policy guards. A STABLE function sees the statement-start
-- snapshot, so during "INSERT ... RETURNING" (which is what
-- supabase.from('proposals').insert(...).select(...) does) it cannot see
-- the row being inserted, the SELECT policy denies it, and the insert
-- fails with:
--   42501 new row violates row-level security policy for table "proposals"
-- VOLATILE forces a fresh snapshot so the new row is visible.
CREATE OR REPLACE FUNCTION public.can_view_proposal(p_proposal UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.proposals p
    WHERE p.id = p_proposal
      AND (
        p.submitted_by = auth.uid()
        OR public.is_org_officer(p.organization_id)
        OR public.current_role_name() = 'system_admin'
        OR EXISTS (
          SELECT 1 FROM public.approval_steps s
          WHERE s.proposal_id = p.id
            AND s.status <> 'waiting'
            AND public.can_act_as(p.id, s.step_role)
        )
      )
  );
$$ LANGUAGE sql VOLATILE SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.can_edit_proposal(p_proposal UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.proposals p
    WHERE p.id = p_proposal
      AND p.status IN ('draft', 'returned')
      AND public.is_org_officer(p.organization_id)
  );
$$ LANGUAGE sql VOLATILE SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.proposal_id_from_path(p_path TEXT)
RETURNS UUID AS $$
BEGIN
  RETURN split_part(p_path, '/', 1)::uuid;
EXCEPTION WHEN others THEN
  RETURN NULL;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION public.notify_user(
  p_user UUID, p_title TEXT, p_message TEXT, p_type TEXT, p_proposal UUID
) RETURNS VOID AS $$
  INSERT INTO public.notifications (user_id, title, message, notification_type, related_proposal_id)
  VALUES (p_user, p_title, p_message, p_type, p_proposal);
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.notify_step_approvers(
  p_proposal UUID, p_step_role TEXT, p_title TEXT, p_message TEXT
) RETURNS VOID AS $$
DECLARE
  v_adviser UUID;
BEGIN
  IF p_step_role = 'adviser' THEN
    SELECT o.adviser_id INTO v_adviser
    FROM public.proposals p JOIN public.organizations o ON o.id = p.organization_id
    WHERE p.id = p_proposal;
    IF v_adviser IS NOT NULL THEN
      PERFORM public.notify_user(v_adviser, p_title, p_message, 'proposal_action_required', p_proposal);
      RETURN;
    END IF;
  END IF;

  INSERT INTO public.notifications (user_id, title, message, notification_type, related_proposal_id)
  SELECT id, p_title, p_message, 'proposal_action_required', p_proposal
  FROM public.profiles
  WHERE primary_role = p_step_role AND account_status = 'active';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ===========================================================================
-- 5. SCHEDULE CONFLICT CHECK
--    20261116 called this but never defined it.
--    Returns TRUE when the slot clashes with an approved reservation (other
--    than p_exclude_reservation_id) or a maintenance period.
-- ===========================================================================
CREATE OR REPLACE FUNCTION public.check_schedule_conflicts(
  p_facility_id UUID,
  p_start TIMESTAMPTZ,
  p_end TIMESTAMPTZ,
  p_exclude_reservation_id UUID DEFAULT NULL
) RETURNS BOOLEAN AS $$
  SELECT
    EXISTS (
      SELECT 1 FROM public.reservations r
      WHERE r.facility_id = p_facility_id
        AND r.status = 'approved'
        AND (p_exclude_reservation_id IS NULL OR r.id <> p_exclude_reservation_id)
        AND (r.start_datetime, r.end_datetime) OVERLAPS (p_start, p_end)
    )
    OR EXISTS (
      SELECT 1 FROM public.maintenance_periods m
      WHERE m.facility_id = p_facility_id
        AND (m.start_datetime, m.end_datetime) OVERLAPS (p_start, p_end)
    );
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

-- ===========================================================================
-- 6. GUARDS
-- ===========================================================================

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_approval_steps_touch ON public.approval_steps;
CREATE TRIGGER trg_approval_steps_touch
  BEFORE UPDATE ON public.approval_steps
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE OR REPLACE FUNCTION public.guard_proposal_workflow_fields()
RETURNS TRIGGER AS $$
BEGIN
  IF coalesce(current_setting('app.proposal_flow', true), '') = 'on' THEN
    RETURN NEW;
  END IF;
  IF NEW.status IS DISTINCT FROM OLD.status
     OR NEW.current_step IS DISTINCT FROM OLD.current_step
     OR NEW.revision IS DISTINCT FROM OLD.revision
     OR NEW.reservation_id IS DISTINCT FROM OLD.reservation_id
     OR NEW.reference_no IS DISTINCT FROM OLD.reference_no
     OR NEW.submitted_at IS DISTINCT FROM OLD.submitted_at
     OR NEW.decided_at IS DISTINCT FROM OLD.decided_at
     OR NEW.organization_id IS DISTINCT FROM OLD.organization_id
     OR NEW.submitted_by IS DISTINCT FROM OLD.submitted_by THEN
    RAISE EXCEPTION 'Workflow fields can only be changed through submit/approve actions.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_proposals_guard_workflow ON public.proposals;
CREATE TRIGGER trg_proposals_guard_workflow
  BEFORE UPDATE ON public.proposals
  FOR EACH ROW EXECUTE FUNCTION public.guard_proposal_workflow_fields();

CREATE OR REPLACE FUNCTION public.guard_proposal_reservation()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.proposal_id IS NOT NULL
     AND NEW.status IS DISTINCT FROM OLD.status
     AND coalesce(current_setting('app.proposal_flow', true), '') <> 'on' THEN
    RAISE EXCEPTION 'This reservation belongs to an event proposal and can only be decided through the proposal approval flow.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_guard_proposal_reservation ON public.reservations;
CREATE TRIGGER trg_guard_proposal_reservation
  BEFORE UPDATE ON public.reservations
  FOR EACH ROW EXECUTE FUNCTION public.guard_proposal_reservation();

CREATE OR REPLACE FUNCTION public.log_proposal_created()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.proposal_events (proposal_id, actor_id, action, to_status, revision)
  VALUES (NEW.id, auth.uid(), 'created', NEW.status, NEW.revision);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_proposals_created ON public.proposals;
CREATE TRIGGER trg_proposals_created
  AFTER INSERT ON public.proposals
  FOR EACH ROW EXECUTE FUNCTION public.log_proposal_created();

-- ===========================================================================
-- 7. WORKFLOW RPCs
-- ===========================================================================

-- submit_proposal(p_proposal UUID)
--   Parameter name MUST stay `p_proposal`: the app calls
--   rpc('submit_proposal', { p_proposal: id }) in src/lib/proposals.ts.
DROP FUNCTION IF EXISTS public.submit_proposal(UUID);
CREATE FUNCTION public.submit_proposal(p_proposal UUID)
RETURNS JSONB AS $$
DECLARE
  p RECORD;
  f RECORD;
  v_conflict TEXT;
  v_reservation UUID;
  v_from TEXT;
  v_action TEXT;
BEGIN
  PERFORM set_config('app.proposal_flow', 'on', true);

  SELECT * INTO p FROM public.proposals WHERE id = p_proposal FOR UPDATE;
  IF p.id IS NULL THEN RAISE EXCEPTION 'Proposal not found.'; END IF;

  IF p.status NOT IN ('draft', 'returned') THEN
    RETURN jsonb_build_object('success', false, 'error',
      format('Only draft or returned proposals can be submitted (current: %s).', p.status));
  END IF;

  IF NOT public.is_org_officer(p.organization_id) THEN
    RETURN jsonb_build_object('success', false, 'error',
      'Only an active president or secretary of this organization can submit the proposal.');
  END IF;

  IF coalesce(trim(p.title), '') = '' THEN
    RETURN jsonb_build_object('success', false, 'error', 'A title is required before submitting.');
  END IF;
  IF p.facility_id IS NULL OR p.start_datetime IS NULL OR p.end_datetime IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error',
      'A venue, start time and end time are required before submitting.');
  END IF;
  IF p.end_datetime <= p.start_datetime THEN
    RETURN jsonb_build_object('success', false, 'error', 'End time must be after the start time.');
  END IF;
  IF p.start_datetime < now() THEN
    RETURN jsonb_build_object('success', false, 'error', 'The event schedule must be in the future.');
  END IF;

  SELECT * INTO f FROM public.facilities WHERE id = p.facility_id;
  IF f.id IS NULL OR NOT f.reservation_enabled THEN
    RETURN jsonb_build_object('success', false, 'error', 'The selected venue is not open for reservations.');
  END IF;
  IF p.expected_attendees > f.capacity THEN
    RETURN jsonb_build_object('success', false, 'error',
      format('Expected attendees (%s) exceed the venue capacity (%s).', p.expected_attendees, f.capacity));
  END IF;

  SELECT r.title INTO v_conflict FROM public.reservations r
  WHERE r.facility_id = p.facility_id AND r.status = 'approved'
    AND r.id IS DISTINCT FROM p.reservation_id
    AND (r.start_datetime, r.end_datetime) OVERLAPS (p.start_datetime, p.end_datetime)
  LIMIT 1;
  IF v_conflict IS NOT NULL THEN
    RETURN jsonb_build_object('success', false, 'error',
      format('The venue is already booked for "%s" during this time.', v_conflict));
  END IF;

  SELECT m.title INTO v_conflict FROM public.maintenance_periods m
  WHERE m.facility_id = p.facility_id
    AND (m.start_datetime, m.end_datetime) OVERLAPS (p.start_datetime, p.end_datetime)
  LIMIT 1;
  IF v_conflict IS NOT NULL THEN
    RETURN jsonb_build_object('success', false, 'error',
      format('The venue is under maintenance ("%s") during this time.', v_conflict));
  END IF;

  -- Create or refresh the linked reservation.
  v_reservation := p.reservation_id;
  IF v_reservation IS NULL THEN
    INSERT INTO public.reservations (
      facility_id, requester_id, organization_id, title, purpose,
      start_datetime, end_datetime, attendee_count, requested_equipment,
      status, proposal_id
    )
    VALUES (
      p.facility_id, p.submitted_by, p.organization_id, p.title,
      coalesce(nullif(p.description, ''), 'Event proposal ' || coalesce(p.reference_no, '')),
      p.start_datetime, p.end_datetime, p.expected_attendees, p.requested_equipment,
      'pending', p.id
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

  -- Five-stage approval chain.
  DELETE FROM public.approval_steps WHERE proposal_id = p.id;
  INSERT INTO public.approval_steps (proposal_id, step_order, step_role, label) VALUES
    (p.id, 1, 'adviser',             'Organization Adviser'),
    (p.id, 2, 'college_dean',        'College Dean'),
    (p.id, 3, 'osas',                'Office of Student Affairs & Services (OSAS)'),
    (p.id, 4, 'campus_director',     'Campus Director'),
    (p.id, 5, 'university_president','University President');

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

  INSERT INTO public.proposal_events (proposal_id, actor_id, action, from_status, to_status, step_order, revision)
  VALUES (p.id, auth.uid(), v_action, v_from, 'in_review', 1, p.revision);

  PERFORM public.notify_step_approvers(p.id, 'adviser',
    'Event proposal awaiting your review',
    format('%s "%s" needs your approval (step 1 of 5).', p.reference_no, p.title));

  RETURN jsonb_build_object('success', true, 'reference_no', p.reference_no, 'revision', p.revision);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- act_on_proposal(p_proposal UUID, p_action TEXT, p_comment TEXT)
DROP FUNCTION IF EXISTS public.act_on_proposal(UUID, TEXT, TEXT);
CREATE FUNCTION public.act_on_proposal(
  p_proposal UUID, p_action TEXT, p_comment TEXT DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
  p RECORD;
  s RECORD;
  v_next RECORD;
  v_total INT;
  v_conflict TEXT;
  v_now TIMESTAMPTZ := now();
  v_sig TEXT;
  v_comment TEXT := nullif(trim(coalesce(p_comment, '')), '');
BEGIN
  PERFORM set_config('app.proposal_flow', 'on', true);

  IF p_action NOT IN ('approve', 'return', 'reject') THEN
    RAISE EXCEPTION 'Unknown action %', p_action;
  END IF;

  SELECT * INTO p FROM public.proposals WHERE id = p_proposal FOR UPDATE;
  IF p.id IS NULL THEN RAISE EXCEPTION 'Proposal not found.'; END IF;
  IF p.status <> 'in_review' THEN
    RAISE EXCEPTION 'This proposal is not awaiting review.';
  END IF;

  SELECT * INTO s FROM public.approval_steps
  WHERE proposal_id = p.id AND step_order = p.current_step FOR UPDATE;
  IF s.id IS NULL OR s.status <> 'pending' THEN
    RAISE EXCEPTION 'No pending approval step was found.';
  END IF;
  IF NOT public.can_act_as(p.id, s.step_role) THEN
    RAISE EXCEPTION 'You are not the assigned approver for this step (%).', s.label;
  END IF;
  IF p_action IN ('return', 'reject') AND v_comment IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Please add a comment explaining the decision.');
  END IF;

  SELECT count(*) INTO v_total FROM public.approval_steps WHERE proposal_id = p.id;

  IF p_action = 'approve' THEN
    -- Venue conflicts are re-checked before the final approval, whichever
    -- role holds that step (20261115 only checked on 'facility_admin', a
    -- step the five-stage chain never creates).
    SELECT * INTO v_next FROM public.approval_steps
    WHERE proposal_id = p.id AND step_order = s.step_order + 1;

    IF v_next.id IS NULL AND p.reservation_id IS NOT NULL THEN
      SELECT r.title INTO v_conflict FROM public.reservations r
      WHERE r.facility_id = p.facility_id AND r.id <> p.reservation_id
        AND r.status = 'approved'
        AND (r.start_datetime, r.end_datetime) OVERLAPS (p.start_datetime, p.end_datetime)
      LIMIT 1;
      IF v_conflict IS NOT NULL THEN
        RETURN jsonb_build_object('success', false, 'error',
          format('Venue conflict: "%s" is already approved for this slot. Return the proposal so the officer can pick another venue or time.', v_conflict));
      END IF;

      SELECT m.title INTO v_conflict FROM public.maintenance_periods m
      WHERE m.facility_id = p.facility_id
        AND (m.start_datetime, m.end_datetime) OVERLAPS (p.start_datetime, p.end_datetime)
      LIMIT 1;
      IF v_conflict IS NOT NULL THEN
        RETURN jsonb_build_object('success', false, 'error',
          format('The venue is under maintenance ("%s") for this slot.', v_conflict));
      END IF;
    END IF;

    v_sig := encode(sha256(convert_to(
      concat_ws('|', p.id, p.reference_no, p.revision, s.id, s.step_role, auth.uid(), v_now), 'UTF8')), 'hex');

    UPDATE public.approval_steps
    SET status = 'approved', acted_by = auth.uid(), acted_at = v_now, comment = v_comment, signature = v_sig
    WHERE id = s.id;

    IF v_next.id IS NOT NULL THEN
      UPDATE public.approval_steps SET status = 'pending', due_at = v_now + interval '48 hours' WHERE id = v_next.id;
      UPDATE public.proposals SET current_step = v_next.step_order WHERE id = p.id;

      INSERT INTO public.proposal_events (proposal_id, actor_id, action, from_status, to_status, step_order, revision, comment)
      VALUES (p.id, auth.uid(), 'approved', 'in_review', 'in_review', s.step_order, p.revision, v_comment);

      PERFORM public.notify_step_approvers(p.id, v_next.step_role,
        'Event proposal awaiting your review',
        format('%s "%s" needs your approval (step %s of %s).', p.reference_no, p.title, v_next.step_order, v_total));
      PERFORM public.notify_user(p.submitted_by, 'Proposal moved forward',
        format('%s approved "%s". Now with: %s.', s.label, p.title, v_next.label), 'proposal_progress', p.id);
    ELSE
      UPDATE public.proposals
      SET status = 'approved', current_step = NULL, decided_at = v_now
      WHERE id = p.id;

      IF p.reservation_id IS NOT NULL THEN
        UPDATE public.reservations
        SET status = 'approved', reviewed_by = auth.uid(), reviewed_at = v_now, updated_at = v_now
        WHERE id = p.reservation_id;
      END IF;

      INSERT INTO public.activities (organization_id, title, description, activity_date, expected_attendees, status, created_by)
      VALUES (p.organization_id, p.title, p.description, (p.start_datetime AT TIME ZONE 'UTC')::date,
              p.expected_attendees, 'approved', p.submitted_by);

      INSERT INTO public.proposal_events (proposal_id, actor_id, action, from_status, to_status, step_order, revision, comment)
      VALUES (p.id, auth.uid(), 'final_approved', 'in_review', 'approved', s.step_order, p.revision, v_comment);

      PERFORM public.notify_user(p.submitted_by, 'Proposal approved',
        format('%s "%s" is fully approved and the venue is confirmed. Download the signed packet.', p.reference_no, p.title),
        'proposal_approved', p.id);
    END IF;

    RETURN jsonb_build_object('success', true, 'signature', v_sig);
  END IF;

  -- Return for revision.
  IF p_action = 'return' THEN
    UPDATE public.approval_steps
    SET status = 'returned', acted_by = auth.uid(), acted_at = v_now, comment = v_comment
    WHERE id = s.id;
    UPDATE public.proposals SET status = 'returned', current_step = NULL WHERE id = p.id;
    IF p.reservation_id IS NOT NULL THEN
      UPDATE public.reservations SET status = 'cancelled', updated_at = v_now WHERE id = p.reservation_id;
    END IF;

    INSERT INTO public.proposal_events (proposal_id, actor_id, action, from_status, to_status, step_order, revision, comment)
    VALUES (p.id, auth.uid(), 'returned', 'in_review', 'returned', s.step_order, p.revision, v_comment);

    PERFORM public.notify_user(p.submitted_by, 'Proposal returned for revision',
      format('%s returned "%s": %s', s.label, p.title, v_comment), 'proposal_returned', p.id);
    RETURN jsonb_build_object('success', true);
  END IF;

  -- Reject.
  UPDATE public.approval_steps
  SET status = 'rejected', acted_by = auth.uid(), acted_at = v_now, comment = v_comment
  WHERE id = s.id;
  UPDATE public.proposals SET status = 'rejected', current_step = NULL, decided_at = v_now WHERE id = p.id;
  IF p.reservation_id IS NOT NULL THEN
    UPDATE public.reservations
    SET status = 'rejected', rejection_reason = v_comment, reviewed_by = auth.uid(), reviewed_at = v_now, updated_at = v_now
    WHERE id = p.reservation_id;
  END IF;

  INSERT INTO public.proposal_events (proposal_id, actor_id, action, from_status, to_status, step_order, revision, comment)
  VALUES (p.id, auth.uid(), 'rejected', 'in_review', 'rejected', s.step_order, p.revision, v_comment);

  PERFORM public.notify_user(p.submitted_by, 'Proposal rejected',
    format('%s rejected "%s": %s', s.label, p.title, v_comment), 'proposal_rejected', p.id);
  RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- cancel_proposal(p_proposal UUID, p_reason TEXT)
DROP FUNCTION IF EXISTS public.cancel_proposal(UUID, TEXT);
CREATE FUNCTION public.cancel_proposal(p_proposal UUID, p_reason TEXT DEFAULT NULL)
RETURNS JSONB AS $$
DECLARE
  p RECORD;
BEGIN
  PERFORM set_config('app.proposal_flow', 'on', true);
  SELECT * INTO p FROM public.proposals WHERE id = p_proposal FOR UPDATE;
  IF p.id IS NULL THEN RAISE EXCEPTION 'Proposal not found.'; END IF;

  IF NOT public.is_org_officer(p.organization_id) THEN
    RETURN jsonb_build_object('success', false, 'error',
      'Only an active president or secretary of this organization can cancel the proposal.');
  END IF;
  IF p.status NOT IN ('draft', 'in_review', 'returned') THEN
    RETURN jsonb_build_object('success', false, 'error', 'This proposal can no longer be cancelled.');
  END IF;

  UPDATE public.proposals SET status = 'cancelled', current_step = NULL, decided_at = now() WHERE id = p.id;
  UPDATE public.approval_steps SET status = 'waiting', due_at = NULL WHERE proposal_id = p.id AND status = 'pending';
  IF p.reservation_id IS NOT NULL THEN
    UPDATE public.reservations SET status = 'cancelled', updated_at = now() WHERE id = p.reservation_id;
  END IF;

  INSERT INTO public.proposal_events (proposal_id, actor_id, action, from_status, to_status, revision, comment)
  VALUES (p.id, auth.uid(), 'cancelled', p.status, 'cancelled', p.revision, nullif(trim(coalesce(p_reason, '')), ''));
  RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- send_overdue_reminders()
CREATE OR REPLACE FUNCTION public.send_overdue_reminders()
RETURNS INT AS $$
DECLARE
  s RECORD;
  v_count INT := 0;
BEGIN
  IF auth.uid() IS NOT NULL AND public.current_role_name() NOT IN ('facility_admin', 'system_admin', 'osa_staff', 'osas', 'campus_director', 'university_president') THEN
    RAISE EXCEPTION 'Access denied.';
  END IF;

  FOR s IN
    SELECT st.*, p.title, p.reference_no, p.revision
    FROM public.approval_steps st JOIN public.proposals p ON p.id = st.proposal_id
    WHERE st.status = 'pending' AND p.status = 'in_review'
      AND st.due_at < now()
      AND (st.reminded_at IS NULL OR st.reminded_at < now() - interval '24 hours')
  LOOP
    PERFORM public.notify_step_approvers(s.proposal_id, s.step_role,
      'Overdue: event proposal awaiting review',
      format('%s "%s" has been waiting since %s.', s.reference_no, s.title, to_char(s.due_at - interval '48 hours', 'Mon DD HH24:MI')));
    UPDATE public.approval_steps SET reminded_at = now() WHERE id = s.id;
    INSERT INTO public.proposal_events (proposal_id, action, step_order, revision)
    VALUES (s.proposal_id, 'reminder_sent', s.step_order, s.revision);
    v_count := v_count + 1;
  END LOOP;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- verify_proposal(p_reference TEXT)
CREATE OR REPLACE FUNCTION public.verify_proposal(p_reference TEXT)
RETURNS JSONB AS $$
  SELECT jsonb_build_object(
    'reference_no', p.reference_no,
    'title', p.title,
    'organization', o.name,
    'status', p.status,
    'revision', p.revision,
    'start_datetime', p.start_datetime,
    'end_datetime', p.end_datetime,
    'decided_at', p.decided_at,
    'steps', coalesce((
      SELECT jsonb_agg(jsonb_build_object(
        'label', s.label, 'status', s.status, 'acted_at', s.acted_at,
        'approver', pr.full_name, 'signature', s.signature) ORDER BY s.step_order)
      FROM public.approval_steps s LEFT JOIN public.profiles pr ON pr.id = s.acted_by
      WHERE s.proposal_id = p.id), '[]'::jsonb)
  )
  FROM public.proposals p JOIN public.organizations o ON o.id = p.organization_id
  WHERE p.reference_no = p_reference AND p.status <> 'draft';
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.verify_proposal(TEXT) TO anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_user(UUID, TEXT, TEXT, TEXT, UUID) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_step_approvers(UUID, TEXT, TEXT, TEXT) FROM PUBLIC, anon, authenticated;

-- ===========================================================================
-- 8. ROW LEVEL SECURITY
-- ===========================================================================

ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposal_budget_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposal_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approval_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposal_events ENABLE ROW LEVEL SECURITY;

-- The proposals table previously carried a blanket "full access" policy from
-- an early hand-written setup. Replace it with the scoped policies below.
DROP POLICY IF EXISTS "Allow authenticated full access to proposals" ON public.proposals;

DROP POLICY IF EXISTS "Proposals visible to involved users" ON public.proposals;
-- The row's OWN columns are referenced inline (submitted_by, organization_id)
-- rather than through can_view_proposal(id), because that helper re-queries
-- public.proposals and therefore cannot see the row being inserted. With the
-- helper, "INSERT ... RETURNING" -- which is what
-- supabase.from('proposals').insert(...).select(...) sends -- fails with
--   42501 new row violates row-level security policy for table "proposals"
-- Inlining the check makes it evaluate against the new tuple directly.
CREATE POLICY "Proposals visible to involved users" ON public.proposals
  FOR SELECT TO authenticated
  USING (
    submitted_by = auth.uid()
    OR public.is_org_officer(organization_id)
    OR public.current_role_name() = 'system_admin'
    OR EXISTS (
      SELECT 1 FROM public.approval_steps s
      WHERE s.proposal_id = proposals.id
        AND s.status <> 'waiting'
        AND public.can_act_as(proposals.id, s.step_role)
    )
  );

DROP POLICY IF EXISTS "Officers create draft proposals" ON public.proposals;
CREATE POLICY "Officers create draft proposals" ON public.proposals
  FOR INSERT TO authenticated
  WITH CHECK (submitted_by = auth.uid() AND status = 'draft' AND public.is_org_officer(organization_id));

DROP POLICY IF EXISTS "Officers edit draft or returned proposals" ON public.proposals;
CREATE POLICY "Officers edit draft or returned proposals" ON public.proposals
  FOR UPDATE TO authenticated
  USING (status IN ('draft', 'returned') AND public.is_org_officer(organization_id))
  WITH CHECK (status IN ('draft', 'returned') AND public.is_org_officer(organization_id));

DROP POLICY IF EXISTS "Officers delete drafts" ON public.proposals;
CREATE POLICY "Officers delete drafts" ON public.proposals
  FOR DELETE TO authenticated
  USING (status = 'draft' AND public.is_org_officer(organization_id));

DROP POLICY IF EXISTS "Budget visible with proposal" ON public.proposal_budget_items;
CREATE POLICY "Budget visible with proposal" ON public.proposal_budget_items
  FOR SELECT TO authenticated USING (public.can_view_proposal(proposal_id));

DROP POLICY IF EXISTS "Budget editable while proposal editable" ON public.proposal_budget_items;
CREATE POLICY "Budget editable while proposal editable" ON public.proposal_budget_items
  FOR ALL TO authenticated
  USING (public.can_edit_proposal(proposal_id))
  WITH CHECK (public.can_edit_proposal(proposal_id));

DROP POLICY IF EXISTS "Attachments visible with proposal" ON public.proposal_attachments;
CREATE POLICY "Attachments visible with proposal" ON public.proposal_attachments
  FOR SELECT TO authenticated USING (public.can_view_proposal(proposal_id));

DROP POLICY IF EXISTS "Attachments editable while proposal editable" ON public.proposal_attachments;
CREATE POLICY "Attachments editable while proposal editable" ON public.proposal_attachments
  FOR ALL TO authenticated
  USING (public.can_edit_proposal(proposal_id))
  WITH CHECK (public.can_edit_proposal(proposal_id) AND uploaded_by = auth.uid());

DROP POLICY IF EXISTS "Steps visible with proposal" ON public.approval_steps;
CREATE POLICY "Steps visible with proposal" ON public.approval_steps
  FOR SELECT TO authenticated USING (public.can_view_proposal(proposal_id));

DROP POLICY IF EXISTS "Events visible with proposal" ON public.proposal_events;
CREATE POLICY "Events visible with proposal" ON public.proposal_events
  FOR SELECT TO authenticated USING (public.can_view_proposal(proposal_id));

-- ===========================================================================
-- 9. STORAGE: private bucket for proposal attachments
-- ===========================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('proposal-files', 'proposal-files', false, 10485760,
  ARRAY['application/pdf', 'image/png', 'image/jpeg',
        'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'])
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Proposal files readable by viewers" ON storage.objects;
CREATE POLICY "Proposal files readable by viewers" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'proposal-files' AND public.can_view_proposal(public.proposal_id_from_path(name)));

DROP POLICY IF EXISTS "Proposal files uploadable by editors" ON storage.objects;
CREATE POLICY "Proposal files uploadable by editors" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'proposal-files' AND public.can_edit_proposal(public.proposal_id_from_path(name)));

DROP POLICY IF EXISTS "Proposal files deletable by editors" ON storage.objects;
CREATE POLICY "Proposal files deletable by editors" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'proposal-files' AND public.can_edit_proposal(public.proposal_id_from_path(name)));

-- ===========================================================================
-- 10. ORGANIZATIONS: hierarchy seed + demo links
-- ===========================================================================

INSERT INTO public.organizations (name, acronym, description, logo_url, status, college, org_type, parent_org_id)
VALUES (
  'Organization for Computing and Technology Advancements', 'OCTA',
  'Mother student organization of the College of Computer Studies (CCS).',
  'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=128&q=80',
  'active', 'College of Computer Studies (CCS)', 'college_mother', NULL
)
ON CONFLICT (acronym) DO UPDATE SET
  name = EXCLUDED.name, description = EXCLUDED.description, logo_url = EXCLUDED.logo_url,
  status = EXCLUDED.status, college = EXCLUDED.college,
  org_type = EXCLUDED.org_type, parent_org_id = EXCLUDED.parent_org_id;

INSERT INTO public.organizations (name, acronym, description, logo_url, status, college, org_type, parent_org_id)
VALUES
  ('Association for Leadership, Governance, and Organization', 'ALGO',
   'Sub-organization of OCTA for Computer Science Students.',
   'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=128&q=80',
   'active', 'College of Computer Studies (CCS)', 'program_sub_org',
   (SELECT id FROM public.organizations WHERE acronym = 'OCTA')),
  ('BSIT', 'BSIT',
   'Sub-organization of OCTA for Information Technology Students.',
   'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=128&q=80',
   'active', 'College of Computer Studies (CCS)', 'program_sub_org',
   (SELECT id FROM public.organizations WHERE acronym = 'OCTA')),
  ('College of Engineering Student Council', 'COESC',
   'Apex student governing body for student welfare and activities across all colleges.',
   'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=128&q=80',
   'active', 'College of Engineering (COE)', 'college_mother', NULL)
ON CONFLICT (acronym) DO UPDATE SET
  name = EXCLUDED.name, description = EXCLUDED.description, logo_url = EXCLUDED.logo_url,
  status = EXCLUDED.status, college = EXCLUDED.college,
  org_type = EXCLUDED.org_type, parent_org_id = EXCLUDED.parent_org_id;

-- The demo officer becomes president of OCTA so the proposal flow is usable.
INSERT INTO public.organization_members (organization_id, user_id, organization_role, membership_status)
SELECT o.id, p.id, 'president', 'active'
FROM public.organizations o JOIN public.profiles p ON p.email = 'officer@campus.edu'
WHERE o.acronym = 'OCTA'
ON CONFLICT (organization_id, user_id)
DO UPDATE SET organization_role = 'president', membership_status = 'active';

-- Dedicated organization test accounts (OCTA, ALGO, BSIT, COESC)
INSERT INTO public.organization_members (organization_id, user_id, organization_role, membership_status)
SELECT o.id, p.id, 'president', 'active'
FROM public.organizations o JOIN public.profiles p ON p.email = 'octa.president@campus.edu'
WHERE o.acronym = 'OCTA'
ON CONFLICT (organization_id, user_id) DO UPDATE SET organization_role = 'president', membership_status = 'active';

INSERT INTO public.organization_members (organization_id, user_id, organization_role, membership_status)
SELECT o.id, p.id, 'secretary', 'active'
FROM public.organizations o JOIN public.profiles p ON p.email = 'octa.secretary@campus.edu'
WHERE o.acronym = 'OCTA'
ON CONFLICT (organization_id, user_id) DO UPDATE SET organization_role = 'secretary', membership_status = 'active';

INSERT INTO public.organization_members (organization_id, user_id, organization_role, membership_status)
SELECT o.id, p.id, 'president', 'active'
FROM public.organizations o JOIN public.profiles p ON p.email = 'algo.president@campus.edu'
WHERE o.acronym = 'ALGO'
ON CONFLICT (organization_id, user_id) DO UPDATE SET organization_role = 'president', membership_status = 'active';

INSERT INTO public.organization_members (organization_id, user_id, organization_role, membership_status)
SELECT o.id, p.id, 'secretary', 'active'
FROM public.organizations o JOIN public.profiles p ON p.email = 'algo.secretary@campus.edu'
WHERE o.acronym = 'ALGO'
ON CONFLICT (organization_id, user_id) DO UPDATE SET organization_role = 'secretary', membership_status = 'active';

INSERT INTO public.organization_members (organization_id, user_id, organization_role, membership_status)
SELECT o.id, p.id, 'president', 'active'
FROM public.organizations o JOIN public.profiles p ON p.email = 'bsit.president@campus.edu'
WHERE o.acronym = 'BSIT'
ON CONFLICT (organization_id, user_id) DO UPDATE SET organization_role = 'president', membership_status = 'active';

INSERT INTO public.organization_members (organization_id, user_id, organization_role, membership_status)
SELECT o.id, p.id, 'secretary', 'active'
FROM public.organizations o JOIN public.profiles p ON p.email = 'bsit.secretary@campus.edu'
WHERE o.acronym = 'BSIT'
ON CONFLICT (organization_id, user_id) DO UPDATE SET organization_role = 'secretary', membership_status = 'active';

INSERT INTO public.organization_members (organization_id, user_id, organization_role, membership_status)
SELECT o.id, p.id, 'president', 'active'
FROM public.organizations o JOIN public.profiles p ON p.email = 'coesc.president@campus.edu'
WHERE o.acronym = 'COESC'
ON CONFLICT (organization_id, user_id) DO UPDATE SET organization_role = 'president', membership_status = 'active';

INSERT INTO public.organization_members (organization_id, user_id, organization_role, membership_status)
SELECT o.id, p.id, 'secretary', 'active'
FROM public.organizations o JOIN public.profiles p ON p.email = 'coesc.secretary@campus.edu'
WHERE o.acronym = 'COESC'
ON CONFLICT (organization_id, user_id) DO UPDATE SET organization_role = 'secretary', membership_status = 'active';

UPDATE public.profiles
SET primary_role = 'officer', account_status = 'active'
WHERE email IN (
  'officer@campus.edu',
  'octa.president@campus.edu',
  'octa.secretary@campus.edu',
  'algo.president@campus.edu',
  'algo.secretary@campus.edu',
  'bsit.president@campus.edu',
  'bsit.secretary@campus.edu',
  'coesc.president@campus.edu',
  'coesc.secretary@campus.edu'
);

-- Keep ACM membership too (linked by 20261113).
INSERT INTO public.organization_members (organization_id, user_id, organization_role, membership_status)
SELECT o.id, p.id, 'officer', 'active'
FROM public.organizations o JOIN public.profiles p ON p.email = 'officer@campus.edu'
WHERE o.acronym = 'ACM'
ON CONFLICT (organization_id, user_id)
DO UPDATE SET membership_status = 'active';

-- Roles for the demo approver accounts. The accounts themselves are created
-- by scripts/seed-demo-accounts.mjs (SQL cannot create Supabase Auth users),
-- so these are no-ops until that script has been run.
UPDATE public.profiles SET primary_role = 'adviser'             WHERE email = 'adviser@campus.edu';
UPDATE public.profiles SET primary_role = 'college_dean'        WHERE email = 'dean@campus.edu';
UPDATE public.profiles SET primary_role = 'osas'                WHERE email = 'osas@campus.edu';
UPDATE public.profiles SET primary_role = 'campus_director'     WHERE email = 'director@campus.edu';
UPDATE public.profiles SET primary_role = 'university_president' WHERE email = 'president@campus.edu';

-- The organisation adviser is referenced by organisations.adviser_id, not by
-- organisation_members, so the adviser can approve without being able to file
-- proposals of their own.
UPDATE public.organizations o SET adviser_id = p.id
FROM public.profiles p
WHERE p.email = 'adviser@campus.edu' AND o.acronym = 'OCTA';

-- ===========================================================================
-- 11. REALTIME
-- ===========================================================================

DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  EXCEPTION WHEN duplicate_object OR undefined_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.proposals;
  EXCEPTION WHEN duplicate_object OR undefined_object THEN NULL;
  END;
END $$;

-- ===========================================================================
-- 12. SCHEMA GUARD
--     Fails loudly if anything the app depends on is still missing, so a
--     skipped migration can never produce a silent runtime error again.
-- ===========================================================================
DO $$
DECLARE
  v_missing TEXT[] := ARRAY[]::TEXT[];
  v_tbl TEXT;
  v_col TEXT;
  v_fn TEXT;
  v_required_tables TEXT[] := ARRAY[
    'public.proposals', 'public.proposal_budget_items',
    'public.proposal_attachments', 'public.approval_steps', 'public.proposal_events'
  ];
  v_required_columns TEXT[] := ARRAY[
    'public.reservations.proposal_id',
    'public.notifications.related_proposal_id',
    'public.organizations.parent_org_id',
    'public.organizations.college',
    'public.organizations.org_type',
    'public.organizations.adviser_id'
  ];
  v_required_functions TEXT[] := ARRAY[
    'public.current_role_name()',
    'public.is_org_officer(uuid)',
    'public.can_act_as(uuid, text)',
    'public.can_view_proposal(uuid)',
    'public.can_edit_proposal(uuid)',
    'public.proposal_id_from_path(text)',
    'public.notify_user(uuid, text, text, text, uuid)',
    'public.notify_step_approvers(uuid, text, text, text)',
    'public.check_schedule_conflicts(uuid, timestamptz, timestamptz, uuid)',
    'public.submit_proposal(uuid)',
    'public.act_on_proposal(uuid, text, text)',
    'public.cancel_proposal(uuid, text)',
    'public.send_overdue_reminders()',
    'public.verify_proposal(text)',
    'public.log_proposal_created()',
    'public.touch_updated_at()',
    'public.guard_proposal_reservation()',
    'public.guard_proposal_workflow_fields()'
  ];
BEGIN
  FOREACH v_tbl IN ARRAY v_required_tables LOOP
    IF to_regclass(v_tbl) IS NULL THEN
      v_missing := array_append(v_missing, 'table ' || v_tbl);
    END IF;
  END LOOP;

  FOREACH v_col IN ARRAY v_required_columns LOOP
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema || '.' || table_name || '.' || column_name = v_col
    ) THEN
      v_missing := array_append(v_missing, 'column ' || v_col);
    END IF;
  END LOOP;

  FOREACH v_fn IN ARRAY v_required_functions LOOP
    IF to_regprocedure(v_fn) IS NULL THEN
      v_missing := array_append(v_missing, 'function ' || v_fn);
    END IF;
  END LOOP;

  -- submit_proposal must keep the parameter name the app calls.
  IF NOT EXISTS (
    SELECT 1
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = 'submit_proposal'
      AND p.pronargs = 1
      AND p.proargnames = ARRAY['p_proposal']::text[]
  ) THEN
    v_missing := array_append(v_missing, 'function public.submit_proposal(p_proposal)');
  END IF;

  IF array_length(v_missing, 1) > 0 THEN
    RAISE EXCEPTION 'Schema guard failed - missing: %', array_to_string(v_missing, ', ');
  END IF;
END $$;

-- ===========================================================================
-- 13. POSTGREST SCHEMA CACHE
--     PostgREST caches the database schema. Without this notification it
--     keeps serving the old cache and every request fails with
--     "Could not find the table ... in the schema cache" even though the
--     table exists. This is the exact error that hid this whole migration.
-- ===========================================================================
NOTIFY pgrst, 'reload schema';
