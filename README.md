# ONE Facility

Unified Campus Facility Management System — discover buildings, explore floor plans, and reserve campus facilities with a conflict-checked approval lifecycle.

## Demo accounts (Supabase Auth)

All accounts use the password `Demo1234!`.

| Email | Role | Lands on |
|-------|------|----------|
| `test1@gmail.com` | Faculty | `/explorer` |
| `officer@campus.edu` | Organization Officer (files proposals) | `/organization` |
| `admin@campus.edu` | Facility Administrator | `/admin` |
| `adviser@campus.edu` | 1. Organization Adviser | `/approvals` |
| `dean@campus.edu` | 2. College Dean | `/approvals` |
| `osas@campus.edu` | 3. Office of Student Affairs | `/approvals` |
| `director@campus.edu` | 4. Campus Director | `/approvals` |
| `president@campus.edu` | 5. University President | `/approvals` |

All accounts are active and linked to seeded campus data (TIC, SAC, SRH buildings; 17 facilities).
There is no student account on the live project; `test1@gmail.com` is the closest
equivalent and lands on the student-facing explorer flow.

The approver accounts are what the five-stage event proposal chain needs
(Adviser → Dean → OSAS → Campus Director → University President). Recreate them
in any environment with:

```
SUPABASE_URL=https://<ref>.supabase.co \
SUPABASE_SERVICE_ROLE_KEY=<service_role key> \
node scripts/seed-demo-accounts.mjs
```

Then apply the SQL migrations below, which assign the roles and link
`officer@campus.edu` as president of OCTA and `adviser@campus.edu` as the
organisation adviser.

## Recommended demo flow (officer → admin → officer)

1. **Officer** — sign in as `officer@campus.edu`, lands on `/organization`. See ACM org + activities.
2. **Officer** — go to `/explorer` → pick a facility → select an available time slot → submit a reservation.
3. **Admin** — sign in as `admin@campus.edu`, lands on `/admin`. See the pending approval queue with the officer's reservation.
4. **Admin** — approve (emerald) or decline (rose, with reason) the reservation.
5. **Officer** — sign back in → bell shows "Reservation Approved" / "Reservation Declined" notification.
6. **Student** — sign in as `test1@gmail.com`, book a facility, see it in `/my-reservations`.
7. **Proposal chain** — as `officer@campus.edu` file a proposal at `/proposals/new`, then sign in as each approver in turn (`adviser@` → `dean@` → `osas@` → `director@` → `president@`) to approve it. The signed packet is at `/proposals/:id/print`.


## Tech stack

- React 19 + Vite + TypeScript + Tailwind CSS
- Supabase (Auth, PostgreSQL, RLS, realtime-ready)
- React Router, TanStack Query, React Hook Form, Zod, Lucide React, Recharts, FullCalendar

## Project structure

```
src/
  app/            Router, route guards (RequireAuth, RequireRole, RedirectIfAuthed)
  components/     Navigation, UI primitives (Dialog, Skeleton, ErrorBoundary)
  features/auth/  Supabase Auth context (sign in / sign out / session)
  features/campus/ Floor plan viewer
  lib/            dataStore (Supabase-only data layer), supabase client, utils
  pages/          Landing, Login, Unauthorized, NotFound,
                  user (explorer, facilities, facility detail, my reservations),
                  organization, admin
  types/          Shared TypeScript types
supabase/
  migrations/     Schema, profile trigger, role access control, demo seed data
  seed.sql        Campus organizations, buildings, floors, facilities
```

## Key behaviors

- **No localStorage fallback** — every read/write goes directly to Supabase. If env vars are missing, the app throws a clear config error instead of silently falling back to demo data.
- **No public sign-up** — the register route and all "Create account" entry points are removed. Accounts are provisioned administratively; the `handle_new_user` trigger still creates the profile row when an account is added in the Supabase dashboard.
- **Role-based routes** — `/admin` (facility_admin/system_admin), `/organization` (officer), `/my-reservations` (authenticated). Guests are redirected to login.
- **Availability-first booking** — time slots are derived from `facility_schedules`, existing approved reservations, and maintenance periods. Conflicts are checked client-side and re-checked server-side via the `approve_reservation()` RPC.
- **Notifications** — written to Supabase (not localStorage); the bell shows unread count and marks items read.

## Environment

Create `.env` (do not overwrite an existing user-owned `.env`):

```
VITE_SUPABASE_URL=https://yojmjuctaqjvxljjctnb.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-key>
```

## Scripts

```
npm run dev     # start dev server at http://localhost:5173
npm run build   # production build
npm run lint    # oxlint
```

## Database

Apply migrations in order:

```
npx supabase db reset        # local (if using Supabase CLI locally)
# or apply each migration file to the remote project:
npx supabase db query --remote --file supabase/migrations/<file>.sql
```

Migration order:
1. `20261110_init_schema.sql` — 13 tables, RLS, helper functions
2. `20261111_add_profile_trigger.sql` — auto-create profiles on signup
3. `20261112_demo_cleanup.sql` — anon catalog reads, notifications INSERT policy
4. `20261113_role_access_control.sql` — harden signup roles, link officer to ACM
5. `20261114_demo_seed_data.sql` — activities, reservations, maintenance, notifications
6. `20261115_event_proposals.sql` — event proposals, budget, attachments, approval steps/events
7. `20261116_student_organizations_and_hierarchy.sql` — org hierarchy, 5-stage approval chain
8. `20261117_randomize_seed_ids.sql` — randomise seeded UUIDs
9. `20261118_plot_real_facilities.sql` — plot the 12 real facilities on the floor plans
10. `20261119_close_public_signup.sql` — reject public signups (before-user-created hook)
11. `20261120_facility_images.sql` — a photograph for every facility
12. `20261121_repair_proposals_and_org_hierarchy.sql` — reconcile the proposals schema (see below)

### Verify the schema actually matches the app

A migration that is not applied leaves the app failing at runtime with errors
like `Could not find the table 'public.proposal_budget_items' in the schema
cache`. Check what the project actually has:

```
npx supabase db query --remote --read-only \
  "SELECT version, name FROM supabase_migrations.schema_migrations ORDER BY version;"
```

Only migrations listed there are tracked by Supabase; anything applied by hand
in the dashboard is invisible to it and can be lost on the next reset.

`20261121_repair_proposals_and_org_hierarchy.sql` ends with a **schema guard**
that raises an exception if any table, column or function the app depends on is
missing, and it ends with `NOTIFY pgrst, 'reload schema'` so PostgREST picks
up the new schema immediately. Run it after any schema change:

```
npx supabase db query --remote --file supabase/migrations/20261121_repair_proposals_and_org_hierarchy.sql
```

### Why the proposals schema needed a repair migration

`20261115` and `20261116` were never applied to the live project, and they
also disagreed with each other and with the app:

- `20261116` called `public.check_schedule_conflicts(...)`, which no migration
  defined.
- `20261116`'s `submit_proposal` wrote to `proposal_events (step_id,
  actor_role, note)`, columns that `20261115` — and the app's `ProposalEvent`
  type — do not have.
- `20261115` constrained `approval_steps.step_role` to three roles, but
  `20261116` inserts five different ones.
- `20261116` renamed the `submit_proposal` parameter from `p_proposal` to
  `p_proposal_id`, so the app's `rpc('submit_proposal', { p_proposal })` call
  would not resolve.
- `20261115`'s venue conflict check only ran for the `facility_admin` step,
  which the five-stage chain never creates.

`20261121` installs the reconciled schema in one place, matching what
`src/types/index.ts` and `src/lib/proposals.ts` actually expect, and adds the
guard so a skipped migration fails loudly instead of silently.

One more subtlety it fixes: the `proposals` SELECT policy cannot use a helper
that re-queries `public.proposals`, because such a function cannot see the row
being inserted. With the helper, `insert(...).select(...)` — which is
`INSERT ... RETURNING` — fails with `42501 new row violates row-level
security policy`. The policy now evaluates the row's own columns inline.

## Closing public registration

Public self-registration is closed at two layers:

1. **Auth config** — `supabase/config.toml` sets `enable_signup = false` and
   registers the before-user-created hook. Push it with:
   ```
   npx supabase config push
   ```
   > This compares the whole local config against the project. To change only
   > the signup settings, stage a minimal `supabase/config.toml` that declares
   > just `[auth] enable_signup` and `[auth.hook.before_user_created]`, then
   > run `npx supabase config push --workdir <dir>` — undeclared properties are
   > left unchanged on the remote project.

2. **Database** — `20261119_close_public_signup.sql` creates
   `public.hook_reject_public_signup()`, which returns an error for every
   signup that reaches it.

Accounts are provisioned administratively instead: create them in the
Supabase dashboard (Authentication → Users → Add user) or with the
service_role key. The `handle_new_user` trigger still creates the matching
`profiles` row automatically.

Verified against the live project: `POST /auth/v1/signup` is rejected, while
`POST /auth/v1/admin/users` and existing-user sign-in both still work.

## Status

- TypeScript: `tsc --noEmit` clean
- Build: `npm run build` succeeds (~668 kB)
- Dev server: `http://localhost:5173`
