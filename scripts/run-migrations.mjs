import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

function loadEnv() {
  const envPath = path.join(root, '.env.local');
  if (!fs.existsSync(envPath)) {
    throw new Error('Missing .env.local');
  }

  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx === -1) continue;
    process.env[trimmed.slice(0, idx).trim()] = trimmed.slice(idx + 1).trim();
  }
}

async function columnExists(dbUrl, table, column) {
  const { Client } = await import('pg');
  const client = new Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
  await client.connect();
  try {
    const { rows } = await client.query(
      `SELECT 1 FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = $1 AND column_name = $2`,
      [table, column]
    );
    return rows.length > 0;
  } finally {
    await client.end();
  }
}

async function runSql(dbUrl, sql) {
  const { Client } = await import('pg');
  const client = new Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
  await client.connect();
  try {
    await client.query(sql);
  } finally {
    await client.end();
  }
}

async function main() {
  loadEnv();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const dbUrl = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;

  if (!url || !serviceKey) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required in .env.local');
  }

  if (!dbUrl) {
    console.error(
      'Cannot run DDL automatically without DATABASE_URL or SUPABASE_DB_URL in .env.local.\n' +
        'Add your Supabase Postgres connection string from Dashboard → Settings → Database,\n' +
        'then run: npm run db:migrate'
    );
    process.exit(1);
  }

  const migrations = [
    '002_add_set_name.sql',
    '003_image_url_nullable.sql',
    '005_add_gender.sql',
  ];

  for (const file of migrations) {
    const filePath = path.join(root, 'supabase', 'migrations', file);
    if (!fs.existsSync(filePath)) continue;

    if (file === '005_add_gender.sql') {
      const hasGender = await columnExists(dbUrl, 'clothes', 'gender');
      if (hasGender) {
        console.log('Already applied: 005_add_gender.sql');
        continue;
      }
    }

    const sql = fs.readFileSync(filePath, 'utf8');
    console.log(`Running ${file}...`);
    try {
      await runSql(dbUrl, sql);
      console.log(`Done: ${file}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('already exists')) {
        console.log(`Skipped ${file} (already exists)`);
      } else {
        throw err;
      }
    }
  }

  const hasGender = await columnExists(dbUrl, 'clothes', 'gender');
  if (hasGender) {
    console.log('All migrations applied successfully.');
  } else {
    console.warn('Warning: gender column still missing after migrations.');
  }
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
