import fs from 'fs';
import path from 'path';

function loadEnvLocal() {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) return {};
  const content = fs.readFileSync(envPath, 'utf8');
  const env = {};
  content.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const firstEquals = trimmed.indexOf('=');
    if (firstEquals === -1) return;
    const key = trimmed.substring(0, firstEquals).trim();
    let val = trimmed.substring(firstEquals + 1).trim();
    if (val.startsWith('"') && val.endsWith('"')) {
      val = val.substring(1, val.length - 1);
    } else if (val.startsWith("'") && val.endsWith("'")) {
      val = val.substring(1, val.length - 1);
    }
    env[key] = val;
  });
  return env;
}

async function main() {
  console.log('📦 Backup: Querying n8n Public API for active workflows...');
  const env = loadEnvLocal();
  const apiKey = env['N8N_API_KEY'];

  if (!apiKey) {
    console.error('✖ Error: N8N_API_KEY not found in .env.local');
    process.exit(1);
  }

  let workflows = [];
  let nextCursor = null;

  try {
    do {
      const url = new URL('https://n8n.balidolphintours.com/api/v1/workflows');
      if (nextCursor) {
        url.searchParams.append('nextCursor', nextCursor);
      }

      console.log(`- Fetching workflows from: ${url.toString()}`);
      const res = await fetch(url.toString(), {
        headers: {
          'X-N8N-API-KEY': apiKey,
          'Accept': 'application/json'
        }
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Failed to fetch workflows (HTTP ${res.status}): ${errorText}`);
      }

      const payload = await res.json();
      if (payload.data && Array.isArray(payload.data)) {
        workflows = workflows.concat(payload.data);
      }
      nextCursor = payload.nextCursor;
    } while (nextCursor);

    console.log(`✔ Successfully retrieved ${workflows.length} workflows from the Public API.`);

    const backupFile = path.resolve(process.cwd(), 'scripts/n8n_public_workflows_backup.json');
    fs.writeFileSync(backupFile, JSON.stringify(workflows, null, 2), 'utf8');
    console.log(`✔ Backup written successfully to: ${backupFile}`);
    console.log('\n🎉 Backup complete!');
  } catch (err) {
    console.error('✖ Backup failed:', err.message);
    process.exit(1);
  }
}

main();
