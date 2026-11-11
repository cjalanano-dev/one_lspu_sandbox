-- ONE Facility: give every facility a picture
--
-- 12 of the 17 facilities had a NULL image_url, so the facilities page
-- rendered a bare placeholder icon instead of a photograph. This migration
-- assigns a photograph to each of them.
--
-- Images are hosted on Wikimedia Commons and are freely licensed (CC BY /
-- CC BY-SA / public domain). They are referenced over HTTPS at a fixed
-- 960px thumbnail width.
--
-- The existing images for the 5 facilities that already had one are kept
-- as-is (they point at Unsplash). Everything below only fills in the gaps.

UPDATE public.facilities SET image_url = 'https://thumb.wikimedia.org/wikipedia/commons/thumb/8/81/Seattle_Pacific_University_-_Ashton_Hall.jpg/960px-Seattle_Pacific_University_-_Ashton_Hall.jpg'
WHERE facility_code = 'DHOSTEL-001';

UPDATE public.facilities SET image_url = 'https://thumb.wikimedia.org/wikipedia/commons/thumb/3/3a/Synod_Higher_Secondary_School_Multipurpose_Hall_Interior.jpg/960px-Synod_Higher_Secondary_School_Multipurpose_Hall_Interior.jpg'
WHERE facility_code = 'SAC-ACC-001';

UPDATE public.facilities SET image_url = 'https://thumb.wikimedia.org/wikipedia/commons/thumb/c/cf/Amphitheatre%2C_Mount_Royal_University%2C_Calgary%2C_Alberta%2C_2025-07-11_02.jpg/960px-Amphitheatre%2C_Mount_Royal_University%2C_Calgary%2C_Alberta%2C_2025-07-11_02.jpg'
WHERE facility_code = 'SAC-AMP-001';

UPDATE public.facilities SET image_url = 'https://thumb.wikimedia.org/wikipedia/commons/thumb/7/70/2025-08-20_AA._Thoddoo_indoor_badminton_court_construction_commencement_ceremony_%2813%29.jpg/960px-2025-08-20_AA._Thoddoo_indoor_badminton_court_construction_commencement_ceremony_%2813%29.jpg'
WHERE facility_code = 'SAC-BAD-001';

UPDATE public.facilities SET image_url = 'https://thumb.wikimedia.org/wikipedia/commons/thumb/1/18/Synod_Higher_Secondary_School_Multipurpose_Hall_Interior_2.jpg/960px-Synod_Higher_Secondary_School_Multipurpose_Hall_Interior_2.jpg'
WHERE facility_code = 'SAC-CCJE-001';

UPDATE public.facilities SET image_url = 'https://thumb.wikimedia.org/wikipedia/commons/thumb/a/a6/Football_field_and_running_track%2C_Kent_Ridge_Campus%2C_National_University_of_Singapore_-_20070125.jpg/960px-Football_field_and_running_track%2C_Kent_Ridge_Campus%2C_National_University_of_Singapore_-_20070125.jpg'
WHERE facility_code = 'SAC-FLD-001';

UPDATE public.facilities SET image_url = 'https://thumb.wikimedia.org/wikipedia/commons/thumb/9/90/Interior_overview_of_the_indoor_sports_hall_at_OAU_Gymnasium.jpg/960px-Interior_overview_of_the_indoor_sports_hall_at_OAU_Gymnasium.jpg'
WHERE facility_code = 'SAC-GYM-001';

UPDATE public.facilities SET image_url = 'https://thumb.wikimedia.org/wikipedia/commons/thumb/1/16/Voleibol_%28Haro%29.jpg/960px-Voleibol_%28Haro%29.jpg'
WHERE facility_code = 'SAC-VOL-001';

UPDATE public.facilities SET image_url = 'https://thumb.wikimedia.org/wikipedia/commons/thumb/f/fa/Minimalist_meeting_room_%28Unsplash%29.jpg/960px-Minimalist_meeting_room_%28Unsplash%29.jpg'
WHERE facility_code = 'SRH-CONF-001';

UPDATE public.facilities SET image_url = 'https://thumb.wikimedia.org/wikipedia/commons/thumb/6/6c/UTA_Engineering_Research_Building_exterior_%282017%29.jpg/960px-UTA_Engineering_Research_Building_exterior_%282017%29.jpg'
WHERE facility_code = 'SRH-RDE-001';

UPDATE public.facilities SET image_url = 'https://thumb.wikimedia.org/wikipedia/commons/thumb/e/e7/Mibu_Toy_Museum_Multipurpose_Hall_1.JPG/960px-Mibu_Toy_Museum_Multipurpose_Hall_1.JPG'
WHERE facility_code = 'TIC-CIT-001';

UPDATE public.facilities SET image_url = 'https://thumb.wikimedia.org/wikipedia/commons/thumb/4/4a/Graz_University-Library_reading-room.jpg/960px-Graz_University-Library_reading-room.jpg'
WHERE facility_code = 'TIC-LIB-001';

-- Safety net: no facility may be left without a picture.
UPDATE public.facilities
SET image_url = 'https://thumb.wikimedia.org/wikipedia/commons/thumb/8/8d/Multi-Purpose_Auditorium%2C_UDS.jpg/960px-Multi-Purpose_Auditorium%2C_UDS.jpg'
WHERE image_url IS NULL OR btrim(image_url) = '';
