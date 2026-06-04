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

const SERVICE_ACCOUNT_CREDENTIALS = {
  googleApi: {
    id: 'sbGQO3EVaJKmAFxd',
    name: 'Google Sheets account 2'
  }
};

async function main() {
  console.log(`\n${colors.cyan}${colors.bold}🔧 MIGRATING ALL GOOGLE SHEETS NODES TO SERVICE ACCOUNT & RESTORING LOGIC...${colors.reset}\n`);

  try {
    for (const [name, id] of Object.entries(WORKFLOW_IDS)) {
      console.log(`Processing ${name} (ID: ${id})...`);

      // 1. Fetch current nodes and connections from Postgres
      const query = `SELECT json_build_object('nodes', nodes, 'connections', connections) FROM workflow_entity WHERE id = '${id}';`;
      const command = `docker exec -i n8n-autoscaling-postgres-1 psql -U postgres -d n8n -t -A -c "${query}"`;
      const rawJson = execSync(command).toString().trim();

      if (!rawJson || rawJson === "") {
        throw new Error(`Failed to fetch workflow ${name}`);
      }

      const workflow = JSON.parse(rawJson);
      const nodes = workflow.nodes;
      let updatedCount = 0;

      // 2. Loop through nodes and migrate Google Sheets
      for (const node of nodes) {
        if (node.type === 'n8n-nodes-base.googleSheets') {
          console.log(`  - Found Sheets node: "${node.name}"`);
          
          // Switch credentials to Service Account type (googleApi)
          node.credentials = { ...SERVICE_ACCOUNT_CREDENTIALS };
          
          // Ensure authentication parameter in parameters is set to serviceAccount
          if (!node.parameters) {
            node.parameters = {};
          }
          node.parameters.authentication = 'serviceAccount';

          // Specially restore erased logic for "Get Guest & Stripe Details"
          if (node.name === 'Get Guest & Stripe Details') {
            console.log(`    ⚠️ RESTORING ERASED LOGIC for "Get Guest & Stripe Details"...`);
            node.parameters = {
              authentication: 'serviceAccount',
              options: {},
              filtersUI: {
                values: [
                  {
                    lookupValue: '={{ $json.body.bookingId }}',
                    lookupColumn: 'BookingCode'
                  }
                ]
              },
              sheetName: {
                __rl: true,
                mode: 'list',
                value: 1618477771
              },
              documentId: {
                __rl: true,
                mode: 'list',
                value: '1r3dhgV_Du2wFK8hqOr_lZexS-wrxI9Xv6QQiyr2APd8'
              }
            };
          }

          // Specially restore erased logic for "Check Current Assignment"
          if (node.name === 'Check Current Assignment') {
            console.log(`    ⚠️ RESTORING ERASED LOGIC for "Check Current Assignment"...`);
            node.parameters = {
              authentication: 'serviceAccount',
              options: {},
              filtersUI: {
                values: [
                  {
                    lookupValue: '={{ $json.bookingCode }}',
                    lookupColumn: 'BookingCode'
                  }
                ]
              },
              sheetName: {
                __rl: true,
                mode: 'list',
                value: 1618477771
              },
              documentId: {
                __rl: true,
                mode: 'list',
                value: '1r3dhgV_Du2wFK8hqOr_lZexS-wrxI9Xv6QQiyr2APd8'
              }
            };
          }

          // Specially restore erased logic for "Assign Captain in Sheets"
          if (node.name === 'Assign Captain in Sheets') {
            console.log(`    ⚠️ RESTORING ERASED LOGIC for "Assign Captain in Sheets"...`);
            node.parameters = {
              authentication: 'serviceAccount',
              options: {},
              fieldsUi: {
                values: [
                  {
                    column: 'AssignedCaptain',
                    fieldValue: "={{ $('Parse Payload Data').item.json.captainName }}"
                  },
                  {
                    column: 'CaptainPhone',
                    fieldValue: "={{ $('Parse Payload Data').item.json.captainPhone }}"
                  }
                ]
              },
              operation: 'update',
              sheetName: {
                __rl: true,
                mode: 'list',
                value: 1618477771
              },
              documentId: {
                __rl: true,
                mode: 'list',
                value: '1r3dhgV_Du2wFK8hqOr_lZexS-wrxI9Xv6QQiyr2APd8'
              },
              valueToMatchOn: "={{ $('Parse Payload Data').item.json.bookingCode }}",
              columnToMatchOn: 'BookingCode'
            };
          }

          updatedCount++;
        }
      }

      // 3. Write back to database if updated
      if (updatedCount > 0) {
        const nodesJsonStr = JSON.stringify(nodes).replace(/'/g, "''");
        const sqlFile = path.resolve(process.cwd(), `scripts/update_${name}.sql`);
        
        const sqlQuery = `
          UPDATE workflow_entity SET nodes = '${nodesJsonStr}'::jsonb WHERE id = '${id}';
          UPDATE workflow_history SET nodes = '${nodesJsonStr}'::jsonb WHERE "versionId" = (SELECT "activeVersionId" FROM workflow_entity WHERE id = '${id}');
        `;
        fs.writeFileSync(sqlFile, sqlQuery, 'utf8');

        execSync(`docker cp ${sqlFile} n8n-autoscaling-postgres-1:/tmp/update_${name}.sql`);
        execSync(`docker exec -i n8n-autoscaling-postgres-1 psql -U postgres -d n8n -f /tmp/update_${name}.sql`);
        fs.unlinkSync(sqlFile);
        
        console.log(`  ${colors.green}✔ Updated ${updatedCount} Sheets nodes in database.${colors.reset}`);
      } else {
        console.log(`  - No Sheets nodes updated.`);
      }
    }

    // 4. Restart n8n webhook and editor
    console.log(`\n- Restarting n8n services to reload configuration...`);
    execSync(`docker restart n8n-autoscaling-n8n-webhook-1 n8n-autoscaling-n8n-1`);

    console.log(`\n${colors.green}${colors.bold}🎉 ALL GOOGLE SHEETS NODES SUCCESSFULLY CONVERTED TO SERVICE ACCOUNT!${colors.reset}\n`);

  } catch (error) {
    console.error(`\n${colors.red}✖ Error: ${error.message}${colors.reset}\n`);
  }
}

main();
