-- ONE Facility Migration: Auto-create profiles on sign-up
-- Run this after 20261110_init_schema.sql

-- Helper function to check if current user is admin (re-defined for completeness)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND primary_role IN ('facility_admin', 'system_admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger function: auto-create profile when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
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
    COALESCE(NEW.raw_user_meta_data->>'primary_role', 'student'),
    'active',
    NEW.raw_user_meta_data->>'department',
    NEW.raw_user_meta_data->>'student_or_employee_id',
    timezone('utc'::text, now()),
    timezone('utc'::text, now())
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users insert
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
