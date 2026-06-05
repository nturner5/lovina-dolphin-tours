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

async function main() {
  console.log(`\n${colors.cyan}${colors.bold}➕ ADDING LEADING PLUS (+) TO WHATSAPP NUMBERS IN DATABASE...${colors.reset}\n`);

  // Target workflow ID: Lovina 1
  const workflowId = 'AgmgY3RKpcafK4bb';

  // 1. Fetch current Lovina 1 nodes from the database
  const nodesJsonStr = execSync(`docker exec -i n8n-autoscaling-postgres-1 psql -U postgres -d n8n -t -c "SELECT nodes::text FROM workflow_entity WHERE id = '${workflowId}';"`);
  
  let updatedNodesStr = nodesJsonStr.toString();

  // Replace "to": "{{ $json.WhatsAppNumber }}" with "to": "+{{ $json.WhatsAppNumber }}"
  // We need to match with backslashes since it is escaped inside json text in Postgres
  const toRegex = /\\"to\\":\s*\\"\{\{\s*\$json\.WhatsAppNumber\s*\}\}\\"/g;
  const payloadRegex = /_\{\{\s*\$json\.WhatsAppNumber\s*\}\}/g;

  if (!toRegex.test(updatedNodesStr)) {
    console.log(`- Warning: Couldn't find exact "to" expression using default regex. Checking double escapes...`);
  }

  updatedNodesStr = updatedNodesStr.replace(toRegex, '\\"to\\":\\"+{{ $json.WhatsAppNumber }}\\"');
  updatedNodesStr = updatedNodesStr.replace(payloadRegex, '_+{{ $json.WhatsAppNumber }}');

  // Convert to SQL safe format
  const sqlSafeStr = updatedNodesStr.trim().replace(/'/g, "''");

  // Write temporary SQL file
  const sqlFile = path.resolve(process.cwd(), 'scripts/update_phone_plus.sql');
  const sqlQuery = `UPDATE workflow_entity SET nodes = '${sqlSafeStr}'::jsonb WHERE id = '${workflowId}';`;
  fs.writeFileSync(sqlFile, sqlQuery, 'utf8');

  try {
    console.log(`- Copying SQL file to Postgres container...`);
    execSync(`docker cp ${sqlFile} n8n-autoscaling-postgres-1:/tmp/update_phone_plus.sql`);

    console.log(`- Executing phone formatting update inside DB...`);
    const output = execSync(`docker exec -i n8n-autoscaling-postgres-1 psql -U postgres -d n8n -f /tmp/update_phone_plus.sql`).toString();

    console.log(`\n${colors.green}${colors.bold}✔ PHONE FORMATTING FORMATTED SUCCESSFULLY!${colors.reset}`);
    console.log(`${output.trim()}`);

    // Clean up
    try {
      fs.unlinkSync(sqlFile);
    } catch (e) {}
  } catch (error) {
    console.error(`${colors.red}✖ Error executing SQL update: ${error.message}${colors.reset}`);
  }
}

main();
