# ONE Facility
## Project Specification & Development Guide

**Project Name:** ONE Facility  
**Project Type:** Web-based Campus Facility Management System  
**Tagline:** Unified Campus Facility Management System

---

# 1. Project Overview

ONE Facility is a centralized web-based campus facility management system designed to simplify the discovery, monitoring, scheduling, and reservation of university facilities and resources.

The platform provides students, faculty members, and student organizations with a unified interface for exploring campus buildings, viewing facility information, checking availability, and submitting reservation requests.

Administrators are provided with management tools for maintaining facility information, handling reservation requests, managing schedules, and monitoring facility utilization.

The system aims to reduce manual reservation processes, improve coordination between campus organizations and administrators, prevent scheduling conflicts, and improve the utilization of campus resources.

## 1.1 Core Objectives

1. Centralize campus facility information.
2. Make facility discovery easier through an interactive campus explorer.
3. Provide a reliable facility reservation and scheduling system.
4. Allow student organizations to manage reservations associated with their activities.
5. Give administrators control over facilities, schedules, and reservation approvals.
6. Maintain accurate records of facility usage and reservation history.

## 1.2 Target Users

- **Students:** Explore facilities and submit reservation requests.
- **Faculty Members:** Explore and request campus facilities.
- **Organization Officers:** Manage organization activities and submit reservations on behalf of their organizations.
- **Facility Administrators:** Manage assigned facilities and process reservation requests.
- **System Administrators:** Manage the overall platform, users, organizations, and campus structure.

---

# 2. Technology Stack

Use the following technologies:

### Frontend
- React
- Vite
- TypeScript
- Tailwind CSS
- shadcn/ui
- Radix UI
- Lucide React

### Backend and Database
- Supabase
- PostgreSQL
- Supabase Auth
- Supabase Storage
- Supabase Realtime, where appropriate

### Frontend Libraries
- React Router for navigation.
- TanStack Query for server-state management.
- React Hook Form for form handling.
- Zod for validation.
- FullCalendar for scheduling and calendar interfaces.
- Recharts for analytics and visualizations.

### Development and Deployment
- Git and GitHub.
- Vercel for frontend deployment.
- Supabase migrations for database schema management.

Use compatible, stable versions of the libraries. Avoid unnecessary dependencies.

---

# 3. System Modules

The application must be organized into the following functional modules.

## 3.1 Authentication and User Management

Implement account authentication using Supabase Auth.

Features:
- User registration.
- User login and logout.
- Password recovery.
- User profile management.
- Role-based access control.
- Account status management.

User roles:

| Role | Permissions |
|---|---|
| Student | Explore facilities and submit personal reservation requests |
| Faculty | Explore facilities and submit reservation requests |
| Organization Officer | Manage organization activities and reservations |
| Facility Administrator | Manage assigned facilities and reservation requests |
| System Administrator | Manage all platform resources and settings |

A user may have organization-specific permissions in addition to their primary account role.

Do not rely on frontend role checks alone. Enforce permissions through Supabase Row Level Security (RLS).

## 3.2 Campus Explorer

The Campus Explorer is one of the primary features of ONE Facility.

It allows users to explore the university campus and discover facilities through an interactive interface.

Features:
- Interactive campus map.
- Building directory.
- Building details.
- Floor navigation.
- Interactive SVG-based floor plans.
- Clickable facility locations.
- Facility search.
- Facility category filters.
- Facility information panels.

Facility information must include:
- Facility name.
- Facility type.
- Building and floor.
- Room number or identifier.
- Capacity.
- Description.
- Available equipment.
- Operating schedule.
- Current availability status.
- Reservation policies.
- Images, where available.

The interactive floor plan must be data-driven. Facility locations should be associated with their corresponding positions on the floor plan.

Avoid implementing a complex 3D map. Use SVG floor plans with clickable facility regions.

## 3.3 Facility Management

Administrators must be able to create, view, update, and deactivate facilities.

Facility information should include:
- Facility name.
- Facility code.
- Description.
- Category.
- Building.
- Floor.
- Capacity.
- Equipment.
- Operating hours.
- Reservation requirements.
- Active or inactive status.

Facilities should support the following availability states:

- Available.
- Reserved.
- Occupied.
- Under Maintenance.
- Unavailable.

Availability must be derived from schedules, reservations, and maintenance periods rather than manually assigned as the primary source of truth.

## 3.4 Facility Scheduling and Availability

Provide a calendar interface for viewing facility schedules.

Features:
- Daily, weekly, and monthly calendar views.
- Facility-specific schedules.
- Reservation schedule visualization.
- Maintenance schedule visualization.
- Available time-slot selection.
- Time-range validation.
- Conflict detection.

The system must validate a requested reservation against:
1. Facility operating hours.
2. Existing approved reservations.
3. Maintenance periods.
4. Facility reservation restrictions.
5. Required equipment availability, if equipment reservations are enabled.

The system must prevent conflicting approved reservations.

Pending requests should not automatically block a facility indefinitely. However, administrators must recheck availability before approving a request.

## 3.5 Reservation Management

Users must be able to submit reservation requests.

Reservation form fields:
- Facility.
- Reservation title.
- Purpose or description.
- Reservation date.
- Start time.
- End time.
- Expected number of attendees.
- Requesting user.
- Organization, if applicable.
- Associated activity, if applicable.
- Requested equipment.
- Supporting attachments, if required.

Reservation statuses:

| Status | Description |
|---|---|
| Pending | Awaiting administrator review |
| Approved | Reservation confirmed |
| Rejected | Reservation declined |
| Cancelled | Reservation cancelled |
| Completed | Reservation period has ended |
| No-show | Reservation holder failed to check in |

Features:
- Submit reservation requests.
- View reservation details.
- Track request status.
- Cancel eligible reservations.
- View reservation history.
- View approval and rejection details.
- Receive reservation notifications.

An administrator must provide a reason when rejecting a reservation.

## 3.6 Organization Management

Student organizations must have dedicated profiles.

Features:
- Organization registration and management.
- Organization profile.
- Organization members.
- Officer management.
- Organization activity creation.
- Activity management.
- Organization reservation history.
- Organization reservation calendar.

Organization activities should support:
- Activity name.
- Description.
- Event date.
- Expected attendees.
- Activity category.
- Assigned organization.
- Activity status.

Reservations made by organization officers must be associated with an organization and, when applicable, a specific activity.

Only authorized organization officers should be able to manage their organization's activities and reservations.

## 3.7 Administrative Dashboard

Provide administrators with a centralized management dashboard.

Dashboard overview:
- Total facilities.
- Total reservations.
- Pending requests.
- Approved reservations.
- Upcoming reservations.
- Facilities under maintenance.

Management features:
- Review reservation requests.
- Approve or reject reservations.
- View reservation details.
- Manage buildings.
- Manage floors.
- Manage facilities.
- Manage operating schedules.
- Manage maintenance periods.
- Manage organizations.
- Manage user accounts and roles.

Facility administrators should only manage the facilities assigned to them unless they have system administrator permissions.

## 3.8 Notification System

Users should receive notifications when:
- A reservation request is submitted.
- A reservation is approved.
- A reservation is rejected.
- A reservation is cancelled.
- A reservation schedule changes.
- A maintenance announcement affects a facility.

For the initial implementation, provide in-app notifications.

Email notifications can be implemented as a later enhancement.

## 3.9 Analytics and Reports

The administrative dashboard should eventually provide:
- Facility utilization rate.
- Most frequently reserved facilities.
- Peak reservation periods.
- Reservation counts by organization.
- Reservation approval and rejection statistics.
- Cancellation statistics.
- Facility usage trends.

Analytics must use actual reservation data.

---

# 4. Main System Workflows

## 4.1 General Reservation Workflow

1. User logs in.
2. User opens the Campus Explorer.
3. User selects a building.
4. User selects a floor.
5. User selects a facility.
6. User views facility details.
7. User checks its availability calendar.
8. User selects an available date and time.
9. User completes the reservation form.
10. System validates the request.
11. User submits the request.
12. Reservation is saved with Pending status.
13. Administrator reviews the request.
14. Administrator approves or rejects it.
15. System updates the reservation status.
16. User receives a notification.

## 4.2 Organization Reservation Workflow

1. Organization officer logs in.
2. Officer opens the organization dashboard.
3. Officer creates or selects an existing activity.
4. Officer explores available facilities.
5. Officer selects a suitable facility.
6. Officer checks availability.
7. Officer completes the reservation form.
8. Officer associates the reservation with the organization activity.
9. Officer submits the request.
10. Administrator reviews the request.
11. Administrator approves or rejects it.
12. Organization dashboard reflects the updated reservation.

## 4.3 Administrator Workflow

1. Administrator logs in.
2. Administrator opens the dashboard.
3. Administrator views pending requests.
4. Administrator opens a reservation request.
5. Administrator checks the reservation details.
6. System validates availability again.
7. Administrator approves or rejects the request.
8. System updates the reservation.
9. System records the decision and administrator.
10. System notifies the requesting user.

---

# 5. Database Design

Use PostgreSQL through Supabase.

Design the database using relational principles, foreign keys, constraints, and appropriate indexes.

Recommended tables:

### profiles
Stores additional user information associated with Supabase Auth accounts.

Fields:
- id (UUID, references auth.users)
- full_name
- email
- avatar_url
- primary_role
- account_status
- created_at
- updated_at

### organizations
Stores student organization information.

Fields:
- id
- name
- acronym
- description
- logo_url
- status
- created_at

### organization_members
Connects users to organizations.

Fields:
- id
- organization_id
- user_id
- organization_role
- membership_status
- created_at

### buildings
Stores campus building information.

Fields:
- id
- name
- code
- description
- location_description
- map_coordinates
- created_at

### floors
Stores building floors.

Fields:
- id
- building_id
- name
- floor_number
- floor_plan_url
- created_at

### facilities
Stores individual reservable facilities.

Fields:
- id
- building_id
- floor_id
- name
- facility_code
- category
- description
- capacity
- equipment
- map_position
- reservation_enabled
- status
- created_at
- updated_at

### facility_schedules
Stores normal operating schedules.

Fields:
- id
- facility_id
- day_of_week
- opening_time
- closing_time
- is_available

### maintenance_periods
Stores maintenance and temporary unavailability periods.

Fields:
- id
- facility_id
- title
- description
- start_datetime
- end_datetime
- created_by
- created_at

### activities
Stores organization activities.

Fields:
- id
- organization_id
- title
- description
- activity_date
- expected_attendees
- status
- created_by
- created_at

### reservations
Stores reservation requests.

Fields:
- id
- facility_id
- requester_id
- organization_id (nullable)
- activity_id (nullable)
- title
- purpose
- start_datetime
- end_datetime
- attendee_count
- status
- rejection_reason
- reviewed_by
- reviewed_at
- created_at
- updated_at

### notifications
Stores in-app notifications.

Fields:
- id
- user_id
- title
- message
- notification_type
- related_reservation_id
- is_read
- created_at

### audit_logs
Records important administrative actions.

Fields:
- id
- actor_id
- action
- entity_type
- entity_id
- details
- created_at

### facility_administrators
Assigns administrators to facilities.

Fields:
- id
- facility_id
- user_id
- created_at

Additional tables may be introduced when justified by actual requirements.

Do not store duplicated information unnecessarily.

Use UUID primary keys and `timestamptz` for timestamps. Use appropriate database constraints and indexes.

For equipment inventory and equipment reservations, design a separate relational model if that feature is implemented. Do not rely on an unstructured JSON field for inventory requiring quantity validation.

---

# 6. Reservation Validation and Data Integrity

Reservation logic is a critical part of the application.

Implement reservation creation and approval using secure database operations.

Requirements:

1. Start time must be earlier than end time.
2. Reservation must fall within facility operating hours.
3. Facility must be active and reservable.
4. Reservation must not overlap an existing approved reservation.
5. Reservation must not overlap a maintenance period.
6. Attendee count must not exceed facility capacity.
7. Only authorized users can create requests.
8. Only authorized administrators can approve or reject requests.
9. Availability must be checked again when an administrator approves a request.
10. Important reservation actions must be recorded.

Use PostgreSQL range types and exclusion constraints where appropriate to prevent overlapping approved reservations at the database level.

Do not depend exclusively on frontend validation.

Use database functions or transactional server-side operations for critical reservation approval and conflict checking.

---

# 7. User Interface and Design Direction

ONE Facility should have a clean, modern, professional campus-management interface.

Design principles:
- Minimal and intuitive.
- Modern dashboard layout.
- Consistent spacing and typography.
- Clear visual hierarchy.
- Responsive design.
- Accessible interactive elements.
- Consistent component styling.
- Clear reservation status indicators.

Suggested visual direction:
- Neutral background.
- White or lightly tinted content surfaces.
- Dark navy or deep blue primary color.
- Subtle borders and shadows.
- Green for approved or available.
- Amber for pending.
- Red for rejected or unavailable.

The interface should feel like a professional university management platform rather than a generic admin template.

Important pages:

### Public / General
- Landing page.
- Login page.
- Registration page.

### User
- User dashboard.
- Campus Explorer.
- Building details.
- Floor plan view.
- Facility details.
- Facility availability calendar.
- Reservation form.
- My reservations.
- Notifications.
- User profile.

### Organization
- Organization dashboard.
- Organization profile.
- Organization members.
- Organization activities.
- Organization reservations.
- Activity details.

### Administration
- Admin dashboard.
- Reservation management.
- Facility management.
- Building management.
- Floor management.
- Schedule management.
- Maintenance management.
- Organization management.
- User management.
- Analytics and reports.

---

# 8. Recommended Project Structure

Use a feature-oriented React project structure.

```text
src/
├── app/
│   ├── router.tsx
│   ├── providers.tsx
│   └── layouts/
│
├── components/
│   ├── ui/
│   ├── shared/
│   └── navigation/
│
├── features/
│   ├── auth/
│   ├── campus/
│   ├── buildings/
│   ├── facilities/
│   ├── reservations/
│   ├── organizations/
│   ├── activities/
│   ├── notifications/
│   └── analytics/
│
├── pages/
│   ├── public/
│   ├── user/
│   ├── organization/
│   └── admin/
│
├── hooks/
├── lib/
│   ├── supabase.ts
│   ├── utils.ts
│   └── validations/
│
├── types/
├── assets/
└── main.tsx

supabase/
├── migrations/
├── seed.sql
└── config.toml
```

Keep business logic separate from UI components.

Avoid placing database queries directly inside large page components. Use feature-specific hooks and service modules.

---

# 9. Development Priorities

Development must follow an incremental approach. Prioritize a complete working reservation workflow over implementing every feature immediately.

## Phase 1: Foundation
- Initialize React, Vite, and TypeScript.
- Configure Tailwind CSS.
- Install and configure UI components.
- Configure Supabase.
- Create database migrations.
- Implement authentication.
- Implement user profiles and roles.
- Configure Row Level Security.

## Phase 2: Campus Explorer
- Building directory.
- Building details.
- Floor navigation.
- SVG floor plan integration.
- Facility directory.
- Facility details.
- Facility search and filtering.

## Phase 3: Reservation System
- Facility availability calendar.
- Reservation request form.
- Reservation creation.
- Validation and conflict detection.
- Reservation status management.
- User reservation history.

## Phase 4: Organization Management
- Organization profiles.
- Organization membership and officer permissions.
- Activity creation.
- Activity-linked reservations.
- Organization reservation dashboard.

## Phase 5: Administration
- Administrative dashboard.
- Facility management.
- Schedule management.
- Maintenance management.
- Reservation approval and rejection.
- User and organization management.

## Phase 6: Polish and Deployment
- In-app notifications.
- Responsive layouts.
- Loading and error states.
- Empty states.
- Analytics.
- Testing.
- Deployment.

---

# 10. Hackathon MVP Scope

The initial hackathon implementation must prioritize these features:

**Must Have**
- Authentication.
- Role-based access.
- Campus Explorer.
- Building and floor navigation.
- Interactive SVG floor plan.
- Facility directory and details.
- Facility availability calendar.
- Reservation submission.
- Reservation conflict checking.
- Administrator approval and rejection.
- Reservation status tracking.
- Basic organization management.
- Organization-linked reservations.
- Administrative dashboard.

**Should Have**
- In-app notifications.
- Facility maintenance scheduling.
- Equipment selection.
- Reservation history.
- Basic utilization statistics.

**Future Enhancements**
- QR-based check-in.
- Equipment inventory management.
- Email notifications.
- Advanced analytics.
- Downloadable reports.
- Recurring reservations.
- Multi-level approval workflows.
- Integration with university systems.

Do not sacrifice the quality and reliability of the Must Have features to implement optional features.

---

# 11. Security and Quality Requirements

- Use Supabase Auth for authentication.
- Enable RLS on every table containing protected data.
- Never expose the Supabase service-role key in frontend code.
- Use environment variables for configuration.
- Validate all user input.
- Enforce permissions on the database or trusted backend layer.
- Prevent unauthorized reservation modifications.
- Prevent unauthorized administrative actions.
- Record important administrative operations.
- Handle database errors gracefully.
- Do not expose sensitive user information.
- Use database migrations to manage schema changes.

The application must work on desktop and mobile browsers.

---

# 12. Agent Development Instructions

You are acting as a senior full-stack software engineer responsible for developing ONE Facility.

Follow these instructions throughout development:

1. Understand the existing project structure before modifying files.
2. Do not overwrite or replace existing working implementations without understanding their purpose.
3. Follow the technology stack and architecture defined in this specification.
4. Use TypeScript and maintain strict type safety.
5. Write clean, modular, reusable, and maintainable code.
6. Keep components reasonably small and focused.
7. Separate UI, business logic, and database operations.
8. Use Supabase migrations for database schema changes.
9. Implement and test RLS policies alongside database features.
10. Never hardcode production data into frontend components.
11. Use seed data for demonstrations and development.
12. Include loading, error, empty, and success states.
13. Validate important operations on the server or database, not just the client.
14. Avoid unnecessary abstractions, dependencies, and overengineering.
15. Do not implement features outside the agreed scope without justification.

### Working Procedure

Before implementing a major feature:

1. Explain the feature and its intended behavior.
2. Identify the required database changes.
3. Identify affected components and services.
4. Implement the database changes.
5. Implement the application logic.
6. Build the user interface.
7. Test the feature and its permissions.
8. Report completed work and remaining issues.

Do not attempt to build the entire application in one pass.

Work incrementally, verify each phase, and maintain consistency with the project specification.

When a requirement is ambiguous, explain the ambiguity and propose a reasonable implementation before making architectural decisions.

---

# 13. Definition of Done

The hackathon MVP is considered functional when the following scenario works from beginning to end:

1. An organization officer logs into ONE Facility.
2. The officer opens their organization dashboard.
3. The officer creates or selects an activity.
4. The officer explores the campus map.
5. The officer navigates to a building and floor.
6. The officer selects a facility.
7. The officer checks the facility's availability.
8. The officer submits a reservation request.
9. The system validates the request and saves it as Pending.
10. A facility administrator logs in and reviews the request.
11. The administrator approves or rejects the request.
12. The system updates the reservation status.
13. The organization officer can see the decision.
14. The approved reservation appears on the facility calendar.
15. Another user cannot obtain an overlapping approved reservation for the same facility.

The system must also enforce appropriate access restrictions for each user role.

**Final objective:** Deliver a working, visually polished, and demonstrable campus facility management platform with a reliable reservation lifecycle, not merely a collection of disconnected dashboard pages.