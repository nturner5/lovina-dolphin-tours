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

const WORKFLOW_IDS = {
  Lovina1: 'AgmgY3RKpcafK4bb',
  Lovina2: 'yKfMVXPuEPaBUwrh',
  Lovina3: 'FXts3OY9D5wZr0PC'
};

async function main() {
  console.log(`\n${colors.cyan}${colors.bold}⚙️ ENABLING TYPECAST OPTION ON ALL WRITE/UPDATE AIRTABLE NODES...${colors.reset}\n`);

  try {
    for (const [name, id] of Object.entries(WORKFLOW_IDS)) {
      console.log(`Processing ${name} (ID: ${id})...`);

      // 1. Fetch current nodes and connections from database
      const query = `SELECT json_build_object('nodes', nodes, 'connections', connections) FROM workflow_entity WHERE id = '${id}';`;
      const command = `docker exec -i n8n-autoscaling-postgres-1 psql -U postgres -d n8n -t -A -c "${query}"`;
      const rawJson = execSync(command).toString().trim();

      if (!rawJson || rawJson === "") {
        throw new Error(`Failed to fetch workflow ${name}`);
      }

      const workflow = JSON.parse(rawJson);
      let nodes = workflow.nodes;
      let updatedCount = 0;

      // 2. Scan nodes and enable typecast for write/update operations
      nodes.forEach(node => {
        if (node.type === 'n8n-nodes-base.airtable') {
          if (node.parameters && ['create', 'update', 'append'].includes(node.parameters.operation)) {
            if (!node.parameters.options) {
              node.parameters.options = {};
            }
            node.parameters.options.typecast = true;
            console.log(`  - Enabled typecast option in node: "${node.name}"`);
            updatedCount++;
          }
        }
      });

      // 3. Write back to database if updated
      if (updatedCount > 0) {
        const nodesJsonStr = JSON.stringify(nodes).replace(/'/g, "''");
        const sqlFile = path.resolve(process.cwd(), `scripts/typecast_${name}.sql`);
        
        const sqlQuery = `
          UPDATE workflow_entity SET nodes = '${nodesJsonStr}'::jsonb WHERE id = '${id}';
          UPDATE workflow_history SET nodes = '${nodesJsonStr}'::jsonb WHERE "versionId" = (SELECT "activeVersionId" FROM workflow_entity WHERE id = '${id}');
        `;
        fs.writeFileSync(sqlFile, sqlQuery, 'utf8');

        execSync(`docker cp ${sqlFile} n8n-autoscaling-postgres-1:/tmp/typecast_${name}.sql`);
        execSync(`docker exec -i n8n-autoscaling-postgres-1 psql -U postgres -d n8n -f /tmp/typecast_${name}.sql`);
        fs.unlinkSync(sqlFile);
        
        console.log(`  ${colors.green}✔ Updated ${updatedCount} nodes in database.${colors.reset}`);
      } else {
        console.log(`  - No nodes required typecast option update.`);
      }
    }

    // 4. Restart n8n webhook and editor
    console.log(`\n- Restarting n8n services to reload configuration...`);
    execSync(`docker restart n8n-autoscaling-n8n-webhook-1 n8n-autoscaling-n8n-1`);

    console.log(`\n${colors.green}${colors.bold}🎉 TYPECAST OPTION CONFIGURED SUCCESSFULLY IN DATABASE!${colors.reset}\n`);

  } catch (error) {
    console.error(`\n${colors.red}✖ Error: ${error.message}${colors.reset}\n`);
  }
}

main();
