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

const WORKFLOW_ID = 'yKfMVXPuEPaBUwrh'; // Lovina 2
const currentNodesPath = path.resolve(process.cwd(), 'scripts/lovina_2_nodes_current.json');

async function main() {
  console.log(`\n${colors.cyan}${colors.bold}🔧 RESTORING CORRECT PRODUCTION ROUTING NODES AND CONNECTIONS...${colors.reset}\n`);

  try {
    if (!fs.existsSync(currentNodesPath)) {
      throw new Error("Current nodes backup file scripts/lovina_2_nodes_current.json is missing.");
    }

    // 1. Read current nodes list
    const nodes = JSON.parse(fs.readFileSync(currentNodesPath, 'utf8'));

    // 2. Ensure Meta Callback Webhook is set to POST and responseMode is deleted (responds immediately)
    const mainWebhook = nodes.find(n => n.name === 'Meta Callback Webhook');
    if (!mainWebhook) {
      throw new Error("Could not find 'Meta Callback Webhook' node in backup.");
    }
    mainWebhook.parameters.httpMethod = "POST";
    delete mainWebhook.parameters.responseMode;
    console.log(`- Configured 'Meta Callback Webhook' to POST (OnReceived response mode).`);

    // 3. Disable Respond to Webhook node
    const respondNode = nodes.find(n => n.name === 'Respond to Webhook');
    if (respondNode) {
      respondNode.disabled = true;
      console.log(`- Disabled 'Respond to Webhook' node.`);
    }

    // 4. Define the correct production connections mapping
    const connections = {
      "Meta Callback Webhook": {
        "main": [
          [
            {
              "node": "Parse Payload Data",
              "type": "main",
              "index": 0
            }
          ]
        ]
      },
      "Parse Payload Data": {
        "main": [
          [
            {
              "node": "Is Captain Action?",
              "type": "main",
              "index": 0
            }
          ]
        ]
      },
      "Is Captain Action?": {
        "main": [
          [
            {
              "node": "Check Current Assignment",
              "type": "main",
              "index": 0
            }
          ],
          [
            {
              "node": "Forward to Chatwoot",
              "type": "main",
              "index": 0
            }
          ]
        ]
      },
      "Check Current Assignment": {
        "main": [
          [
            {
              "node": "Is Still Unassigned?",
              "type": "main",
              "index": 0
            }
          ]
        ]
      },
      "Is Still Unassigned?": {
        "main": [
          [
            {
              "node": "Assign Captain in Sheets",
              "type": "main",
              "index": 0
            }
          ],
          [
            {
              "node": "Send Missed Template Alert",
              "type": "main",
              "index": 0
            }
          ]
        ]
      },
      "Assign Captain in Sheets": {
        "main": [
          [
            {
              "node": "Send Private Agreement Link",
              "type": "main",
              "index": 0
            }
          ]
        ]
      }
    };
    console.log(`- Mapped correct connections logic.`);

    // 5. Convert to clean single line strings for SQL injection
    const nodesJsonStr = JSON.stringify(nodes).replace(/'/g, "''");
    const connectionsJsonStr = JSON.stringify(connections).replace(/'/g, "''");

    // 6. Write temporary SQL file
    const sqlFile = path.resolve(process.cwd(), 'scripts/restore_production.sql');
    const sqlQuery = `
      UPDATE workflow_entity SET nodes = '${nodesJsonStr}'::jsonb, connections = '${connectionsJsonStr}'::jsonb WHERE id = '${WORKFLOW_ID}';
      UPDATE workflow_history SET nodes = '${nodesJsonStr}'::jsonb, connections = '${connectionsJsonStr}'::jsonb WHERE "versionId" = (SELECT "activeVersionId" FROM workflow_entity WHERE id = '${WORKFLOW_ID}');
      DELETE FROM webhook_entity WHERE "webhookPath" = 'meta-whatsapp-callback' AND method = 'GET';
      INSERT INTO webhook_entity ("workflowId", "webhookPath", method, node) VALUES ('${WORKFLOW_ID}', 'meta-whatsapp-callback', 'POST', 'Meta Callback Webhook') ON CONFLICT DO NOTHING;
      UPDATE webhook_entity SET method = 'POST' WHERE "webhookPath" = 'meta-whatsapp-callback';
    `;
    fs.writeFileSync(sqlFile, sqlQuery, 'utf8');

    // 7. Inject and execute inside the Postgres container
    console.log(`- Copying SQL file to Postgres container...`);
    execSync(`docker cp ${sqlFile} n8n-autoscaling-postgres-1:/tmp/restore_production.sql`);

    console.log(`- Executing database updates...`);
    const output = execSync(`docker exec -i n8n-autoscaling-postgres-1 psql -U postgres -d n8n -f /tmp/restore_production.sql`).toString();
    console.log(`${output.trim()}`);

    fs.unlinkSync(sqlFile);

    // 8. Restart n8n webhook and editor to load configuration
    console.log(`- Restarting n8n services to reload configuration...`);
    execSync(`docker restart n8n-autoscaling-n8n-webhook-1 n8n-autoscaling-n8n-1`);

    console.log(`\n${colors.green}${colors.bold}✔ PRODUCTION WORKFLOW ROUTING RESTORED SUCCESSFULLY WITH CORRECT NODES!${colors.reset}\n`);

  } catch (error) {
    console.error(`${colors.red}✖ Error: ${error.message}${colors.reset}`);
  }
}

main();
