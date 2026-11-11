# ONE Facility

Unified Campus Facility Management System — discover buildings, explore floor plans, and reserve campus facilities with a conflict-checked approval lifecycle.

## Demo accounts (Supabase Auth)

| Email | Password | Role | Lands on |
|-------|----------|------|----------|
| `test1@gmail.com` | `Demo1234!` | Faculty | `/explorer` |
| `officer@campus.edu` | `Demo1234!` | Organization Officer | `/organization` |
| `admin@campus.edu` | `Demo1234!` | Facility Administrator | `/admin` |

All accounts are active and linked to seeded campus data (TIC, SAC, SRH buildings; 5 facilities).
There is no student account on the live project; `test1@gmail.com` is the closest
equivalent and lands on the student-facing explorer flow.

## Recommended demo flow (officer → admin → officer)

1. **Officer** — sign in as `officer@campus.edu`, lands on `/organization`. See ACM org + activities.
2. **Officer** — go to `/explorer` → pick a facility → select an available time slot → submit a reservation.
3. **Admin** — sign in as `admin@campus.edu`, lands on `/admin`. See the pending approval queue with the officer's reservation.
4. **Admin** — approve (emerald) or decline (rose, with reason) the reservation.
5. **Officer** — sign back in → bell shows "Reservation Approved" / "Reservation Declined" notification.
6. **Student** — sign in as `student@campus.edu`, book a facility, see it in `/my-reservations`.

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
6. `20261119_close_public_signup.sql` — reject public signups (before-user-created hook)

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
