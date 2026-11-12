#!/usr/bin/env node
/**
 * Seed the demo accounts for ONE Facility.
 *
 * The live project stores accounts in Supabase Auth, which SQL migrations
 * cannot create directly, so account provisioning lives here. Run it once
 * per environment; it is idempotent (existing accounts are left alone).
 *
 *   SUPABASE_URL=https://<ref>.supabase.co \
 *   SUPABASE_SERVICE_ROLE_KEY=<service_role key> \
 *   node scripts/seed-demo-accounts.mjs
 *
 * The service_role key is a server secret. Never commit it, never put it in
 * .env files that ship to the browser, and never expose it to the client.
 *
 * After the accounts exist, apply the role assignments from
 * supabase/migrations/20261121_repair_proposals_and_org_hierarchy.sql, which
 * links officer@campus.edu as president of OCTA and adviser@campus.edu as
 * the organisation adviser.
 */

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !serviceKey) {
  console.error(
    'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.\n' +
      'Usage: SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/seed-demo-accounts.mjs',
  )
  process.exit(1)
}

const PASSWORD = process.env.DEMO_PASSWORD || 'Demo1234!'

// primary_role is only a hint here: the handle_new_user trigger clamps roles
// to student/faculty/officer, so approver roles are assigned by SQL afterwards.
const ACCOUNTS = [
  { email: 'test1@gmail.com', full_name: 'Faculty User', primary_role: 'faculty' },
  { email: 'officer@campus.edu', full_name: 'OCTA President', primary_role: 'officer' },
  { email: 'octa.president@campus.edu', full_name: 'OCTA President', primary_role: 'officer' },
  { email: 'octa.secretary@campus.edu', full_name: 'OCTA Secretary', primary_role: 'officer' },
  { email: 'algo.president@campus.edu', full_name: 'ALGO President', primary_role: 'officer' },
  { email: 'algo.secretary@campus.edu', full_name: 'ALGO Secretary', primary_role: 'officer' },
  { email: 'bsit.president@campus.edu', full_name: 'BSIT President', primary_role: 'officer' },
  { email: 'bsit.secretary@campus.edu', full_name: 'BSIT Secretary', primary_role: 'officer' },
  { email: 'coesc.president@campus.edu', full_name: 'COESC President', primary_role: 'officer' },
  { email: 'coesc.secretary@campus.edu', full_name: 'COESC Secretary', primary_role: 'officer' },
  { email: 'octa.adviser@campus.edu', full_name: 'OCTA Adviser', primary_role: 'adviser' },
  { email: 'algo.adviser@campus.edu', full_name: 'ALGO Adviser', primary_role: 'adviser' },
  { email: 'bsit.adviser@campus.edu', full_name: 'BSIT Adviser', primary_role: 'adviser' },
  { email: 'coesc.adviser@campus.edu', full_name: 'COESC Adviser', primary_role: 'adviser' },
  { email: 'admin@campus.edu', full_name: 'Facility Administrator', primary_role: 'facility_admin' },
  { email: 'adviser@campus.edu', full_name: 'Organisation Adviser', primary_role: 'adviser' },
  { email: 'dean@campus.edu', full_name: 'College Dean', primary_role: 'college_dean' },
  { email: 'osas@campus.edu', full_name: 'Office of Student Affairs', primary_role: 'osas' },
  { email: 'director@campus.edu', full_name: 'Campus Director', primary_role: 'campus_director' },
  { email: 'president@campus.edu', full_name: 'University President', primary_role: 'university_president' },
]

const headers = {
  apikey: serviceKey,
  Authorization: `Bearer ${serviceKey}`,
  'Content-Type': 'application/json',
}

async function createAccount(account) {
  const res = await fetch(`${url}/auth/v1/admin/users`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      email: account.email,
      password: PASSWORD,
      email_confirm: true,
      user_metadata: {
        full_name: account.full_name,
        primary_role: account.primary_role,
      },
    }),
  })

  if (res.ok) {
    const data = await res.json()
    console.log(`  created  ${account.email}  (${account.primary_role})  id=${data.id}`)
    return
  }

  const text = await res.text()
  if (/already been registered|already exists|email_exists/i.test(text)) {
    console.log(`  exists   ${account.email}`)
    return
  }
  console.error(`  FAILED   ${account.email}: ${text}`)
  process.exitCode = 1
}

console.log(`Seeding ${ACCOUNTS.length} demo accounts into ${url}`)
for (const account of ACCOUNTS) {
  await createAccount(account)
}
console.log('\nDone. Apply the SQL migrations for roles, org membership and profiles.')
