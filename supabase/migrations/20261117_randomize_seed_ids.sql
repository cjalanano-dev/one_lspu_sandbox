-- supabase/migrations/20261117_randomize_seed_ids.sql
--
-- Randomizes the recognizable "seed-style" IDs (11111111-*, 22222222-*,
-- 33333333-*, a1111111-*, b2222222-*, c3333333-*) used by demo data so every
-- primary key is a proper random UUID.
--
-- All affected foreign keys are switched to ON UPDATE CASCADE first, so
-- changing the primary keys propagates automatically to every referencing row.
-- buildings.code, facilities.facility_code, and organization acronyms are
-- left untouched, so every app lookup and route keeps working.
--
-- Idempotent: running it twice is safe.
--
-- NOTE: Apply this in Supabase Dashboard → SQL Editor. It cannot be applied
-- with the anon key (no DDL permission).

BEGIN;

-- 1. Cascade updates on every FK that references a seeded table.
ALTER TABLE public.floors
  DROP CONSTRAINT IF EXISTS floors_building_id_fkey,
  ADD CONSTRAINT floors_building_id_fkey
    FOREIGN KEY (building_id) REFERENCES public.buildings(id)
    ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE public.facilities
  DROP CONSTRAINT IF EXISTS facilities_building_id_fkey,
  ADD CONSTRAINT facilities_building_id_fkey
    FOREIGN KEY (building_id) REFERENCES public.buildings(id)
    ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE public.facilities
  DROP CONSTRAINT IF EXISTS facilities_floor_id_fkey,
  ADD CONSTRAINT facilities_floor_id_fkey
    FOREIGN KEY (floor_id) REFERENCES public.floors(id)
    ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE public.facility_schedules
  DROP CONSTRAINT IF EXISTS facility_schedules_facility_id_fkey,
  ADD CONSTRAINT facility_schedules_facility_id_fkey
    FOREIGN KEY (facility_id) REFERENCES public.facilities(id)
    ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE public.maintenance_periods
  DROP CONSTRAINT IF EXISTS maintenance_periods_facility_id_fkey,
  ADD CONSTRAINT maintenance_periods_facility_id_fkey
    FOREIGN KEY (facility_id) REFERENCES public.facilities(id)
    ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE public.facility_administrators
  DROP CONSTRAINT IF EXISTS facility_administrators_facility_id_fkey,
  ADD CONSTRAINT facility_administrators_facility_id_fkey
    FOREIGN KEY (facility_id) REFERENCES public.facilities(id)
    ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE public.reservations
  DROP CONSTRAINT IF EXISTS reservations_facility_id_fkey,
  ADD CONSTRAINT reservations_facility_id_fkey
    FOREIGN KEY (facility_id) REFERENCES public.facilities(id)
    ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE public.reservations
  DROP CONSTRAINT IF EXISTS reservations_organization_id_fkey,
  ADD CONSTRAINT reservations_organization_id_fkey
    FOREIGN KEY (organization_id) REFERENCES public.organizations(id)
    ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE public.organization_members
  DROP CONSTRAINT IF EXISTS organization_members_organization_id_fkey,
  ADD CONSTRAINT organization_members_organization_id_fkey
    FOREIGN KEY (organization_id) REFERENCES public.organizations(id)
    ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE public.activities
  DROP CONSTRAINT IF EXISTS activities_organization_id_fkey,
  ADD CONSTRAINT activities_organization_id_fkey
    FOREIGN KEY (organization_id) REFERENCES public.organizations(id)
    ON UPDATE CASCADE ON DELETE CASCADE;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'proposals'
  ) THEN
    ALTER TABLE public.proposals
      DROP CONSTRAINT IF EXISTS proposals_organization_id_fkey,
      ADD CONSTRAINT proposals_organization_id_fkey
        FOREIGN KEY (organization_id) REFERENCES public.organizations(id)
        ON UPDATE CASCADE ON DELETE CASCADE;

    ALTER TABLE public.proposals
      DROP CONSTRAINT IF EXISTS proposals_facility_id_fkey,
      ADD CONSTRAINT proposals_facility_id_fkey
        FOREIGN KEY (facility_id) REFERENCES public.facilities(id)
        ON UPDATE CASCADE ON DELETE SET NULL;
  END IF;
END $$;

-- 2. Randomize the seeded primary keys.
UPDATE public.buildings
SET id = gen_random_uuid()
WHERE id IN (
  '11111111-0000-0000-0000-000000000001',
  '11111111-0000-0000-0000-000000000002',
  '11111111-0000-0000-0000-000000000003'
);

UPDATE public.floors
SET id = gen_random_uuid()
WHERE id IN (
  '22222222-0000-0000-0000-000000000001',
  '22222222-0000-0000-0000-000000000002',
  '22222222-0000-0000-0000-000000000003',
  '22222222-0000-0000-0000-000000000004'
);

UPDATE public.facilities
SET id = gen_random_uuid()
WHERE id IN (
  '33333333-0000-0000-0000-000000000001',
  '33333333-0000-0000-0000-000000000002',
  '33333333-0000-0000-0000-000000000003',
  '33333333-0000-0000-0000-000000000004',
  '33333333-0000-0000-0000-000000000005'
);

UPDATE public.organizations
SET id = gen_random_uuid()
WHERE id IN (
  'a1111111-1111-1111-1111-111111111111',
  'b2222222-2222-2222-2222-222222222222',
  'c3333333-3333-3333-3333-333333333333'
);

-- 3. Guard: fail loudly if any patterned ID is still present.
DO $$
DECLARE
  bad_buildings int;
  bad_floors int;
  bad_facilities int;
  bad_organizations int;
BEGIN
  SELECT COUNT(*) INTO bad_buildings
    FROM public.buildings
    WHERE id IN (
      '11111111-0000-0000-0000-000000000001',
      '11111111-0000-0000-0000-000000000002',
      '11111111-0000-0000-0000-000000000003'
    );
  SELECT COUNT(*) INTO bad_floors
    FROM public.floors
    WHERE id IN (
      '22222222-0000-0000-0000-000000000001',
      '22222222-0000-0000-0000-000000000002',
      '22222222-0000-0000-0000-000000000003',
      '22222222-0000-0000-0000-000000000004'
    );
  SELECT COUNT(*) INTO bad_facilities
    FROM public.facilities
    WHERE id IN (
      '33333333-0000-0000-0000-000000000001',
      '33333333-0000-0000-0000-000000000002',
      '33333333-0000-0000-0000-000000000003',
      '33333333-0000-0000-0000-000000000004',
      '33333333-0000-0000-0000-000000000005'
    );
  SELECT COUNT(*) INTO bad_organizations
    FROM public.organizations
    WHERE id IN (
      'a1111111-1111-1111-1111-111111111111',
      'b2222222-2222-2222-2222-222222222222',
      'c3333333-3333-3333-3333-333333333333'
    );

  IF bad_buildings > 0 OR bad_floors > 0 OR bad_facilities > 0 OR bad_organizations > 0 THEN
    RAISE EXCEPTION
      'Seed-ID randomization incomplete: buildings=% floors=% facilities=% organizations=%',
      bad_buildings, bad_floors, bad_facilities, bad_organizations;
  END IF;
END $$;

COMMIT;
