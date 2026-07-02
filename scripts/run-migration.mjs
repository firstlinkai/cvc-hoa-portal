/**
 * Runs every SQL file in supabase/migrations (sorted) against the Supabase
 * Postgres instance defined by SUPABASE_DB_URL in .env.local.
 *
 * Usage: npm run db:migrate
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import pg from 'pg';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

dotenv.config({ path: join(root, '.env.local') });

const connectionString = process.env.SUPABASE_DB_URL;
if (!connectionString) {
  console.error('❌ SUPABASE_DB_URL is not set in .env.local');
  process.exit(1);
}

const migrationsDir = join(root, 'supabase', 'migrations');
const files = readdirSync(migrationsDir)
  .filter((f) => f.endsWith('.sql'))
  .sort();

const client = new pg.Client({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

try {
  await client.connect();
  console.log('✔ Connected to Supabase Postgres');

  for (const file of files) {
    const sql = readFileSync(join(migrationsDir, file), 'utf8');
    process.stdout.write(`→ Applying ${file} ... `);
    await client.query(sql);
    console.log('done');
  }

  console.log('✅ All migrations applied successfully.');
} catch (err) {
  console.error('\n❌ Migration failed:', err.message);
  process.exitCode = 1;
} finally {
  await client.end();
}
