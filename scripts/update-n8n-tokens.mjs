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
  console.log(`\n${colors.cyan}${colors.bold}🔄 UPDATING N8N TOKENS AND PHONE IDS IN POSTGRES DATABASE...${colors.reset}\n`);

  // 1. Read .env.local to get the current META_ACCESS_TOKEN and META_PHONE_NUMBER_ID
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) {
    console.error(`${colors.red}✖ Error: .env.local file not found at ${envPath}${colors.reset}`);
    process.exit(1);
  }

  const envContent = fs.readFileSync(envPath, 'utf8');
  const tokenMatch = envContent.match(/META_ACCESS_TOKEN="?([^"\s]+)"?/);
  const phoneMatch = envContent.match(/META_PHONE_NUMBER_ID="?([^"\s]+)"?/);

  if (!tokenMatch) {
    console.error(`${colors.red}✖ Error: META_ACCESS_TOKEN not found in .env.local${colors.reset}`);
    process.exit(1);
  }

  const currentToken = tokenMatch[1];
  const currentPhoneId = phoneMatch ? phoneMatch[1] : '1146773325183741';

  console.log(`- Active Meta Access Token: ${currentToken.substring(0, 15)}...`);
  console.log(`- Active Sandbox Phone ID: ${currentPhoneId}`);

  // Old hardcoded token we want to replace
  const oldToken = 'EAAW3tqcsDUIBRsOxEBlIhP1RLymUiOJoRa4KvqfC9zxFSY1KUv4A3OUUyAxp0sZAZCN8YTQgySd2lqe85Pfkl0zCSarhQYv9CrSAIHA6wmtWR0lZAXg0Csy2tQk6JUw3xJwWEyoDzAaAN5YswiAyzElZCvhv6EsBJNpXzaB9NGwyznUobdPNLhhSamgN0660Gy90BDGyRzqM0Cj5JSzMBvMBFZCZCDuFn2uHxI';
  
  // 2. Formulate SQL queries
  // Replace old token with current token in all workflows (entity and history)
  const updateTokenQuery = `
    UPDATE workflow_entity 
    SET nodes = replace(nodes::text, '${oldToken}', '${currentToken}')::jsonb 
    WHERE nodes::text LIKE '%${oldToken}%';
    UPDATE workflow_history 
    SET nodes = replace(nodes::text, '${oldToken}', '${currentToken}')::jsonb 
    WHERE nodes::text LIKE '%${oldToken}%';
  `;

  // Also replace any production WABA Phone ID (1248861244970433) with current sandbox Phone ID (1146773325183741)
  // in all workflows (entity and history) so that it routes via Sandbox during local dev testing
  const oldProductionPhoneId = '1248861244970433';
  const updatePhoneIdQuery = `
    UPDATE workflow_entity 
    SET nodes = replace(nodes::text, '${oldProductionPhoneId}', '${currentPhoneId}')::jsonb 
    WHERE nodes::text LIKE '%${oldProductionPhoneId}%';
    UPDATE workflow_history 
    SET nodes = replace(nodes::text, '${oldProductionPhoneId}', '${currentPhoneId}')::jsonb 
    WHERE nodes::text LIKE '%${oldProductionPhoneId}%';
  `;

  // Write temporary SQL file
  const sqlFile = path.resolve(process.cwd(), 'scripts/update_tokens.sql');
  const fullSql = `${updateTokenQuery}\n${updatePhoneIdQuery}`;
  fs.writeFileSync(sqlFile, fullSql, 'utf8');

  try {
    console.log(`- Copying SQL file to Postgres container (n8n-autoscaling-postgres-1)...`);
    execSync(`docker cp ${sqlFile} n8n-autoscaling-postgres-1:/tmp/update_tokens.sql`);

    console.log(`- Executing token replacement inside DB...`);
    const output = execSync(`docker exec -i n8n-autoscaling-postgres-1 psql -U postgres -d n8n -f /tmp/update_tokens.sql`).toString();

    console.log(`- Restarting n8n services to apply token/phone updates...`);
    execSync(`docker restart n8n-autoscaling-n8n-webhook-1 n8n-autoscaling-n8n-1`);

    console.log(`\n${colors.green}${colors.bold}✔ N8N DATABASE SYNCHRONIZED AND RESTARTED SUCCESSFULLY!${colors.reset}`);
    console.log(`${output.trim()}`);

    // Clean up temporary SQL file
    try {
      fs.unlinkSync(sqlFile);
    } catch (e) {
      // Ignore
    }
  } catch (error) {
    console.error(`${colors.red}✖ Error executing SQL update: ${error.message}${colors.reset}`);
  }
}

main();
