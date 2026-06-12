import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const colors = {
  reset: '\x1b[0m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  bold: '\x1b[1m',
};

async function main() {
  console.log(`\n${colors.cyan}${colors.bold}🔍 INSPECTING HOSTED N8N WORKFLOWS (via SQL file)...${colors.reset}\n`);

  const sqlQuery = `
.headers off
.mode json
SELECT json_group_array(
  json_object(
    'id', id,
    'name', name,
    'active', active,
    'nodes', json(nodes)
  )
) FROM workflow_entity;
`;

  const localSqlFile = path.resolve(process.cwd(), 'scripts/temp_inspect.sql');
  
  try {
    fs.writeFileSync(localSqlFile, sqlQuery, 'utf8');

    console.log(`- Copying query to hosted VM...`);
    execSync(`gcloud compute scp ${localSqlFile} n8n-server:/tmp/inspect.sql --zone=us-central1-a`);

    console.log(`- Executing query in SQLite database...`);
    const remoteCommand = `sudo sqlite3 /var/lib/docker/volumes/n8n-docker_n8n_data/_data/database.sqlite < /tmp/inspect.sql`;
    const output = execSync(`gcloud compute ssh n8n-server --zone=us-central1-a --command="${remoteCommand}"`, { maxBuffer: 15 * 1024 * 1024 }).toString().trim();

    if (!output) {
      throw new Error("No output returned from SQLite query.");
    }

    const workflows = JSON.parse(output);
    console.log(`- Found ${workflows.length} workflows in hosted SQLite database:\n`);

    for (const w of workflows) {
      const nodes = w.nodes || [];
      const airtableNodes = nodes.filter(n => n.type === 'n8n-nodes-base.airtable');
      const supabaseNodes = nodes.filter(n => n.type === 'n8n-nodes-base.supabase');
      
      console.log(`${colors.bold}Workflow:${colors.reset} "${w.name}" (ID: ${w.id}, Active: ${w.active === 1 ? 'Yes' : 'No'})`);
      console.log(`  Total Nodes: ${nodes.length}`);
      if (airtableNodes.length > 0) {
        console.log(`  ${colors.yellow}⚠️  Airtable Nodes Found: ${airtableNodes.length}${colors.reset}`);
        airtableNodes.forEach(n => console.log(`     - "${n.name}"`));
      } else {
        console.log(`  ✅ No Airtable nodes.`);
      }
      if (supabaseNodes.length > 0) {
        console.log(`  ℹ️  Supabase Nodes Found: ${supabaseNodes.length}`);
        supabaseNodes.forEach(n => console.log(`     - "${n.name}"`));
      }
      console.log('');
    }

  } catch (error) {
    console.error(`${colors.red}✖ Error: ${error.message}${colors.reset}`);
  } finally {
    // Clean up local SQL file
    if (fs.existsSync(localSqlFile)) {
      fs.unlinkSync(localSqlFile);
    }
    // Clean up remote SQL file
    try {
      execSync(`gcloud compute ssh n8n-server --zone=us-central1-a --command="rm -f /tmp/inspect.sql"`);
    } catch (_) {}
  }
}

main();
