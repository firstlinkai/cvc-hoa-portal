/**
 * One-time bootstrap: provisions the System Admin account (auth user +
 * active sys_admin profile), breaking the approval chicken-and-egg loop.
 *
 * Reads SEED_ADMIN_* variables from .env.local. Idempotent — safe to re-run.
 *
 * Usage: npm run db:seed-admin
 */
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '..', '.env.local') });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const email = process.env.SEED_ADMIN_EMAIL;
const password = process.env.SEED_ADMIN_PASSWORD;
const firstName = process.env.SEED_ADMIN_FIRST_NAME || 'System';
const lastName = process.env.SEED_ADMIN_LAST_NAME || 'Admin';

if (!url || !serviceKey || !email || !password) {
  console.error(
    '❌ Missing one of NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD in .env.local'
  );
  process.exit(1);
}

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// 1. Create (or find) the auth user, pre-confirmed.
let userId;
const { data: created, error: createErr } = await admin.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
});

if (createErr) {
  if (
    createErr.message?.toLowerCase().includes('already') ||
    createErr.code === 'email_exists'
  ) {
    console.log('ℹ Auth user already exists — locating it...');
    const { data: list, error: listErr } = await admin.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });
    if (listErr) {
      console.error('❌ Could not list users:', listErr.message);
      process.exit(1);
    }
    const existing = list.users.find(
      (u) => u.email?.toLowerCase() === email.toLowerCase()
    );
    if (!existing) {
      console.error('❌ User reported as existing but was not found.');
      process.exit(1);
    }
    userId = existing.id;
  } else {
    console.error('❌ Failed to create auth user:', createErr.message);
    process.exit(1);
  }
} else {
  userId = created.user.id;
  console.log('✔ Auth user created:', userId);
}

// 2. Upsert the sys_admin profile in the active state.
const { error: profileErr } = await admin.from('profiles').upsert(
  {
    id: userId,
    email,
    first_name: firstName,
    last_name: lastName,
    phase: 'HQ',
    block: '0',
    lot: '0',
    role: 'sys_admin',
    status: 'active',
  },
  { onConflict: 'id' }
);

if (profileErr) {
  console.error('❌ Failed to upsert sys_admin profile:', profileErr.message);
  process.exit(1);
}

console.log(`✅ System Admin ready: ${email} (role=sys_admin, status=active)`);
