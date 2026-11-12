-- Migration: 20261123_provision_org_accounts.sql
-- Description: Provisions the 8 dedicated student organization accounts
-- (OCTA, ALGO, BSIT, COESC President & Secretary) directly in auth.users,
-- auth.identities, public.profiles, and public.organization_members with
-- password 'Demo1234!'. Idempotent and safe to run in Supabase SQL Editor.

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

DO $$
DECLARE
  v_password_hash TEXT := extensions.crypt('Demo1234!', extensions.gen_salt('bf', 10));
  v_user_id UUID;
  r RECORD;
BEGIN
  -- 1. Ensure the 4 organizations exist before linking members
  INSERT INTO public.organizations (name, acronym, description, logo_url, status, college, org_type, parent_org_id)
  VALUES (
    'Organization for Computing and Technology Advancements', 'OCTA',
    'Mother student organization of the College of Computer Studies (CCS).',
    'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=128&q=80',
    'active', 'College of Computer Studies (CCS)', 'college_mother', NULL
  )
  ON CONFLICT (acronym) DO UPDATE SET
    name = EXCLUDED.name, college = EXCLUDED.college, org_type = EXCLUDED.org_type;

  INSERT INTO public.organizations (name, acronym, description, logo_url, status, college, org_type, parent_org_id)
  VALUES
    ('Association for Leadership, Governance, and Organization', 'ALGO',
     'Sub-organization of OCTA for Computer Science Students.',
     'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=128&q=80',
     'active', 'College of Computer Studies (CCS)', 'program_sub_org',
     (SELECT id FROM public.organizations WHERE acronym = 'OCTA')),
    ('BSIT', 'BSIT',
     'Sub-organization of OCTA for Information Technology Students.',
     'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=128&q=80',
     'active', 'College of Computer Studies (CCS)', 'program_sub_org',
     (SELECT id FROM public.organizations WHERE acronym = 'OCTA')),
    ('College of Engineering Student Council', 'COESC',
     'Apex student governing body for student welfare and activities across all colleges.',
     'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=128&q=80',
     'active', 'College of Engineering (COE)', 'college_mother', NULL)
  ON CONFLICT (acronym) DO UPDATE SET
    name = EXCLUDED.name, college = EXCLUDED.college, org_type = EXCLUDED.org_type, parent_org_id = EXCLUDED.parent_org_id;

  -- 2. Provision the 8 dedicated organization officer accounts
  FOR r IN
    SELECT * FROM (VALUES
      ('octa.president@campus.edu',  'OCTA President',  'OCTA',  'president', 'College of Computer Studies (CCS)'),
      ('octa.secretary@campus.edu',  'OCTA Secretary',  'OCTA',  'secretary', 'College of Computer Studies (CCS)'),
      ('algo.president@campus.edu',  'ALGO President',  'ALGO',  'president', 'College of Computer Studies (CCS)'),
      ('algo.secretary@campus.edu',  'ALGO Secretary',  'ALGO',  'secretary', 'College of Computer Studies (CCS)'),
      ('bsit.president@campus.edu',  'BSIT President',  'BSIT',  'president', 'College of Computer Studies (CCS)'),
      ('bsit.secretary@campus.edu',  'BSIT Secretary',  'BSIT',  'secretary', 'College of Computer Studies (CCS)'),
      ('coesc.president@campus.edu', 'COESC President', 'COESC', 'president', 'College of Engineering (COE)'),
      ('coesc.secretary@campus.edu', 'COESC Secretary', 'COESC', 'secretary', 'College of Engineering (COE)')
    ) AS t(email, full_name, org_acronym, org_role, college)
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
          'primary_role', 'officer',
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
      -- Ensure password and confirmed state match Demo1234! if user already exists
      UPDATE auth.users
      SET encrypted_password = v_password_hash,
          email_confirmed_at = COALESCE(email_confirmed_at, now()),
          raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object(
            'full_name', r.full_name,
            'primary_role', 'officer',
            'department', r.college
          ),
          updated_at = now()
      WHERE id = v_user_id;
    END IF;

    -- Ensure profile exists and has primary_role = 'officer'
    INSERT INTO public.profiles (
      id, full_name, email, primary_role, account_status, department, created_at, updated_at
    )
    VALUES (
      v_user_id, r.full_name, r.email, 'officer', 'active', r.college, now(), now()
    )
    ON CONFLICT (id) DO UPDATE SET
      full_name = EXCLUDED.full_name,
      email = EXCLUDED.email,
      primary_role = 'officer',
      account_status = 'active',
      department = COALESCE(public.profiles.department, EXCLUDED.department),
      updated_at = now();

    -- Link user to their respective organization and role
    INSERT INTO public.organization_members (
      organization_id, user_id, organization_role, membership_status
    )
    SELECT o.id, v_user_id, r.org_role, 'active'
    FROM public.organizations o
    WHERE o.acronym = r.org_acronym
    ON CONFLICT (organization_id, user_id) DO UPDATE SET
      organization_role = EXCLUDED.organization_role,
      membership_status = 'active';
  END LOOP;
END $$;

-- Also ensure officer@campus.edu is linked to OCTA as president
INSERT INTO public.organization_members (organization_id, user_id, organization_role, membership_status)
SELECT o.id, p.id, 'president', 'active'
FROM public.organizations o
JOIN public.profiles p ON p.email = 'officer@campus.edu'
WHERE o.acronym = 'OCTA'
ON CONFLICT (organization_id, user_id)
DO UPDATE SET organization_role = 'president', membership_status = 'active';

NOTIFY pgrst, 'reload schema';
