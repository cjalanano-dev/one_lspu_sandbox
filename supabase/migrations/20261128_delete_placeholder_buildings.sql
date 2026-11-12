-- Migration: 20261128_delete_placeholder_buildings.sql
-- Description: Deletes placeholder buildings (SAC, TIC, DHOSTEL, SRH) from public.buildings.
-- Foreign keys on floors, facilities, facility_schedules, maintenance_periods,
-- and facility_administrators cascade. Proposals referencing deleted facilities
-- are automatically set to NULL (ON DELETE SET NULL).

DELETE FROM public.buildings
WHERE upper(code) IN ('SAC', 'TIC', 'DHOSTEL', 'SRH');

NOTIFY pgrst, 'reload schema';
