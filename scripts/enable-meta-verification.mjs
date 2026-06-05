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

async function main() {
  console.log(`\n${colors.cyan}${colors.bold}🔓 TEMPORARILY ENABLING META VERIFICATION ROUTING...${colors.reset}\n`);

  try {
    // 1. Fetch current Lovina 2 nodes and connections from the database
    const workflowDataRaw = execSync(`docker exec -i n8n-autoscaling-postgres-1 psql -U postgres -d n8n -t -c "SELECT row_to_json(w) FROM workflow_entity w WHERE id = '${WORKFLOW_ID}';"`);
    const workflow = JSON.parse(workflowDataRaw.toString().trim());

    let nodes = workflow.nodes;
    let connections = workflow.connections;

    // 2. Change the main Webhook node to GET
    const mainWebhook = nodes.find(n => n.name === 'Meta Callback Webhook');
    if (!mainWebhook) {
      throw new Error("Could not find 'Meta Callback Webhook' node in workflow.");
    }
    mainWebhook.parameters.httpMethod = "GET";
    mainWebhook.parameters.responseMode = "responseNode";
    console.log(`- Changed 'Meta Callback Webhook' method to GET.`);

    // 3. Enable and configure Respond to Webhook node
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
    console.log(`- Configured and enabled 'Respond to Webhook' node.`);

    // 4. Temporarily connect Webhook directly to Responder node
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
    console.log(`- Rewired 'Meta Callback Webhook' output directly to 'Respond to Webhook'.`);

    // 5. Convert to clean single line strings for SQL injection
    const nodesJsonStr = JSON.stringify(nodes).replace(/'/g, "''");
    const connectionsJsonStr = JSON.stringify(connections).replace(/'/g, "''");

    // 6. Write temporary SQL file
    const sqlFile = path.resolve(process.cwd(), 'scripts/enable_verif.sql');
    const sqlQuery = `
      UPDATE workflow_entity SET nodes = '${nodesJsonStr}'::jsonb, connections = '${connectionsJsonStr}'::jsonb WHERE id = '${WORKFLOW_ID}';
      UPDATE workflow_history SET nodes = '${nodesJsonStr}'::jsonb, connections = '${connectionsJsonStr}'::jsonb WHERE "versionId" = (SELECT "activeVersionId" FROM workflow_entity WHERE id = '${WORKFLOW_ID}');
      DELETE FROM webhook_entity WHERE "webhookPath" = 'meta-whatsapp-callback' AND method = 'POST';
      INSERT INTO webhook_entity ("workflowId", "webhookPath", method, node) VALUES ('${WORKFLOW_ID}', 'meta-whatsapp-callback', 'GET', 'Meta Callback Webhook') ON CONFLICT DO NOTHING;
      UPDATE webhook_entity SET method = 'GET' WHERE "webhookPath" = 'meta-whatsapp-callback';
    `;
    fs.writeFileSync(sqlFile, sqlQuery, 'utf8');

    // 7. Inject and execute
    execSync(`docker cp ${sqlFile} n8n-autoscaling-postgres-1:/tmp/enable_verif.sql`);
    execSync(`docker exec -i n8n-autoscaling-postgres-1 psql -U postgres -d n8n -f /tmp/enable_verif.sql`);
    fs.unlinkSync(sqlFile);

    // Restart n8n webhook and editor to reload cache
    console.log(`- Restarting n8n services to reload configuration...`);
    execSync(`docker restart n8n-autoscaling-n8n-webhook-1 n8n-autoscaling-n8n-1`);

    console.log(`\n${colors.green}${colors.bold}✔ GET VERIFICATION ENDPOINT IS NOW ACTIVE!${colors.reset}`);
    console.log(`\n${colors.bold}💡 NEXT STEPS:${colors.reset}`);
    console.log(`1. Go to Meta Developer Console -> WhatsApp -> Configuration.`);
    console.log(`2. Paste your Callback URL and Verify Token, then click 'Verify and Save'.`);
    console.log(`3. Once verification succeeds, let me know and we will restore the POST handler!`);

  } catch (error) {
    console.error(`${colors.red}✖ Error: ${error.message}${colors.reset}`);
  }
}

main();
