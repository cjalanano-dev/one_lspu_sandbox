-- ONE Facility: Digital Event Proposals & Multi-step Approval Routing
--
-- An organization officer files an event proposal (details, venue/schedule,
-- budget, attachments). On submit it is routed through a fixed approval chain:
--   1. Org Adviser  ->  2. Student Affairs (OSA)  ->  3. Facility Admin
-- Approvers may approve, return (with comments, for revision) or reject.
-- Every action is written to an append-only audit trail and each approval is
-- stamped with a verification signature (sha256) for the printable packet.

-- ---------------------------------------------------------------------------
-- 1. ROLES & ORGANIZATION ADVISER
-- ---------------------------------------------------------------------------
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_primary_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_primary_role_check
  CHECK (primary_role IN ('student', 'faculty', 'officer', 'adviser', 'osa_staff', 'facility_admin', 'system_admin'));

ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS adviser_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- ---------------------------------------------------------------------------
-- 2. TABLES
-- ---------------------------------------------------------------------------
CREATE SEQUENCE IF NOT EXISTS public.proposal_reference_seq;

CREATE TABLE IF NOT EXISTS public.proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_no TEXT UNIQUE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  submitted_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  event_type TEXT NOT NULL DEFAULT 'other'
    CHECK (event_type IN ('academic', 'seminar', 'competition', 'social', 'outreach', 'sports', 'meeting', 'other')),
  description TEXT,
  objectives TEXT,
  start_datetime TIMESTAMPTZ,
  end_datetime TIMESTAMPTZ,
  expected_attendees INT NOT NULL DEFAULT 1 CHECK (expected_attendees > 0),
  facility_id UUID REFERENCES public.facilities(id) ON DELETE SET NULL,
  requested_equipment JSONB NOT NULL DEFAULT '[]'::jsonb,
  reservation_id UUID REFERENCES public.reservations(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'in_review', 'returned', 'approved', 'rejected', 'cancelled')),
  current_step INT,
  revision INT NOT NULL DEFAULT 1,
  submitted_at TIMESTAMPTZ,
  decided_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CHECK (start_datetime IS NULL OR end_datetime IS NULL OR start_datetime < end_datetime)
);

CREATE TABLE IF NOT EXISTS public.proposal_budget_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID NOT NULL REFERENCES public.proposals(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity NUMERIC(12, 2) NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_cost NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (unit_cost >= 0),
  source_of_funds TEXT NOT NULL DEFAULT 'org_funds'
    CHECK (source_of_funds IN ('org_funds', 'student_fees', 'sponsorship', 'school_subsidy', 'other')),
  position INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.proposal_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID NOT NULL REFERENCES public.proposals(id) ON DELETE CASCADE,
  doc_type TEXT NOT NULL DEFAULT 'other'
    CHECK (doc_type IN ('proposal_letter', 'program_flow', 'budget_breakdown', 'parental_waiver', 'other')),
  file_name TEXT NOT NULL,
  storage_path TEXT NOT NULL UNIQUE,
  size_bytes BIGINT,
  uploaded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.approval_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID NOT NULL REFERENCES public.proposals(id) ON DELETE CASCADE,
  step_order INT NOT NULL,
  step_role TEXT NOT NULL CHECK (step_role IN ('adviser', 'osa_staff', 'facility_admin')),
  label TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'waiting'
    CHECK (status IN ('waiting', 'pending', 'approved', 'returned', 'rejected')),
  acted_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  acted_at TIMESTAMPTZ,
  comment TEXT,
  due_at TIMESTAMPTZ,
  reminded_at TIMESTAMPTZ,
  signature TEXT,
  UNIQUE (proposal_id, step_order)
);

CREATE TABLE IF NOT EXISTS public.proposal_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID NOT NULL REFERENCES public.proposals(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL
    CHECK (action IN ('created', 'submitted', 'resubmitted', 'approved', 'returned', 'rejected', 'cancelled', 'final_approved', 'reminder_sent')),
  from_status TEXT,
  to_status TEXT,
  step_order INT,
  revision INT,
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.reservations
  ADD COLUMN IF NOT EXISTS proposal_id UUID REFERENCES public.proposals(id) ON DELETE SET NULL;

ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS related_proposal_id UUID REFERENCES public.proposals(id) ON DELETE CASCADE;
ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_notification_type_check;
ALTER TABLE public.notifications ADD CONSTRAINT notifications_notification_type_check
  CHECK (notification_type IN (
    'reservation_submitted', 'reservation_approved', 'reservation_rejected', 'reservation_cancelled',
    'maintenance_alert', 'info',
    'proposal_action_required', 'proposal_progress', 'proposal_returned',
    'proposal_approved', 'proposal_rejected', 'proposal_overdue'
  ));

CREATE INDEX IF NOT EXISTS idx_proposals_org ON public.proposals (organization_id, status);
CREATE INDEX IF NOT EXISTS idx_proposals_submitter ON public.proposals (submitted_by);
CREATE INDEX IF NOT EXISTS idx_approval_steps_pending ON public.approval_steps (step_role, status);
CREATE INDEX IF NOT EXISTS idx_proposal_events_proposal ON public.proposal_events (proposal_id, created_at);
CREATE INDEX IF NOT EXISTS idx_budget_items_proposal ON public.proposal_budget_items (proposal_id);
CREATE INDEX IF NOT EXISTS idx_attachments_proposal ON public.proposal_attachments (proposal_id);

-- ---------------------------------------------------------------------------
-- 3. HELPER FUNCTIONS (SECURITY DEFINER so they can be used inside RLS)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.current_role_name()
RETURNS TEXT AS $$
  SELECT primary_role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

-- Officer (any active non-"member" role) of the given organization
CREATE OR REPLACE FUNCTION public.is_org_officer(p_org UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_id = p_org
      AND user_id = auth.uid()
      AND membership_status = 'active'
      AND organization_role <> 'member'
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

-- Can the current user act on a step with the given role for this proposal?
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

  RETURN v_role = p_step_role;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

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
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.can_edit_proposal(p_proposal UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.proposals p
    WHERE p.id = p_proposal
      AND p.status IN ('draft', 'returned')
      AND public.is_org_officer(p.organization_id)
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

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

CREATE OR REPLACE FUNCTION public.notify_step_approvers(p_proposal UUID, p_step_role TEXT, p_title TEXT, p_message TEXT)
RETURNS VOID AS $$
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

-- ---------------------------------------------------------------------------
-- 4. GUARD: proposal-linked reservations can only change through the workflow
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.guard_proposal_reservation()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.proposal_id IS NOT NULL
     AND NEW.status IS DISTINCT FROM OLD.status
     AND coalesce(current_setting('app.proposal_flow', true), '') <> 'on' THEN
    RAISE EXCEPTION 'This reservation belongs to event proposal and can only be decided through the proposal approval flow.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_guard_proposal_reservation ON public.reservations;
CREATE TRIGGER trg_guard_proposal_reservation
  BEFORE UPDATE ON public.reservations
  FOR EACH ROW EXECUTE FUNCTION public.guard_proposal_reservation();

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_proposals_touch ON public.proposals;
CREATE TRIGGER trg_proposals_touch
  BEFORE UPDATE ON public.proposals
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

-- ---------------------------------------------------------------------------
-- 5. ROW LEVEL SECURITY
-- ---------------------------------------------------------------------------
ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposal_budget_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposal_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approval_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposal_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Proposals visible to involved users" ON public.proposals;
CREATE POLICY "Proposals visible to involved users" ON public.proposals
  FOR SELECT TO authenticated USING (public.can_view_proposal(id));

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

-- ---------------------------------------------------------------------------
-- 6. WORKFLOW RPCs
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.submit_proposal(p_proposal UUID)
RETURNS JSONB AS $$
DECLARE
  p RECORD;
  f RECORD;
  v_conflict TEXT;
  v_reservation UUID;
  v_action TEXT;
  v_from TEXT;
BEGIN
  PERFORM set_config('app.proposal_flow', 'on', true);

  SELECT * INTO p FROM public.proposals WHERE id = p_proposal FOR UPDATE;
  IF p IS NULL THEN RAISE EXCEPTION 'Proposal not found.'; END IF;
  IF NOT public.is_org_officer(p.organization_id) THEN
    RAISE EXCEPTION 'Only officers of this organization can submit the proposal.';
  END IF;
  IF p.status NOT IN ('draft', 'returned') THEN
    RAISE EXCEPTION 'Only draft or returned proposals can be submitted.';
  END IF;

  IF coalesce(trim(p.title), '') = '' OR p.start_datetime IS NULL OR p.end_datetime IS NULL OR p.facility_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Title, schedule and venue are required before submitting.');
  END IF;
  IF p.start_datetime < now() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Event schedule must be in the future.');
  END IF;

  SELECT * INTO f FROM public.facilities WHERE id = p.facility_id;
  IF f IS NULL OR NOT f.reservation_enabled THEN
    RETURN jsonb_build_object('success', false, 'error', 'Selected venue is not open for reservations.');
  END IF;
  IF p.expected_attendees > f.capacity THEN
    RETURN jsonb_build_object('success', false, 'error',
      format('Expected attendees (%s) exceed venue capacity (%s).', p.expected_attendees, f.capacity));
  END IF;

  SELECT r.title INTO v_conflict FROM public.reservations r
  WHERE r.facility_id = p.facility_id AND r.status = 'approved'
    AND r.id IS DISTINCT FROM p.reservation_id
    AND (r.start_datetime, r.end_datetime) OVERLAPS (p.start_datetime, p.end_datetime)
  LIMIT 1;
  IF v_conflict IS NOT NULL THEN
    RETURN jsonb_build_object('success', false, 'error', format('Venue already booked for "%s" during this time.', v_conflict));
  END IF;
  SELECT m.title INTO v_conflict FROM public.maintenance_periods m
  WHERE m.facility_id = p.facility_id
    AND (m.start_datetime, m.end_datetime) OVERLAPS (p.start_datetime, p.end_datetime)
  LIMIT 1;
  IF v_conflict IS NOT NULL THEN
    RETURN jsonb_build_object('success', false, 'error', format('Venue is under maintenance ("%s") during this time.', v_conflict));
  END IF;

  IF p.reservation_id IS NULL THEN
    INSERT INTO public.reservations (facility_id, requester_id, organization_id, title, purpose,
      start_datetime, end_datetime, attendee_count, requested_equipment, status, proposal_id)
    VALUES (p.facility_id, p.submitted_by, p.organization_id, p.title,
      coalesce(nullif(p.description, ''), 'Event proposal ' || coalesce(p.reference_no, '')),
      p.start_datetime, p.end_datetime, p.expected_attendees, p.requested_equipment, 'pending', p.id)
    RETURNING id INTO v_reservation;
  ELSE
    v_reservation := p.reservation_id;
    UPDATE public.reservations
    SET facility_id = p.facility_id, title = p.title,
        purpose = coalesce(nullif(p.description, ''), purpose),
        start_datetime = p.start_datetime, end_datetime = p.end_datetime,
        attendee_count = p.expected_attendees, requested_equipment = p.requested_equipment,
        status = 'pending', rejection_reason = NULL, reviewed_by = NULL, reviewed_at = NULL,
        updated_at = timezone('utc'::text, now())
    WHERE id = v_reservation;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.approval_steps WHERE proposal_id = p.id) THEN
    INSERT INTO public.approval_steps (proposal_id, step_order, step_role, label) VALUES
      (p.id, 1, 'adviser', 'Organization Adviser'),
      (p.id, 2, 'osa_staff', 'Office of Student Affairs'),
      (p.id, 3, 'facility_admin', 'Facility Administrator');
  ELSE
    UPDATE public.approval_steps
    SET status = 'waiting', acted_by = NULL, acted_at = NULL, comment = NULL,
        due_at = NULL, reminded_at = NULL, signature = NULL
    WHERE proposal_id = p.id;
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

  INSERT INTO public.proposal_events (proposal_id, actor_id, action, from_status, to_status, step_order, revision)
  VALUES (p.id, auth.uid(), v_action, v_from, 'in_review', 1, p.revision);

  PERFORM public.notify_step_approvers(p.id, 'adviser',
    'Event proposal awaiting your review',
    format('%s "%s" needs your approval (step 1 of 3).', p.reference_no, p.title));

  RETURN jsonb_build_object('success', true, 'reference_no', p.reference_no, 'revision', p.revision);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.act_on_proposal(p_proposal UUID, p_action TEXT, p_comment TEXT DEFAULT NULL)
RETURNS JSONB AS $$
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
  IF p IS NULL THEN RAISE EXCEPTION 'Proposal not found.'; END IF;
  IF p.status <> 'in_review' THEN
    RAISE EXCEPTION 'This proposal is not awaiting review.';
  END IF;

  SELECT * INTO s FROM public.approval_steps
  WHERE proposal_id = p.id AND step_order = p.current_step FOR UPDATE;
  IF s IS NULL OR s.status <> 'pending' THEN
    RAISE EXCEPTION 'No pending approval step found.';
  END IF;
  IF NOT public.can_act_as(p.id, s.step_role) THEN
    RAISE EXCEPTION 'You are not the assigned approver for this step (%).', s.label;
  END IF;
  IF p_action IN ('return', 'reject') AND v_comment IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Please add a comment explaining the decision.');
  END IF;

  SELECT count(*) INTO v_total FROM public.approval_steps WHERE proposal_id = p.id;

  IF p_action = 'approve' THEN
    IF s.step_role = 'facility_admin' AND p.reservation_id IS NOT NULL THEN
      SELECT r.title INTO v_conflict FROM public.reservations r, public.reservations mine
      WHERE mine.id = p.reservation_id
        AND r.facility_id = mine.facility_id AND r.id <> mine.id AND r.status = 'approved'
        AND (r.start_datetime, r.end_datetime) OVERLAPS (mine.start_datetime, mine.end_datetime)
      LIMIT 1;
      IF v_conflict IS NOT NULL THEN
        RETURN jsonb_build_object('success', false, 'error',
          format('Venue conflict: "%s" is already approved for this slot. Return the proposal so the officer can pick another venue/time.', v_conflict));
      END IF;
      SELECT m.title INTO v_conflict FROM public.maintenance_periods m, public.reservations mine
      WHERE mine.id = p.reservation_id AND m.facility_id = mine.facility_id
        AND (m.start_datetime, m.end_datetime) OVERLAPS (mine.start_datetime, mine.end_datetime)
      LIMIT 1;
      IF v_conflict IS NOT NULL THEN
        RETURN jsonb_build_object('success', false, 'error',
          format('Venue is under maintenance ("%s") during this slot.', v_conflict));
      END IF;
    END IF;

    v_sig := encode(sha256(convert_to(
      concat_ws('|', p.id, p.reference_no, p.revision, s.id, s.step_role, auth.uid(), v_now), 'UTF8')), 'hex');

    UPDATE public.approval_steps
    SET status = 'approved', acted_by = auth.uid(), acted_at = v_now, comment = v_comment, signature = v_sig
    WHERE id = s.id;

    SELECT * INTO v_next FROM public.approval_steps
    WHERE proposal_id = p.id AND step_order = s.step_order + 1;

    IF v_next IS NOT NULL THEN
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

      PERFORM public.notify_user(p.submitted_by, 'Event proposal approved 🎉',
        format('%s "%s" is fully approved and the venue is confirmed. Download the signed packet.', p.reference_no, p.title),
        'proposal_approved', p.id);
    END IF;

    RETURN jsonb_build_object('success', true, 'signature', v_sig);
  END IF;

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

CREATE OR REPLACE FUNCTION public.cancel_proposal(p_proposal UUID, p_reason TEXT DEFAULT NULL)
RETURNS JSONB AS $$
DECLARE
  p RECORD;
BEGIN
  PERFORM set_config('app.proposal_flow', 'on', true);
  SELECT * INTO p FROM public.proposals WHERE id = p_proposal FOR UPDATE;
  IF p IS NULL THEN RAISE EXCEPTION 'Proposal not found.'; END IF;
  IF NOT public.is_org_officer(p.organization_id) THEN
    RAISE EXCEPTION 'Only officers of this organization can cancel the proposal.';
  END IF;
  IF p.status NOT IN ('draft', 'in_review', 'returned') THEN
    RAISE EXCEPTION 'This proposal can no longer be cancelled.';
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

CREATE OR REPLACE FUNCTION public.send_overdue_reminders()
RETURNS INT AS $$
DECLARE
  s RECORD;
  v_count INT := 0;
BEGIN
  IF auth.uid() IS NOT NULL AND public.current_role_name() NOT IN ('facility_admin', 'system_admin', 'osa_staff') THEN
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

-- ---------------------------------------------------------------------------
-- 7. STORAGE: private bucket for proposal attachments ("<proposal_id>/<file>")
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- 8. REALTIME (live notification bell & proposal status)
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- 9. DEMO ROLES (no-ops unless these accounts exist)
-- ---------------------------------------------------------------------------
UPDATE public.profiles SET primary_role = 'adviser' WHERE email = 'adviser@campus.edu';
UPDATE public.profiles SET primary_role = 'osa_staff' WHERE email = 'osa@campus.edu';
UPDATE public.organizations o SET adviser_id = p.id
FROM public.profiles p
WHERE p.email = 'adviser@campus.edu' AND o.acronym = 'ACM';
