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
      url: "https://app.chatwoot.com/webhooks/whatsapp/+6285190422839",
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
  const sqlQuery = `UPDATE workflow_entity SET nodes = '${nodesJsonStr}'::jsonb, connections = '${connectionsJsonStr}'::jsonb WHERE id = '${WORKFLOW_ID}';`;
  fs.writeFileSync(sqlFile, sqlQuery, 'utf8');

  console.log(`- Generated database injection payload.`);

  // 7. Inject the SQL query directly into the Postgres Docker container!
  try {
    console.log(`- Executing update inside PostgreSQL container (n8n-autoscaling-postgres-1)...`);
    
    // Copy the SQL file into the container
    execSync(`docker cp ${sqlFile} n8n-autoscaling-postgres-1:/tmp/update_workflow.sql`);
    
    // Run the SQL script inside the Postgres container
    const output = execSync(`docker exec -i n8n-autoscaling-postgres-1 psql -U postgres -d n8n -f /tmp/update_workflow.sql`).toString();
    
    console.log(`\n${colors.green}${colors.bold}✔ UPDATE COMPLETED SUCCESSFULLY!${colors.reset}`);
    console.log(`${colors.gray}Database Output: ${output.trim()}${colors.reset}`);
    console.log(`\n${colors.bold}💡 WHAT TO DO NEXT:${colors.reset}`);
    console.log(`1. Go to your n8n browser tab and simply refresh the page.`);
    console.log(`2. Open the ${colors.cyan}Lovina 2: Bidding Claim & Contract Request${colors.reset} workflow.`);
    console.log(`3. You will see the new nodes perfectly wired and positioned!`);
    console.log(`4. Double click ${colors.bold}Forward to Chatwoot${colors.reset} and paste your specific Chatwoot Webhook URL.`);
  } catch (error) {
    console.error(`\n${colors.red}✖ Failed to update database container:${colors.reset}`, error.message);
  } finally {
    // Clean up temporary sql file
    if (fs.existsSync(sqlFile)) fs.unlinkSync(sqlFile);
  }
}

main();
