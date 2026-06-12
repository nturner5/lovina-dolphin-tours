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

const WORKFLOW_ID = process.env.PRODUCTION === 'true' ? 'BksrAXQCChEmzwIV' : 'yKfMVXPuEPaBUwrh'; // Production or Sandbox Lovina 2

const nodesPath = path.resolve(process.cwd(), 'scripts/lovina_2_nodes.json');
const connectionsPath = path.resolve(process.cwd(), 'scripts/lovina_2_connections.json');

async function main() {
  console.log(`\n${colors.cyan}${colors.bold}⚙ INJECTING CHATWOOT ROUTER INTO N8N DATABASE...${colors.reset}\n`);

  if (!fs.existsSync(nodesPath) || !fs.existsSync(connectionsPath)) {
    console.error(`${colors.red}✖ Error: Required backup files are missing! Run the export first.${colors.reset}`);
    process.exit(1);
  }

  // 1. Read existing configurations
  const nodes = JSON.parse(fs.readFileSync(nodesPath, 'utf8'));
  const connections = JSON.parse(fs.readFileSync(connectionsPath, 'utf8'));

  console.log(`- Loaded ${nodes.length} nodes and connection map.`);

  // 2. Remove existing instances of our new nodes if they exist (to avoid duplicates)
  const filteredNodes = nodes.filter(n => n.id !== 'Is Captain Action?' && n.id !== 'Forward to Chatwoot');

  // 3. Define the new nodes to insert
  const ifNode = {
    parameters: {
      conditions: {
        string: [
          {
            value1: "={{ ($json.entry || $json.body?.entry || $json.body?.body?.entry)?.[0]?.changes?.[0]?.value?.messages?.[0]?.button?.payload }}",
            operation: "startsWith",
            value2: "claim_"
          }
        ]
      }
    },
    id: "Is Captain Action?",
    name: "Is Captain Action?",
    type: "n8n-nodes-base.if",
    typeVersion: 1,
    position: [-928, 96]
  };

  const chatwootNode = {
    parameters: {
      method: "POST",
      url: "https://app.chatwoot.com/webhooks/whatsapp/+18018556266",
      sendHeaders: true,
      headerParameters: {
        parameters: [
          {
            name: "Content-Type",
            "value": "application/json"
          }
        ]
      },
      sendBody: true,
      specifyBody: "json",
      jsonBody: "={{ JSON.stringify($json.body || $json) }}",
      options: {}
    },
    id: "Forward to Chatwoot",
    name: "Forward to Chatwoot",
    type: "n8n-nodes-base.httpRequest",
    typeVersion: 4.1,
    position: [-700, 250]
  };

  // Add the nodes to our list
  filteredNodes.push(ifNode);
  filteredNodes.push(chatwootNode);

  // 4. Update the connections map
  // Route Webhook trigger to the IF node
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

  // Connect the IF node outputs (true -> Parse Payload, false -> Forward to Chatwoot)
  connections["Is Captain Action?"] = {
    main: [
      [
        {
          node: "Parse Payload Data",
          type: "main",
          index: 0
        }
      ],
      [
        {
          node: "Forward to Chatwoot",
          type: "main",
          index: 0
        }
      ]
    ]
  };

  // Chatwoot HTTP node has no output connections
  connections["Forward to Chatwoot"] = {
    main: []
  };

  console.log(`- Nodes configured. Connections rewired successfully.`);

  // 5. Convert to clean single line strings for raw SQL injection
  const nodesJsonStr = JSON.stringify(filteredNodes).replace(/'/g, "''");
  const connectionsJsonStr = JSON.stringify(connections).replace(/'/g, "''");

  // 6. Write a temporary SQL file to avoid command length limitations
  const sqlFile = path.resolve(process.cwd(), 'scripts/update_workflow.sql');
  const isProduction = process.env.PRODUCTION === 'true';

  let sqlQuery = '';
  if (isProduction) {
    sqlQuery = `
      -- Update workflow_entity in SQLite
      UPDATE workflow_entity 
      SET 
        nodes = '${nodesJsonStr}', 
        connections = '${connectionsJsonStr}', 
        "updatedAt" = datetime('now') 
      WHERE id = '${WORKFLOW_ID}';

      -- Update workflow_history in SQLite for latest version
      UPDATE workflow_history
      SET
        nodes = '${nodesJsonStr}',
        connections = '${connectionsJsonStr}',
        "updatedAt" = datetime('now')
      WHERE "workflowId" = '${WORKFLOW_ID}' AND "versionId" = (SELECT "versionId" FROM workflow_entity WHERE id = '${WORKFLOW_ID}');
    `;
  } else {
    sqlQuery = `UPDATE workflow_entity SET nodes = '${nodesJsonStr}'::jsonb, connections = '${connectionsJsonStr}'::jsonb WHERE id = '${WORKFLOW_ID}';`;
  }
  
  fs.writeFileSync(sqlFile, sqlQuery, 'utf8');
  console.log(`- Generated database injection payload (${isProduction ? 'SQLite' : 'PostgreSQL'}).`);

  // 7. Inject the SQL query directly
  try {
    if (isProduction) {
      console.log(`- Copying SQL script to hosted VM (n8n-server)...`);
      execSync(`gcloud compute scp ${sqlFile} n8n-server:/tmp/update_workflow.sql --zone=us-central1-a`);

      console.log(`- Executing update inside SQLite database on VM...`);
      const sqlCommand = `sudo sqlite3 /var/lib/docker/volumes/n8n-docker_n8n_data/_data/database.sqlite < /tmp/update_workflow.sql`;
      execSync(`gcloud compute ssh n8n-server --zone=us-central1-a --command="${sqlCommand}"`);
      
      console.log(`- Restarting hosted n8n service to reload workflows...`);
      execSync(`gcloud compute ssh n8n-server --zone=us-central1-a --command="sudo docker restart n8n-docker-n8n-1"`);

      console.log(`\n${colors.green}${colors.bold}✔ PRODUCTION UPDATE COMPLETED SUCCESSFULLY!${colors.reset}`);
    } else {
      console.log(`- Executing update inside PostgreSQL container (n8n-autoscaling-postgres-1)...`);
      execSync(`docker cp ${sqlFile} n8n-autoscaling-postgres-1:/tmp/update_workflow.sql`);
      const output = execSync(`docker exec -i n8n-autoscaling-postgres-1 psql -U postgres -d n8n -f /tmp/update_workflow.sql`).toString();
      console.log(`\n${colors.green}${colors.bold}✔ LOCAL UPDATE COMPLETED SUCCESSFULLY!${colors.reset}`);
      console.log(`${colors.gray}Database Output: ${output.trim()}${colors.reset}`);
    }

    console.log(`\n${colors.bold}💡 WHAT TO DO NEXT:${colors.reset}`);
    console.log(`1. Go to your n8n browser tab and simply refresh the page.`);
    console.log(`2. Open the ${colors.cyan}Lovina 2: Bidding Claim & Contract Request${colors.reset} workflow.`);
    console.log(`3. You will see the new nodes perfectly wired and positioned!`);
  } catch (error) {
    console.error(`\n${colors.red}✖ Failed to update database:${colors.reset}`, error.message);
  } finally {
    // Clean up temporary sql file
    if (fs.existsSync(sqlFile)) {
      fs.unlinkSync(sqlFile);
    }
    if (isProduction) {
      try {
        execSync(`gcloud compute ssh n8n-server --zone=us-central1-a --command="sudo rm -f /tmp/update_workflow.sql"`);
      } catch (e) {
        // Ignore
      }
    }
  }
}

main();
