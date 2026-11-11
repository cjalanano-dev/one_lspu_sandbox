import type { Facility, FacilityCategory } from '../types'

// ---------------------------------------------------------------------------
// Facility imagery
// ---------------------------------------------------------------------------
// Every facility is expected to carry its own photograph (image_url), which is
// seeded in supabase/seed.sql and supabase/migrations/20261120_facility_images.sql.
//
// The map below is a safety net: if a facility is ever added without a
// picture, it still gets a relevant one based on its category instead of
// rendering an empty box. The images are hosted on Wikimedia Commons and are
// freely licensed (CC BY / CC BY-SA / public domain).
// ---------------------------------------------------------------------------

const CATEGORY_FALLBACK: Record<FacilityCategory, string> = {
  auditorium:
    'https://thumb.wikimedia.org/wikipedia/commons/thumb/c/ca/Auditorium_of_the_Pan-European_University%2C_Bratislava%2C_Slovakia_-_20140723-01.jpg/960px-Auditorium_of_the_Pan-European_University%2C_Bratislava%2C_Slovakia_-_20140723-01.jpg',
  lecture_hall:
    'https://thumb.wikimedia.org/wikipedia/commons/thumb/0/02/University_of_Washington_-_Amazon_Auditorium%2C_Bill_and_Melinda_Gates_Center_for_CSE_01.jpg/960px-University_of_Washington_-_Amazon_Auditorium%2C_Bill_and_Melinda_Gates_Center_for_CSE_01.jpg',
  laboratory:
    'https://thumb.wikimedia.org/wikipedia/commons/thumb/8/89/Vintage_laboratory_equipment%2C_Chemical_Faculty%2C_Gdansk_University_of_Technology2.jpg/960px-Vintage_laboratory_equipment%2C_Chemical_Faculty%2C_Gdansk_University_of_Technology2.jpg',
  conference_room:
    'https://thumb.wikimedia.org/wikipedia/commons/thumb/f/fa/Minimalist_meeting_room_%28Unsplash%29.jpg/960px-Minimalist_meeting_room_%28Unsplash%29.jpg',
  multipurpose:
    'https://thumb.wikimedia.org/wikipedia/commons/thumb/8/8d/Multi-Purpose_Auditorium%2C_UDS.jpg/960px-Multi-Purpose_Auditorium%2C_UDS.jpg',
  sports_gym:
    'https://thumb.wikimedia.org/wikipedia/commons/thumb/9/90/Interior_overview_of_the_indoor_sports_hall_at_OAU_Gymnasium.jpg/960px-Interior_overview_of_the_indoor_sports_hall_at_OAU_Gymnasium.jpg',
  study_lounge:
    'https://thumb.wikimedia.org/wikipedia/commons/thumb/4/4a/Graz_University-Library_reading-room.jpg/960px-Graz_University-Library_reading-room.jpg',
  outdoor_field:
    'https://thumb.wikimedia.org/wikipedia/commons/thumb/a/a6/Football_field_and_running_track%2C_Kent_Ridge_Campus%2C_National_University_of_Singapore_-_20070125.jpg/960px-Football_field_and_running_track%2C_Kent_Ridge_Campus%2C_National_University_of_Singapore_-_20070125.jpg',
}

// Last resort if the category is unknown: a generic hall.
const GENERIC_FALLBACK =
  'https://thumb.wikimedia.org/wikipedia/commons/thumb/e/e7/Mibu_Toy_Museum_Multipurpose_Hall_1.JPG/960px-Mibu_Toy_Museum_Multipurpose_Hall_1.JPG'

/** The photograph to show for a facility: its own, or one matching its category. */
export function facilityImageUrl(facility: Pick<Facility, 'image_url' | 'category'>): string {
  const own = facility.image_url?.trim()
  if (own) return own
  return CATEGORY_FALLBACK[facility.category] ?? GENERIC_FALLBACK
}
