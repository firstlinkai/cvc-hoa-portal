/**
 * Quick diagnostic: prints bucket config, RLS flags, policies, and profiles.
 * Usage: node scripts/verify-db.mjs
 */
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import pg from 'pg';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '..', '.env.local') });

const c = new pg.Client({
  connectionString: process.env.SUPABASE_DB_URL,
  ssl: { rejectUnauthorized: false },
});
await c.connect();

const b = await c.query(
  "select id, public, file_size_limit, allowed_mime_types from storage.buckets where id='hoa-documents'"
);
console.log('bucket:', JSON.stringify(b.rows, null, 1));

const r = await c.query(
  "select relname, relrowsecurity from pg_class where relname in ('profiles','documents') and relkind='r'"
);
console.log('rls:', JSON.stringify(r.rows));

const p = await c.query(
  'select polname, polrelid::regclass::text as tbl from pg_policy order by 2,1'
);
console.log('policies:', JSON.stringify(p.rows, null, 1));

const prof = await c.query('select email, role, status from public.profiles');
console.log('profiles:', JSON.stringify(prof.rows));

await c.end();
