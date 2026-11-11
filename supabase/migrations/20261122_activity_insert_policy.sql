-- ONE Facility: allow organisation officers to record activities
--
-- public.activities has row-level security enabled but only SELECT policies
-- ("Activities viewable by all", "Anon read for activities"). Any INSERT is
-- therefore rejected with:
--
--   42501 new row violates row-level security policy for table "activities"
--
-- which is what the "New Organization Activity" form on the organisation
-- dashboard hits. This migration adds the missing INSERT policy, scoped to
-- organisation officers so it matches public.is_org_officer() and the rule
-- the proposals policies already use.
--
-- Idempotent: safe to re-run.

DROP POLICY IF EXISTS "Officers create activities" ON public.activities;
CREATE POLICY "Officers create activities" ON public.activities
  FOR INSERT TO authenticated
  WITH CHECK (public.is_org_officer(organization_id));

-- Officers may also correct or remove an activity they own.
DROP POLICY IF EXISTS "Officers update own activities" ON public.activities;
CREATE POLICY "Officers update own activities" ON public.activities
  FOR UPDATE TO authenticated
  USING (public.is_org_officer(organization_id))
  WITH CHECK (public.is_org_officer(organization_id));

DROP POLICY IF EXISTS "Officers delete own activities" ON public.activities;
CREATE POLICY "Officers delete own activities" ON public.activities
  FOR DELETE TO authenticated
  USING (public.is_org_officer(organization_id));

-- Guard: the policy must exist, otherwise the activity form fails silently
-- against the row-level security layer.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'activities'
      AND policyname = 'Officers create activities'
      AND cmd = 'INSERT'
  ) THEN
    RAISE EXCEPTION 'Schema guard failed - missing policy: Officers create activities on public.activities';
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';
