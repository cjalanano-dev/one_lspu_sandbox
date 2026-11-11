# ONE Facility — Frontend Design & UX Audit

**Date:** November 11, 2026  
**Scope:** Complete frontend: landing, auth, campus explorer, facilities directory, facility detail/reservation, my reservations, organization dashboard, admin dashboard, shared navigation, modals, and responsive behavior.  
**Mode:** Read-only audit. No application, backend, Supabase, schema, or functionality changes were made.

---

## 1. Executive verdict

ONE Facility has a credible visual shell: the navy/blue brand, card language, status badges, and page headers read as one product. The underlying experience is not release-ready.

The core product promise is **“find a room on a floor plan and reserve it.”** That path currently breaks at three points:

1. Unauthenticated users who open a protected URL see a blank page instead of a login screen.
2. The Explorer’s “interactive” floor-plan rooms are drawn outside the visible SVG canvas, so the primary spatial-discovery feature is effectively unusable.
3. The forms that drive login, registration, reservation, and admin decisions do not have programmatically associated labels.

Axe-core recorded **127 color-contrast failures across the captured page states**, plus **26 critical form-label failures** and **6 critical select-name failures**. The interface also carries the symptoms of an unfinished design system: four unused CSS variables, six gradients, and a mix of slate, sky, indigo, emerald, amber, rose, and purple applied ad hoc.

**Verdict:** fix the P0 blockers before any demo, usability test, or release. Then redesign the reservation journey around availability, not a long form. The visual polish is already good enough to preserve; the next pass should make the product trustworthy and operable.

### Scorecard

| Area | Status | Summary |
|---|---|---|
| Brand and first impression | Good | Distinctive navy/blue identity; consistent cards and badges. |
| Visual hierarchy | Fair | Strong page titles; weak metadata contrast and heading structure. |
| Navigation and IA | Weak | Same top nav for every role; no admin/org workspace structure. |
| Reservation journey | Weak | Long mixed-purpose page; no availability-first selection or review step. |
| Admin usability | Fair | Review cards are clear; no management surfaces or triage tools. |
| Accessibility | Blocked | Critical labels, contrast, modal, keyboard, and landmark failures. |
| Responsive behavior | Fair | No horizontal overflow, but tablet/mobile nav and long mobile pages break down. |
| Design-system consistency | Weak | Tokens are declared but unused; raw palette and type sizes are fragmented. |
| Content trust | Fair | Attractive claims outrun the shipped experience in several places. |

---

## 2. Method and limits

- Read all routes, layouts, navigation, auth guards, data-store calls, shared styles, and major page components.
- Ran `npm run build` successfully; the bundle is **656.17 kB** in one JS chunk, with Vite’s chunk-size warning.
- Ran the Impeccable detector against source and rendered pages.
- Ran axe-core at **1440×900**, **768×1024**, and **390×844** on landing, login, register, explorer, facilities, facility detail, my-reservations, organization, admin, guest-protected routes, and open modals.
- Captured full-page screenshots and DOM metrics for each state.
- Verified no horizontal overflow at the tested widths.

**Limits:** the live `profiles` and `reservations` tables were empty, so authenticated and reservation flows were exercised with mocked Supabase responses. Live end-to-end auth, approval, and notification delivery were not verified. The organization-dashboard console error was diagnosed as an empty image `src`; see P1-6.

All recommendations below are **frontend-only**. They do not require changing backend logic, Supabase configuration, database schemas, or existing product behavior.

---

## 3. P0 — Release blockers

These are the issues that make the product look broken, block assistive-technology users, or prevent the core journey from starting. Fix these first.

### P0-1. Protected routes dead-end on a blank page

**Evidence**
- `src/app/guards/RequireAuth.tsx:8` and `:27` return `null` when `isLoading` is true **or** `user === null`.
- The redirect checks at lines 10–12 and 29–31 are therefore unreachable for a signed-out user.
- `admin-guest.png` and `myres-guest.png` show the header and footer with a completely empty main area.
- Axe reports `page-has-heading-one` on both guest captures because there is no content at all.

**Impact**
A student who bookmarks `/my-reservations`, or an admin who opens `/admin` before signing in, sees a blank screen. There is no message, no login form, and no way forward. Expired sessions produce the same result. This is the first impression for every deep link.

**Recommendation**
- Treat loading and unauthenticated states separately:

```tsx
if (isLoading) return <FullPageLoader />
if (!user) return <Navigate to="/login" state={{ from: location }} replace />
```

- In `RequireRole`, redirect authenticated users with the wrong role to `/unauthorized` only after the user is known.
- Preserve the intended destination and return there after login; validate that the destination is an internal route.
- Give the loading state a real skeleton or spinner, not `null`.

**Acceptance criteria**
- Signed-out visits to `/admin`, `/organization`, and `/my-reservations` redirect to `/login` with a visible return path.
- Wrong-role authenticated users see `/unauthorized`, not a blank page.
- The login page shows a loading state while auth resolves, never a blank main area.
- Axe reports no `page-has-heading-one` on protected-route captures.

---

### P0-2. The Explorer floor plan renders rooms off-canvas and is pointer-only

**Evidence**
- `src/features/campus/FloorPlanViewer.tsx:50` uses `viewBox="0 0 100 70"`.
- Real `map_position` values from `facilities.json` are on a roughly 0–480 × 0–280 scale, for example:
  - Grand Innovation Auditorium: `x=60, y=60, width=260, height=180`
  - SAC Arena: `x=50, y=50, width=420, height=220`
- The rendered Explorer screenshot shows only a clipped blue rectangle at the bottom-right; most room geometry is outside the canvas.
- `floor_plan_url` points to `/floorplans/tic-1f.svg`, `/floorplans/tic-2f.svg`, etc., but `public/` and `dist/` contain only `favicon.svg` and `icons.svg`. The four referenced floor plans do not exist.
- `FloorPlanViewer` never reads `floor_plan_url` or `svg_data`.
- Rooms are `<g onClick={...}>` at line 111 with no `tabIndex`, `role`, keyboard handler, or accessible name.
- The selected-facility image uses `src={selectedFacility.image_url || ''}` (line 201), which can produce an empty-string `src` request.

**Impact**
The Explorer is positioned as the product’s front door and main differentiator. In practice, users cannot see or click most rooms, and keyboard/screen-reader users cannot select any room. The advertised “interactive SVG floor plans” are not shipped.

**Recommendation**
- Ship the four floor-plan SVGs, or explicitly render a normalized schematic from `map_position`.
- Normalize coordinates to one coordinate system: either scale the data into the `100×70` viewBox or change the viewBox to the data’s native `480×280`.
- Render each room as a focusable control:
  - `<g role="button" tabIndex={0} aria-label="Grand Innovation Auditorium, TIC-A101, 280 seats, available">`
  - `onKeyDown` for Enter/Space.
  - Visible `:focus-visible` outline.
- Add a synchronized, always-visible facility list beside/below the plan. It should be the accessible fallback and a faster option on mobile.
- Render the image only when a URL exists; otherwise show a neutral placeholder.
- If a floor has no plan asset, say so honestly and fall back to the list rather than drawing a misleading diagram.

**Acceptance criteria**
- At 390, 768, and 1440 px, every room on the selected floor is fully visible and selectable.
- Pointer and keyboard users can select every room; focus is visible and the accessible name includes facility name, code, capacity, and status.
- The facility list and the plan stay in sync.
- No 404s for floor-plan assets and no empty-string image requests.
- If a plan is missing, a clear fallback appears instead of a clipped or empty canvas.

---

### P0-3. Forms lack programmatic labels; filters lack accessible names

**Evidence**
- Axe critical `label` violations: **26 nodes across 9 captured states**.
  - Login: 2 per viewport.
  - Register: 3 per viewport.
  - Facility detail: 4 per viewport.
  - Organization activity modal: 2 per viewport.
- Axe critical `select-name` violations: **6 nodes across explorer and facilities captures**.
- `LoginPage.tsx:48` and `:63` use `<label>` without `htmlFor`; inputs have `id="email"` and `id="password"` but the labels do not reference them.
- `RegisterPage.tsx:73`, `:88`, `:103`, and `:119` repeat the same pattern.
- `FacilityDetailPage.tsx:308`, `:323`, `:340`, `:359`, `:385`, `:396`, `:407`, `:420`, and `:436` are visual labels only. The DOM inspector found six unnamed inputs: title, purpose, date, start time, end time, and attendee count.
- `AdminDashboardPage.tsx:342` and `OrganizationDashboardPage.tsx:233` label modal fields without association.
- `CampusExplorerPage.tsx:154` and `FacilitiesDirectoryPage.tsx:66` render category `<select>` elements with no label or `aria-label`.
- The equipment “checkboxes” in `FacilityDetailPage.tsx:443` are clickable `<div>`s, not inputs or ARIA checkboxes.
- The registration role selector is a set of buttons plus an unlabeled hidden input, not a radio group.

**Impact**
Screen-reader users hear “edit text” or “combo box” with no name and cannot reliably complete login, registration, reservation, or admin rejection. This is a WCAG 2.2 Level A failure and a hard blocker for any accessibility claim.

**Recommendation**
- Add `htmlFor`/`id` pairs to every label and control.
- Add `aria-label` to search and category selects; placeholder text is not a label.
- Use a real `<fieldset>` + `<legend>` + radio group for account role and equipment selection. If custom controls are retained, add `role="checkbox"`, `aria-checked`, keyboard handling, and visible focus.
- Associate help text and errors with `aria-describedby`.
- Add `aria-required` or visible required indicators consistently.
- Make the “Rejection Reason” field required and announce validation inline.

**Acceptance criteria**
- Axe reports zero critical `label` or `select-name` violations on every route and modal.
- A keyboard/screen-reader user can complete login, registration, reservation, and rejection without guessing a field’s purpose.
- Role and equipment groups are announced as groups with selected state.
- Every error is announced and tied to its field.

---

### P0-4. Mobile menu stays open after navigation, and the header is overcrowded

**Evidence**
- `menu-after-nav.png` shows the fixed mobile overlay still open after selecting “Facilities”; the URL changed to `/facilities` but the menu did not close.
- `Navbar.tsx:334–360` renders the panel from local state and has no route-change effect.
- The menu toggle at `:318` has no `aria-expanded` or `aria-controls`; the panel has no dialog semantics, Escape handling, focus trap, or body-scroll lock.
- Guest auth links at `:301–315` are always rendered, including below `md`. At 390 px they sit beside the logo and are squeezed into narrow columns.
- At 768 px the desktop nav is visible (`md:flex`) and wraps “Campus Explorer,” “My Reservations,” “Admin Panel,” and “Sign out” onto multiple lines.
- Navigation links are about 36–40 px high; the notification button is 36×36; “Sign out” is 28 px high.
- The 10 px “CAMPUS MANAGEMENT” subtitle is below a comfortable functional size.

**Impact**
On mobile, tapping a destination appears to do nothing because the overlay remains. The header looks broken at exactly the widths where users need confidence. Small targets increase mis-taps, and wrapped tablet navigation destroys scanability.

**Recommendation**
- Close the mobile menu on `location.pathname` change and on Escape.
- Lock body scroll while open; use one close control; return focus to the trigger.
- Hide desktop auth links and the profile text below `md`; show logo + notifications/avatar + menu only.
- Move “Sign out” into the mobile menu, not the top bar.
- Add `aria-expanded`, `aria-controls`, and an accessible name to the trigger.
- Use `whitespace-nowrap` or a compact icon+label treatment; do not let nav labels wrap at 768 px.
- Raise all interactive targets to at least 44×44 CSS px.

**Acceptance criteria**
- Selecting any mobile menu item navigates and closes the overlay.
- Escape closes the menu; focus returns to the toggle.
- At 390 px the header fits on one row with logo, notification/avatar, and a 44 px menu button.
- At 768 px no nav label wraps.
- Keyboard users can open, traverse, and close the menu without focus escaping behind it.

---

### P0-5. Modals are not dialogs

**Evidence**
- Admin reject modal: `AdminDashboardPage.tsx:330` is a plain `fixed inset-0` div.
- Organization activity modal: `OrganizationDashboardPage.tsx:224` uses the same pattern.
- Neither has `role="dialog"`, `aria-modal="true"`, `aria-labelledby`, `aria-describedby`, focus trapping, Escape handling, or focus restoration.
- Background content remains tabbable and clickable behind the overlay.
- Axe reports critical `label` violations inside the organization modal.
- The notification dropdown (`Navbar.tsx:227`) and mobile menu have the same missing-popover behavior.

**Impact**
Keyboard and screen-reader users can tab into the page behind the modal, lose context, or trigger unrelated actions. The modal is visually present but semantically invisible.

**Recommendation**
- Build one reusable accessible dialog/popover primitive. The stack already includes shadcn/Radix; use it rather than hand-rolling.
- Required behavior: portal, overlay, initial focus, focus trap, Escape to close, restore focus to the opener, `aria-labelledby`/`aria-describedby`, body-scroll lock, and inert background.
- Use the same primitive for the notification popover and mobile menu, with appropriate semantics.
- Keep destructive confirmation clear: title, consequence, primary action, cancel, pending state, and inline error.

**Acceptance criteria**
- Opening a modal moves focus inside; Tab cycles within it; Escape closes it; focus returns to the trigger.
- Screen readers announce the dialog title and description.
- Background content cannot be focused or clicked while open.
- Axe reports zero critical violations in open-modal states.

---

## 4. P1 — High-impact experience work

These issues do not always block a task, but they determine whether the product feels trustworthy and usable at realistic scale.

### P1-1. The reservation journey is a long form, not an availability-first flow

**Evidence**
- `FacilityDetailPage.tsx` is 535 lines and mixes facility facts, equipment, rules, a reservation form, and a schedule list on one page.
- The form starts around line 280; the schedule starts around line 484. On tablet, the hero image alone pushes the form below a full viewport.
- Date and time are raw native inputs. The default date is hard-coded to `2026-11-16`; there is no `min` date and no inline end-after-start validation.
- Submission builds UTC strings from local inputs (`${date}T${time}:00Z`), which can shift displayed times for users outside UTC.
- The page says “All reservations are automatically validated for scheduling conflicts before submission” and the button says “Validating Conflicts…”, but the user only sees a generic error at the top after submission.
- The frontend never reads the existing `facility_schedules` table, so operating hours are displayed as text but not used to constrain or explain availability.
- The schedule list is a `max-h-[500px]` scroll area with no keyboard access (axe `scrollable-region-focusable`).
- The schedule is a flat list with no date grouping, no “today” context, and no indication of which slots are free.

**Impact**
Users must read a list, mentally translate dates and times, guess a valid slot, and discover conflicts only after submitting. This is the highest-friction part of the product and the most likely source of abandonment and bad requests.

**Recommendation**
Restructure the page into three explicit steps:

1. **Choose a time** — date picker with operating hours, a day/week availability grid or slot list, clear unavailable states, and a timezone label.
2. **Describe the request** — title, purpose, attendees, equipment, and organization/activity linkage. Keep the selected slot visible in a sticky summary.
3. **Review and submit** — a compact summary of facility, date/time, attendees, equipment, and requester; inline edit links; then submit.

Supporting changes:
- Use the existing `facility_schedules` data to show opening hours and disable out-of-hours slots.
- Enforce end-after-start and capacity inline, before submit.
- Preserve entered values on error; show field-level messages and a summary at the top.
- Replace the generic “Validating Conflicts…” label with real states: checking, available, conflict, unavailable.
- After success, show a confirmation panel with “View my reservations” instead of navigating away after 1.5 seconds.
- Keep the schedule visible but make it secondary and keyboard-accessible.

**Acceptance criteria**
- A user can see availability for a chosen date without scrolling through a flat list.
- A valid slot can be selected in three interactions or fewer from the facility page.
- Past dates, end-before-start, over-capacity, and out-of-hours requests are blocked with inline explanations.
- The review step shows every submitted value before confirmation.
- Keyboard users can operate the date/slot picker and schedule list.
- No axe critical/serious violations on the reservation page.

---

### P1-2. Navigation is a page list, not a role workspace

**Evidence**
- `src/app/router.tsx` defines landing, explorer, facilities, facility detail, my-reservations, organization, admin, and unauthorized.
- Every role shares the same top-nav pattern. Admins get one gold “Admin Panel” link; officers get one indigo “Org Dashboard” link.
- There is no persistent admin or organization sub-navigation, and no breadcrumb outside facility detail.
- The admin page says “Manage platform-wide facilities, users, organizations, and campus resources,” but the only surfaces are “Pending Approval Queue” and “All Reservations Archive.”
- The landing hero repeats “Sign in” and “Create account” already present in the navbar.
- The mobile menu groups links under “Explore” and “Account,” but the desktop nav has no such grouping.

**Impact**
Admins cannot find facility, user, organization, or campus-structure management because those screens do not exist. Users cannot tell where they are in a multi-step task. The nav is a flat list that grows with every feature and will not scale.

**Recommendation**
- Define role-based workspaces:
  - **Explore:** Campus Explorer, Facilities.
  - **My activity:** My Reservations; Organization for officers.
  - **Admin:** Review Queue, Facilities, Users, Organizations, Campus Structure (only surfaces that are actually shipped).
- Add a persistent secondary nav or sidebar for admin and organization at `lg` and above; mirror it in the mobile menu.
- Add breadcrumbs to every detail page and nested flow.
- Use one primary CTA per state on the landing page; remove duplicate auth actions from the hero when the navbar already provides them.
- Make the avatar a profile menu containing role, profile/settings (when shipped), and sign out.
- Rename “Facilities” to “Browse Facilities” or “Facility Directory” where it disambiguates from “Campus Explorer.”

**Acceptance criteria**
- From any page, a user can reach their role home in one click.
- Breadcrumbs reflect the actual hierarchy on detail and nested pages.
- Admin navigation exposes every shipped management surface and no dead links.
- The mobile and desktop navigation expose the same destinations and active states.
- The landing page has one primary action per audience state.

---

### P1-3. The admin dashboard is a review queue, not a command center

**Evidence**
- The page has four decorative KPI cards, a pending queue, and an archive. There are no facility, user, organization, or campus-structure management surfaces.
- KPI labels use `text-slate-400` at 12 px; axe records **11 serious contrast failures** on the admin page at every viewport.
- The heading order is H1 → H3 for reservation titles; there is no H2 section structure.
- The archive is a `max-h-[600px]` scroll area with raw UUIDs, no search, no filters, no sorting, and no pagination.
- Approve is a single click with no confirmation; success/error alerts render at the top of the page, potentially off-screen after acting on a lower card.
- On mobile, the four KPI cards stack into four tall cards before the queue begins.
- The `text-indigo-600` KPI number is flagged by the detector as an off-palette accent.

**Impact**
An administrator with 7 reservations can cope. At 70 or 700, the page provides no way to find, filter, or batch-process work. The low-contrast labels and off-screen feedback make routine review slower and less confident.

**Recommendation**
- Replace the four large KPI cards with a compact summary strip: pending, approved, facilities, organizations. Use semantic text colors that pass contrast.
- Add a real archive view: search, status/facility/date/requester filters, sortable columns, pagination or virtualization.
- Add a detail drawer for a reservation with requester, facility, schedule context, equipment, and history.
- Add bulk selection and bulk approve/reject only if the workflow supports it.
- Use an inline toast or sticky action bar with `aria-live` so feedback is visible wherever the admin is.
- Add section headings (H2) and a clear hierarchy: summary → queue → archive.
- Either add the promised management surfaces or change the subtitle to match what is shipped.

**Acceptance criteria**
- An admin can filter the archive by status, facility, and date.
- Action feedback is visible without scrolling and announced to screen readers.
- KPI labels meet 4.5:1 contrast; heading order is H1 → H2 → H3.
- Mobile shows the queue within the first viewport after the header, not after four full-height cards.
- Every action has a pending state and a recoverable error state.

---

### P1-4. The design system is declared but not used

**Evidence**
- `src/index.css` defines only four HSL variables (`--background`, `--foreground`, `--primary`, `--primary-foreground`), and no component uses them.
- Components use raw Tailwind values: 55 `border-slate-200`, 37 `text-slate-400`, 19 `text-sky-600`, 9 `text-indigo-600`, 7 each of emerald/amber, plus rose and purple.
- Six gradients: three `bg-gradient-to-tr`, two `bg-gradient-to-r`, one `bg-gradient-to-br`.
- Ten instances of `text-[10px]` and five of `text-[11px]`.
- Axe records **127 color-contrast node failures across 20 captured states** (many repeat across viewports).
- Known failing ratios on white/slate-50:
  - `text-slate-400` ≈ 2.63:1
  - `text-sky-600` ≈ 4.02:1
  - `text-emerald-600` ≈ 3.65:1
  - `text-amber-600` ≈ 3.20:1
- The landing hero uses gradient text; the detector flags it as `gradient-text`.
- Dates are inconsistent: “Nov 13, 2026, 6:00 PM,” “2026-11-20,” and “11/16/2026” all appear in the same product.
- Radii mix `rounded-2xl` and `rounded-3xl`; shadows and icon colors vary by page.

**Impact**
The product looks cohesive at a glance but feels assembled from several templates. Low-contrast metadata is hard to read, 10 px labels are below a functional size, and inconsistent dates slow scanning and create ambiguity.

**Recommendation**
- Define semantic tokens in CSS `@theme` (or an equivalent token layer):
  - surface, surface-muted, border, text-primary, text-secondary, text-muted
  - brand, brand-hover, focus
  - success, warning, danger, info and their soft backgrounds
- Replace raw palette classes with token-backed utilities in new work; migrate existing components incrementally.
- Adopt a type scale: 12 / 14 / 16 / 20 / 24 / 32 / 48. Reserve 10–11 px for truly decorative text only; never for labels, metadata, or status.
- Enforce contrast: 4.5:1 for normal text, 3:1 for large text and UI boundaries.
- Use one accent (sky) plus semantic status colors. Remove indigo/purple/emerald/amber from decorative roles.
- Keep the dark gradient hero as the one expressive moment; remove gradient text and additional gradients elsewhere.
- Centralize date formatting in `src/lib/utils.ts`: `formatDate`, `formatDateTime`, `formatTime`, `formatDateInput`, and a timezone policy.
- Standardize radius and shadow scales (e.g., cards `2xl`, modals `3xl`, controls `xl`).

**Acceptance criteria**
- All functional text is at least 12 px; primary labels and body text are 14–16 px.
- Axe reports zero color-contrast failures on all routes.
- A single date/time format is used per context, and timezone is explicit where it matters.
- New components use semantic tokens; no new raw hex or one-off palette classes.
- The interface uses one accent family plus semantic status colors.

---

### P1-5. Responsive layout works, but tablet and mobile ergonomics do not

**Evidence**
- No horizontal overflow at 390, 768, or 1440 — a real strength.
- At 768, the top nav wraps “Campus Explorer,” “My Reservations,” “Admin Panel,” and “Sign out” onto multiple lines.
- On tablet, the facility-detail hero image is roughly a full viewport tall, pushing the reservation form far below.
- On mobile, admin KPI cards stack into four tall cards; the org hero title wraps to four lines; the facility-detail page becomes a very long single column.
- Functional labels are frequently 10–11 px; many controls are 28–38 px high.
- The mobile menu uses the same full-width overlay pattern at all widths and does not lock scroll.

**Impact**
Tablet feels like a squeezed desktop rather than a designed intermediate state. Mobile users must scroll through decoration and metadata before reaching the task, and small targets increase errors.

**Recommendation**
- Design three explicit layouts: mobile (<640), tablet (640–1023), desktop (≥1024). Do not rely on `md` alone for a nav with this many items.
- At tablet, collapse the nav to the mobile pattern or a compact icon rail; do not wrap labels.
- Cap hero media height on tablet (`max-h-[320px]` or a 21:9 crop) and prioritize the reservation form above the image on small screens.
- Use a 2×2 KPI grid on mobile, not four full-width cards.
- Clamp long organization names and move secondary copy below the fold.
- Raise all interactive targets to 44×44 px; keep primary actions sticky at the bottom of long forms.
- Test at 320 px as well as 390/768/1024/1440.

**Acceptance criteria**
- No horizontal overflow at 320, 390, 768, 1024, and 1440.
- No nav label wraps at 768; the header remains one row at 390.
- The reservation form begins within the first 1.5 viewports at 768.
- All interactive targets are at least 44×44 CSS px.
- Mobile admin and organization pages show the primary task before secondary decoration.

---

### P1-6. Organization dashboard duplicates actions and exposes raw data

**Evidence**
- “New Organization Activity” appears as a hero button and again as a plus icon in the Activities card header (`OrganizationDashboardPage.tsx:99` and `:128`).
- Activity dates render as raw `2026-11-20`; reservation dates render as “Nov 13, 2026, 6:00 PM.”
- The organization logo uses `src={selectedOrg?.logo_url || ''}` (`:80`), producing the console error “An empty string was passed to the src attribute.”
- The reservation list has no status filter, date grouping, or sort; it is a flat list of seven cards.
- The hero is visually heavy on mobile and pushes the actual work down.
- Activity cards have no edit, cancel, or detail action.

**Impact**
Officers see the same action twice, inconsistent dates, and a console error on every load. The dashboard reads as a display page rather than a management workspace.

**Recommendation**
- Keep one primary “New activity” action; remove the duplicate plus or turn it into a secondary icon with the same handler.
- Render a logo fallback (initials or building icon) when `logo_url` is absent; never pass an empty string to `src`.
- Format activity dates with the shared date utility.
- Group reservations by upcoming/past and add status filters.
- Add activity actions (view, edit, cancel) when those flows exist; otherwise remove the affordance.
- Compress the hero on mobile: smaller logo, shorter title treatment, actions stacked below.

**Acceptance criteria**
- No console errors on the organization page.
- One primary “New activity” action.
- Dates are formatted consistently with the rest of the product.
- Officers can filter reservations by status and see upcoming items first.
- The primary task appears within the first mobile viewport after the header.

---

### P1-7. My Reservations buries the next step in noise

**Evidence**
- Every card displays a full internal UUID (`MyReservationsPage.tsx:116`), e.g. “ID: r10000000-0000-0000-0000-000000000001.”
- Filters are All / Pending / Approved / Rejected; `cancelled` and `completed` are not available even though the data model supports them.
- There is no date sort, grouping, or “upcoming” emphasis; the list is ordered by creation time from the data store.
- Cancellation uses `window.confirm` (`:34`) and errors use `alert` (`:41`), which break the visual flow and are not styleable.
- “Facility Details” uses an external-link icon for an internal route.
- Rejected cards show the reason but no next action such as “Find another time.”
- No `aria-live` announcement after cancel or status change.

**Impact**
Users cannot quickly answer “What is my next booking?” Internal IDs add visual noise, missing statuses hide part of the lifecycle, and browser dialogs feel unfinished.

**Recommendation**
- Remove the UUID from the primary card; move it to a details view or copy action.
- Default to upcoming reservations, sorted by start date; group past reservations separately.
- Add all status filters, including cancelled and completed, with counts.
- Replace `window.confirm`/`alert` with the accessible dialog and inline toast patterns.
- Add a clear next action per status: “Cancel request,” “Find another time,” “View facility,” “View decision.”
- Use an internal navigation icon for facility links.
- Announce cancellation and status changes via `aria-live`.

**Acceptance criteria**
- The default view answers “What is next?” within one screen.
- All lifecycle statuses are filterable.
- Cancellation is confirmed in-product, with focus management and an announced result.
- UUIDs are not shown in the primary list.
- Rejected reservations offer a recovery path.

---

## 5. P2 — Quality, accessibility, and trust

### P2-1. Auth pages lack recovery, landmarks, and product context

**Evidence**
- Login and register are standalone `min-h-screen` divs outside `AppLayout`; axe reports `landmark-one-main` and multiple `region` violations.
- No “Forgot password?” path, password visibility toggle, terms acceptance, or password-strength guidance.
- Register role selection is a set of buttons plus an unlabeled hidden input, not a radio group.
- Contrast failures: 1 on login, 2 on register.
- The pages have no logo link back to the landing page and no supporting product context.
- Code-level risk: `LoginPage.tsx` computes the post-login destination from the `user` value captured before `signIn` resolves. With an async profile fetch, an admin or officer can land on `/explorer` instead of their dashboard. Verify with real accounts and route from the returned profile/role.

**Recommendation**
- Create a branded auth shell with a main landmark, logo/home link, and consistent footer.
- Add password visibility, recovery link (if the backend supports it), inline validation, and autocomplete attributes.
- Use a fieldset/radio group for role selection.
- Add terms/privacy copy if required by the institution.
- Keep the form narrow and focused, but give it enough context to feel like ONE Facility.

**Acceptance criteria**
- Axe reports no landmark/region/label violations.
- Keyboard-only users can complete login and registration.
- Recovery path is visible and functional, or clearly marked as unavailable.
- Mobile auth pages are usable at 320 px.

---

### P2-2. Notifications are inaccessible and can go stale

**Evidence**
- Bell button is 36×36 with no `aria-expanded`/`aria-controls`.
- Dropdown is a `div` with clickable notification `div`s; no role, focus management, Escape, or outside-click close.
- `Navbar.tsx:37` listens for `onefacility_notif_updated`, but no code dispatches that event.
- No “mark all read,” no date grouping, and timestamps show only time-of-day.
- Unread count is visual only.

**Recommendation**
- Use the shared popover/dialog primitive with focus management and `aria-expanded`.
- Make each notification a button or link with a clear action.
- Add “Mark all read,” relative timestamps, and an empty state.
- Refresh via query invalidation or dispatch the existing event after approve/reject/cancel; do not leave a dead listener.
- Announce unread-count changes with `aria-live`.

**Acceptance criteria**
- Keyboard users can open, traverse, and close notifications.
- Unread state updates after an action without a page reload.
- Notification items are operable by keyboard and screen reader.
- Empty and error states are explicit.

---

### P2-3. Global accessibility gaps

**Evidence**
- No skip link, no `aria-live` region, and no `prefers-reduced-motion` handling anywhere in `src`.
- Focus styles rely on per-component rings; some controls have no visible focus state.
- Icon-only controls sometimes rely on `title` rather than `aria-label`.
- Heading order is broken on most pages (H1 → H3 or H1 → H4).
- The `scrollable-region-focusable` violation appears on the facility schedule.
- The mobile menu and modals lack focus containment.

**Recommendation**
- Add a “Skip to main content” link and a `main` landmark with an id.
- Add a global `aria-live="polite"` region for toasts and async results.
- Add a `prefers-reduced-motion: reduce` block that disables transforms, spinners where possible, and nonessential animation.
- Standardize `:focus-visible` rings across controls.
- Fix heading hierarchy page by page: one H1, H2 for sections, H3 for cards.
- Make scrollable regions focusable with `tabIndex={0}` and an accessible name.

**Acceptance criteria**
- Keyboard-only walkthrough can skip to content, navigate, open menus/modals, and complete the reservation.
- Axe reports zero critical/serious violations across all routes and viewports.
- Reduced-motion preference removes nonessential animation.
- Heading outline is logical on every page.

---

### P2-4. Missing loading, error, empty, and 404 states

**Evidence**
- Most pages render nothing while data loads; only facility detail has a text loading state.
- No error boundary or route-level error UI.
- Facilities directory renders an empty grid when search/filter returns zero results; no empty-state message.
- The wildcard route redirects to `/` rather than showing a 404.
- Several actions have no pending/disabled state beyond a few buttons.

**Recommendation**
- Add route-level skeletons that match the final layout.
- Add error boundaries with a retry action.
- Add empty states for search, filters, no reservations, no activities, and no notifications.
- Add a real 404 page with links to Explorer and Facilities.
- Use optimistic or pending states for actions, with rollback on failure.

**Acceptance criteria**
- Every data-driven page has loading, empty, error, and success states.
- A failed request never leaves a blank page.
- Unknown URLs show a branded 404, not a silent redirect.
- Search with no matches explains how to recover.

---

### P2-5. Performance and asset hygiene

**Evidence**
- Build output: one **656.17 kB** JS chunk; Vite warns about chunk size.
- `recharts`, FullCalendar packages, `react-hook-form`, `zod`, and `date-fns` are installed but largely unused in the current UI.
- One facility image URL returns 404: `https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=800&q=80`.
- No route-level code splitting; no image lazy loading or explicit dimensions.
- No favicon issue (favicon exists), but no meta description/OG tags for sharing.

**Recommendation**
- Lazy-load routes with `React.lazy`/`Suspense` and split the admin/org bundles.
- Remove unused dependencies or defer them to the features that need them.
- Add `loading="lazy"`, `decoding="async"`, and explicit aspect ratios for facility images.
- Add an image fallback component and fix the broken Unsplash URL.
- Add a meta description and social preview metadata.
- Measure with Lighthouse mobile and a throttled 4G profile.

**Acceptance criteria**
- Initial route JS is materially smaller; the admin/org code does not load on the landing page.
- No 404 image requests.
- Images reserve space and do not cause layout shift.
- Lighthouse mobile performance is measured before/after, with a documented target.

---

### P2-6. Date/time truth and demo labeling

**Evidence**
- The reservation default date is hard-coded to `2026-11-16`; there is no `min`.
- The form builds UTC timestamps from local wall-clock inputs.
- Operating hours are displayed (08:00–20:00) but not used to constrain the form; the audit fixtures include 1:00–5:00 AM and 10:00 PM–12:00 AM slots.
- `facility_schedules` exists in the schema but is not read by the frontend.
- The footer says “All Systems Operational” and “Real data from Supabase” on every page, regardless of actual state.
- The landing page claims “interactive SVG floor plans” and “zero conflict scheduling” that outrun the shipped frontend: the floor plans are not usable, and the schedule data is not read.

**Recommendation**
- Centralize timezone handling and label it in the UI where ambiguity matters.
- Use `facility_schedules` to show opening hours and disable out-of-hours slots.
- Set `min` to today and validate end-after-start, capacity, and operating hours inline.
- Replace the static status pill with a truthful demo/environment label, or wire it to real health data.
- Align marketing copy with shipped behavior; do not claim features that are not present.

**Acceptance criteria**
- Impossible times cannot be submitted from the UI.
- Operating hours visibly constrain the selectable slots.
- Timezone is explicit in the reservation summary.
- Footer status is truthful and does not imply production monitoring.
- Landing copy matches the shipped feature set.

---

## 6. P3 — Polish backlog

These are worth doing after the blockers and core journey are solid.

### P3-1. Landing page simplification
- Remove duplicate “Sign in” / “Create account” CTAs from the hero when the navbar already exposes them.
- Fix the heading outline: the three feature cards should be H2, not H3 under an H1 with no H2.
- Replace gradient text with a solid brand color or a restrained highlight.
- Add a real product visual: a floor-plan preview, availability card, or reservation timeline. The current three generic feature cards do not show the product.
- Reduce the hero’s vertical footprint on mobile; put one primary CTA above the fold.

### P3-2. Microcopy and icon consistency
- “Pax” → “people” or “attendees.”
- “Seats” is wrong for auditoriums and arenas; use “capacity” unless the facility is genuinely seated.
- Standardize “Book” vs “Reserve” vs “Request.”
- Use one term for decline/reject; the UI uses both.
- Use an internal-link icon for “Facility Details,” not an external-link arrow.
- Remove duplicate plus icons where a primary button already exists.
- Replace “Real data from Supabase” with user-facing language or a demo badge.

### P3-3. Imagery and art direction
- Facility photos mix crowd scenes, empty corridors, lecture halls, and a basketball close-up; the visual language is inconsistent.
- Choose a consistent photographic treatment (wide architectural crops, same color temperature) or use a deliberate illustration system.
- Fix the broken AI & Robotics image.
- Ensure every image has a meaningful alt description, not just the facility name repeated.

### P3-4. Documentation and design-system capture
- Add a `DESIGN.md` or token reference covering color, type, spacing, radius, shadow, focus, and status.
- Document the accessible dialog, form-field, and nav patterns so new pages do not regress.
- Add a short “definition of done” checklist for UI work: axe clean, keyboard path, 390/768/1440 screenshots, empty/error states, contrast.

---

## 7. Recommended sequencing

### Phase 1 — Stop the bleeding (P0)
1. Fix `RequireAuth`/`RequireRole` and the login return path.
2. Fix floor-plan coordinate normalization, ship or fall back from missing SVGs, and make rooms keyboard-operable.
3. Associate every form label and select; convert equipment/role controls to real inputs.
4. Close the mobile menu on navigation; redesign the 390/768 header.
5. Replace hand-rolled modals with an accessible dialog primitive.

**Exit criteria:** no blank protected routes; Explorer rooms visible and selectable; axe zero critical label/select-name; mobile nav closes; modals trap focus.

### Phase 2 — Make the core journey credible (P1-1 to P1-4)
1. Redesign the reservation flow around availability and a review step.
2. Add role-based navigation and admin/org secondary navigation.
3. Turn the admin queue into a triage workspace with filters, feedback, and contrast fixes.
4. Introduce semantic design tokens and a type/contrast pass.

**Exit criteria:** a student can find a room, see availability, submit a valid request, and understand the next step; an admin can find and process a request without scanning a flat list; axe serious/critical count is zero on core routes.

### Phase 3 — Quality and consistency (P1-5 to P1-7, P2)
1. Responsive pass at 320/390/768/1024/1440.
2. Organization and My Reservations refinements.
3. Auth shell, notifications, global a11y, loading/error/empty states.
4. Performance and asset cleanup.

### Phase 4 — Polish (P3)
Landing page, microcopy, imagery, documentation, and motion polish.

---

## 8. Verification plan

Run this after each phase, not only at the end.

### Automated
- `npm run build` succeeds without new warnings.
- axe-core: **0 critical and 0 serious** violations on:
  - `/`
  - `/login`
  - `/register`
  - `/explorer`
  - `/facilities`
  - `/facilities/:id`
  - `/my-reservations`
  - `/organization`
  - `/admin`
  - open reject modal and open activity modal
- Test at **390×844**, **768×1024**, and **1440×900**; add **320×568** for the mobile pass.
- No horizontal overflow (`scrollWidth === innerWidth`) at all widths.
- No console errors and no 404 network requests.
- Contrast: 4.5:1 normal text, 3:1 large text and UI boundaries.

### Manual keyboard walkthrough
1. Tab from the top of the landing page; reach the skip link and main content.
2. Open the mobile menu, navigate, and confirm it closes; Escape closes it.
3. Select a building, floor, and room in the Explorer using only the keyboard.
4. Open a facility, choose a date/time, complete the reservation, and review the summary.
5. Open the admin reject modal; confirm focus trap, Escape, and focus return.
6. Open notifications; traverse and mark one read.
7. Cancel a pending reservation; confirm the in-product dialog and announced result.

### Task-based checks
- **Student:** “Find an available auditorium for next Thursday evening and submit a request.” Target: under 2 minutes, no dead ends.
- **Officer:** “Create an activity and associate a reservation with it.” Target: one obvious primary action per step.
- **Admin:** “Find all pending requests for the TIC auditorium and decline one with a reason.” Target: under 30 seconds with filters.
- **Guest:** “Open a bookmarked reservation page.” Target: login screen with return path, never a blank page.

---

## 9. What is already working

Preserve these strengths through the redesign:

- The navy header with the blue accent creates a recognizable product identity.
- Card radii, borders, and shadows are consistent enough to feel intentional.
- Status badges use semantic color families and are easy to scan when contrast is fixed.
- The admin review cards have a clear hierarchy: status, facility, title, time, requester, purpose, equipment, actions.
- Page titles and supporting copy are generally direct and understandable.
- The facilities directory’s search/category controls and the Explorer’s building cards are familiar patterns.
- Empty states exist on My Reservations and the admin queue.
- Images have alt text, forms use native controls, and focus rings exist in most places.
- The layout does not overflow horizontally at the tested widths; the responsive stacking model is a good base.
- The build succeeds and the app runs without runtime crashes on the audited routes.

---

## 10. Evidence index

Screenshots, axe JSON, DOM metrics, and capture scripts are in:

`C:\Users\cruzl\AppData\Local\Temp\opencode\onefacility-audit\`

Key evidence:
- `admin-guest.png`, `myres-guest.png` — blank protected routes.
- `menu-after-nav.png` — mobile overlay remains after navigation.
- `explorer-desktop.png`, `explorer-mobile.png` — clipped floor-plan room.
- `detail-desktop.png`, `detail-tablet.png`, `detail-mobile.png` — long mixed-purpose reservation page and oversized tablet hero.
- `admin-desktop.png`, `admin-mobile.png`, `admin-modal-desktop.png` — KPI contrast, queue layout, modal.
- `org-desktop.png`, `org-mobile.png`, `org-modal-desktop.png` — duplicate actions, raw dates, modal.
- `myres-desktop.png`, `myres-mobile.png` — UUID noise and missing status filters.
- `login-desktop.png`, `register-desktop.png` — plain auth pages.
- `*-desktop.json`, `*-mobile.json`, `*-tablet.json` — axe results and DOM metrics.

Key source files:
- `src/app/guards/RequireAuth.tsx`
- `src/components/navigation/Navbar.tsx`
- `src/pages/public/LoginPage.tsx`
- `src/pages/public/RegisterPage.tsx`
- `src/pages/user/FacilityDetailPage.tsx`
- `src/pages/user/CampusExplorerPage.tsx`
- `src/features/campus/FloorPlanViewer.tsx`
- `src/pages/user/FacilitiesDirectoryPage.tsx`
- `src/pages/user/MyReservationsPage.tsx`
- `src/pages/organization/OrganizationDashboardPage.tsx`
- `src/pages/admin/AdminDashboardPage.tsx`
- `src/app/layouts/AppLayout.tsx`
- `src/app/router.tsx`
- `src/index.css`

---

## 11. Bottom line

Do not spend the next pass on more gradients, cards, or decorative polish. Fix the three broken promises first:

1. **A protected link should lead to login, not a blank page.**
2. **A room on the floor plan should be visible and selectable by everyone.**
3. **A form field should have a name that assistive technology can announce.**

Then make the reservation journey availability-first and the admin surface a real triage workspace. The visual foundation is good enough to keep; the product needs to become operable, truthful, and accessible.
