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
const backupNodesPath = path.resolve(process.cwd(), 'scripts/lovina_2_nodes.json');
const backupConnsPath = path.resolve(process.cwd(), 'scripts/lovina_2_connections.json');

async function main() {
  console.log(`\n${colors.cyan}${colors.bold}🧹 RESETTING AND ENABLING CLEAN GET VERIFICATION ENDPOINT...${colors.reset}\n`);

  try {
    if (!fs.existsSync(backupNodesPath) || !fs.existsSync(backupConnsPath)) {
      throw new Error("Backup files are missing. Cannot safely restore.");
    }

    // 1. Read clean backup data
    const nodes = JSON.parse(fs.readFileSync(backupNodesPath, 'utf8'));
    const connections = JSON.parse(fs.readFileSync(backupConnsPath, 'utf8'));

    // 2. Change the main Webhook node to GET in the nodes list
    const mainWebhook = nodes.find(n => n.name === 'Meta Callback Webhook');
    if (!mainWebhook) {
      throw new Error("Could not find 'Meta Callback Webhook' in backup.");
    }
    mainWebhook.parameters.httpMethod = "GET";
    mainWebhook.parameters.responseMode = "responseNode";

    // 3. Configure and enable the Respond to Webhook node
    let respondNode = nodes.find(n => n.name === 'Respond to Webhook');
    if (respondNode) {
      delete respondNode.disabled;
      respondNode.parameters = {
        respondWith: "text",
        responseBody: "={{ $json.query['hub.challenge'] || $json.query.hub_challenge }}",
        options: {
          responseHeaders: {
            entries: [
              {
                name: "Content-Type",
                value: "text/plain"
              }
            ]
          }
        }
      };
    } else {
      respondNode = {
        parameters: {
          respondWith: "text",
          responseBody: "={{ $json.query['hub.challenge'] || $json.query.hub_challenge }}",
          options: {
            responseHeaders: {
              entries: [
                {
                  name: "Content-Type",
                  value: "text/plain"
                }
              ]
            }
          }
        },
        id: "7989bed8-cf65-48f6-ac91-b055da51518c",
        name: "Respond to Webhook",
        type: "n8n-nodes-base.respondToWebhook",
        typeVersion: 1.5,
        position: [-900, 384]
      };
      nodes.push(respondNode);
    }

    // 4. Connect Webhook directly to Respond to Webhook in connections
    connections["Meta Callback Webhook"] = {
      main: [
        [
          {
            node: "Respond to Webhook",
            type: "main",
            index: 0
          }
        ]
      ]
    };

    console.log(`- Webhook node and connections re-aligned from original backup.`);

    // 5. Save nodes and connections JSON strings
    const nodesJsonStr = JSON.stringify(nodes).replace(/'/g, "''");
    const connectionsJsonStr = JSON.stringify(connections).replace(/'/g, "''");

    // 6. Write temporary SQL file
    const sqlFile = path.resolve(process.cwd(), 'scripts/reset_verification.sql');
    const sqlQuery = `
      UPDATE workflow_entity SET nodes = '${nodesJsonStr}'::jsonb, connections = '${connectionsJsonStr}'::jsonb WHERE id = '${WORKFLOW_ID}';
      UPDATE workflow_history SET nodes = '${nodesJsonStr}'::jsonb, connections = '${connectionsJsonStr}'::jsonb WHERE "versionId" = (SELECT "activeVersionId" FROM workflow_entity WHERE id = '${WORKFLOW_ID}');
      DELETE FROM webhook_entity WHERE "webhookPath" = 'meta-whatsapp-callback' AND method = 'POST';
      INSERT INTO webhook_entity ("workflowId", "webhookPath", method, node) VALUES ('${WORKFLOW_ID}', 'meta-whatsapp-callback', 'GET', 'Meta Callback Webhook') ON CONFLICT DO NOTHING;
      UPDATE webhook_entity SET method = 'GET' WHERE "webhookPath" = 'meta-whatsapp-callback';
    `;
    fs.writeFileSync(sqlFile, sqlQuery, 'utf8');

    // 7. Inject and execute inside the Postgres container
    console.log(`- Copying SQL file to Postgres container...`);
    execSync(`docker cp ${sqlFile} n8n-autoscaling-postgres-1:/tmp/reset_verification.sql`);

    console.log(`- Executing reset database query...`);
    const output = execSync(`docker exec -i n8n-autoscaling-postgres-1 psql -U postgres -d n8n -f /tmp/reset_verification.sql`).toString();
    console.log(`${colors.gray}Database Output: ${output.trim()}${colors.reset}`);

    fs.unlinkSync(sqlFile);

    // 8. Restart n8n webhook and editor to load clean configuration
    console.log(`- Restarting n8n services to reload configuration...`);
    execSync(`docker restart n8n-autoscaling-n8n-webhook-1 n8n-autoscaling-n8n-1`);

    console.log(`\n${colors.green}${colors.bold}✔ CLEAN GET VERIFICATION ENDPOINT ACTIVE!${colors.reset}`);

  } catch (error) {
    console.error(`${colors.red}✖ Error: ${error.message}${colors.reset}`);
  }
}

main();
