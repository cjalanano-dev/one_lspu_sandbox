-- Migration: 20261128_delete_placeholder_buildings.sql
-- Description: Deletes placeholder buildings (SAC, TIC, DHOSTEL, SRH) from public.buildings.
-- Sets 'app.proposal_flow' = 'on' for the transaction so that cascading
-- foreign-key actions (e.g. proposals.reservation_id -> NULL on reservation delete)
-- are permitted by public.guard_proposal_workflow_fields().

SET LOCAL app.proposal_flow = 'on';

DO $$
BEGIN
  -- Set transaction setting inside the block in case tool runs in autocommit mode
  PERFORM set_config('app.proposal_flow', 'on', true);

  -- Delete target buildings
  DELETE FROM public.buildings
  WHERE upper(code) IN ('SAC', 'TIC', 'DHOSTEL', 'SRH');
END $$;

NOTIFY pgrst, 'reload schema';


