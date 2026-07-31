import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

async function main() {
  const sqlQuery = `
.headers off
.mode json
SELECT data FROM execution_data WHERE executionId = 308;
`;
  const localSqlFile = path.resolve(process.cwd(), 'scripts/temp_inspect_nodes.sql');
  
  try {
    fs.writeFileSync(localSqlFile, sqlQuery, 'utf8');
    execSync(`gcloud compute scp ${localSqlFile} n8n-server:/tmp/inspect_nodes.sql --zone=us-central1-a`);
    const output = execSync(`gcloud compute ssh n8n-server --zone=us-central1-a --command="sudo sqlite3 /var/lib/docker/volumes/n8n-docker_n8n_data/_data/database.sqlite < /tmp/inspect_nodes.sql"`, { maxBuffer: 30 * 1024 * 1024 }).toString().trim();

    const row = JSON.parse(output);
    const execJson = JSON.parse(row[0].data);

    function unflatten(val, cache = new Map()) {
      if (typeof val === 'string' && /^\d+$/.test(val)) {
        const idx = parseInt(val, 10);
        if (cache.has(idx)) return cache.get(idx);
        const resolved = execJson[idx];
        if (resolved === null || resolved === undefined || typeof resolved !== 'object') {
          return resolved;
        }
        const placeholder = Array.isArray(resolved) ? [] : {};
        cache.set(idx, placeholder);
        const actual = unflatten(resolved, cache);
        if (Array.isArray(actual)) {
          actual.forEach(item => placeholder.push(item));
        } else {
          Object.assign(placeholder, actual);
        }
        return placeholder;
      }
      if (Array.isArray(val)) {
        return val.map(item => unflatten(item, cache));
      }
      if (val && typeof val === 'object') {
        const newObj = {};
        for (const key of Object.keys(val)) {
          newObj[key] = unflatten(val[key], cache);
        }
        return newObj;
      }
      return val;
    }

    const fullExec = unflatten('0');
    
    console.log('=== UNFLATTENED EXECUTION SUCCESS ===');
    
    const runData = fullExec.resultData.runData;
    
    for (const nodeName of ['Parse Payload Data', 'Is Captain Action?', 'Is Guest Message?', 'Alert Nathan: Telegram Notification']) {
      if (runData[nodeName]) {
        console.log(`\n=== NODE: ${nodeName} ===`);
        console.log(JSON.stringify(runData[nodeName], null, 2));
      } else {
        console.log(`\n=== NODE: ${nodeName} === (NOT EXECUTED)`);
      }
    }

  } catch (err) {
    console.error(err);
  } finally {
    if (fs.existsSync(localSqlFile)) fs.unlinkSync(localSqlFile);
  }
}

main();
