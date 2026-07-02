/**
 * Deletes a document (storage object + database row) by tracking number.
 * Usage: node scripts/delete-document.mjs CV-NOTICE-2026-001
 */
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '..', '.env.local') });

const trackingNumber = process.argv[2];
if (!trackingNumber) {
  console.error('Usage: node scripts/delete-document.mjs <TRACKING_NUMBER>');
  process.exit(1);
}

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// 1. Locate the document and show what we are about to delete.
const { data: doc, error: findErr } = await admin
  .from('documents')
  .select('*')
  .eq('tracking_number', trackingNumber)
  .maybeSingle();

if (findErr) {
  console.error('❌ Lookup failed:', findErr.message);
  process.exit(1);
}
if (!doc) {
  console.error(`❌ No document found with tracking number ${trackingNumber}`);
  process.exit(1);
}

console.log('Found document:');
console.log(`  id:        ${doc.id}`);
console.log(`  title:     ${doc.title}`);
console.log(`  category:  ${doc.category}`);
console.log(`  file:      ${doc.storage_url}`);
console.log(`  published: ${doc.is_published}`);

// 2. Remove the storage object.
const { error: storageErr } = await admin.storage
  .from('hoa-documents')
  .remove([doc.storage_url]);
if (storageErr) {
  console.error('⚠ Storage object removal failed:', storageErr.message);
} else {
  console.log('✔ Storage object removed');
}

// 3. Remove the database row.
const { error: rowErr } = await admin.from('documents').delete().eq('id', doc.id);
if (rowErr) {
  console.error('❌ Database row deletion failed:', rowErr.message);
  process.exit(1);
}
console.log('✔ Database row removed');
console.log(`✅ ${trackingNumber} deleted.`);
