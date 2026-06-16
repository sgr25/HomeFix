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

async function verifyInsertWorks(url, serviceKey) {
  const res = await fetch(`${url}/rest/v1/clothes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      Prefer: 'return=representation',
    },
    body: JSON.stringify({
      size: '__migration_test__',
      season: 'summer',
      image_url: '',
      status: 'in_closet',
    }),
  });

  const body = await res.json().catch(() => ({}));

  if (!res.ok) {
    const message =
      typeof body.message === 'string'
        ? body.message
        : typeof body.error === 'string'
          ? body.error
          : `HTTP ${res.status}`;
    return { ok: false, message };
  }

  const id = body?.[0]?.id ?? body?.id;
  if (id) {
    await fetch(`${url}/rest/v1/clothes?id=eq.${id}`, {
      method: 'DELETE',
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
      },
    });
  }

  return { ok: true };
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

  const before = await verifyInsertWorks(url, serviceKey);
  if (before.ok) {
    console.log('Migration already applied: image_url accepts NULL.');
    return;
  }

  console.log('Current issue:', before.message);

  if (!dbUrl) {
    console.error(
      'Cannot run DDL automatically without DATABASE_URL or SUPABASE_DB_URL in .env.local.\n' +
        'Add your Supabase Postgres connection string from Dashboard → Settings → Database,\n' +
        'then run: node scripts/run-migrations.mjs'
    );
    process.exit(1);
  }

  const migrations = [
    '002_add_set_name.sql',
    '003_image_url_nullable.sql',
  ];

  for (const file of migrations) {
    const sql = fs.readFileSync(path.join(root, 'supabase', 'migrations', file), 'utf8');
    console.log(`Running ${file}...`);
    await runSql(dbUrl, sql);
    console.log(`Done: ${file}`);
  }

  const after = await verifyInsertWorks(url, serviceKey);
  if (!after.ok) {
    throw new Error(`Migration finished but verification failed: ${after.message}`);
  }

  console.log('All migrations applied successfully.');
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
