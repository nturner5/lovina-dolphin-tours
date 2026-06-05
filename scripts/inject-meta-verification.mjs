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
  console.log(`\n${colors.cyan}${colors.bold}⚙ INJECTING META VERIFICATION NODES INTO N8N DATABASE...${colors.reset}\n`);

  try {
    // 1. Fetch current Lovina 2 nodes and connections from the database
    console.log(`- Fetching active workflow state from database container...`);
    const workflowDataRaw = execSync(`docker exec -i n8n-autoscaling-postgres-1 psql -U postgres -d n8n -t -c "SELECT row_to_json(w) FROM workflow_entity w WHERE id = '${WORKFLOW_ID}';"`);
    const workflow = JSON.parse(workflowDataRaw.toString().trim());

    let nodes = workflow.nodes;
    let connections = workflow.connections;

    console.log(`- Loaded active nodes count: ${nodes.length}`);

    // 2. Define the respond to webhook node and verify it is enabled
    // Find if "Respond to Webhook" already exists
    let respondNode = nodes.find(n => n.name === 'Respond to Webhook');
    if (respondNode) {
      console.log(`- Found existing 'Respond to Webhook' node. Enabling it...`);
      delete respondNode.disabled; // Remove disabled flag
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
      console.log(`- Creating new 'Respond to Webhook' node...`);
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
        id: "7989bed8-cf65-48f6-ac91-b55da51518c8",
        name: "Respond to Webhook",
        type: "n8n-nodes-base.respondToWebhook",
        typeVersion: 1.5,
        position: [-900, 384]
      };
      nodes.push(respondNode);
    }

    // 3. Create the Meta Callback Webhook (GET) trigger
    const getWebhookNodeId = "meta-callback-webhook-get";
    const getWebhookNodeName = "Meta Callback Webhook (GET)";

    // Remove if already exists to avoid duplicates
    nodes = nodes.filter(n => n.id !== getWebhookNodeId && n.name !== getWebhookNodeName);

    const getWebhookNode = {
      parameters: {
        httpMethod: "GET",
        path: "meta-whatsapp-callback",
        responseMode: "responseNode",
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
      id: getWebhookNodeId,
      name: getWebhookNodeName,
      type: "n8n-nodes-base.webhook",
      typeVersion: 1,
      position: [-1152, 384]
    };
    nodes.push(getWebhookNode);

    // 4. Update the connections map
    connections[getWebhookNodeName] = {
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

    console.log(`- Configured GET Webhook and connected to Responder node.`);

    // 5. Convert to clean single line strings for SQL injection
    const nodesJsonStr = JSON.stringify(nodes).replace(/'/g, "''");
    const connectionsJsonStr = JSON.stringify(connections).replace(/'/g, "''");

    // 6. Write temporary SQL file
    const sqlFile = path.resolve(process.cwd(), 'scripts/update_verification.sql');
    const sqlQuery = `UPDATE workflow_entity SET nodes = '${nodesJsonStr}'::jsonb, connections = '${connectionsJsonStr}'::jsonb WHERE id = '${WORKFLOW_ID}';`;
    fs.writeFileSync(sqlFile, sqlQuery, 'utf8');

    // 7. Inject and execute
    console.log(`- Copying SQL file to Postgres container...`);
    execSync(`docker cp ${sqlFile} n8n-autoscaling-postgres-1:/tmp/update_verification.sql`);

    console.log(`- Injecting database updates...`);
    const output = execSync(`docker exec -i n8n-autoscaling-postgres-1 psql -U postgres -d n8n -f /tmp/update_verification.sql`).toString();

    console.log(`\n${colors.green}${colors.bold}✔ VERIFICATION ROUTING INSTALLED SUCCESSFULLY!${colors.reset}`);
    console.log(`${colors.gray}Database Output: ${output.trim()}${colors.reset}`);

    // Clean up
    fs.unlinkSync(sqlFile);

    // Restart n8n container to reload memory cache
    console.log(`- Restarting n8n container to apply changes...`);
    execSync(`docker restart n8n-autoscaling-n8n-1`);
    console.log(`${colors.green}✔ n8n container restarted successfully.${colors.reset}`);

  } catch (error) {
    console.error(`${colors.red}✖ Error executing script: ${error.message}${colors.reset}`);
  }
}

main();
