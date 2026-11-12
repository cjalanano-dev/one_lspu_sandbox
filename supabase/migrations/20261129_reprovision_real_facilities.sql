-- Migration: 20261129_reprovision_real_facilities.sql
-- Description: Replaces all placeholder facilities with the real LSPU San Pablo facilities:
-- - College of Engineering Building (COE Computer Applications Lab 101, COE Engineering Lecture Hall 201)
-- - CIT Multi-Tech Building (CIT Multi-Tech Electronics Lab 101, Technical Drafting Studio 201)
-- - CIT Building (CIT Industrial Technology Lecture Hall 101)
-- - Audio-Visual Educational Center (AVEC) (own facility)
-- - Old CCS Building (Old CCS Computing Lab 101, Old CCS Seminar Room 201)
-- - University Gymnasium (own facility)
-- - College of Criminal Justice Education Building (CCJE Function Hall)
-- - College of Arts and Sciences Building (CAS Natural Science Laboratory 101, CAS Humanities Lecture Hall 201)
-- - College of Business Administration and Accountancy (CBAA Accreditation Room)
-- - University Amphitheater (own facility)
-- - College of Hospitality Management and Tourism Building (CHMT Commercial Kitchen Lab 101, CHMT Banquet Training Hall 201)
-- - Indoor Badminton Court (own facility)
-- - Research & Extension Building (Research & Extension Conference Center)
-- - New College of Computer Studies Building (CCS Accreditation Room, 1st floor)
-- - Hostel Building (Hostel Function Hall)
-- - College of Teacher Education Building (CTE Function Hall, 2nd floor)
--
-- Unlisted buildings in public.buildings (NSTP, ALUMNI, DOST, ICTS, LIB, CLINIC, CANTEEN)
-- are removed from the database while kept on the visual map.

SET LOCAL app.proposal_flow = 'on';

DO $$
DECLARE
  v_admin_id UUID;
  -- Buildings
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
  v_fl_coe_1f UUID;
  v_fl_coe_2f UUID;
  v_fl_cit_multi_1f UUID;
  v_fl_cit_multi_2f UUID;
  v_fl_cit_1f UUID;
  v_fl_avec_1f UUID;
  v_fl_old_ccs_1f UUID;
  v_fl_old_ccs_2f UUID;
  v_fl_gym_1f UUID;
  v_fl_ccje_1f UUID;
  v_fl_cas_1f UUID;
  v_fl_cas_2f UUID;
  v_fl_cbaa_1f UUID;
  v_fl_amphi_1f UUID;
  v_fl_chmt_1f UUID;
  v_fl_chmt_2f UUID;
  v_fl_badminton_1f UUID;
  v_fl_research_1f UUID;
  v_fl_new_ccs_1f UUID;
  v_fl_hostel_1f UUID;
  v_fl_cte_2f UUID;
BEGIN
  PERFORM set_config('app.proposal_flow', 'on', true);

  -- 1. Identify admin profile for facility administrator mapping
  SELECT id INTO v_admin_id FROM public.profiles WHERE email = 'admin@campus.edu' LIMIT 1;
  IF v_admin_id IS NULL THEN
    SELECT id INTO v_admin_id FROM public.profiles WHERE primary_role = 'facility_admin' LIMIT 1;
  END IF;

  -- 2. Delete buildings not on the facility list (keep map data separate)
  -- Buildings to delete from DB: NSTP, ALUMNI, DOST, ICTS, LIB, CLINIC, CANTEEN + old placeholders
  DELETE FROM public.buildings
  WHERE upper(code) IN ('NSTP', 'ALUMNI', 'DOST', 'ICTS', 'LIB', 'CLINIC', 'CANTEEN', 'SAC', 'TIC', 'DHOSTEL', 'SRH');

  -- 3. Clear out obsolete facility rows to guarantee clean replacement
  DELETE FROM public.facilities;

  -- 4. Lookup or create the 16 real campus buildings
  -- COE
  SELECT id INTO v_b_coe FROM public.buildings WHERE upper(code) = 'COE';
  IF v_b_coe IS NULL THEN
    INSERT INTO public.buildings (name, code, description, location_description, total_floors, map_coordinates)
    VALUES ('College of Engineering Building', 'COE', 'Engineering lecture rooms, computer-aided drafting labs, and faculty offices.', 'North-West Campus', 3, '{"x": 150, "y": 165}'::jsonb)
    RETURNING id INTO v_b_coe;
  END IF;

  -- CIT-MULTI
  SELECT id INTO v_b_cit_multi FROM public.buildings WHERE upper(code) = 'CIT-MULTI';
  IF v_b_cit_multi IS NULL THEN
    INSERT INTO public.buildings (name, code, description, location_description, total_floors, map_coordinates)
    VALUES ('CIT Multi-Tech Building', 'CIT-MULTI', 'Industrial technology workshops, electronics, and technical training suites.', 'North Campus', 3, '{"x": 250, "y": 180}'::jsonb)
    RETURNING id INTO v_b_cit_multi;
  END IF;

  -- CIT
  SELECT id INTO v_b_cit FROM public.buildings WHERE upper(code) = 'CIT';
  IF v_b_cit IS NULL THEN
    INSERT INTO public.buildings (name, code, description, location_description, total_floors, map_coordinates)
    VALUES ('CIT Building', 'CIT', 'College of Industrial Technology classrooms and department offices.', 'North-West Quad', 2, '{"x": 250, "y": 370}'::jsonb)
    RETURNING id INTO v_b_cit;
  END IF;

  -- AVEC
  SELECT id INTO v_b_avec FROM public.buildings WHERE upper(code) = 'AVEC';
  IF v_b_avec IS NULL THEN
    INSERT INTO public.buildings (name, code, description, location_description, total_floors, map_coordinates)
    VALUES ('Audio-Visual Educational Center (AVEC)', 'AVEC', 'Campus media screening center and audio-visual presentations hall.', 'North-West Quad', 1, '{"x": 295, "y": 285}'::jsonb)
    RETURNING id INTO v_b_avec;
  END IF;

  -- OLD-CCS
  SELECT id INTO v_b_old_ccs FROM public.buildings WHERE upper(code) = 'OLD-CCS';
  IF v_b_old_ccs IS NULL THEN
    INSERT INTO public.buildings (name, code, description, location_description, total_floors, map_coordinates)
    VALUES ('Old CCS Building', 'OLD-CCS', 'Legacy computing hall, faculty lounge, and seminar rooms.', 'North Campus', 2, '{"x": 395, "y": 190}'::jsonb)
    RETURNING id INTO v_b_old_ccs;
  END IF;

  -- GYM
  SELECT id INTO v_b_gym FROM public.buildings WHERE upper(code) = 'GYM';
  IF v_b_gym IS NULL THEN
    INSERT INTO public.buildings (name, code, description, location_description, total_floors, map_coordinates)
    VALUES ('University Gymnasium', 'GYM', 'Full-court indoor arena for basketball, assemblies, and institutional events.', 'Central Sports Quad', 2, '{"x": 360, "y": 265}'::jsonb)
    RETURNING id INTO v_b_gym;
  END IF;

  -- CCJE
  SELECT id INTO v_b_ccje FROM public.buildings WHERE upper(code) = 'CCJE';
  IF v_b_ccje IS NULL THEN
    INSERT INTO public.buildings (name, code, description, location_description, total_floors, map_coordinates)
    VALUES ('College of Criminal Justice Education Building', 'CCJE', 'Forensic science rooms, mock courtroom, and criminology departments.', 'North-East Campus', 3, '{"x": 545, "y": 265}'::jsonb)
    RETURNING id INTO v_b_ccje;
  END IF;

  -- CAS
  SELECT id INTO v_b_cas FROM public.buildings WHERE upper(code) = 'CAS';
  IF v_b_cas IS NULL THEN
    INSERT INTO public.buildings (name, code, description, location_description, total_floors, map_coordinates)
    VALUES ('College of Arts and Sciences Building', 'CAS', 'Natural science laboratories, language labs, and humanities lecture halls.', 'East Campus', 3, '{"x": 535, "y": 395}'::jsonb)
    RETURNING id INTO v_b_cas;
  END IF;

  -- CBAA
  SELECT id INTO v_b_cbaa FROM public.buildings WHERE upper(code) = 'CBAA';
  IF v_b_cbaa IS NULL THEN
    INSERT INTO public.buildings (name, code, description, location_description, total_floors, map_coordinates)
    VALUES ('College of Business Administration and Accountancy', 'CBAA', 'Business analytics suite, mock boardrooms, and accounting classrooms.', 'East Campus', 3, '{"x": 585, "y": 465}'::jsonb)
    RETURNING id INTO v_b_cbaa;
  END IF;

  -- AMPHI
  SELECT id INTO v_b_amphi FROM public.buildings WHERE upper(code) = 'AMPHI';
  IF v_b_amphi IS NULL THEN
    INSERT INTO public.buildings (name, code, description, location_description, total_floors, map_coordinates)
    VALUES ('University Open-Air Amphitheater', 'AMPHI', 'Outdoor amphitheater and staging ground for cultural presentations.', 'East Campus', 1, '{"x": 655, "y": 495}'::jsonb)
    RETURNING id INTO v_b_amphi;
  END IF;

  -- CHMT
  SELECT id INTO v_b_chmt FROM public.buildings WHERE upper(code) = 'CHMT';
  IF v_b_chmt IS NULL THEN
    INSERT INTO public.buildings (name, code, description, location_description, total_floors, map_coordinates)
    VALUES ('College of Hospitality Management and Tourism Building', 'CHMT', 'Culinary arts kitchens, banquet training halls, and bar labs.', 'South-East Strip', 2, '{"x": 630, "y": 565}'::jsonb)
    RETURNING id INTO v_b_chmt;
  END IF;

  -- BADMINTON
  SELECT id INTO v_b_badminton FROM public.buildings WHERE upper(code) = 'BADMINTON';
  IF v_b_badminton IS NULL THEN
    INSERT INTO public.buildings (name, code, description, location_description, total_floors, map_coordinates)
    VALUES ('Indoor Badminton Court', 'BADMINTON', 'Indoor wooden badminton and multi-purpose sports facility.', 'South-East Strip', 1, '{"x": 715, "y": 570}'::jsonb)
    RETURNING id INTO v_b_badminton;
  END IF;

  -- RESEARCH
  SELECT id INTO v_b_research FROM public.buildings WHERE upper(code) = 'RESEARCH';
  IF v_b_research IS NULL THEN
    INSERT INTO public.buildings (name, code, description, location_description, total_floors, map_coordinates)
    VALUES ('Research & Extension Building', 'RESEARCH', 'R&D offices, faculty publications, and project workspaces.', 'South Quad', 2, '{"x": 390, "y": 605}'::jsonb)
    RETURNING id INTO v_b_research;
  END IF;

  -- NEW-CCS
  SELECT id INTO v_b_new_ccs FROM public.buildings WHERE upper(code) = 'NEW-CCS';
  IF v_b_new_ccs IS NULL THEN
    INSERT INTO public.buildings (name, code, description, location_description, total_floors, map_coordinates)
    VALUES ('New College of Computer Studies Building', 'NEW-CCS', 'Flagship CCS complex with networking, AI, and systems laboratories.', 'West Campus', 4, '{"x": 140, "y": 330}'::jsonb)
    RETURNING id INTO v_b_new_ccs;
  END IF;

  -- HOSTEL
  SELECT id INTO v_b_hostel FROM public.buildings WHERE upper(code) = 'HOSTEL';
  IF v_b_hostel IS NULL THEN
    INSERT INTO public.buildings (name, code, description, location_description, total_floors, map_coordinates)
    VALUES ('Hostel Building', 'HOSTEL', 'Campus visitor suites, dormitory accommodations, and hospitality rooms.', 'South Campus', 3, '{"x": 210, "y": 640}'::jsonb)
    RETURNING id INTO v_b_hostel;
  END IF;

  -- CTE
  SELECT id INTO v_b_cte FROM public.buildings WHERE upper(code) = 'CTE';
  IF v_b_cte IS NULL THEN
    INSERT INTO public.buildings (name, code, description, location_description, total_floors, map_coordinates)
    VALUES ('College of Teacher Education Building', 'CTE', 'Secondary and elementary teacher education classrooms and lecture halls.', 'South Campus Entrance', 3, '{"x": 210, "y": 800}'::jsonb)
    RETURNING id INTO v_b_cte;
  END IF;

  -- 5. Floors Setup
  -- COE Floors
  INSERT INTO public.floors (building_id, name, floor_number)
  VALUES (v_b_coe, '1st Floor - Laboratories', 1)
  ON CONFLICT (building_id, floor_number) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO v_fl_coe_1f;

  INSERT INTO public.floors (building_id, name, floor_number)
  VALUES (v_b_coe, '2nd Floor - Lecture Halls', 2)
  ON CONFLICT (building_id, floor_number) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO v_fl_coe_2f;

  -- CIT-MULTI Floors
  INSERT INTO public.floors (building_id, name, floor_number)
  VALUES (v_b_cit_multi, '1st Floor - Electronics Labs', 1)
  ON CONFLICT (building_id, floor_number) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO v_fl_cit_multi_1f;

  INSERT INTO public.floors (building_id, name, floor_number)
  VALUES (v_b_cit_multi, '2nd Floor - Technical Studios', 2)
  ON CONFLICT (building_id, floor_number) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO v_fl_cit_multi_2f;

  -- CIT Floors
  INSERT INTO public.floors (building_id, name, floor_number)
  VALUES (v_b_cit, '1st Floor - Lecture Rooms', 1)
  ON CONFLICT (building_id, floor_number) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO v_fl_cit_1f;

  -- AVEC Floor
  INSERT INTO public.floors (building_id, name, floor_number)
  VALUES (v_b_avec, '1st Floor - Audio-Visual Hall', 1)
  ON CONFLICT (building_id, floor_number) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO v_fl_avec_1f;

  -- OLD-CCS Floors
  INSERT INTO public.floors (building_id, name, floor_number)
  VALUES (v_b_old_ccs, '1st Floor - Computer Labs', 1)
  ON CONFLICT (building_id, floor_number) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO v_fl_old_ccs_1f;

  INSERT INTO public.floors (building_id, name, floor_number)
  VALUES (v_b_old_ccs, '2nd Floor - Seminar Rooms', 2)
  ON CONFLICT (building_id, floor_number) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO v_fl_old_ccs_2f;

  -- GYM Floor
  INSERT INTO public.floors (building_id, name, floor_number)
  VALUES (v_b_gym, '1st Floor - Arena & Court', 1)
  ON CONFLICT (building_id, floor_number) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO v_fl_gym_1f;

  -- CCJE Floor
  INSERT INTO public.floors (building_id, name, floor_number)
  VALUES (v_b_ccje, '1st Floor - Function Hall & Offices', 1)
  ON CONFLICT (building_id, floor_number) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO v_fl_ccje_1f;

  -- CAS Floors
  INSERT INTO public.floors (building_id, name, floor_number)
  VALUES (v_b_cas, '1st Floor - Science Laboratories', 1)
  ON CONFLICT (building_id, floor_number) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO v_fl_cas_1f;

  INSERT INTO public.floors (building_id, name, floor_number)
  VALUES (v_b_cas, '2nd Floor - Humanities Lecture Halls', 2)
  ON CONFLICT (building_id, floor_number) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO v_fl_cas_2f;

  -- CBAA Floor
  INSERT INTO public.floors (building_id, name, floor_number)
  VALUES (v_b_cbaa, '1st Floor - Administrative & Accreditation', 1)
  ON CONFLICT (building_id, floor_number) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO v_fl_cbaa_1f;

  -- AMPHI Floor
  INSERT INTO public.floors (building_id, name, floor_number)
  VALUES (v_b_amphi, 'Ground Level - Amphitheater Stage & Seating', 1)
  ON CONFLICT (building_id, floor_number) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO v_fl_amphi_1f;

  -- CHMT Floors
  INSERT INTO public.floors (building_id, name, floor_number)
  VALUES (v_b_chmt, '1st Floor - Commercial Kitchen Labs', 1)
  ON CONFLICT (building_id, floor_number) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO v_fl_chmt_1f;

  INSERT INTO public.floors (building_id, name, floor_number)
  VALUES (v_b_chmt, '2nd Floor - Banquet Training Hall', 2)
  ON CONFLICT (building_id, floor_number) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO v_fl_chmt_2f;

  -- BADMINTON Floor
  INSERT INTO public.floors (building_id, name, floor_number)
  VALUES (v_b_badminton, '1st Floor - Badminton Courts', 1)
  ON CONFLICT (building_id, floor_number) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO v_fl_badminton_1f;

  -- RESEARCH Floor
  INSERT INTO public.floors (building_id, name, floor_number)
  VALUES (v_b_research, '1st Floor - Research Conference Center', 1)
  ON CONFLICT (building_id, floor_number) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO v_fl_research_1f;

  -- NEW-CCS Floor (1st Floor)
  INSERT INTO public.floors (building_id, name, floor_number)
  VALUES (v_b_new_ccs, '1st Floor - Administration & Accreditation', 1)
  ON CONFLICT (building_id, floor_number) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO v_fl_new_ccs_1f;

  -- HOSTEL Floor
  INSERT INTO public.floors (building_id, name, floor_number)
  VALUES (v_b_hostel, '1st Floor - Function & Reception Hall', 1)
  ON CONFLICT (building_id, floor_number) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO v_fl_hostel_1f;

  -- CTE Floors (2nd Floor specified)
  INSERT INTO public.floors (building_id, name, floor_number)
  VALUES (v_b_cte, '2nd Floor - Function Hall & Seminar Suites', 2)
  ON CONFLICT (building_id, floor_number) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO v_fl_cte_2f;

  -- 6. Insert Real Facilities
  -- 1) College of Engineering: COE Computer Applications Lab 101, COE Engineering Lecture Hall 201
  INSERT INTO public.facilities (building_id, floor_id, name, facility_code, category, description, capacity, equipment, map_position, status, image_url)
  VALUES
    (v_b_coe, v_fl_coe_1f, 'COE Computer Applications Lab 101', 'COE-CAL-101', 'laboratory', 'Engineering CAD/CAM workstation computer laboratory with high-spec simulation software.', 45, '["45 CAD Workstations", "Smart Board", "Air Conditioning", "Instructor Projection System"]'::jsonb, '{"x": 60, "y": 60, "width": 120, "height": 70}'::jsonb, 'available', 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=960&q=80'),
    (v_b_coe, v_fl_coe_2f, 'COE Engineering Lecture Hall 201', 'COE-ELH-201', 'lecture_hall', 'Tiered engineering lecture room for design defenses, seminars, and lectures.', 80, '["Dual Projectors", "Wireless Lapel Mic", "Whiteboards", "Sound System"]'::jsonb, '{"x": 260, "y": 60, "width": 120, "height": 70}'::jsonb, 'available', 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=960&q=80');

  -- 2) CIT Multi-Tech Building: CIT Multi-Tech Electronics Lab 101, CIT Technical Drafting Studio 201
  INSERT INTO public.facilities (building_id, floor_id, name, facility_code, category, description, capacity, equipment, map_position, status, image_url)
  VALUES
    (v_b_cit_multi, v_fl_cit_multi_1f, 'CIT Multi-Tech Electronics Lab 101', 'CIT-MEL-101', 'laboratory', 'Specialized electronics assembly, instrumentation, and prototyping facility.', 40, '["Oscilloscopes", "Soldering Workbenches", "Power Supplies", "Exhaust Fume Extractors"]'::jsonb, '{"x": 60, "y": 60, "width": 120, "height": 70}'::jsonb, 'available', 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=960&q=80'),
    (v_b_cit_multi, v_fl_cit_multi_2f, 'CIT Technical Drafting Studio 201', 'CIT-TDS-201', 'lecture_hall', 'Precision manual and digital drafting studio for technical architecture projects.', 50, '["Drafting Tables", "Light Boxes", "Overhead Projector", "Plotter Station"]'::jsonb, '{"x": 260, "y": 60, "width": 120, "height": 70}'::jsonb, 'available', 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=960&q=80');

  -- 3) CIT Building: CIT Lecture Hall 101
  INSERT INTO public.facilities (building_id, floor_id, name, facility_code, category, description, capacity, equipment, map_position, status, image_url)
  VALUES
    (v_b_cit, v_fl_cit_1f, 'CIT Industrial Technology Lecture Hall 101', 'CIT-LH-101', 'lecture_hall', 'Spacious lecture hall for industrial technology seminars and student conferences.', 70, '["Laser Projector", "PA Audio System", "Podium", "Ergonomic Chairs"]'::jsonb, '{"x": 160, "y": 60, "width": 120, "height": 70}'::jsonb, 'available', 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=960&q=80');

  -- 4) Audio-Visual Educational Center (AVEC): own facility
  INSERT INTO public.facilities (building_id, floor_id, name, facility_code, category, description, capacity, equipment, map_position, status, image_url)
  VALUES
    (v_b_avec, v_fl_avec_1f, 'Audio-Visual Educational Center (AVEC)', 'AVEC-HALL-001', 'auditorium', 'Premier acoustic multimedia theater equipped for institutional screenings, symposiums, and cultural events.', 180, '["Cinematic Screen", "Surround Sound Setup", "Wireless Microphones", "Stage Dimming Lighting", "Podium"]'::jsonb, '{"x": 160, "y": 60, "width": 140, "height": 80}'::jsonb, 'available', 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=960&q=80');

  -- 5) Old CCS Building: Old CCS Computing Lab 101, Old CCS Seminar Room 201
  INSERT INTO public.facilities (building_id, floor_id, name, facility_code, category, description, capacity, equipment, map_position, status, image_url)
  VALUES
    (v_b_old_ccs, v_fl_old_ccs_1f, 'Old CCS Computing Lab 101', 'OCCS-LAB-101', 'laboratory', 'Computer laboratory equipped with programming development suites and networking routers.', 40, '["40 PC Rigs", "High-speed Switch Hub", "Laser Projector", "Central Air Conditioning"]'::jsonb, '{"x": 60, "y": 60, "width": 120, "height": 70}'::jsonb, 'available', 'https://images.unsplash.com/photo-1562774053-701939374585?w=960&q=80'),
    (v_b_old_ccs, v_fl_old_ccs_2f, 'Old CCS Seminar Room 201', 'OCCS-SEM-201', 'conference_room', 'Collaborative seminar room for student organization meetings and thesis colloquiums.', 35, '["Interactive Display", "Conference Audio Mic", "Whiteboard Wall", "Modular Tables"]'::jsonb, '{"x": 260, "y": 60, "width": 120, "height": 70}'::jsonb, 'available', 'https://images.unsplash.com/photo-1431540015161-0bf868a2d407?w=960&q=80');

  -- 6) University Gymnasium: own facility
  INSERT INTO public.facilities (building_id, floor_id, name, facility_code, category, description, capacity, equipment, map_position, status, image_url)
  VALUES
    (v_b_gym, v_fl_gym_1f, 'University Gymnasium', 'GYM-MAIN-001', 'sports_gym', 'Institutional grand gymnasium and maple court for athletic competitions, university assemblies, and general conventions.', 1200, '["Regulation Hardwood Court", "Electronic Scoreboard", "Retractable Bleachers", "Heavy Duty PA System", "High-Bay Floodlights"]'::jsonb, '{"x": 160, "y": 60, "width": 160, "height": 90}'::jsonb, 'available', 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=960&q=80');

  -- 7) College of Criminal Justice Education Building: CCJE Function Hall
  INSERT INTO public.facilities (building_id, floor_id, name, facility_code, category, description, capacity, equipment, map_position, status, image_url)
  VALUES
    (v_b_ccje, v_fl_ccje_1f, 'CCJE Function Hall', 'CCJE-HALL-001', 'multipurpose', 'Multi-purpose hall for criminology events, pin-honoring rites, drill briefings, and lectures.', 150, '["Stage Platform", "Full Audio PA Rig", "Wireless Handheld Mics", "Ceiling Projector", "Monoblock Chairs"]'::jsonb, '{"x": 160, "y": 60, "width": 140, "height": 80}'::jsonb, 'available', 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=960&q=80');

  -- 8) College of Arts and Sciences: CAS Natural Science Laboratory 101, CAS Humanities Lecture Hall 201
  INSERT INTO public.facilities (building_id, floor_id, name, facility_code, category, description, capacity, equipment, map_position, status, image_url)
  VALUES
    (v_b_cas, v_fl_cas_1f, 'CAS Natural Science Laboratory 101', 'CAS-NSL-101', 'laboratory', 'Science laboratory equipped with fume hoods, sinks, compound microscopes, and chemical safety gear.', 40, '["Microscopes", "Fume Hood", "Chemical Storage Cabinet", "Eye Wash Station", "Safety Goggles"]'::jsonb, '{"x": 60, "y": 60, "width": 120, "height": 70}'::jsonb, 'available', 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=960&q=80'),
    (v_b_cas, v_fl_cas_2f, 'CAS Humanities Lecture Hall 201', 'CAS-HLH-201', 'lecture_hall', 'Air-conditioned lecture amphitheater for literary seminars, language symposiums, and debates.', 90, '["Dual Displays", "Podium with Mic", "Sound Amplifier", "Tiered Seating"]'::jsonb, '{"x": 260, "y": 60, "width": 120, "height": 70}'::jsonb, 'available', 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=960&q=80');

  -- 9) College of Business Administration and Accountancy: CBAA Accreditation Room
  INSERT INTO public.facilities (building_id, floor_id, name, facility_code, category, description, capacity, equipment, map_position, status, image_url)
  VALUES
    (v_b_cbaa, v_fl_cbaa_1f, 'CBAA Accreditation Room', 'CBAA-ACCR-001', 'conference_room', 'Dedicated formal conference room for institutional accreditation, faculty reviews, and defense panels.', 30, '["Executive Boardroom Table", "Conference Mic Pods", "4K Video Bar", "Glass Whiteboard", "Ergonomic Chairs"]'::jsonb, '{"x": 160, "y": 60, "width": 140, "height": 80}'::jsonb, 'available', 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=960&q=80');

  -- 10) University Amphitheater: own facility
  INSERT INTO public.facilities (building_id, floor_id, name, facility_code, category, description, capacity, equipment, map_position, status, image_url)
  VALUES
    (v_b_amphi, v_fl_amphi_1f, 'University Open-Air Amphitheater', 'AMPHI-MAIN-001', 'auditorium', 'Expansive open-air amphitheater with tiered concrete seating and staging deck for outdoor university festivals.', 800, '["Raised Proscenium Stage", "Outdoor Weatherproof Audio", "High-Power Stage Floodlights", "Dressing Backstage Rooms"]'::jsonb, '{"x": 160, "y": 60, "width": 160, "height": 90}'::jsonb, 'available', 'https://images.unsplash.com/photo-1469488865564-c2de10f69f96?w=960&q=80');

  -- 11) College of Hospitality Management and Tourism: CHMT Commercial Kitchen Lab 101, CHMT Banquet Training Hall 201
  INSERT INTO public.facilities (building_id, floor_id, name, facility_code, category, description, capacity, equipment, map_position, status, image_url)
  VALUES
    (v_b_chmt, v_fl_chmt_1f, 'CHMT Commercial Kitchen Lab 101', 'CHMT-CKL-101', 'laboratory', 'Commercial-grade culinary cooking and baking laboratory with stainless steel preparation stations.', 35, '["Commercial Ovens", "Stainless Work Tables", "Walk-in Chillers", "Safety Extinguishers", "Culinary Cutlery Sets"]'::jsonb, '{"x": 60, "y": 60, "width": 120, "height": 70}'::jsonb, 'available', 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=960&q=80'),
    (v_b_chmt, v_fl_chmt_2f, 'CHMT Banquet Training Hall 201', 'CHMT-BTH-201', 'multipurpose', 'Hospitality event banquet simulation hall for dining service, bar styling, and reception events.', 75, '["Round Banquet Tables", "Cocktail Bar Station", "Linen & Tableware", "Audio Speakers"]'::jsonb, '{"x": 260, "y": 60, "width": 120, "height": 70}'::jsonb, 'available', 'https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?w=960&q=80');

  -- 12) Indoor Badminton Court: own facility
  INSERT INTO public.facilities (building_id, floor_id, name, facility_code, category, description, capacity, equipment, map_position, status, image_url)
  VALUES
    (v_b_badminton, v_fl_badminton_1f, 'Indoor Badminton Court', 'BADM-MAIN-001', 'sports_gym', 'Indoor specialized wooden badminton court complex with official court markings and referee stands.', 120, '["Tournament Grade Nets", "Wooden Court Floor", "Umpire High Chairs", "Spectator Benches", "Overhead LED Lighting"]'::jsonb, '{"x": 160, "y": 60, "width": 140, "height": 80}'::jsonb, 'available', 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=960&q=80');

  -- 13) Research & Extension Building: Research & Extension Conference Center
  INSERT INTO public.facilities (building_id, floor_id, name, facility_code, category, description, capacity, equipment, map_position, status, image_url)
  VALUES
    (v_b_research, v_fl_research_1f, 'Research & Extension Conference Center', 'RES-CONF-001', 'conference_room', 'Executive conference center for inter-university research symposiums, patent discussions, and grant proposals.', 60, '["Conferencing Mic Console", "Dual Laser Projectors", "Executive Seating", "High-Speed Wi-Fi", "Glass Presentation Boards"]'::jsonb, '{"x": 160, "y": 60, "width": 140, "height": 80}'::jsonb, 'available', 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=960&q=80');

  -- 14) New College of Computer Studies Building: CCS Accreditation Room, 1st floor
  INSERT INTO public.facilities (building_id, floor_id, name, facility_code, category, description, capacity, equipment, map_position, status, image_url)
  VALUES
    (v_b_new_ccs, v_fl_new_ccs_1f, 'CCS Accreditation Room', 'NCCS-ACCR-101', 'conference_room', 'Flagship accreditation and evaluation suite of the College of Computer Studies on the 1st floor.', 35, '["4K Smart Screen", "Digital Document Station", "Conference Audio Array", "Ergonomic Executive Chairs", "High-speed Fiber Uplink"]'::jsonb, '{"x": 160, "y": 60, "width": 140, "height": 80}'::jsonb, 'available', 'https://images.unsplash.com/photo-1577495508048-b635879837f1?w=960&q=80');

  -- 15) Hostel Building: Hostel Function Hall
  INSERT INTO public.facilities (building_id, floor_id, name, facility_code, category, description, capacity, equipment, map_position, status, image_url)
  VALUES
    (v_b_hostel, v_fl_hostel_1f, 'Hostel Function Hall', 'HOSTEL-HALL-001', 'multipurpose', 'Air-conditioned reception and multipurpose seminar hall for campus delegates, guests, and visiting faculty.', 90, '["Modular Presentation Screen", "Wireless Microphones", "Round Tables", "Sound Console", "Private Restrooms"]'::jsonb, '{"x": 160, "y": 60, "width": 140, "height": 80}'::jsonb, 'available', 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=960&q=80');

  -- 16) College of Teacher Education Building: CTE Function Hall, 2nd floor
  INSERT INTO public.facilities (building_id, floor_id, name, facility_code, category, description, capacity, equipment, map_position, status, image_url)
  VALUES
    (v_b_cte, v_fl_cte_2f, 'CTE Function Hall', 'CTE-HALL-201', 'multipurpose', 'Premier multipurpose event hall of the College of Teacher Education on the 2nd floor for pinning ceremonies, teaching demos, and congresses.', 220, '["Elevated Stage", "Twin 4K Projectors", "Digital Sound Mixer", "Lapel & Wireless Mics", "Air Conditioning Array"]'::jsonb, '{"x": 160, "y": 60, "width": 150, "height": 85}'::jsonb, 'available', 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=960&q=80');

  -- 7. Assign facility administrator to all facilities if admin profile exists
  IF v_admin_id IS NOT NULL THEN
    INSERT INTO public.facility_administrators (facility_id, user_id)
    SELECT id, v_admin_id FROM public.facilities
    ON CONFLICT (facility_id, user_id) DO NOTHING;
  END IF;

END $$;

NOTIFY pgrst, 'reload schema';
