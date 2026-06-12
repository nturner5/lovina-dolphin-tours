import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const colors = {
  reset: '\x1b[0m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  bold: '\x1b[1m'
};

const WORKFLOW_ID = 'reSyw1JxACv2NocR';
const TARGET_VERSION_ID = 'f91d5955-4b3d-4d22-88d6-7dc6da629b7d';

async function main() {
  console.log(`\n${colors.cyan}${colors.bold}🩹 RECOVERING USER SAVED VERSION FOR WORKFLOW ${WORKFLOW_ID}...${colors.reset}\n`);

  try {
    const sqlQuery = `
      UPDATE workflow_entity 
      SET 
        nodes = (SELECT nodes FROM workflow_history WHERE "versionId" = '${TARGET_VERSION_ID}'),
        connections = (SELECT connections FROM workflow_history WHERE "versionId" = '${TARGET_VERSION_ID}'),
        "versionId" = '${TARGET_VERSION_ID}',
        "activeVersionId" = '${TARGET_VERSION_ID}',
        "updatedAt" = datetime('now')
      WHERE id = '${WORKFLOW_ID}';
    `;

    const localSqlFile = path.resolve(process.cwd(), 'scripts/recover_workflow.sql');
    fs.writeFileSync(localSqlFile, sqlQuery, 'utf8');

    console.log(`- Copying recovery SQL script to hosted VM...`);
    execSync(`gcloud compute scp ${localSqlFile} n8n-server:/tmp/recover_workflow.sql --zone=us-central1-a`);

    console.log(`- Restoring version ${TARGET_VERSION_ID} inside SQLite database...`);
    const sqlCommand = `sudo sqlite3 /var/lib/docker/volumes/n8n-docker_n8n_data/_data/database.sqlite < /tmp/recover_workflow.sql`;
    const executionOutput = execSync(`gcloud compute ssh n8n-server --zone=us-central1-a --command="${sqlCommand}"`).toString();
    console.log(executionOutput ? executionOutput.trim() : '- Database recovery completed successfully.');

    fs.unlinkSync(localSqlFile);

    console.log(`- Restarting hosted n8n service to apply recovered workflow...`);
    execSync(`gcloud compute ssh n8n-server --zone=us-central1-a --command="sudo docker restart n8n-docker-n8n-1"`);

    console.log(`\n${colors.green}${colors.bold}✔ WORKFLOW ${WORKFLOW_ID} RECOVERED SUCCESSFULLY TO THE LATEST USER VERSION!${colors.reset}\n`);

  } catch (error) {
    console.error(`${colors.red}✖ Error during recovery: ${error.message}${colors.reset}`);
  }
}

main();
