import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

async function main() {
  console.log('🔍 Fetching recent n8n executions from hosted VM...');

  const sqlQuery = `
.headers on
.mode json
SELECT id, workflowId, status, mode, startedAt, stoppedAt
FROM execution_entity
ORDER BY startedAt DESC
LIMIT 10;
`;

  const localSqlFile = path.resolve(process.cwd(), 'scripts/temp_executions.sql');
  
  try {
    fs.writeFileSync(localSqlFile, sqlQuery, 'utf8');

    console.log(`- Copying query to hosted VM...`);
    execSync(`gcloud compute scp ${localSqlFile} n8n-server:/tmp/inspect_executions.sql --zone=us-central1-a`);

    console.log(`- Executing query in SQLite database...`);
    const remoteCommand = `sudo sqlite3 /var/lib/docker/volumes/n8n-docker_n8n_data/_data/database.sqlite < /tmp/inspect_executions.sql`;
    const output = execSync(`gcloud compute ssh n8n-server --zone=us-central1-a --command="${remoteCommand}"`, { maxBuffer: 15 * 1024 * 1024 }).toString().trim();

    if (!output) {
      console.log('No execution logs found in execution_entity table.');
      return;
    }

    const executions = JSON.parse(output);
    console.log('\n=== RECENT EXECUTIONS ===');
    console.log(JSON.stringify(executions, null, 2));

  } catch (error) {
    console.error(`✖ Error fetching executions:`, error.message);
  } finally {
    // Clean up local SQL file
    if (fs.existsSync(localSqlFile)) {
      fs.unlinkSync(localSqlFile);
    }
    // Clean up remote SQL file
    try {
      execSync(`gcloud compute ssh n8n-server --zone=us-central1-a --command="rm -f /tmp/inspect_executions.sql"`);
    } catch (_) {}
  }
}

main();
