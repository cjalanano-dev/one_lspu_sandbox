-- Migration: 20261127_seed_real_campus_buildings.sql
-- Description: Provisions the full set of real LSPU San Pablo City Campus buildings
-- matching the official campus guide: COE, CIT Multi-Tech, Old CCS, NSTP, CCJE,
-- CAS, CBAA, Amphitheater, Indoor Badminton, CHMT, ICTS, DOST, Alumni, Research,
-- Gym, New CCS, Library, Clinic, Canteen, Hostel, CTE.

INSERT INTO public.buildings (name, code, description, location_description, total_floors, map_coordinates)
VALUES
  ('College of Engineering Building', 'COE', 'Engineering lecture rooms, computer-aided drafting labs, and faculty offices.', 'North-West Campus', 3, '{"x": 150, "y": 165}'::jsonb),
  ('CIT Multi-Tech Building', 'CIT-MULTI', 'Industrial technology workshops, electronics, and technical training suites.', 'North Campus', 3, '{"x": 250, "y": 180}'::jsonb),
  ('CIT Building', 'CIT', 'College of Industrial Technology classrooms and department offices.', 'North-West Quad', 2, '{"x": 250, "y": 370}'::jsonb),
  ('Audio-Visual Educational Center (AVEC)', 'AVEC', 'Campus media screening center and audio-visual presentations room.', 'North-West Quad', 1, '{"x": 295, "y": 285}'::jsonb),
  ('Old CCS Building', 'OLD-CCS', 'Legacy computing hall, faculty lounge, and seminar rooms.', 'North Campus', 2, '{"x": 395, "y": 190}'::jsonb),
  ('NSTP Office', 'NSTP', 'National Service Training Program and student civic engagement headquarters.', 'North Campus', 1, '{"x": 510, "y": 190}'::jsonb),
  ('University Gymnasium', 'GYM', 'Full-court indoor arena for basketball, assemblies, and institutional events.', 'Central Sports Quad', 2, '{"x": 360, "y": 265}'::jsonb),
  ('College of Criminal Justice Education Building', 'CCJE', 'Forensic science rooms, mock courtroom, and criminology departments.', 'North-East Campus', 3, '{"x": 545, "y": 265}'::jsonb),
  ('College of Arts and Sciences Building', 'CAS', 'Natural science laboratories, language labs, and humanities lecture halls.', 'East Campus', 3, '{"x": 535, "y": 395}'::jsonb),
  ('College of Business Administration and Accountancy', 'CBAA', 'Business analytics suite, mock boardrooms, and accounting classrooms.', 'East Campus', 3, '{"x": 585, "y": 465}'::jsonb),
  ('University Open-Air Amphitheater', 'AMPHI', 'Outdoor amphitheater and staging ground for cultural presentations.', 'East Campus', 1, '{"x": 655, "y": 495}'::jsonb),
  ('Alumni Affairs Building', 'ALUMNI', 'Alumni relations, historical records, and conference suites.', 'South-East Strip', 1, '{"x": 395, "y": 550}'::jsonb),
  ('DOST Innovation Building', 'DOST', 'Department of Science and Technology incubation and fabrication lab.', 'South-East Strip', 1, '{"x": 475, "y": 550}'::jsonb),
  ('ICTS Building', 'ICTS', 'Information & Communications Technology Services and campus datacenter.', 'South-East Strip', 2, '{"x": 550, "y": 558}'::jsonb),
  ('College of Hospitality Management and Tourism Building', 'CHMT', 'Culinary arts kitchens, banquet training halls, and bar labs.', 'South-East Strip', 2, '{"x": 630, "y": 565}'::jsonb),
  ('Indoor Badminton Court', 'BADMINTON', 'Indoor wooden badminton and multi-purpose sports facility.', 'South-East Strip', 1, '{"x": 715, "y": 570}'::jsonb),
  ('Research & Extension Building', 'RESEARCH', 'R&D offices, faculty publications, and project workspaces.', 'South Quad', 2, '{"x": 390, "y": 605}'::jsonb),
  ('New College of Computer Studies Building', 'NEW-CCS', 'Flagship CCS complex with networking, AI, and systems laboratories.', 'West Campus', 4, '{"x": 140, "y": 330}'::jsonb),
  ('University Library', 'LIB', 'Circulation desk, thesis archives, e-library, and quiet study areas.', 'West Campus', 2, '{"x": 155, "y": 445}'::jsonb),
  ('University Medical & Dental Clinic', 'CLINIC', 'First-aid triage, doctor consultations, and dental care.', 'West Campus', 1, '{"x": 165, "y": 525}'::jsonb),
  ('University Canteen', 'CANTEEN', 'Student and faculty dining hall, snack kiosks, and food services.', 'West Campus', 1, '{"x": 230, "y": 565}'::jsonb),
  ('Hostel Building', 'HOSTEL', 'Campus visitor suites, dormitory accommodations, and hospitality rooms.', 'South Campus', 3, '{"x": 210, "y": 640}'::jsonb),
  ('College of Teacher Education Building', 'CTE', 'Secondary and elementary teacher education classrooms and lecture halls.', 'South Campus Entrance', 3, '{"x": 210, "y": 800}'::jsonb)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  location_description = EXCLUDED.location_description,
  total_floors = EXCLUDED.total_floors,
  map_coordinates = EXCLUDED.map_coordinates;

-- Ensure each building has at least a 1st floor so it can immediately be selected in the UI
INSERT INTO public.floors (building_id, name, floor_number)
SELECT b.id, '1st Floor - Main Hall', 1
FROM public.buildings b
ON CONFLICT (building_id, floor_number) DO NOTHING;

NOTIFY pgrst, 'reload schema';

