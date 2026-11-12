-- Migration: 20261125_provision_org_advisers.sql
-- Description: Provisions a dedicated Organization Adviser account for each
-- student organization (OCTA, ALGO, BSIT, COESC, USSC) with password 'Demo1234!'
-- and assigns each organization its own respective adviser_id so Step 1
-- proposal approvals are strictly scoped to the organization's own adviser.

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

DO $$
DECLARE
  v_password_hash TEXT := extensions.crypt('Demo1234!', extensions.gen_salt('bf', 10));
  v_user_id UUID;
  r RECORD;
BEGIN
  FOR r IN
    SELECT * FROM (VALUES
      ('octa.adviser@campus.edu',  'OCTA Faculty Adviser',  'OCTA',  'College of Computer Studies (CCS)'),
      ('algo.adviser@campus.edu',  'ALGO Faculty Adviser',  'ALGO',  'College of Computer Studies (CCS)'),
      ('bsit.adviser@campus.edu',  'BSIT Faculty Adviser',  'BSIT',  'College of Computer Studies (CCS)'),
      ('coesc.adviser@campus.edu', 'COESC Faculty Adviser', 'COESC', 'College of Engineering (COE)'),
      ('ussc.adviser@campus.edu',  'USSC Faculty Adviser',  'USSC',  'University Wide')
    ) AS t(email, full_name, org_acronym, college)
  LOOP
    SELECT id INTO v_user_id FROM auth.users WHERE email = r.email;

    IF v_user_id IS NULL THEN
      v_user_id := gen_random_uuid();

      INSERT INTO auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        raw_app_meta_data,
        raw_user_meta_data,
        created_at,
        updated_at,
        confirmation_token,
        email_change,
        email_change_token_new,
        recovery_token
      )
      VALUES (
        '00000000-0000-0000-0000-000000000000',
        v_user_id,
        'authenticated',
        'authenticated',
        r.email,
        v_password_hash,
        now(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        jsonb_build_object(
          'sub', v_user_id::text,
          'email', r.email,
          'full_name', r.full_name,
          'primary_role', 'adviser',
          'department', r.college,
          'email_verified', true,
          'phone_verified', false
        ),
        now(),
        now(),
        '',
        '',
        '',
        ''
      );

      INSERT INTO auth.identities (
        id,
        user_id,
        provider_id,
        identity_data,
        provider,
        last_sign_in_at,
        created_at,
        updated_at
      )
      VALUES (
        gen_random_uuid(),
        v_user_id,
        v_user_id::text,
        jsonb_build_object(
          'sub', v_user_id::text,
          'email', r.email,
          'email_verified', true,
          'phone_verified', false
        ),
        'email',
        now(),
        now(),
        now()
      )
      ON CONFLICT (provider_id, provider) DO NOTHING;
    ELSE
      UPDATE auth.users
      SET encrypted_password = v_password_hash,
          email_confirmed_at = COALESCE(email_confirmed_at, now()),
          raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object(
            'full_name', r.full_name,
            'primary_role', 'adviser',
            'department', r.college
          ),
          updated_at = now()
      WHERE id = v_user_id;
    END IF;

    -- Ensure profile exists and has primary_role = 'adviser'
    INSERT INTO public.profiles (
      id, full_name, email, primary_role, account_status, department, created_at, updated_at
    )
    VALUES (
      v_user_id, r.full_name, r.email, 'adviser', 'active', r.college, now(), now()
    )
    ON CONFLICT (id) DO UPDATE SET
      full_name = EXCLUDED.full_name,
      email = EXCLUDED.email,
      primary_role = 'adviser',
      account_status = 'active',
      department = COALESCE(public.profiles.department, EXCLUDED.department),
      updated_at = now();

    -- Link this dedicated adviser directly to their respective organization
    UPDATE public.organizations
    SET adviser_id = v_user_id
    WHERE acronym = r.org_acronym;
  END LOOP;

  -- Update ALGO and BSIT organization names
  UPDATE public.organizations
  SET name = 'Association for Leadership, Governance, and Organization'
  WHERE acronym = 'ALGO';

  UPDATE public.organizations
  SET name = 'BSIT'
  WHERE acronym = 'BSIT';
END $$;

NOTIFY pgrst, 'reload schema';

