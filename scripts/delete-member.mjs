/**
 * Permanently deletes a member (auth user + profile) by email.
 * Refuses if the member has uploaded documents (audit trail preservation).
 *
 * Usage: node scripts/delete-member.mjs <email>
 */
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '..', '.env.local') });

const email = process.argv[2]?.trim().toLowerCase();
if (!email) {
  console.error('Usage: node scripts/delete-member.mjs <email>');
  process.exit(1);
}

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// 1. Locate the profile and show what we are about to delete.
const { data: profile } = await admin
  .from('profiles')
  .select('*')
  .eq('email', email)
  .maybeSingle();

if (!profile) {
  console.error(`❌ No member found with email ${email}`);
  process.exit(1);
}

console.log('Found member:');
console.log(`  id:     ${profile.id}`);
console.log(`  name:   ${profile.first_name} ${profile.last_name}`);
console.log(`  role:   ${profile.role}`);
console.log(`  status: ${profile.status}`);
console.log(`  P/B/L:  ${profile.phase}/${profile.block}/${profile.lot}`);

// 2. Guard: members with uploaded documents cannot be hard-deleted.
const { count } = await admin
  .from('documents')
  .select('id', { count: 'exact', head: true })
  .eq('uploaded_by', profile.id);

if ((count ?? 0) > 0) {
  console.error(
    `❌ Member has ${count} uploaded document(s). Deleting would break the audit trail — keep the account deactivated instead.`
  );
  process.exit(1);
}

// 3. Delete the auth user (profile row cascades).
const { error } = await admin.auth.admin.deleteUser(profile.id);
if (error) {
  console.error('❌ Deletion failed:', error.message);
  process.exit(1);
}

console.log(`✅ ${email} permanently deleted (auth user + profile).`);
