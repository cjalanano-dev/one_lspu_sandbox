-- Migration: 20261129_reprovision_real_facilities.sql
-- Description:
-- 1. Deletes any remaining unlisted/placeholder buildings and removes all old facilities.
-- 2. Seeds only the user-specified facilities and room choices across the active LSPU buildings.
-- 3. Enables 'app.proposal_flow' = 'on' to permit cascade updates through guard triggers.

SET LOCAL app.proposal_flow = 'on';

DO $$
DECLARE
  v_b_coe UUID;
  v_b_cit_multi UUID;
  v_b_cit UUID;
  v_b_avec UUID;
  v_b_old_ccs UUID;
  v_b_gym UUID;
  v_b_ccje UUID;
  v_b_cas UUID;
  v_b_cbaa UUID;
  v_b_amphi UUID;
  v_b_chmt UUID;
  v_b_badminton UUID;
  v_b_research UUID;
  v_b_new_ccs UUID;
  v_b_hostel UUID;
  v_b_cte UUID;

  -- Floors
  v_fl_old_ccs_1f UUID;
  v_fl_old_ccs_2f UUID;
  v_fl_new_ccs_1f UUID;
  v_fl_cte_2f UUID;
BEGIN
  PERFORM set_config('app.proposal_flow', 'on', true);

  -- 1. Remove any buildings not in the specified active set
  DELETE FROM public.buildings
  WHERE code NOT IN (
    'COE', 'CIT-MULTI', 'CIT', 'AVEC', 'OLD-CCS', 'GYM', 'CCJE',
    'CAS', 'CBAA', 'AMPHI', 'CHMT', 'BADMINTON', 'RESEARCH',
    'NEW-CCS', 'HOSTEL', 'CTE'
  );

  -- 2. Wipe old facilities so only the exact specified facilities exist
  DELETE FROM public.facilities;

  -- 3. Retrieve building IDs
  SELECT id INTO v_b_coe FROM public.buildings WHERE code = 'COE';
  SELECT id INTO v_b_cit_multi FROM public.buildings WHERE code = 'CIT-MULTI';
  SELECT id INTO v_b_cit FROM public.buildings WHERE code = 'CIT';
  SELECT id INTO v_b_avec FROM public.buildings WHERE code = 'AVEC';
  SELECT id INTO v_b_old_ccs FROM public.buildings WHERE code = 'OLD-CCS';
  SELECT id INTO v_b_gym FROM public.buildings WHERE code = 'GYM';
  SELECT id INTO v_b_ccje FROM public.buildings WHERE code = 'CCJE';
  SELECT id INTO v_b_cas FROM public.buildings WHERE code = 'CAS';
  SELECT id INTO v_b_cbaa FROM public.buildings WHERE code = 'CBAA';
  SELECT id INTO v_b_amphi FROM public.buildings WHERE code = 'AMPHI';
  SELECT id INTO v_b_chmt FROM public.buildings WHERE code = 'CHMT';
  SELECT id INTO v_b_badminton FROM public.buildings WHERE code = 'BADMINTON';
  SELECT id INTO v_b_research FROM public.buildings WHERE code = 'RESEARCH';
  SELECT id INTO v_b_new_ccs FROM public.buildings WHERE code = 'NEW-CCS';
  SELECT id INTO v_b_hostel FROM public.buildings WHERE code = 'HOSTEL';
  SELECT id INTO v_b_cte FROM public.buildings WHERE code = 'CTE';

  -- 4. Ensure specific floors exist
  INSERT INTO public.floors (building_id, name, floor_number)
  VALUES (v_b_old_ccs, '1st Floor', 1)
  ON CONFLICT (building_id, floor_number) DO UPDATE SET name = EXCLUDED.name
  RETURNING id INTO v_fl_old_ccs_1f;

  INSERT INTO public.floors (building_id, name, floor_number)
  VALUES (v_b_old_ccs, '2nd Floor', 2)
  ON CONFLICT (building_id, floor_number) DO UPDATE SET name = EXCLUDED.name
  RETURNING id INTO v_fl_old_ccs_2f;

  INSERT INTO public.floors (building_id, name, floor_number)
  VALUES (v_b_new_ccs, '1st Floor', 1)
  ON CONFLICT (building_id, floor_number) DO UPDATE SET name = EXCLUDED.name
  RETURNING id INTO v_fl_new_ccs_1f;

  INSERT INTO public.floors (building_id, name, floor_number)
  VALUES (v_b_cte, '2nd Floor', 2)
  ON CONFLICT (building_id, floor_number) DO UPDATE SET name = EXCLUDED.name
  RETURNING id INTO v_fl_cte_2f;

  -- 5. Insert exact facilities

  -- A. College of Engineering Building (Specify Room/s)
  INSERT INTO public.facilities (
    building_id, floor_id, name, facility_code, category, description, capacity, equipment, reservation_enabled
  ) VALUES (
    v_b_coe,
    (SELECT id FROM public.floors WHERE building_id = v_b_coe LIMIT 1),
    'College of Engineering Building (Specify Room/s)',
    'COE-ROOMS',
    'lecture_hall',
    'College of Engineering facilities. Please specify the exact room(s) needed in your reservation purpose.',
    60,
    '["Whiteboard", "Standard AV Provision"]'::jsonb,
    true
  );

  -- B. CIT Multi-Tech Building (Specify Room/s)
  INSERT INTO public.facilities (
    building_id, floor_id, name, facility_code, category, description, capacity, equipment, reservation_enabled
  ) VALUES (
    v_b_cit_multi,
    (SELECT id FROM public.floors WHERE building_id = v_b_cit_multi LIMIT 1),
    'CIT Multi-Tech Building (Specify Room/s)',
    'CIT-MULTI-ROOMS',
    'laboratory',
    'CIT Multi-Tech building facilities. Please specify the exact technical workshop or room(s) needed in your reservation purpose.',
    50,
    '["Industrial Workbenches", "Power Outlets"]'::jsonb,
    true
  );

  -- C. CIT Building (Specify Room/s)
  INSERT INTO public.facilities (
    building_id, floor_id, name, facility_code, category, description, capacity, equipment, reservation_enabled
  ) VALUES (
    v_b_cit,
    (SELECT id FROM public.floors WHERE building_id = v_b_cit LIMIT 1),
    'CIT Building (Specify Room/s)',
    'CIT-ROOMS',
    'lecture_hall',
    'College of Industrial Technology classrooms. Please specify the room number(s) in your reservation purpose.',
    50,
    '["Classroom Seating", "Whiteboard"]'::jsonb,
    true
  );

  -- D. Audio-Visual Educational Center (AVEC)
  INSERT INTO public.facilities (
    building_id, floor_id, name, facility_code, category, description, capacity, equipment, reservation_enabled
  ) VALUES (
    v_b_avec,
    (SELECT id FROM public.floors WHERE building_id = v_b_avec LIMIT 1),
    'Audio-Visual Educational Center (AVEC)',
    'AVEC-MAIN',
    'auditorium',
    'Campus media presentation and audio-visual screening facility.',
    120,
    '["Projector & Projection Screen", "PA Sound System", "Wireless Microphones"]'::jsonb,
    true
  );

  -- E. Old CCS Building (Floor 1: Lab 1-4; Floor 2: Lec 1, Lab 5-6)
  INSERT INTO public.facilities (
    building_id, floor_id, name, facility_code, category, description, capacity, equipment, reservation_enabled
  ) VALUES
    -- Floor 1
    (v_b_old_ccs, v_fl_old_ccs_1f, 'Old CCS - Computer Lab 1', 'OLD-CCS-LAB1', 'laboratory', 'Old CCS Computer Laboratory 1 (Floor 1)', 40, '["Computer Workstations", "Air Conditioning", "Projector"]'::jsonb, true),
    (v_b_old_ccs, v_fl_old_ccs_1f, 'Old CCS - Computer Lab 2', 'OLD-CCS-LAB2', 'laboratory', 'Old CCS Computer Laboratory 2 (Floor 1)', 40, '["Computer Workstations", "Air Conditioning", "Projector"]'::jsonb, true),
    (v_b_old_ccs, v_fl_old_ccs_1f, 'Old CCS - Computer Lab 3', 'OLD-CCS-LAB3', 'laboratory', 'Old CCS Computer Laboratory 3 (Floor 1)', 40, '["Computer Workstations", "Air Conditioning", "Projector"]'::jsonb, true),
    (v_b_old_ccs, v_fl_old_ccs_1f, 'Old CCS - Computer Lab 4', 'OLD-CCS-LAB4', 'laboratory', 'Old CCS Computer Laboratory 4 (Floor 1)', 40, '["Computer Workstations", "Air Conditioning", "Projector"]'::jsonb, true),
    -- Floor 2
    (v_b_old_ccs, v_fl_old_ccs_2f, 'Old CCS - Lecture Room 1', 'OLD-CCS-LEC1', 'lecture_hall', 'Old CCS Lecture Room 1 (Floor 2)', 45, '["Whiteboard", "Wall-mounted Display"]'::jsonb, true),
    (v_b_old_ccs, v_fl_old_ccs_2f, 'Old CCS - Computer Lab 5', 'OLD-CCS-LAB5', 'laboratory', 'Old CCS Computer Laboratory 5 (Floor 2)', 40, '["Computer Workstations", "Air Conditioning", "Projector"]'::jsonb, true),
    (v_b_old_ccs, v_fl_old_ccs_2f, 'Old CCS - Computer Lab 6', 'OLD-CCS-LAB6', 'laboratory', 'Old CCS Computer Laboratory 6 (Floor 2)', 40, '["Computer Workstations", "Air Conditioning", "Projector"]'::jsonb, true);

  -- F. University Gymnasium (Own facility)
  INSERT INTO public.facilities (
    building_id, floor_id, name, facility_code, category, description, capacity, equipment, reservation_enabled
  ) VALUES (
    v_b_gym,
    (SELECT id FROM public.floors WHERE building_id = v_b_gym LIMIT 1),
    'University Gymnasium',
    'GYM-MAIN',
    'sports_gym',
    'University Gymnasium full indoor court arena for athletic events, convocations, and assemblies.',
    1200,
    '["Basketball Court", "Bleachers", "Arena PA Sound System", "Scoreboard"]'::jsonb,
    true
  );

  -- G. College of Criminal Justice Education Building - CCJE Function Hall
  INSERT INTO public.facilities (
    building_id, floor_id, name, facility_code, category, description, capacity, equipment, reservation_enabled
  ) VALUES (
    v_b_ccje,
    (SELECT id FROM public.floors WHERE building_id = v_b_ccje LIMIT 1),
    'CCJE Function Hall',
    'CCJE-FH',
    'multipurpose',
    'Function hall of the College of Criminal Justice Education Building.',
    150,
    '["Sound System", "Stage / Podium", "Air Conditioning"]'::jsonb,
    true
  );

  -- H. College of Arts and Sciences Building (Specify Room/s)
  INSERT INTO public.facilities (
    building_id, floor_id, name, facility_code, category, description, capacity, equipment, reservation_enabled
  ) VALUES (
    v_b_cas,
    (SELECT id FROM public.floors WHERE building_id = v_b_cas LIMIT 1),
    'College of Arts and Sciences Building (Specify Room/s)',
    'CAS-ROOMS',
    'lecture_hall',
    'CAS classrooms and lecture halls. Please specify the room number(s) in your reservation purpose.',
    50,
    '["Standard Classroom Amenities"]'::jsonb,
    true
  );

  -- I. College of Business Administration and Accountancy - CBAA Accreditation Room
  INSERT INTO public.facilities (
    building_id, floor_id, name, facility_code, category, description, capacity, equipment, reservation_enabled
  ) VALUES (
    v_b_cbaa,
    (SELECT id FROM public.floors WHERE building_id = v_b_cbaa LIMIT 1),
    'CBAA Accreditation Room',
    'CBAA-ACCRED',
    'conference_room',
    'Accreditation and conference hall of the College of Business Administration and Accountancy.',
    60,
    '["Conference Table & Chairs", "Air Conditioning", "Presentation Screen"]'::jsonb,
    true
  );

  -- J. University Amphitheater (Own facility)
  INSERT INTO public.facilities (
    building_id, floor_id, name, facility_code, category, description, capacity, equipment, reservation_enabled
  ) VALUES (
    v_b_amphi,
    (SELECT id FROM public.floors WHERE building_id = v_b_amphi LIMIT 1),
    'University Amphitheater',
    'AMPHI-MAIN',
    'auditorium',
    'University open-air amphitheater for cultural presentations, performances, and student gatherings.',
    600,
    '["Elevated Concrete Stage", "Stage Floodlights", "Power Access"]'::jsonb,
    true
  );

  -- K. College of Hospitality Management and Tourism Building (Specify Room/s)
  INSERT INTO public.facilities (
    building_id, floor_id, name, facility_code, category, description, capacity, equipment, reservation_enabled
  ) VALUES (
    v_b_chmt,
    (SELECT id FROM public.floors WHERE building_id = v_b_chmt LIMIT 1),
    'CHMT Building (Specify Room/s)',
    'CHMT-ROOMS',
    'multipurpose',
    'CHMT hospitality training rooms and suites. Please specify the room(s) in your reservation purpose.',
    50,
    '["Hospitality Training Equipment"]'::jsonb,
    true
  );

  -- L. Indoor Badminton Court
  INSERT INTO public.facilities (
    building_id, floor_id, name, facility_code, category, description, capacity, equipment, reservation_enabled
  ) VALUES (
    v_b_badminton,
    (SELECT id FROM public.floors WHERE building_id = v_b_badminton LIMIT 1),
    'Indoor Badminton Court',
    'BADMINTON-MAIN',
    'sports_gym',
    'Indoor wooden badminton facility.',
    100,
    '["Badminton Nets", "Indoor Lighting"]'::jsonb,
    true
  );

  -- M. Research & Extension Building
  INSERT INTO public.facilities (
    building_id, floor_id, name, facility_code, category, description, capacity, equipment, reservation_enabled
  ) VALUES (
    v_b_research,
    (SELECT id FROM public.floors WHERE building_id = v_b_research LIMIT 1),
    'Research & Extension Building',
    'RESEARCH-MAIN',
    'conference_room',
    'Research, development, and extension innovation center.',
    40,
    '["Conference Display", "Whiteboard"]'::jsonb,
    true
  );

  -- N. New College of Computer Studies Building - CCS Accreditation Room, 1st floor
  INSERT INTO public.facilities (
    building_id, floor_id, name, facility_code, category, description, capacity, equipment, reservation_enabled
  ) VALUES (
    v_b_new_ccs,
    v_fl_new_ccs_1f,
    'CCS Accreditation Room',
    'NEW-CCS-ACCRED-1F',
    'conference_room',
    'CCS Accreditation Room located on the 1st Floor of the New College of Computer Studies Building.',
    50,
    '["Conference Table & Executive Chairs", "Air Conditioning", "Smart TV Screen"]'::jsonb,
    true
  );

  -- O. Hostel Building
  INSERT INTO public.facilities (
    building_id, floor_id, name, facility_code, category, description, capacity, equipment, reservation_enabled
  ) VALUES (
    v_b_hostel,
    (SELECT id FROM public.floors WHERE building_id = v_b_hostel LIMIT 1),
    'Hostel Building',
    'HOSTEL-MAIN',
    'multipurpose',
    'Campus hostel accommodation and hospitality facility.',
    40,
    '["Lounge Chairs", "Air Conditioning"]'::jsonb,
    true
  );

  -- P. College of Teacher Education Building - CTE Function Hall, 2nd floor
  INSERT INTO public.facilities (
    building_id, floor_id, name, facility_code, category, description, capacity, equipment, reservation_enabled
  ) VALUES (
    v_b_cte,
    v_fl_cte_2f,
    'CTE Function Hall',
    'CTE-FH-2F',
    'multipurpose',
    'CTE Function Hall located on the 2nd Floor of the College of Teacher Education Building.',
    180,
    '["Sound System", "Stage Podium", "Air Conditioning", "Projector"]'::jsonb,
    true
  );

END $$;

NOTIFY pgrst, 'reload schema';

