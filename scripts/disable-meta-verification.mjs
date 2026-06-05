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
  console.log(`\n${colors.cyan}${colors.bold}🔒 RESTORING POST WEBHOOK ROUTING FOR INCOMING MESSAGES...${colors.reset}\n`);

  try {
    // 1. Fetch current Lovina 2 nodes and connections from the database
    const workflowDataRaw = execSync(`docker exec -i n8n-autoscaling-postgres-1 psql -U postgres -d n8n -t -c "SELECT row_to_json(w) FROM workflow_entity w WHERE id = '${WORKFLOW_ID}';"`);
    const workflow = JSON.parse(workflowDataRaw.toString().trim());

    let nodes = workflow.nodes;
    let connections = workflow.connections;

    // 2. Change the main Webhook node back to POST
    const mainWebhook = nodes.find(n => n.name === 'Meta Callback Webhook');
    if (!mainWebhook) {
      throw new Error("Could not find 'Meta Callback Webhook' node in workflow.");
    }
    mainWebhook.parameters.httpMethod = "POST";
    delete mainWebhook.parameters.responseMode;
    console.log(`- Restored 'Meta Callback Webhook' method to POST.`);

    // 3. Disable Respond to Webhook node
    let respondNode = nodes.find(n => n.name === 'Respond to Webhook');
    if (respondNode) {
      respondNode.disabled = true;
      console.log(`- Disabled 'Respond to Webhook' node.`);
    }

    // 4. Restore connection from Webhook to Is Captain Action?
    connections["Meta Callback Webhook"] = {
      main: [
        [
          {
            node: "Is Captain Action?",
            type: "main",
            index: 0
          }
        ]
      ]
    };
    console.log(`- Reconnected 'Meta Callback Webhook' output to 'Is Captain Action?'.`);

    // 5. Convert to clean single line strings for SQL injection
    const nodesJsonStr = JSON.stringify(nodes).replace(/'/g, "''");
    const connectionsJsonStr = JSON.stringify(connections).replace(/'/g, "''");

    // 6. Write temporary SQL file
    const sqlFile = path.resolve(process.cwd(), 'scripts/disable_verif.sql');
    const sqlQuery = `
      UPDATE workflow_entity SET nodes = '${nodesJsonStr}'::jsonb, connections = '${connectionsJsonStr}'::jsonb WHERE id = '${WORKFLOW_ID}';
      UPDATE workflow_history SET nodes = '${nodesJsonStr}'::jsonb, connections = '${connectionsJsonStr}'::jsonb WHERE "versionId" = (SELECT "activeVersionId" FROM workflow_entity WHERE id = '${WORKFLOW_ID}');
      DELETE FROM webhook_entity WHERE "webhookPath" = 'meta-whatsapp-callback' AND method = 'GET';
      INSERT INTO webhook_entity ("workflowId", "webhookPath", method, node) VALUES ('${WORKFLOW_ID}', 'meta-whatsapp-callback', 'POST', 'Meta Callback Webhook') ON CONFLICT DO NOTHING;
      UPDATE webhook_entity SET method = 'POST' WHERE "webhookPath" = 'meta-whatsapp-callback';
    `;
    fs.writeFileSync(sqlFile, sqlQuery, 'utf8');

    // 7. Inject and execute
    execSync(`docker cp ${sqlFile} n8n-autoscaling-postgres-1:/tmp/disable_verif.sql`);
    execSync(`docker exec -i n8n-autoscaling-postgres-1 psql -U postgres -d n8n -f /tmp/disable_verif.sql`);
    fs.unlinkSync(sqlFile);

    // Restart n8n webhook and editor to reload cache
    console.log(`- Restarting n8n services to reload configuration...`);
    execSync(`docker restart n8n-autoscaling-n8n-webhook-1 n8n-autoscaling-n8n-1`);

    console.log(`\n${colors.green}${colors.bold}✔ POST WEBHOOK ROUTING RESTORED SUCCESSFULLY!${colors.reset}`);
    console.log(`\n${colors.bold}💡 NEXT STEPS:${colors.reset}`);
    console.log(`1. Test the 'claim trip' click on your device.`);
    console.log(`2. Verify that webhooks now flow directly into n8n and Google Sheets!`);

  } catch (error) {
    console.error(`${colors.red}✖ Error: ${error.message}${colors.reset}`);
  }
}

main();
