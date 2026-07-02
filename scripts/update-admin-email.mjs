/**
 * One-off: re-points the seeded sys_admin account to a new email address
 * (auth.users + public.profiles), keeping the same user ID.
 *
 * Usage: node scripts/update-admin-email.mjs <old-email> <new-email>
 */
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '..', '.env.local') });

const [oldEmail, newEmail] = process.argv.slice(2);
if (!oldEmail || !newEmail) {
  console.error('Usage: node scripts/update-admin-email.mjs <old-email> <new-email>');
  process.exit(1);
}

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const { data: list, error: listErr } = await admin.auth.admin.listUsers({
  page: 1,
  perPage: 1000,
});
if (listErr) {
  console.error('❌ Could not list users:', listErr.message);
  process.exit(1);
}

const user = list.users.find(
  (u) => u.email?.toLowerCase() === oldEmail.toLowerCase()
);
if (!user) {
  console.error(`❌ No auth user found with email ${oldEmail}`);
  process.exit(1);
}

const { error: updateErr } = await admin.auth.admin.updateUserById(user.id, {
  email: newEmail,
  email_confirm: true,
});
if (updateErr) {
  console.error('❌ Failed to update auth user email:', updateErr.message);
  process.exit(1);
}
console.log(`✔ auth.users email updated (${user.id})`);

const { error: profileErr } = await admin
  .from('profiles')
  .update({ email: newEmail })
  .eq('id', user.id);
if (profileErr) {
  console.error('❌ Failed to update profile email:', profileErr.message);
  process.exit(1);
}
console.log('✔ public.profiles email updated');
console.log(`✅ sys_admin is now ${newEmail} (password unchanged)`);
