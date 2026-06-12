import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const colors = {
  reset: '\x1b[0m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  bold: '\x1b[1m',
};

const REMOTE_DB_PATH = '/var/lib/docker/volumes/n8n-docker_n8n_data/_data/database.sqlite';
const BACKUP_DB_PATH = `/var/lib/docker/volumes/n8n-docker_n8n_data/_data/database_backup_python_${Date.now()}.sqlite`;
const CREDENTIAL_ID = 'Jl0QXzDHF911VKnm';

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
  console.log(`\n${colors.cyan}${colors.bold}🔄 RUNNING HOSTED N8N WORKFLOWS MIGRATION (ORCHESTRATOR)...${colors.reset}\n`);

  const env = loadEnvLocal();
  const supabaseUrl = env['SUPABASE_URL'];
  const supabaseSecret = env['SUPABASE_SERVICE_ROLE_KEY'];

  if (!supabaseUrl || !supabaseSecret) {
    console.error(`${colors.red}✖ Error: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not found in .env.local${colors.reset}`);
    process.exit(1);
  }

  const localPyScript = path.resolve(process.cwd(), 'scripts/migrate_remote.py');
  if (!fs.existsSync(localPyScript)) {
    console.error(`${colors.red}✖ Error: Local python script not found at ${localPyScript}${colors.reset}`);
    process.exit(1);
  }

  const tempInjectedScript = path.resolve(process.cwd(), 'scripts/temp_migrate_remote_injected.py');

  try {
    // 1. Create remote database backup
    console.log(`- Backing up remote SQLite database to ${BACKUP_DB_PATH}...`);
    execSync(`gcloud compute ssh n8n-server --zone=us-central1-a --command="sudo cp ${REMOTE_DB_PATH} ${BACKUP_DB_PATH}"`);
    console.log(`${colors.green}  ✔ Database backup created successfully.${colors.reset}`);

    // 2. Inject credentials into the python script text
    console.log(`- Injecting credentials into migration script...`);
    let scriptContent = fs.readFileSync(localPyScript, 'utf8');
    scriptContent = scriptContent.replace('YOUR_SUPABASE_CREDENTIAL_ID', CREDENTIAL_ID);
    scriptContent = scriptContent.replace('YOUR_SUPABASE_URL', supabaseUrl);
    scriptContent = scriptContent.replace('YOUR_SUPABASE_SERVICE_ROLE_KEY', supabaseSecret);
    fs.writeFileSync(tempInjectedScript, scriptContent, 'utf8');

    // 3. SCP the injected script to the remote VM
    console.log(`- Copying injected migration script to remote VM...`);
    execSync(`gcloud compute scp ${tempInjectedScript} n8n-server:/tmp/migrate_remote.py --zone=us-central1-a`);

    // 4. Run the Python migration script
    console.log(`- Executing migration on remote VM...`);
    const remoteExecutionCommand = `sudo python3 /tmp/migrate_remote.py`;
    const execResult = execSync(
      `gcloud compute ssh n8n-server --zone=us-central1-a --command="${remoteExecutionCommand}"`
    ).toString();
    
    console.log(`\n--- REMOTE EXECUTION OUTPUT ---`);
    console.log(execResult.trim());
    console.log(`--------------------------------\n`);

    // 5. Clean up remote file
    console.log(`- Cleaning up remote files...`);
    execSync(`gcloud compute ssh n8n-server --zone=us-central1-a --command="rm -f /tmp/migrate_remote.py"`);

    // 6. Restart remote n8n docker service
    console.log(`- Restarting hosted n8n service to apply changes...`);
    execSync(`gcloud compute ssh n8n-server --zone=us-central1-a --command="sudo docker restart n8n-docker-n8n-1"`);
    
    console.log(`\n${colors.green}${colors.bold}✔ HOSTED N8N WORKFLOWS MIGRATED AND SERVICES RESTARTED SUCCESSFULLY!${colors.reset}\n`);

  } catch (error) {
    console.error(`\n${colors.red}✖ Orchestration failed: ${error.message}${colors.reset}\n`);
  } finally {
    // Clean up local temp injected file
    if (fs.existsSync(tempInjectedScript)) {
      fs.unlinkSync(tempInjectedScript);
    }
  }
}

main();
