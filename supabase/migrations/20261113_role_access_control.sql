-- ONE Facility role-based access control
--
-- 1. Harden handle_new_user so public signup cannot self-grant admin roles.
--    Only student, faculty, officer are allowed via the Register page; anything
--    else defaults to 'student'. Admin accounts must be created manually/SQL.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  requested_role TEXT;
BEGIN
  requested_role := COALESCE(NEW.raw_user_meta_data->>'primary_role', 'student');

  IF requested_role NOT IN ('student', 'faculty', 'officer') THEN
    requested_role := 'student';
  END IF;

  INSERT INTO public.profiles (
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
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.email,
    NEW.raw_user_meta_data->>'avatar_url',
    requested_role,
    'active',
    NEW.raw_user_meta_data->>'department',
    NEW.raw_user_meta_data->>'student_or_employee_id',
    timezone('utc'::text, now()),
    timezone('utc'::text, now())
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Link officer@campus.edu to ACM as a member so the org dashboard is real.
INSERT INTO public.organization_members (organization_id, user_id, organization_role, membership_status)
SELECT
  o.id,
  p.id,
  'officer',
  'active'
FROM public.organizations o
JOIN public.profiles p ON p.email = 'officer@campus.edu'
WHERE o.acronym = 'ACM'
ON CONFLICT (organization_id, user_id) DO NOTHING;
