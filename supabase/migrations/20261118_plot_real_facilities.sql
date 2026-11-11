-- Plot the 12 real LSPU facilities on their floor plans so they render
-- and are clickable in the Campus Explorer alongside the 5 existing rooms.
--
-- Coordinates use the same 480x280 source space the existing rooms use
-- (see normalizePosition in src/features/campus/FloorPlanViewer.tsx).
-- Keyed by facility_code so it works regardless of the (now randomized) IDs.
-- Idempotent: safe to re-run.

UPDATE public.facilities
SET map_position = '{"svg_id":"room-tic-cit","x":40,"y":170,"width":120,"height":70}'::jsonb,
    updated_at = timezone('utc'::text, now())
WHERE facility_code = 'TIC-CIT-001';

UPDATE public.facilities
SET map_position = '{"svg_id":"room-tic-lib","x":185,"y":170,"width":120,"height":70}'::jsonb,
    updated_at = timezone('utc'::text, now())
WHERE facility_code = 'TIC-LIB-001';

UPDATE public.facilities
SET map_position = '{"svg_id":"room-sac-gym","x":180,"y":60,"width":120,"height":70}'::jsonb,
    updated_at = timezone('utc'::text, now())
WHERE facility_code = 'SAC-GYM-001';

UPDATE public.facilities
SET map_position = '{"svg_id":"room-sac-amp","x":330,"y":60,"width":120,"height":70}'::jsonb,
    updated_at = timezone('utc'::text, now())
WHERE facility_code = 'SAC-AMP-001';

UPDATE public.facilities
SET map_position = '{"svg_id":"room-sac-fld","x":40,"y":170,"width":120,"height":70}'::jsonb,
    updated_at = timezone('utc'::text, now())
WHERE facility_code = 'SAC-FLD-001';

UPDATE public.facilities
SET map_position = '{"svg_id":"room-sac-vol","x":185,"y":170,"width":120,"height":70}'::jsonb,
    updated_at = timezone('utc'::text, now())
WHERE facility_code = 'SAC-VOL-001';

UPDATE public.facilities
SET map_position = '{"svg_id":"room-sac-bad","x":330,"y":170,"width":120,"height":70}'::jsonb,
    updated_at = timezone('utc'::text, now())
WHERE facility_code = 'SAC-BAD-001';

UPDATE public.facilities
SET map_position = '{"svg_id":"room-sac-acc","x":60,"y":60,"width":120,"height":70}'::jsonb,
    updated_at = timezone('utc'::text, now())
WHERE facility_code = 'SAC-ACC-001';

UPDATE public.facilities
SET map_position = '{"svg_id":"room-sac-ccje","x":260,"y":60,"width":120,"height":70}'::jsonb,
    updated_at = timezone('utc'::text, now())
WHERE facility_code = 'SAC-CCJE-001';

UPDATE public.facilities
SET map_position = '{"svg_id":"room-srh-conf","x":60,"y":60,"width":120,"height":70}'::jsonb,
    updated_at = timezone('utc'::text, now())
WHERE facility_code = 'SRH-CONF-001';

UPDATE public.facilities
SET map_position = '{"svg_id":"room-srh-rde","x":260,"y":60,"width":120,"height":70}'::jsonb,
    updated_at = timezone('utc'::text, now())
WHERE facility_code = 'SRH-RDE-001';

UPDATE public.facilities
SET map_position = '{"svg_id":"room-dhostel-001","x":140,"y":60,"width":120,"height":70}'::jsonb,
    updated_at = timezone('utc'::text, now())
WHERE facility_code = 'DHOSTEL-001';

-- Guard: every facility must either have a map_position or none should
-- silently fail. Report how many facilities per building are now plotted.
SELECT
  b.code AS building,
  COUNT(f.id) AS total_facilities,
  COUNT(f.id) FILTER (WHERE f.map_position IS NOT NULL AND (f.map_position->>'x') IS NOT NULL) AS plotted
FROM public.buildings b
LEFT JOIN public.facilities f ON f.building_id = b.id
GROUP BY b.code
ORDER BY b.code;
