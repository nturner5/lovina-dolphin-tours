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

async function main() {
  console.log(`\n${colors.cyan}${colors.bold}🔄 RUNNING HOSTED N8N WORKFLOWS MIGRATION (ORCHESTRATOR)...${colors.reset}\n`);

  try {
    // 1. Create remote database backup
    console.log(`- Backing up remote SQLite database to ${BACKUP_DB_PATH}...`);
    execSync(`gcloud compute ssh n8n-server --zone=us-central1-a --command="sudo cp ${REMOTE_DB_PATH} ${BACKUP_DB_PATH}"`);
    console.log(`${colors.green}  ✔ Database backup created successfully.${colors.reset}`);

    // 2. SCP the Python migration script to the remote VM
    const localPyScript = path.resolve(process.cwd(), 'scripts/migrate_remote.py');
    if (!fs.existsSync(localPyScript)) {
      throw new Error(`Local python script not found at: ${localPyScript}`);
    }
    console.log(`- Copying Python migration script to remote VM...`);
    execSync(`gcloud compute scp ${localPyScript} n8n-server:/tmp/migrate_remote.py --zone=us-central1-a`);

    // 3. Run the Python migration script
    console.log(`- Executing migration on remote VM...`);
    const remoteExecutionCommand = `sudo python3 /tmp/migrate_remote.py`;
    const execResult = execSync(
      `gcloud compute ssh n8n-server --zone=us-central1-a --command="${remoteExecutionCommand}"`
    ).toString();
    
    console.log(`\n--- REMOTE EXECUTION OUTPUT ---`);
    console.log(execResult.trim());
    console.log(`--------------------------------\n`);

    // 4. Clean up remote file
    console.log(`- Cleaning up remote files...`);
    execSync(`gcloud compute ssh n8n-server --zone=us-central1-a --command="rm -f /tmp/migrate_remote.py"`);

    // 5. Restart remote n8n docker service
    console.log(`- Restarting hosted n8n service to apply changes...`);
    execSync(`gcloud compute ssh n8n-server --zone=us-central1-a --command="sudo docker restart n8n-docker-n8n-1"`);
    
    console.log(`\n${colors.green}${colors.bold}✔ HOSTED N8N WORKFLOWS MIGRATED AND SERVICES RESTARTED SUCCESSFULLY!${colors.reset}\n`);

  } catch (error) {
    console.error(`\n${colors.red}✖ Orchestration failed: ${error.message}${colors.reset}\n`);
  }
}

main();
