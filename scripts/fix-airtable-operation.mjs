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

const WORKFLOW_ID = 'AgmgY3RKpcafK4bb'; // Lovina 1

async function main() {
  console.log(`\n${colors.cyan}${colors.bold}⚙️ FIXING CREATE BOOKING ROW OPERATION VALUE TO 'create'...${colors.reset}\n`);

  try {
    // 1. Fetch current nodes and connections from database
    const query = `SELECT json_build_object('nodes', nodes, 'connections', connections) FROM workflow_entity WHERE id = '${WORKFLOW_ID}';`;
    const command = `docker exec -i n8n-autoscaling-postgres-1 psql -U postgres -d n8n -t -A -c "${query}"`;
    const rawJson = execSync(command).toString().trim();

    if (!rawJson || rawJson === "") {
      throw new Error(`Failed to fetch workflow Lovina 1`);
    }

    const workflow = JSON.parse(rawJson);
    let nodes = workflow.nodes;
    let updatedCount = 0;

    // 2. Find "Create Booking Row" and update operation to "create"
    nodes.forEach(node => {
      if (node.name === 'Create Booking Row' && node.type === 'n8n-nodes-base.airtable') {
        if (node.parameters && node.parameters.operation === 'append') {
          node.parameters.operation = 'create';
          console.log(`  - Changed operation from "append" to "create" for node "${node.name}"`);
          updatedCount++;
        }
      }
    });

    // 3. Write back to database if updated
    if (updatedCount > 0) {
      const nodesJsonStr = JSON.stringify(nodes).replace(/'/g, "''");
      const sqlFile = path.resolve(process.cwd(), `scripts/fix_operation.sql`);
      
      const sqlQuery = `
        UPDATE workflow_entity SET nodes = '${nodesJsonStr}'::jsonb WHERE id = '${WORKFLOW_ID}';
        UPDATE workflow_history SET nodes = '${nodesJsonStr}'::jsonb WHERE "versionId" = (SELECT "activeVersionId" FROM workflow_entity WHERE id = '${WORKFLOW_ID}');
      `;
      fs.writeFileSync(sqlFile, sqlQuery, 'utf8');

      execSync(`docker cp ${sqlFile} n8n-autoscaling-postgres-1:/tmp/fix_operation.sql`);
      execSync(`docker exec -i n8n-autoscaling-postgres-1 psql -U postgres -d n8n -f /tmp/fix_operation.sql`);
      fs.unlinkSync(sqlFile);
      
      console.log(`  ${colors.green}✔ Updated nodes in database.${colors.reset}`);
    } else {
      console.log(`  - Operation was already set to "create" or node not found.`);
    }

    // 4. Restart n8n webhook and editor
    console.log(`\n- Restarting n8n services to reload configuration...`);
    execSync(`docker restart n8n-autoscaling-n8n-webhook-1 n8n-autoscaling-n8n-1`);

    console.log(`\n${colors.green}${colors.bold}🎉 OPERATION VALUE FIX COMPLETED SUCCESSFULLY!${colors.reset}\n`);

  } catch (error) {
    console.error(`\n${colors.red}✖ Error: ${error.message}${colors.reset}\n`);
  }
}

main();
