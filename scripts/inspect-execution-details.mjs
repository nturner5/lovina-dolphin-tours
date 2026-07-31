import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

async function main() {
  console.log('🔍 Fetching detailed data for Execution 307...');

  const sqlQuery = `
.headers off
.mode json
SELECT data FROM execution_data WHERE executionId = 307;
`;

  const localSqlFile = path.resolve(process.cwd(), 'scripts/temp_exec_data.sql');
  
  try {
    fs.writeFileSync(localSqlFile, sqlQuery, 'utf8');

    console.log(`- Copying query to hosted VM...`);
    execSync(`gcloud compute scp ${localSqlFile} n8n-server:/tmp/inspect_exec_data.sql --zone=us-central1-a`);

    console.log(`- Executing query...`);
    const remoteCommand = `sudo sqlite3 /var/lib/docker/volumes/n8n-docker_n8n_data/_data/database.sqlite < /tmp/inspect_exec_data.sql`;
    const output = execSync(`gcloud compute ssh n8n-server --zone=us-central1-a --command="${remoteCommand}"`, { maxBuffer: 30 * 1024 * 1024 }).toString().trim();

    if (!output) {
      console.log('No data found for Execution 307.');
      return;
    }

    // SQLite returns a JSON string, which itself contains the "data" column string.
    // Let's parse the SQLite output
    const row = JSON.parse(output);
    const executionDataStr = row[0].data;
    const execJson = JSON.parse(executionDataStr);

    console.log('\n=== DEBUG EXECJSON ===');
    console.log('Keys of execJson:', Object.keys(execJson));
    console.log('First 500 chars of string:', executionDataStr.substring(0, 500));
    
    const resultData = execJson.resultData || {};
    const runData = resultData.runData || {};

    console.log('Nodes Executed:');
    for (const nodeName of Object.keys(runData)) {
      const runs = runData[nodeName];
      console.log(`\n- Node: "${nodeName}"`);
      runs.forEach((run, i) => {
        console.log(`  Run ${i + 1}:`);
        if (run.error) {
          console.log(`    ❌ Error: ${JSON.stringify(run.error)}`);
        } else {
          console.log(`    ✅ Succeeded`);
          if (run.data && run.data.main) {
            console.log(`    Inputs:`, JSON.stringify(run.data.main.map(x => x ? x.length : 0)));
          }
        }
      });
    }

  } catch (error) {
    console.error(`✖ Error:`, error.message);
  } finally {
    if (fs.existsSync(localSqlFile)) {
      fs.unlinkSync(localSqlFile);
    }
    try {
      execSync(`gcloud compute ssh n8n-server --zone=us-central1-a --command="rm -f /tmp/inspect_exec_data.sql"`);
    } catch (_) {}
  }
}

main();
