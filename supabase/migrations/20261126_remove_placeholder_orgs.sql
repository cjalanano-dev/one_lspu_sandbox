-- Migration: 20261126_remove_placeholder_orgs.sql
-- Description: Removes the placeholder student organizations ACM, SME and USSC.
-- Foreign keys handle dependents: organization_members, activities and
-- proposals cascade; reservations.organization_id and child parent_org_id
-- are set to NULL. Also removes the USSC-only demo accounts.

DELETE FROM public.organizations
WHERE upper(acronym) IN ('ACM', 'SME', 'USSC');

-- Remove the USSC demo accounts. Skip any that are still referenced elsewhere
-- (e.g. as a proposal signer) instead of failing the migration.
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT id, email FROM auth.users
    WHERE email IN ('ussc.adviser@campus.edu', 'ussc.president@campus.edu', 'ussc.secretary@campus.edu')
  LOOP
    BEGIN
      DELETE FROM public.profiles WHERE id = r.id;
      DELETE FROM auth.users WHERE id = r.id;
    EXCEPTION WHEN foreign_key_violation THEN
      RAISE NOTICE 'Kept % (still referenced)', r.email;
    END;
  END LOOP;
END $$;

NOTIFY pgrst, 'reload schema';

