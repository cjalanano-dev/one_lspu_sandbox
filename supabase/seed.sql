-- ONE Facility Realistic Seed Data
-- 1. Organizations
INSERT INTO public.organizations (id, name, acronym, description, logo_url, status)
VALUES 
  ('a1111111-1111-1111-1111-111111111111', 'Association for Computing Machinery - Student Chapter', 'ACM', 'Student chapter dedicated to computing and innovation.', 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=128&q=80', 'active'),
  ('b2222222-2222-2222-2222-222222222222', 'University Supreme Student Council', 'USSC', 'Apex governing student body for student welfare and activities.', 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=128&q=80', 'active'),
  ('c3333333-3333-3333-3333-333333333333', 'Society of Mechanical Engineers', 'SME', 'Innovators and builders advancing engineering solutions.', 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=128&q=80', 'active')
ON CONFLICT (id) DO NOTHING;

-- 2. Buildings
INSERT INTO public.buildings (id, name, code, description, location_description, total_floors, map_coordinates)
VALUES
  ('11111111-0000-0000-0000-000000000001', 'Technological Innovation Center', 'TIC', 'Premier 4-story facility housing computer labs, maker spaces, and auditoriums.', 'North Campus, near Engineering Oval', 4, '{"x": 180, "y": 140, "campus_zone": "North"}'::jsonb),
  ('11111111-0000-0000-0000-000000000002', 'University Student Activity Complex', 'SAC', 'Multi-purpose hubs for student governance, clubs, athletics, and cultural events.', 'Central Campus, adjacent to University Green', 3, '{"x": 420, "y": 280, "campus_zone": "Central"}'::jsonb),
  ('11111111-0000-0000-0000-000000000003', 'Science & Research Hall', 'SRH', 'State-of-the-art laboratory facility with specialized seminar rooms.', 'East Campus, Research Quadrangle', 3, '{"x": 680, "y": 160, "campus_zone": "East"}'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- 3. Floors
INSERT INTO public.floors (id, building_id, name, floor_number, floor_plan_url)
VALUES
  ('22222222-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000001', '1st Floor - Main Lobby & Auditorium', 1, '/floorplans/tic-1f.svg'),
  ('22222222-0000-0000-0000-000000000002', '11111111-0000-0000-0000-000000000001', '2nd Floor - Innovation Labs & Lecture Halls', 2, '/floorplans/tic-2f.svg'),
  ('22222222-0000-0000-0000-000000000003', '11111111-0000-0000-0000-000000000002', '1st Floor - Multipurpose Arena & Cafeteria', 1, '/floorplans/sac-1f.svg'),
  ('22222222-0000-0000-0000-000000000004', '11111111-0000-0000-0000-000000000002', '2nd Floor - Council Chambers & Org Suites', 2, '/floorplans/sac-2f.svg')
ON CONFLICT (id) DO NOTHING;

-- 4. Facilities
INSERT INTO public.facilities (id, building_id, floor_id, name, facility_code, category, description, capacity, equipment, map_position, status, image_url, rules)
VALUES
  (
    '33333333-0000-0000-0000-000000000001',
    '11111111-0000-0000-0000-000000000001',
    '22222222-0000-0000-0000-000000000001',
    'Grand Innovation Auditorium',
    'TIC-A101',
    'auditorium',
    'Acoustically engineered auditorium equipped with dual 4K laser projectors, stage lighting, and theatrical sound.',
    280,
    '["Dual 4K Laser Projectors", "Surround Sound Array", "Wireless Lapel & Handheld Mics", "Stage Lighting Console", "Live Streaming Rig"]'::jsonb,
    '{"svg_id": "room-auditorium", "x": 60, "y": 60, "width": 260, "height": 180}'::jsonb,
    'available',
    'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=800&q=80',
    'No food or sugary drinks inside. Sound technician required for stage equipment.'
  ),
  (
    '33333333-0000-0000-0000-000000000002',
    '11111111-0000-0000-0000-000000000001',
    '22222222-0000-0000-0000-000000000001',
    'Executive Conference Suite',
    'TIC-C102',
    'conference_room',
    'Modern executive boardroom with video conference bar, conference mic arrays, and smart glass privacy.',
    24,
    '["4K Smart Board", "Polycom Video Bar", "Conference Mic Pods", "Ergonomic Chairs", "High-speed Ethernet"]'::jsonb,
    '{"svg_id": "room-exec-board", "x": 340, "y": 60, "width": 160, "height": 120}'::jsonb,
    'available',
    'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80',
    'Whiteboards must be wiped clean after session. Leave all AV cables coiled.'
  ),
  (
    '33333333-0000-0000-0000-000000000003',
    '11111111-0000-0000-0000-000000000001',
    '22222222-0000-0000-0000-000000000002',
    'AI & Robotics Innovation Lab',
    'TIC-L201',
    'laboratory',
    'High-performance computing lab with 40 workstation rigs, soldering stations, and 3D printing equipment.',
    45,
    '["40 RTX Workstations", "3x Bambu 3D Printers", "Oscilloscopes", "Soldering Fume Extractors", "Smart Projection Display"]'::jsonb,
    '{"svg_id": "room-ai-lab", "x": 60, "y": 60, "width": 220, "height": 160}'::jsonb,
    'available',
    'https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=800&q=80',
    'Wear lab safety attire when handling 3D printing or soldering equipment.'
  ),
  (
    '33333333-0000-0000-0000-000000000004',
    '11111111-0000-0000-0000-000000000001',
    '22222222-0000-0000-0000-000000000002',
    'Interactive Tiered Lecture Hall',
    'TIC-LH202',
    'lecture_hall',
    'Tiered acoustic lecture hall optimized for symposiums, guest speaker seminars, and panel discussions.',
    120,
    '["Ultra-wide Cinema Display", "Dual Wireless Mics", "Podium with HDMI/USB-C", "Power Outlets at Every Seat"]'::jsonb,
    '{"svg_id": "room-lecture-hall", "x": 300, "y": 60, "width": 200, "height": 160}'::jsonb,
    'available',
    'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800&q=80',
    'Ensure podium master switch is powered off upon departure.'
  ),
  (
    '33333333-0000-0000-0000-000000000005',
    '11111111-0000-0000-0000-000000000002',
    '22222222-0000-0000-0000-000000000003',
    'SAC Multipurpose Sports & Activity Arena',
    'SAC-MP101',
    'multipurpose',
    'Spacious indoor maple-wood court suitable for assemblies, sports events, hackathons, and exhibitions.',
    500,
    '["Mobile Bleachers", "PA Announcement System", "Scoreboard Display", "Stage Platform Modules", "High-bay LED Floodlights"]'::jsonb,
    '{"svg_id": "room-arena", "x": 50, "y": 50, "width": 420, "height": 220}'::jsonb,
    'available',
    'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800&q=80',
    'Non-marking footwear required on hardwood floor. Clean as you go.'
  )
ON CONFLICT (id) DO NOTHING;
