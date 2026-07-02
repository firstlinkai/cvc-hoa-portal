/**
 * Seeds demo accounts for user testing (auth user + active profile).
 * Idempotent — existing accounts are skipped.
 *
 * Usage: node scripts/seed-demo-accounts.mjs
 */
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '..', '.env.local') });

const DEMO_PASSWORD = 'test123';

const DEMO_ACCOUNTS = [
  { email: 'admin@cvc-hoa.com', role: 'sys_admin',      firstName: 'Demo', lastName: 'Admin',      phase: '1', block: '1', lot: '1' },
  { email: 'pres@cvc-hoa.com',  role: 'president',      firstName: 'Demo', lastName: 'President',  phase: '1', block: '2', lot: '3' },
  { email: 'vp@cvc-hoa.com',    role: 'vice_president', firstName: 'Demo', lastName: 'VP',         phase: '1', block: '4', lot: '5' },
  { email: 'board@cvc-hoa.com', role: 'board_member',   firstName: 'Demo', lastName: 'Board',      phase: '2', block: '6', lot: '7' },
  { email: 'doc@cvc-hoa.com',   role: 'doc_controller', firstName: 'Demo', lastName: 'DocControl', phase: '2', block: '8', lot: '9' },
  { email: 'hom@cvc-hoa.com',   role: 'regular_member', firstName: 'Demo', lastName: 'Homeowner',  phase: '3', block: '10', lot: '11' },
];

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

let failures = 0;

for (const account of DEMO_ACCOUNTS) {
  process.stdout.write(`→ ${account.email} (${account.role}) ... `);

  // 1. Create (or find) the auth user, pre-confirmed.
  let userId;
  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email: account.email,
    password: DEMO_PASSWORD,
    email_confirm: true,
  });

  if (createErr) {
    if (
      createErr.code === 'email_exists' ||
      createErr.message?.toLowerCase().includes('already')
    ) {
      const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
      const existing = list?.users.find(
        (u) => u.email?.toLowerCase() === account.email.toLowerCase()
      );
      if (!existing) {
        console.log('FAILED (exists but not found)');
        failures++;
        continue;
      }
      userId = existing.id;
    } else {
      console.log(`FAILED (${createErr.message})`);
      failures++;
      continue;
    }
  } else {
    userId = created.user.id;
  }

  // 2. Upsert the active profile with the assigned role.
  const { error: profileErr } = await admin.from('profiles').upsert(
    {
      id: userId,
      email: account.email,
      first_name: account.firstName,
      last_name: account.lastName,
      phase: account.phase,
      block: account.block,
      lot: account.lot,
      role: account.role,
      status: 'active',
    },
    { onConflict: 'id' }
  );

  if (profileErr) {
    console.log(`FAILED (profile: ${profileErr.message})`);
    failures++;
    continue;
  }

  console.log('ready');
}

if (failures > 0) {
  console.error(`\n❌ ${failures} account(s) failed.`);
  process.exit(1);
}
console.log('\n✅ All demo accounts are active and ready for testing.');
