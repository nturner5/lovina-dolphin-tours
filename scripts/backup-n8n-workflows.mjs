import fs from 'fs';
import path from 'path';
import os from 'os';
import { execSync } from 'child_process';

const colors = {
  reset: '\x1b[0m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  bold: '\x1b[1m',
  gray: '\x1b[90m'
};

async function main() {
  console.log(`\n${colors.cyan}${colors.bold}📦 EXPORTING ALL WORKFLOWS FROM N8N DATABASE...${colors.reset}`);
  
  try {
    // Query to aggregate all workflows into a single JSON array natively in Postgres
    const query = "SELECT json_agg(t) FROM (SELECT id, name, active, nodes, connections, settings, meta FROM workflow_entity) t;";
    
    const command = `docker exec -i n8n-autoscaling-postgres-1 psql -U postgres -d n8n -t -A -c "${query}"`;
    
    console.log(`- Connecting to database container 'n8n-autoscaling-postgres-1'...`);
    const rawJson = execSync(command).toString().trim();
    
    if (!rawJson || rawJson === "") {
      throw new Error("No data returned from database or query failed.");
    }
    
    const parsedData = JSON.parse(rawJson);
    console.log(`- Successfully retrieved ${parsedData.length} workflows from the database.`);
    
    // Format output JSON beautifully
    const formattedJson = JSON.stringify(parsedData, null, 2);
    
    // Target paths
    const localBackupPath = path.resolve(process.cwd(), 'scripts/n8n_workflows_backup.json');
    const downloadsBackupPath = path.join(os.homedir(), 'Downloads', 'n8n_workflows_backup.json');
    
    // Save inside project repo
    fs.writeFileSync(localBackupPath, formattedJson, 'utf8');
    console.log(`${colors.green}✔ Backup saved to project repo: ${colors.bold}scripts/n8n_workflows_backup.json${colors.reset}`);
    
    // Save inside macOS Downloads
    fs.writeFileSync(downloadsBackupPath, formattedJson, 'utf8');
    console.log(`${colors.green}✔ Backup saved to Downloads: ${colors.bold}${downloadsBackupPath}${colors.reset}`);
    
    console.log(`\n${colors.bold}🎉 SUCCESS! Your n8n workflows are 100% secure.${colors.reset}`);
    console.log(`${colors.gray}To restore any workflow, you can import this file directly back into n8n.${colors.reset}\n`);
  } catch (error) {
    console.error(`\n${colors.red}✖ Failed to backup workflows:${colors.reset}`, error.message);
  }
}

main();
