/**
 * Verifies each demo account can sign in and has the expected role/status.
 * Usage: node scripts/verify-demo-accounts.mjs
 */
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '..', '.env.local') });

const EXPECTED = [
  ['admin@cvc-hoa.com', 'sys_admin'],
  ['pres@cvc-hoa.com', 'president'],
  ['vp@cvc-hoa.com', 'vice_president'],
  ['board@cvc-hoa.com', 'board_member'],
  ['doc@cvc-hoa.com', 'doc_controller'],
  ['hom@cvc-hoa.com', 'regular_member'],
];

let failures = 0;

for (const [email, expectedRole] of EXPECTED) {
  const client = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  const { data, error } = await client.auth.signInWithPassword({
    email,
    password: 'test123',
  });

  if (error) {
    console.log(`✘ ${email}: sign-in failed (${error.message})`);
    failures++;
    continue;
  }

  const { data: profile } = await client
    .from('profiles')
    .select('role, status')
    .eq('id', data.user.id)
    .single();

  const ok = profile?.role === expectedRole && profile?.status === 'active';
  console.log(
    `${ok ? '✔' : '✘'} ${email}: role=${profile?.role}, status=${profile?.status}`
  );
  if (!ok) failures++;

  await client.auth.signOut();
}

process.exit(failures === 0 ? 0 : 1);
