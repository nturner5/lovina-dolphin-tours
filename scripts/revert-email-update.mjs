import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const colors = {
  reset: '\x1b[0m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  bold: '\x1b[1m'
};

const WORKFLOW_ID = 'FXts3OY9D5wZr0PC'; // Lovina 3
const BACKUP_PATH = path.resolve(process.cwd(), 'scripts/n8n_workflows_backup.json');

async function main() {
  console.log(`\n${colors.cyan}${colors.bold}⏪ REVERTING LAST EMAIL UPDATE IN DATABASE FROM BACKUP...${colors.reset}\n`);

  try {
    if (!fs.existsSync(BACKUP_PATH)) {
      throw new Error("Backup file not found at " + BACKUP_PATH);
    }

    const backup = JSON.parse(fs.readFileSync(BACKUP_PATH, 'utf8'));
    const originalWorkflow = backup.find(w => w.id === WORKFLOW_ID);

    if (!originalWorkflow) {
      throw new Error(`Could not find workflow ${WORKFLOW_ID} in backup.`);
    }

    const nodesJsonStr = JSON.stringify(originalWorkflow.nodes).replace(/'/g, "''");
    const connectionsJsonStr = JSON.stringify(originalWorkflow.connections).replace(/'/g, "''");

    const sqlFile = path.resolve(process.cwd(), 'scripts/revert_email.sql');
    const sqlQuery = `
      UPDATE workflow_entity SET nodes = '${nodesJsonStr}'::jsonb, connections = '${connectionsJsonStr}'::jsonb WHERE id = '${WORKFLOW_ID}';
      UPDATE workflow_history SET nodes = '${nodesJsonStr}'::jsonb, connections = '${connectionsJsonStr}'::jsonb WHERE "versionId" = (SELECT "activeVersionId" FROM workflow_entity WHERE id = '${WORKFLOW_ID}');
    `;
    fs.writeFileSync(sqlFile, sqlQuery, 'utf8');

    execSync(`docker cp ${sqlFile} n8n-autoscaling-postgres-1:/tmp/revert_email.sql`);
    execSync(`docker exec -i n8n-autoscaling-postgres-1 psql -U postgres -d n8n -f /tmp/revert_email.sql`);
    fs.unlinkSync(sqlFile);

    console.log(`  ${colors.green}✔ Restored workflow ${originalWorkflow.name} nodes and connections from backup.${colors.reset}`);

    // Restart n8n
    console.log(`\n- Restarting n8n services to reload configuration...`);
    execSync(`docker restart n8n-autoscaling-n8n-webhook-1 n8n-autoscaling-n8n-1`);

    console.log(`\n${colors.green}${colors.bold}🎉 REVERT COMPLETED COMPLETED COMPLETED!${colors.reset}\n`);

  } catch (error) {
    console.error(`\n${colors.red}✖ Revert failed:${colors.reset}`, error.message);
  }
}

main();
