-- ONE Facility demo cleanup: real Supabase data only
--
-- 1. Public (anon) read access to catalog tables so discovery/exploration works
--    without requiring a login. Reservations, notifications, and profiles stay
--    private (authenticated only).
-- 2. Notifications INSERT: any authenticated user may insert notifications for
--    themselves; administrators (is_admin()) may insert for any user.

DO $$ BEGIN
  CREATE POLICY "Anon read for buildings" ON public.buildings FOR SELECT TO anon USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Anon read for floors" ON public.floors FOR SELECT TO anon USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Anon read for facilities" ON public.facilities FOR SELECT TO anon USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Anon read for schedules" ON public.facility_schedules FOR SELECT TO anon USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Anon read for maintenance" ON public.maintenance_periods FOR SELECT TO anon USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Anon read for organizations" ON public.organizations FOR SELECT TO anon USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Anon read for activities" ON public.activities FOR SELECT TO anon USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users and admins can insert notifications" ON public.notifications
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id OR public.is_admin());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
