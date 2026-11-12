# ONE LSPU

**ONE LSPU** unifies campus facility management and student event governance at **Laguna State Polytechnic University — San Pablo City Campus** through interactive schematic floor plans, real-time availability, automated conflict detection, and a five-stage digital signatory workflow—eliminating manual paperwork, preventing double bookings, and delivering faster, transparent approvals across dedicated role-based workspaces.

---

## Quick Start

### 1. Environment Variables
Ensure your `.env` file at the project root contains your Supabase credentials:
```env
VITE_SUPABASE_URL=https://lntfwbqxprrqvsexmckw.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-key>
```

### 2. Install & Run
```bash
npm install
npm run dev
```

---

## Demo Accounts (Password: `Demo1234!`)

Every account is pre-provisioned in Supabase Auth and `public.profiles`. You can switch between any role instantly using the **Quick Fill** tabs on `/login` (`Staff & Faculty`, `Org Officers`, `Signatories`).

### 1. Faculty & Campus Requesters
| Role | Email | Password | Default Workspace | Capabilities |
| :--- | :--- | :--- | :--- | :--- |
| **Faculty** | `test1@gmail.com` | `Demo1234!` | `/` | Browse interactive campus map & floor plans, check live availability, submit & cancel personal facility reservations |

### 2. Student Organization Officers (Presidents & Secretaries)
Only active **Presidents** and **Secretaries** of recognized student organizations can draft and submit event proposals.

| Organization | Position | Email | Password | Default Route |
| :--- | :--- | :--- | :--- | :--- |
| **OCTA** *(CCS Mother Org)* | President | `octa.president@campus.edu` *(or `officer@campus.edu`)* | `Demo1234!` | `/proposals` |
| **OCTA** *(CCS Mother Org)* | Secretary | `octa.secretary@campus.edu` | `Demo1234!` | `/proposals` |
| **ALGO** *(CS Sub-Org under OCTA)* | President | `algo.president@campus.edu` | `Demo1234!` | `/proposals` |
| **ALGO** *(CS Sub-Org under OCTA)* | Secretary | `algo.secretary@campus.edu` | `Demo1234!` | `/proposals` |
| **BSIT** *(IT Sub-Org under OCTA)* | President | `bsit.president@campus.edu` | `Demo1234!` | `/proposals` |
| **BSIT** *(IT Sub-Org under OCTA)* | Secretary | `bsit.secretary@campus.edu` | `Demo1234!` | `/proposals` |
| **COESC** *(College of Engineering SC)* | President | `coesc.president@campus.edu` | `Demo1234!` | `/proposals` |
| **COESC** *(College of Engineering SC)* | Secretary | `coesc.secretary@campus.edu` | `Demo1234!` | `/proposals` |

### 3. Five-Stage Signatories & Approvers
Each proposal progresses sequentially through five clearance stages (`Step 1` → `Step 5`). Step 1 is scoped to the submitting organization's dedicated Faculty Adviser.

| Stage | Signatory Role | Email | Password | Scope / Default Route |
| :--- | :--- | :--- | :--- | :--- |
| **Step 1** | **OCTA Adviser** | `octa.adviser@campus.edu` | `Demo1234!` | Step 1 for OCTA proposals (`/approvals`) |
| **Step 1** | **ALGO Adviser** | `algo.adviser@campus.edu` | `Demo1234!` | Step 1 for ALGO proposals (`/approvals`) |
| **Step 1** | **BSIT Adviser** | `bsit.adviser@campus.edu` | `Demo1234!` | Step 1 for BSIT proposals (`/approvals`) |
| **Step 1** | **COESC Adviser** | `coesc.adviser@campus.edu` | `Demo1234!` | Step 1 for COESC proposals (`/approvals`) |
| **Step 1** | **General Org Adviser** | `adviser@campus.edu` | `Demo1234!` | Fallback Step 1 Signatory (`/approvals`) |
| **Step 2** | **College Dean** | `dean@campus.edu` | `Demo1234!` | Step 2 Signatory (`/approvals`) |
| **Step 3** | **OSAS** | `osas@campus.edu` | `Demo1234!` | Step 3 Signatory (`/approvals`) |
| **Step 4** | **Campus Director** | `director@campus.edu` | `Demo1234!` | Step 4 Signatory (`/approvals`) |
| **Step 5** | **University President** | `president@campus.edu` | `Demo1234!` | Step 5 Final Signatory (`/approvals`) |

### 4. Facility & System Administration
| Role | Email | Password | Default Route | Capabilities |
| :--- | :--- | :--- | :--- | :--- |
| **Facility Admin** | `admin@campus.edu` | `Demo1234!` | `/admin` | Approve/reject direct venue reservations, manage facility catalog & maintenance status, oversee campus-wide bookings |

---

## End-to-End Demo Walkthroughs

### Flow A: Five-Stage Student Event Proposal & Automatic Venue Locking
1. **Draft & Submit Proposal (`octa.president@campus.edu`)**
   - Sign in on `/login` using the **Org Officers** quick-fill tab.
   - Click **New Event Proposal** (`/proposals/new`) and complete the 5-step wizard:
     - **Step 1 (Basic Details):** Title, Category, Organization (`OCTA`), Objective, and Expected Attendance.
     - **Step 2 (Schedule & Venue):** Pick an event date/time and select a campus venue (e.g., `AVEC-MAIN` or `GYM-MAIN`). The system performs live venue conflict checks against both direct reservations and other in-flight proposals.
     - **Step 3 (Program & Speakers):** Add program timeline blocks and speakers.
     - **Step 4 (Budget):** Itemize projected expenses with automatic total calculation (`tabular-nums`).
     - **Step 5 (Documents):** Upload supporting PDFs/attachments and click **Submit for Approval**.
2. **Sequential Signatory Clearances (`Step 1` → `Step 5`)**
   - Sign in as `octa.adviser@campus.edu` (`/approvals`), open the proposal, and click **Approve & Sign** (or **Return for Revision** with required notes).
   - Repeat clearance through `dean@campus.edu` (Step 2), `osas@campus.edu` (Step 3), `director@campus.edu` (Step 4), and `president@campus.edu` (Step 5).
   - Each approval generates a cryptographic **SHA-256 signature hash**, timestamp, and audit trail entry.
3. **Automatic Reservation & Printable Permit**
   - Upon **Step 5 (University President)** approval:
     - The proposal status transitions to `approved`.
     - A confirmed reservation is **automatically locked** in `public.reservations` for the selected venue and schedule.
     - The event appears on the **University-Wide Student Organization Events Calendar** (`/calendar`).
   - Open `/proposals/:id/print` to generate the official A4 **Event Permit & Clearance Sheet** complete with signatory stamps and a verifiable QR code (`/verify/:reference`).

### Flow B: Interactive Campus Discovery & Direct Facility Reservation
1. Sign in as `test1@gmail.com` (Faculty) or `octa.president@campus.edu`.
2. Open **Campus Map** (`/explorer`):
   - Explore the **Interactive 2D LSPU San Pablo Campus Map** featuring 16 real campus buildings, main gates, parking zones, and pathways.
   - Select a building (e.g., `Old CCS Building` or `AVEC Building`) and switch to the **Floor Plan Viewer** to inspect room-level schematic layouts and live status pins (`Available`, `Reserved`, `Pending`, `Maintenance`).
3. Click any room pin to inspect capacity, amenities, and schedule, then submit a time-slot reservation.
4. Sign in as `admin@campus.edu` (`/admin`) to review and approve the reservation request.

---

## Key Architecture & Features

- **Role-Isolated Workspaces:**
  - **Signatories (`adviser`, `dean`, `osas`, `director`, `president`):** Dedicated clearance inbox (`/approvals`), 48-hour SLA tracking, overdue alerts, and university calendar visibility.
  - **Organization Officers (`student_officer`):** Executive dashboard (`/organization`), 5-step proposal wizard (`/proposals`), real-time stepper tracking, and facility booking access.
  - **Facility Administrators (`admin`, `super_admin`):** Central reservation command center (`/admin`), status overrides, and facility inventory controls.
  - **Faculty & Staff (`faculty`, `student`):** Streamlined campus map discovery (`/explorer`), directory search (`/facilities`), and personal reservation tracking (`/my-reservations`).
- **Real LSPU San Pablo Campus Geometry (`16 Buildings`, `22 Reservable Facilities`):**
  - **Buildings:** `COE`, `CIT-MULTI`, `CIT`, `AVEC`, `OLD-CCS` (1F & 2F), `GYM`, `CCJE`, `CAS`, `CBAA`, `AMPHI`, `CHMT`, `BADMINTON`, `RESEARCH`, `NEW-CCS`, `HOSTEL`, and `CTE`.
  - **Facilities:** Includes `GYM-MAIN` (1,200 cap), `AMPHI-MAIN` (600 cap), `AVEC-MAIN` (250 cap), `OLD-CCS-LAB1`–`LAB6` & `LEC1`, `NEW-CCS-ACCRED-1F`, `CBAA-ACCRED`, `CCJE-FH`, `CTE-FH-2F`, `BADMINTON-MAIN`, `HOSTEL-MAIN`, `RESEARCH-MAIN`, and college room blocks.
- **Dual-Layer Conflict Detection:**
  - Prevents overlapping bookings at both the client pre-check layer (`check_reservation_conflict` & `check_proposal_venue_conflict` RPCs) and the PostgreSQL trigger layer (`trg_prevent_reservation_overlap`) with a 1-hour setup/teardown buffer.
- **Cryptographic Signatory Ledger & Public QR Verification:**
  - Every signatory decision records a verifiable signature hash (`SHA-256`) and can be validated publicly without login via `/verify/:reference`.
- **Architectural Space & Signatory Ledger UI:**
  - Engineered with `IBM Plex Sans` and `IBM Plex Mono`, `1px` structural hairlines (`.ledger-strip` / `.ledger-cell`), high-contrast status semantics, print-ready A4 permit stylesheets, and responsive touch targets (`320px` mobile to desktop widescreen).

---

## Application Routes

| Route | Access | Description |
| :--- | :--- | :--- |
| `/` | Public / Authenticated | Institutional portal for guests; role-scoped workspace upon login |
| `/login` | Public | Institutional Sign-In with Quick-Fill Demo Role Switcher |
| `/calendar` | Authenticated | University-Wide Student Organization Events Calendar (Month / Week / Day) |
| `/explorer` | Requesters & Admins | Interactive 2D LSPU San Pablo Campus Map & SVG Floor Plan Viewer |
| `/facilities` | Requesters & Admins | Searchable Facility Directory with Building, Type, Capacity, and Equipment filters |
| `/facilities/:id` | Requesters & Admins | Facility Specifications, Live Availability Timeline, and Reservation Modal |
| `/my-reservations` | Requesters & Admins | Personal Reservation Ledger & Cancellation Controls |
| `/organization` | `student_officer`, `admin` | Student Organization Executive Dashboard (Activities & Venue Bookings) |
| `/proposals` | `student_officer`, Signatories, Admins | Event Proposals Registry with Status & Search Filters |
| `/proposals/new` | `student_officer` *(Pres/Sec)*, `admin` | 5-Step Event Proposal Submission Wizard |
| `/proposals/:id` | Authenticated | Proposal Dossier, 5-Stage Approval Stepper, Budget, & Audit Log |
| `/proposals/:id/print` | Authenticated | Printable A4 Official Event Permit with QR Code & Digital Stamps |
| `/verify/:reference` | Public | Public Cryptographic Permit & Signatory Verification Page |
| `/approvals` | Signatories & Admins | Signatory Clearance Inbox with 48h SLA Indicators & Batch Filters |
| `/admin` | `admin`, `super_admin` | Facility Administrator Command Center & Catalog Management |

---

## Database Schema & Migrations (`supabase/migrations/`)

All 20 migrations are applied to project `lntfwbqxprrqvsexmckw`:

1. `20261110_init_schema.sql` — Core enums, `profiles`, `organizations`, `buildings`, `floors`, `facilities`, `reservations`, `reservation_logs`, and overlap prevention triggers.
2. `20261111_rls_and_rpc.sql` — Row-Level Security (RLS) policies and `check_reservation_conflict` RPC.
3. `20261112_seed_campus_data.sql` — Initial campus seed data.
4. `20261113_seed_demo_accounts.sql` — Core demo accounts in `auth.users` and `public.profiles`.
5. `20261114_event_proposals_schema.sql` — 5-stage `event_proposals`, `proposal_approvals`, `proposal_attachments`, `proposal_audit_logs`, and automatic venue reservation trigger on Step 5 approval.
6. `20261115_seed_signatory_accounts.sql` — Signatory demo accounts (`adviser`, `dean`, `osas`, `director`, `president`) and sample multi-stage proposals.
7. `20261116_enhance_proposals_v2.sql` — Budget breakdown JSONB, program schedule, speakers, QR verification reference, SHA-256 signature hashes, and `check_proposal_venue_conflict` RPC.
8. `20261117_storage_and_Print_Verification.sql` — Supabase Storage bucket (`proposal-attachments`) and public QR verification RPC (`verify_proposal_by_reference`).
9. `20261118_student_orgs_and_officers.sql` — `organization_officers` table and helper functions (`can_create_org_proposal`).
10. `20261119_lspu_campus_map_seed.sql` — LSPU San Pablo City Campus 2D map coordinates and schematic floor plan geometries.
11. `20261120_lockdown_public_signup.sql` — Disables public self-registration and restricts account creation to institutional provisioning.
12. `20261121_fix_storage_rls_and_conflict_rpc.sql` — Storage RLS refinements and conflict detection accuracy updates.
13. `20261122_fix_proposal_update_rls.sql` — RLS policy allowing officers to resubmit returned proposals and signatories to advance stages.
14. `20261123_reseed_orgs_octa_algo_bsit_coesc.sql` — Seeds real LSPU student organizations (`OCTA`, `ALGO`, `BSIT`, `COESC`) with hierarchy (`parent_org_id`).
15. `20261124_seed_org_presidents_and_secretaries.sql` — Dedicated President and Secretary accounts for `OCTA`, `ALGO`, `BSIT`, and `COESC`.
16. `20261125_org_advisers_and_step1_scoping.sql` — Dedicated Faculty Adviser accounts per organization and Step 1 approval scoping.
17. `20261126_rename_bsit_org.sql` — Standardizes BSIT organization naming and metadata.
18. `20261127_update_campus_buildings.sql` — Updates campus buildings to the 16 real LSPU San Pablo structures.
19. `20261128_align_facilities_to_real_buildings.sql` — Aligns facility records and floor plan coordinates to the real campus buildings.
20. `20261129_reprovision_real_facilities.sql` — Provisions the 22 real reservable facilities across LSPU San Pablo City Campus.

---

## Scripts

- `npm run dev` — Start Vite development server with HMR
- `npm run build` — Type-check (`tsc -b`) and build production bundle to `dist/`
- `npm run lint` — Run ESLint across `src/`
- `npm run preview` — Preview production build locally
