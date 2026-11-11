-- ONE Facility: close public self-registration
--
-- The public register page has been removed from the app, but Supabase's
-- /auth/v1/signup endpoint is still open by default. Anyone could POST to
-- it directly and mint a 'student' account even though the UI no longer
-- offers registration.
--
-- Two layers close this:
--
--   1. Auth config (supabase/config.toml -> enable_signup = false),
--      pushed to the hosted project with `supabase config push`.
--      This makes the signup endpoint reject every request. It does NOT
--      affect administrative user creation.
--
--   2. This migration: the "Before User Created" auth hook. It runs inside
--      the auth server immediately before the row is inserted into
--      auth.users. It is the only interception point that fires for the
--      public signup endpoint WITHOUT also firing for administrative user
--      creation, so it is a safe second layer if the auth config is ever
--      reset. It must be enabled in the Supabase dashboard
--      (Authentication -> Hooks -> Before User Created) and pointed at this
--      function via:
--          uri = "pg-functions://postgres/public/hook_reject_public_signup"
--      See README "Database" for the one-time enablement steps.
--
-- Verified empirically against this project (yojmjuctaqjvxljjctnb):
--   - POST /auth/v1/signup      -> rejected
--   - POST /auth/v1/admin/users -> unaffected; accounts can still be
--                                  provisioned with the service_role key
--                                  or from the Supabase dashboard

-- ---------------------------------------------------------------------------
-- 1. The hook function: rejects every signup that reaches it.
-- ---------------------------------------------------------------------------
create or replace function public.hook_reject_public_signup(event jsonb)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
begin
  -- Accounts are provisioned administratively instead. Return an error
  -- object to reject; returning '{}' would allow the signup.
  return jsonb_build_object(
    'error', jsonb_build_object(
      'message', 'Public registration is disabled on this platform. Accounts are provisioned by the university administration. Contact the campus facilities office for access.',
      'http_code', 403
    )
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- 2. Permissions.
--    supabase_auth_admin is the role Supabase Auth uses to call the hook.
--    anon/authenticated/public must NOT be able to execute it directly.
-- ---------------------------------------------------------------------------
grant usage on schema public to supabase_auth_admin;

grant execute
  on function public.hook_reject_public_signup(jsonb)
  to supabase_auth_admin;

revoke execute
  on function public.hook_reject_public_signup(jsonb)
  from authenticated, anon, public;

-- ---------------------------------------------------------------------------
-- 3. Harden handle_new_user.
--    Re-asserts the role allowlist (a self-granted role can never exceed
--    student/faculty/officer) and pins the search_path, which a
--    SECURITY DEFINER function should never leave to the caller's default.
--
--    Note: this trigger cannot tell a public signup apart from an
--    administrative user creation -- both arrive with identical session
--    context (session_user = supabase_auth_admin, request.jwt.claims =
--    NULL, identical raw_app_meta_data). That was verified against the
--    live project. The hook in section 1 is therefore the enforcement
--    point; this trigger is defence in depth only.
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  requested_role text;
begin
  requested_role := coalesce(new.raw_user_meta_data->>'primary_role', 'student');

  if requested_role not in ('student', 'faculty', 'officer') then
    requested_role := 'student';
  end if;

  insert into public.profiles (
    id,
    full_name,
    email,
    avatar_url,
    primary_role,
    account_status,
    department,
    student_or_employee_id,
    created_at,
    updated_at
  )
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.email,
    new.raw_user_meta_data->>'avatar_url',
    requested_role,
    'active',
    new.raw_user_meta_data->>'department',
    new.raw_user_meta_data->>'student_or_employee_id',
    timezone('utc'::text, now()),
    timezone('utc'::text, now())
  );
  return new;
end;
$$;
