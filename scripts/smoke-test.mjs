/**
 * End-to-end smoke test against the live Supabase project:
 *  1. anon client must NOT read profiles (RLS)
 *  2. sys_admin can sign in with password
 *  3. sys_admin sees own profile and the documents table through RLS
 * Usage: node scripts/smoke-test.mjs
 */
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '..', '.env.local') });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let failures = 0;
const check = (name, ok, detail = '') => {
  console.log(`${ok ? '✔' : '✘'} ${name}${detail ? ` — ${detail}` : ''}`);
  if (!ok) failures++;
};

// 1. Anonymous access must be blocked by RLS.
const anon = createClient(url, anonKey);
const { data: anonProfiles } = await anon.from('profiles').select('email');
check(
  'anon client cannot read profiles',
  !anonProfiles || anonProfiles.length === 0,
  `rows returned: ${anonProfiles?.length ?? 0}`
);

// 2. sys_admin password sign-in.
const client = createClient(url, anonKey);
const { data: session, error: signInError } =
  await client.auth.signInWithPassword({
    email: process.env.SEED_ADMIN_EMAIL,
    password: process.env.SEED_ADMIN_PASSWORD,
  });
check('sys_admin signs in', !signInError, signInError?.message);

if (!signInError) {
  // 3. Authenticated reads through RLS.
  const { data: me, error: meErr } = await client
    .from('profiles')
    .select('role, status')
    .eq('id', session.user.id)
    .single();
  check(
    'sys_admin reads own profile',
    !meErr && me?.role === 'sys_admin' && me?.status === 'active',
    meErr?.message ?? `role=${me?.role} status=${me?.status}`
  );

  const { error: docsErr } = await client.from('documents').select('id').limit(1);
  check('sys_admin can query documents', !docsErr, docsErr?.message);

  await client.auth.signOut();
}

process.exit(failures === 0 ? 0 : 1);
