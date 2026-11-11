-- ONE Facility Realistic Seed Data
-- Idempotent: every row is resolved by its natural key (code / acronym /
-- facility_code / (building_id, floor_number)) and receives a random UUID.
-- Re-running this file is safe and never reintroduces patterned IDs.
DO $$
DECLARE
  -- Buildings
  v_tic uuid;
  v_sac uuid;
  v_srh uuid;
  -- Floors
  v_tic_1f uuid;
  v_tic_2f uuid;
  v_sac_1f uuid;
  v_sac_2f uuid;
  v_srh_1f uuid;
  -- Facilities
  v_tic_a101 uuid;
  v_tic_c102 uuid;
  v_tic_l201 uuid;
  v_tic_lh202 uuid;
  v_sac_mp101 uuid;
  -- Organizations
  v_octa uuid;
BEGIN
  -- 1. Buildings (upsert by code)
  INSERT INTO public.buildings (name, code, description, location_description, total_floors, map_coordinates)
  VALUES (
    'Technological Innovation Center', 'TIC',
    'Premier 4-story facility housing computer labs, maker spaces, and auditoriums.',
    'North Campus, near Engineering Oval', 4,
    '{"x": 180, "y": 140, "campus_zone": "North"}'::jsonb
  )
  ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    location_description = EXCLUDED.location_description,
    total_floors = EXCLUDED.total_floors,
    map_coordinates = EXCLUDED.map_coordinates
  RETURNING id INTO v_tic;

  INSERT INTO public.buildings (name, code, description, location_description, total_floors, map_coordinates)
  VALUES (
    'University Student Activity Complex', 'SAC',
    'Multi-purpose hubs for student governance, clubs, athletics, and cultural events.',
    'Central Campus, adjacent to University Green', 3,
    '{"x": 420, "y": 280, "campus_zone": "Central"}'::jsonb
  )
  ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    location_description = EXCLUDED.location_description,
    total_floors = EXCLUDED.total_floors,
    map_coordinates = EXCLUDED.map_coordinates
  RETURNING id INTO v_sac;

  INSERT INTO public.buildings (name, code, description, location_description, total_floors, map_coordinates)
  VALUES (
    'Science & Research Hall', 'SRH',
    'State-of-the-art laboratory facility with specialized seminar rooms.',
    'East Campus, Research Quadrangle', 3,
    '{"x": 680, "y": 160, "campus_zone": "East"}'::jsonb
  )
  ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    location_description = EXCLUDED.location_description,
    total_floors = EXCLUDED.total_floors,
    map_coordinates = EXCLUDED.map_coordinates
  RETURNING id INTO v_srh;

  -- 2. Floors (upsert by building_id + floor_number)
  INSERT INTO public.floors (building_id, name, floor_number, floor_plan_url)
  VALUES (v_tic, '1st Floor - Main Lobby & Auditorium', 1, '/floorplans/tic-1f.svg')
  ON CONFLICT (building_id, floor_number) DO UPDATE SET
    name = EXCLUDED.name,
    floor_plan_url = EXCLUDED.floor_plan_url
  RETURNING id INTO v_tic_1f;

  INSERT INTO public.floors (building_id, name, floor_number, floor_plan_url)
  VALUES (v_tic, '2nd Floor - Innovation Labs & Lecture Halls', 2, '/floorplans/tic-2f.svg')
  ON CONFLICT (building_id, floor_number) DO UPDATE SET
    name = EXCLUDED.name,
    floor_plan_url = EXCLUDED.floor_plan_url
  RETURNING id INTO v_tic_2f;

  INSERT INTO public.floors (building_id, name, floor_number, floor_plan_url)
  VALUES (v_sac, '1st Floor - Multipurpose Arena & Cafeteria', 1, '/floorplans/sac-1f.svg')
  ON CONFLICT (building_id, floor_number) DO UPDATE SET
    name = EXCLUDED.name,
    floor_plan_url = EXCLUDED.floor_plan_url
  RETURNING id INTO v_sac_1f;

  INSERT INTO public.floors (building_id, name, floor_number, floor_plan_url)
  VALUES (v_sac, '2nd Floor - Council Chambers & Org Suites', 2, '/floorplans/sac-2f.svg')
  ON CONFLICT (building_id, floor_number) DO UPDATE SET
    name = EXCLUDED.name,
    floor_plan_url = EXCLUDED.floor_plan_url
  RETURNING id INTO v_sac_2f;

  INSERT INTO public.floors (building_id, name, floor_number, floor_plan_url)
  VALUES (v_srh, '1st Floor - Research Facilities', 1, NULL)
  ON CONFLICT (building_id, floor_number) DO UPDATE SET
    name = EXCLUDED.name,
    floor_plan_url = EXCLUDED.floor_plan_url
  RETURNING id INTO v_srh_1f;

  -- 3. Facilities (upsert by facility_code)
  INSERT INTO public.facilities (building_id, floor_id, name, facility_code, category, description, capacity, equipment, map_position, status, image_url, rules)
  VALUES (
    v_tic, v_tic_1f, 'Grand Innovation Auditorium', 'TIC-A101', 'auditorium',
    'Acoustically engineered auditorium equipped with dual 4K laser projectors, stage lighting, and theatrical sound.',
    280,
    '["Dual 4K Laser Projectors", "Surround Sound Array", "Wireless Lapel & Handheld Mics", "Stage Lighting Console", "Live Streaming Rig"]'::jsonb,
    '{"svg_id": "room-auditorium", "x": 60, "y": 60, "width": 260, "height": 180}'::jsonb,
    'available',
    'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=800&q=80',
    'No food or sugary drinks inside. Sound technician required for stage equipment.'
  )
  ON CONFLICT (facility_code) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    capacity = EXCLUDED.capacity,
    equipment = EXCLUDED.equipment,
    map_position = EXCLUDED.map_position,
    status = EXCLUDED.status,
    image_url = EXCLUDED.image_url,
    rules = EXCLUDED.rules
  RETURNING id INTO v_tic_a101;

  INSERT INTO public.facilities (building_id, floor_id, name, facility_code, category, description, capacity, equipment, map_position, status, image_url, rules)
  VALUES (
    v_tic, v_tic_1f, 'Executive Conference Suite', 'TIC-C102', 'conference_room',
    'Modern executive boardroom with video conference bar, conference mic arrays, and smart glass privacy.',
    24,
    '["4K Smart Board", "Polycom Video Bar", "Conference Mic Pods", "Ergonomic Chairs", "High-speed Ethernet"]'::jsonb,
    '{"svg_id": "room-exec-board", "x": 340, "y": 60, "width": 160, "height": 120}'::jsonb,
    'available',
    'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80',
    'Whiteboards must be wiped clean after session. Leave all AV cables coiled.'
  )
  ON CONFLICT (facility_code) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    capacity = EXCLUDED.capacity,
    equipment = EXCLUDED.equipment,
    map_position = EXCLUDED.map_position,
    status = EXCLUDED.status,
    image_url = EXCLUDED.image_url,
    rules = EXCLUDED.rules
  RETURNING id INTO v_tic_c102;

  INSERT INTO public.facilities (building_id, floor_id, name, facility_code, category, description, capacity, equipment, map_position, status, image_url, rules)
  VALUES (
    v_tic, v_tic_2f, 'AI & Robotics Innovation Lab', 'TIC-L201', 'laboratory',
    'High-performance computing lab with 40 workstation rigs, soldering stations, and 3D printing equipment.',
    45,
    '["40 RTX Workstations", "3x Bambu 3D Printers", "Oscilloscopes", "Soldering Fume Extractors", "Smart Projection Display"]'::jsonb,
    '{"svg_id": "room-ai-lab", "x": 60, "y": 60, "width": 220, "height": 160}'::jsonb,
    'available',
    'https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=800&q=80',
    'Wear lab safety attire when handling 3D printing or soldering equipment.'
  )
  ON CONFLICT (facility_code) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    capacity = EXCLUDED.capacity,
    equipment = EXCLUDED.equipment,
    map_position = EXCLUDED.map_position,
    status = EXCLUDED.status,
    image_url = EXCLUDED.image_url,
    rules = EXCLUDED.rules
  RETURNING id INTO v_tic_l201;

  INSERT INTO public.facilities (building_id, floor_id, name, facility_code, category, description, capacity, equipment, map_position, status, image_url, rules)
  VALUES (
    v_tic, v_tic_2f, 'Interactive Tiered Lecture Hall', 'TIC-LH202', 'lecture_hall',
    'Tiered acoustic lecture hall optimized for symposiums, guest speaker seminars, and panel discussions.',
    120,
    '["Ultra-wide Cinema Display", "Dual Wireless Mics", "Podium with HDMI/USB-C", "Power Outlets at Every Seat"]'::jsonb,
    '{"svg_id": "room-lecture-hall", "x": 300, "y": 60, "width": 200, "height": 160}'::jsonb,
    'available',
    'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800&q=80',
    'Ensure podium master switch is powered off upon departure.'
  )
  ON CONFLICT (facility_code) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    capacity = EXCLUDED.capacity,
    equipment = EXCLUDED.equipment,
    map_position = EXCLUDED.map_position,
    status = EXCLUDED.status,
    image_url = EXCLUDED.image_url,
    rules = EXCLUDED.rules
  RETURNING id INTO v_tic_lh202;

  INSERT INTO public.facilities (building_id, floor_id, name, facility_code, category, description, capacity, equipment, map_position, status, image_url, rules)
  VALUES (
    v_sac, v_sac_1f, 'SAC Multipurpose Sports & Activity Arena', 'SAC-MP101', 'multipurpose',
    'Spacious indoor maple-wood court suitable for assemblies, sports events, hackathons, and exhibitions.',
    500,
    '["Mobile Bleachers", "PA Announcement System", "Scoreboard Display", "Stage Platform Modules", "High-bay LED Floodlights"]'::jsonb,
    '{"svg_id": "room-arena", "x": 50, "y": 50, "width": 420, "height": 220}'::jsonb,
    'available',
    'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800&q=80',
    'Non-marking footwear required on hardwood floor. Clean as you go.'
  )
  ON CONFLICT (facility_code) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    capacity = EXCLUDED.capacity,
    equipment = EXCLUDED.equipment,
    map_position = EXCLUDED.map_position,
    status = EXCLUDED.status,
    image_url = EXCLUDED.image_url,
    rules = EXCLUDED.rules
  RETURNING id INTO v_sac_mp101;

  -- 4. Organizations (upsert by acronym; resolve parent by acronym)
  INSERT INTO public.organizations (name, acronym, description, logo_url, status, college, org_type, parent_org_id)
  VALUES (
    'Organization for Computing and Technology Advancements', 'OCTA',
    'Mother student organization of the College of Computer Studies (CCS).',
    'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=128&q=80',
    'active', 'College of Computer Studies (CCS)', 'college_mother', NULL
  )
  ON CONFLICT (acronym) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    logo_url = EXCLUDED.logo_url,
    status = EXCLUDED.status,
    college = EXCLUDED.college,
    org_type = EXCLUDED.org_type,
    parent_org_id = EXCLUDED.parent_org_id
  RETURNING id INTO v_octa;

  INSERT INTO public.organizations (name, acronym, description, logo_url, status, college, org_type, parent_org_id)
  VALUES (
    'Alliance of Leaders in G-Software and Optimization', 'ALGO',
    'Sub-organization of OCTA for Computer Science Students.',
    'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=128&q=80',
    'active', 'College of Computer Studies (CCS)', 'program_sub_org', v_octa
  )
  ON CONFLICT (acronym) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    logo_url = EXCLUDED.logo_url,
    status = EXCLUDED.status,
    college = EXCLUDED.college,
    org_type = EXCLUDED.org_type,
    parent_org_id = EXCLUDED.parent_org_id;

  INSERT INTO public.organizations (name, acronym, description, logo_url, status, college, org_type, parent_org_id)
  VALUES (
    'Bachelor of Science in Information Technology Student Society', 'BSIT',
    'Sub-organization of OCTA for Information Technology Students.',
    'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=128&q=80',
    'active', 'College of Computer Studies (CCS)', 'program_sub_org', v_octa
  )
  ON CONFLICT (acronym) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    logo_url = EXCLUDED.logo_url,
    status = EXCLUDED.status,
    college = EXCLUDED.college,
    org_type = EXCLUDED.org_type,
    parent_org_id = EXCLUDED.parent_org_id;

  INSERT INTO public.organizations (name, acronym, description, logo_url, status, college, org_type, parent_org_id)
  VALUES (
    'College of Engineering Student Council', 'COESC',
    'Apex student governing body of the College of Engineering.',
    'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=128&q=80',
    'active', 'College of Engineering (COE)', 'college_mother', NULL
  )
  ON CONFLICT (acronym) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    logo_url = EXCLUDED.logo_url,
    status = EXCLUDED.status,
    college = EXCLUDED.college,
    org_type = EXCLUDED.org_type,
    parent_org_id = EXCLUDED.parent_org_id;

  INSERT INTO public.organizations (name, acronym, description, logo_url, status, college, org_type, parent_org_id)
  VALUES (
    'University Supreme Student Council', 'USSC',
    'Apex governing student body for student welfare and activities across all colleges.',
    'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=128&q=80',
    'active', 'University Wide', 'university_wide', NULL
  )
  ON CONFLICT (acronym) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    logo_url = EXCLUDED.logo_url,
    status = EXCLUDED.status,
    college = EXCLUDED.college,
    org_type = EXCLUDED.org_type,
    parent_org_id = EXCLUDED.parent_org_id;
END $$;
