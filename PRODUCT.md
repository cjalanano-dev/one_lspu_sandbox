# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Students, faculty members, student-organization officers, facility administrators, and system administrators are all first-class users in this round; no role is subordinated to another. Students and faculty explore campus facilities and request reservations for personal or academic use. Organization officers manage activities and reservations on behalf of their organizations. Facility administrators manage assigned facilities and review reservation requests; system administrators manage the platform, users, organizations, and campus structure. All use desktop and mobile browsers.

## Product Purpose

ONE Facility centralizes the discovery, monitoring, scheduling, and reservation of university facilities and resources. It exists to replace manual reservation processes, prevent scheduling conflicts, improve coordination between organizations and administrators, and raise campus facility utilization. Success means a complete, trustworthy reservation lifecycle — discover a facility, verify availability, submit a request, receive a reviewed decision, and see the approved booking reflected on the facility calendar — with accurate utilization records.

## Positioning

ONE Facility pairs spatial campus discovery — building directory, floor navigation, and data-driven interactive SVG floor plans with clickable facility regions — with a conflict-checked reservation lifecycle that links organization activities to requests and gives administrators scoped review control. A generic room-booking tool could copy the form; it would still lack the campus map-to-room-to-calendar path and the organization/activity layer the product is built around.

## Operating Context

- University campus with buildings, floors, rooms, and shared equipment.
- Students and faculty discover facilities in a browser and submit personal requests; organization officers create activities and reserve facilities on an organization's behalf; facility administrators review requests for assigned facilities; system administrators manage platform-wide resources.
- Availability is derived from operating schedules, approved reservations, and maintenance periods, and is rechecked at approval time.
- The app runs entirely on Supabase: `@campus.edu` accounts and the TIC, SAC, and SRH buildings, with seeded facilities, reservations, and maintenance. There is no localStorage fallback; every read and write goes to the real database.

## Capabilities and Constraints

Confirmed MVP scope:

- Supabase Auth login/logout, profile management, role-based access, and account status. Public self-registration is not offered; accounts are provisioned administratively.
- Five roles: student, faculty, organization officer, facility administrator, system administrator.
- Campus Explorer with building directory, building details, floor navigation, data-driven interactive SVG floor plans, clickable facility locations, search, category filters, and facility information panels.
- Facility directory and detail pages with capacity, equipment, schedule, availability, reservation policy, and images.
- Facility availability calendar with daily, weekly, and monthly views; reservation and maintenance visualization; time-slot selection; conflict detection.
- Reservation requests with title, purpose, date/time, attendee count, requester, organization/activity linkage, requested equipment, and attachments where required.
- Reservation lifecycle: pending, approved, rejected, cancelled, completed, no-show; rejection requires a reason; status tracking, history, and in-app notifications.
- Organization profiles, members, officers, activities, and organization-linked reservations and calendars.
- Administrative dashboard with facility, building, floor, schedule, maintenance, organization, user, and reservation management; facility administrators are scoped to assigned facilities.
- Analytics and reports derived from actual reservation data (later phase).

Technical and scope constraints:

- React + Vite + TypeScript + Tailwind CSS + shadcn/ui/Radix + Lucide React on the frontend; Supabase/PostgreSQL, Auth, Storage, and Realtime on the backend; React Router, TanStack Query, React Hook Form, Zod, FullCalendar, and Recharts as specified.
- Permissions must be enforced with Supabase Row Level Security, not frontend checks alone.
- Reservation validation must happen in the database or a trusted server layer: start before end, operating hours, active/reservable facility, no overlap with approved reservations or maintenance, capacity, authorization, recheck at approval, and audit logging. Use PostgreSQL range types and exclusion constraints where appropriate.
- Availability is derived, never manually assigned as the primary source of truth.
- Use SVG floor plans, not a complex 3D map.
- Email notifications, QR check-in, equipment inventory management, advanced analytics, downloadable reports, recurring reservations, multi-level approvals, and university-system integrations are explicitly future enhancements, not MVP commitments.
- The application must work on desktop and mobile browsers.

Current build state:

- Implemented routes: landing, login, campus explorer, facilities directory, facility detail, my reservations, organization dashboard, and admin dashboard.
- Supabase schema and seed data exist; the app reads and writes directly to Supabase with no localStorage fallback.
- Several specified surfaces (notifications page, profile page, building/floor detail pages, full facility management, analytics) are not yet present and must not be described as shipped.

## Brand Commitments

- The working name "ONE Facility" and the tagline "Unified Campus Facility Management System" are current, not binding: naming, tagline, and voice are open for later revision per the product owner.
- The demo campus is fictional. Do not introduce a real university's name, marks, buildings, or endorsement without supplied assets and permission.
- No logo system is established yet; the wordmark "ONE FACILITY" is set in black system type.
- Brand palette: strict monochrome — paper white `#FFFFFF`, ink `#0A0A0A`, neutral grays only. Zero gradients, zero blur, zero shadows, zero saturated accents. Confirmed in `DESIGN.md`.
- Typography: system grotesque for UI; monospace for room codes, dates, times, and metadata.
- The visual direction in `onefacility.md` (navy/blue primary) is superseded by the monochrome wayfinding system in `DESIGN.md`.

## Evidence on Hand

- `onefacility.md` — full product specification and development guide; the authoritative scope document for the hackathon build.
- `supabase/migrations/` — schema for profiles, organizations, members, buildings, floors, facilities, schedules, maintenance, activities, reservations, notifications, audit logs, and facility administrators.
- All data is served from Supabase; there is no client-side demo store.
- Facility and building photography uses Unsplash URLs in seed data; these are placeholders, not licensed institutional assets.
- No real university data, testimonials, customer logos, press, benchmarks, utilization statistics, or endorsement exist. Future work must not fabricate them.

## Product Principles

1. One lifecycle, not disconnected dashboards: discovery, availability, request, review, notification, and calendar reflection must work end to end.
2. Availability is earned from evidence: schedules, approved reservations, and maintenance determine status; never hand-set it as the source of truth.
3. Permission is enforced where the data lives: frontend role checks shape the experience, RLS and database functions enforce the truth.
4. The campus map is the front door: spatial building/floor discovery is core product value, not decoration around a booking form.
5. Demo honestly: fictional seed data is labeled as such; never present demo content as real institutional evidence.

## Accessibility & Inclusion

- The product must work on desktop and mobile browsers and provide accessible interactive elements, per the specification.
- No specific accessibility standard (for example WCAG 2.2 AA) or additional user need has been confirmed; treat that as an open decision.
