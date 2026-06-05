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

const WORKFLOW_IDS = {
  Lovina1: 'AgmgY3RKpcafK4bb',
  Lovina2: 'yKfMVXPuEPaBUwrh',
  Lovina3: 'FXts3OY9D5wZr0PC'
};

const AIRTABLE_BASE_PLACEHOLDER = 'YOUR_AIRTABLE_BASE_ID';

const CREDENTIALS = {
  airtableApi: {
    id: 'airtable_credential_placeholder',
    name: 'Airtable account'
  }
};

const FLATTEN_CODE = `// Flatten Airtable fields to root level for compatibility
const items = input.all();
return items.map(item => {
  const fields = item.json.fields || {};
  return {
    json: {
      id: item.json.id,
      createdTime: item.json.createdTime,
      ...fields
    }
  };
});`;

async function main() {
  console.log(`\n${colors.cyan}${colors.bold}⚙️ MIGRATING ALL GOOGLE SHEETS NODES TO AIRTABLE...${colors.reset}\n`);

  try {
    for (const [name, id] of Object.entries(WORKFLOW_IDS)) {
      console.log(`Processing ${name} (ID: ${id})...`);

      // 1. Fetch current nodes and connections from database
      const query = `SELECT json_build_object('nodes', nodes, 'connections', connections) FROM workflow_entity WHERE id = '${id}';`;
      const command = `docker exec -i n8n-autoscaling-postgres-1 psql -U postgres -d n8n -t -A -c "${query}"`;
      const rawJson = execSync(command).toString().trim();

      if (!rawJson || rawJson === "") {
        throw new Error(`Failed to fetch workflow ${name}`);
      }

      const workflow = JSON.parse(rawJson);
      let nodes = workflow.nodes;
      let connections = workflow.connections;
      let updatedCount = 0;

      // 2. Perform Migration depending on the workflow
      if (name === 'Lovina1') {
        // --- MIGRATION FOR LOVINA 1 ---
        // Node 1: Create Booking Row
        const createBookingNode = nodes.find(n => n.name === 'Create Booking Row');
        if (createBookingNode) {
          console.log(`  - Migrating "Create Booking Row" to Airtable...`);
          Object.assign(createBookingNode, {
            type: 'n8n-nodes-base.airtable',
            typeVersion: 2,
            retryOnFail: true,
            maxTries: 5,
            waitBetweenTries: 5000,
            credentials: { ...CREDENTIALS },
            parameters: {
              operation: 'append',
              base: { __rl: true, value: AIRTABLE_BASE_PLACEHOLDER, mode: 'list' },
              table: { __rl: true, value: 'Bookings', mode: 'list' },
              columnsUi: {
                columns: [
                  { columnName: 'BookingCode', columnValue: '={{ $json.body.data.object.metadata.bookingCode }}' },
                  { columnName: 'Date', columnValue: '={{ $json.body.data.object.metadata.date }}' },
                  { columnName: 'Guests', columnValue: '={{ parseInt($json.body.data.object.metadata.guests) }}' },
                  { columnName: 'PickupLocation', columnValue: '={{ $json.body.data.object.metadata.pickupLocation }}' },
                  { columnName: 'PickupDescription', columnValue: '={{ $json.body.data.object.metadata.pickupDescription }}' },
                  { columnName: 'WhatsappNumber', columnValue: '={{ $json.body.data.object.metadata.whatsappNumber }}' },
                  { columnName: 'HotelDetails', columnValue: '={{ $json.body.data.object.metadata.hotelDetails }}' }
                ]
              }
            }
          });
          updatedCount++;
        }

        // Node 2: Get Captains List
        const getCaptainsNode = nodes.find(n => n.name === 'Get Captains List');
        if (getCaptainsNode) {
          console.log(`  - Migrating "Get Captains List" to Airtable + Flatten node...`);
          // 1. Rename old node to raw
          getCaptainsNode.name = 'Get Captains List Raw';
          Object.assign(getCaptainsNode, {
            type: 'n8n-nodes-base.airtable',
            typeVersion: 2,
            retryOnFail: true,
            maxTries: 5,
            waitBetweenTries: 5000,
            credentials: { ...CREDENTIALS },
            parameters: {
              operation: 'list',
              base: { __rl: true, value: AIRTABLE_BASE_PLACEHOLDER, mode: 'list' },
              table: { __rl: true, value: 'Captains', mode: 'list' },
              options: {}
            }
          });

          // 2. Create the new flattening Code node (using original name so references don't break)
          const flattenCaptainsNode = {
            id: 'flatten-captains-list-id-l1',
            name: 'Get Captains List',
            type: 'n8n-nodes-base.code',
            typeVersion: 2,
            position: [480, 848],
            parameters: {
              jsCode: FLATTEN_CODE
            }
          };
          nodes.push(flattenCaptainsNode);

          // 3. Rewire connections
          // Create Booking Row connects to Get Captains List Raw
          connections['Create Booking Row'].main[0] = connections['Create Booking Row'].main[0].map(c => 
            c.node === 'Get Captains List' ? { ...c, node: 'Get Captains List Raw' } : c
          );
          // Get Captains List Raw connects to Get Captains List
          connections['Get Captains List Raw'] = {
            main: [[{ node: 'Get Captains List', type: 'main', index: 0 }]]
          };
          // Get Captains List (the Code node) connects to Sort by Priority1
          connections['Get Captains List'] = {
            main: [[{ node: 'Sort by Priority1', type: 'main', index: 0 }]]
          };

          updatedCount++;
        }

        // Node 3: Check Ledger Status1
        const checkLedgerNode = nodes.find(n => n.name === 'Check Ledger Status1');
        if (checkLedgerNode) {
          console.log(`  - Migrating "Check Ledger Status1" to Airtable + Flatten node...`);
          checkLedgerNode.name = 'Check Ledger Status1 Raw';
          Object.assign(checkLedgerNode, {
            type: 'n8n-nodes-base.airtable',
            typeVersion: 2,
            retryOnFail: true,
            maxTries: 5,
            waitBetweenTries: 5000,
            credentials: { ...CREDENTIALS },
            parameters: {
              operation: 'list',
              base: { __rl: true, value: AIRTABLE_BASE_PLACEHOLDER, mode: 'list' },
              table: { __rl: true, value: 'Bookings', mode: 'list' },
              options: {
                filterByFormula: `={BookingCode} = '{{ $('Webhook').item.json.body.data.object.metadata.bookingCode }}'`
              }
            }
          });

          // Create flattening node
          const flattenLedgerNode = {
            id: 'flatten-ledger-status-id-l1',
            name: 'Check Ledger Status1',
            type: 'n8n-nodes-base.code',
            typeVersion: 2,
            position: [1280, 848],
            parameters: {
              jsCode: FLATTEN_CODE
            }
          };
          nodes.push(flattenLedgerNode);

          // Rewire
          connections['Wait 5 Minutes1'].main[0] = connections['Wait 5 Minutes1'].main[0].map(c =>
            c.node === 'Check Ledger Status1' ? { ...c, node: 'Check Ledger Status1 Raw' } : c
          );
          connections['Check Ledger Status1 Raw'] = {
            main: [[{ node: 'Check Ledger Status1', type: 'main', index: 0 }]]
          };
          connections['Check Ledger Status1'] = {
            main: [[{ node: 'Is Still Unassigned?1', type: 'main', index: 0 }]]
          };

          updatedCount++;
        }
      } 
      else if (name === 'Lovina2') {
        // --- MIGRATION FOR LOVINA 2 ---
        // Node 1: Check Current Assignment
        const checkCurrentNode = nodes.find(n => n.name === 'Check Current Assignment');
        if (checkCurrentNode) {
          console.log(`  - Migrating "Check Current Assignment" to Airtable + Flatten node...`);
          checkCurrentNode.name = 'Check Current Assignment Raw';
          Object.assign(checkCurrentNode, {
            type: 'n8n-nodes-base.airtable',
            typeVersion: 2,
            retryOnFail: true,
            maxTries: 5,
            waitBetweenTries: 5000,
            credentials: { ...CREDENTIALS },
            parameters: {
              operation: 'list',
              base: { __rl: true, value: AIRTABLE_BASE_PLACEHOLDER, mode: 'list' },
              table: { __rl: true, value: 'Bookings', mode: 'list' },
              options: {
                filterByFormula: `={BookingCode} = '{{ $json.bookingCode }}'`
              }
            }
          });

          // Create flattening node
          const flattenCurrentNode = {
            id: 'flatten-current-assignment-id-l2',
            name: 'Check Current Assignment',
            type: 'n8n-nodes-base.code',
            typeVersion: 2,
            position: [-300, 96],
            parameters: {
              jsCode: FLATTEN_CODE
            }
          };
          nodes.push(flattenCurrentNode);

          // Rewire
          connections['Is Captain Action?'].main[0] = connections['Is Captain Action?'].main[0].map(c =>
            c.node === 'Check Current Assignment' ? { ...c, node: 'Check Current Assignment Raw' } : c
          );
          connections['Check Current Assignment Raw'] = {
            main: [[{ node: 'Check Current Assignment', type: 'main', index: 0 }]]
          };
          connections['Check Current Assignment'] = {
            main: [[{ node: 'Is Still Unassigned?', type: 'main', index: 0 }]]
          };

          updatedCount++;
        }

        // Node 2: Assign Captain in Sheets (Update)
        const assignCaptainNode = nodes.find(n => n.name === 'Assign Captain in Sheets');
        if (assignCaptainNode) {
          console.log(`  - Migrating "Assign Captain in Sheets" to Airtable...`);
          Object.assign(assignCaptainNode, {
            type: 'n8n-nodes-base.airtable',
            typeVersion: 2,
            retryOnFail: true,
            maxTries: 5,
            waitBetweenTries: 5000,
            credentials: { ...CREDENTIALS },
            parameters: {
              operation: 'update',
              base: { __rl: true, value: AIRTABLE_BASE_PLACEHOLDER, mode: 'list' },
              table: { __rl: true, value: 'Bookings', mode: 'list' },
              id: '={{ $json.id }}',
              columnsUi: {
                columns: [
                  { columnName: 'AssignedCaptain', columnValue: `={{ $('Parse Payload Data').item.json.captainName }}` },
                  { columnName: 'CaptainPhone', columnValue: `={{ $('Parse Payload Data').item.json.captainPhone }}` }
                ]
              }
            }
          });
          updatedCount++;
        }
      } 
      else if (name === 'Lovina3') {
        // --- MIGRATION FOR LOVINA 3 ---
        // Node 1: Get Guest & Stripe Details
        const getGuestNode = nodes.find(n => n.name === 'Get Guest & Stripe Details');
        if (getGuestNode) {
          console.log(`  - Migrating "Get Guest & Stripe Details" to Airtable + Flatten node...`);
          getGuestNode.name = 'Get Guest & Stripe Details Raw';
          Object.assign(getGuestNode, {
            type: 'n8n-nodes-base.airtable',
            typeVersion: 2,
            retryOnFail: true,
            maxTries: 5,
            waitBetweenTries: 5000,
            credentials: { ...CREDENTIALS },
            parameters: {
              operation: 'list',
              base: { __rl: true, value: AIRTABLE_BASE_PLACEHOLDER, mode: 'list' },
              table: { __rl: true, value: 'Bookings', mode: 'list' },
              options: {
                filterByFormula: `={BookingCode} = '{{ $json.body.bookingId }}'`
              }
            }
          });

          // Create flattening node
          const flattenGuestNode = {
            id: 'flatten-guest-details-id-l3',
            name: 'Get Guest & Stripe Details',
            type: 'n8n-nodes-base.code',
            typeVersion: 2,
            position: [400, 304],
            parameters: {
              jsCode: FLATTEN_CODE
            }
          };
          nodes.push(flattenGuestNode);

          // Rewire
          connections['Captain Signed Webhook'].main[0] = connections['Captain Signed Webhook'].main[0].map(c =>
            c.node === 'Get Guest & Stripe Details' ? { ...c, node: 'Get Guest & Stripe Details Raw' } : c
          );
          connections['Get Guest & Stripe Details Raw'] = {
            main: [[{ node: 'Get Guest & Stripe Details', type: 'main', index: 0 }]]
          };
          connections['Get Guest & Stripe Details'] = {
            main: [[{ node: 'Log Signature in Sheets', type: 'main', index: 0 }]]
          };

          updatedCount++;
        }

        // Node 2: Log Signature in Sheets (Update)
        const logSignatureNode = nodes.find(n => n.name === 'Log Signature in Sheets');
        if (logSignatureNode) {
          console.log(`  - Migrating "Log Signature in Sheets" to Airtable...`);
          Object.assign(logSignatureNode, {
            type: 'n8n-nodes-base.airtable',
            typeVersion: 2,
            retryOnFail: true,
            maxTries: 5,
            waitBetweenTries: 5000,
            credentials: { ...CREDENTIALS },
            parameters: {
              operation: 'update',
              base: { __rl: true, value: AIRTABLE_BASE_PLACEHOLDER, mode: 'list' },
              table: { __rl: true, value: 'Bookings', mode: 'list' },
              id: '={{ $json.id }}',
              columnsUi: {
                columns: [
                  { columnName: 'RulesSigned', columnValue: 'TRUE' },
                  { columnName: 'SignatureTime', columnValue: `={{ $('Captain Signed Webhook').item.json.body.signedAt }}` }
                ]
              }
            }
          });
          updatedCount++;
        }
      }

      // 3. Write back to database if updated
      if (updatedCount > 0) {
        const nodesJsonStr = JSON.stringify(nodes).replace(/'/g, "''");
        const connectionsJsonStr = JSON.stringify(connections).replace(/'/g, "''");
        const sqlFile = path.resolve(process.cwd(), `scripts/migrate_${name}.sql`);
        
        const sqlQuery = `
          UPDATE workflow_entity SET nodes = '${nodesJsonStr}'::jsonb, connections = '${connectionsJsonStr}'::jsonb WHERE id = '${id}';
          UPDATE workflow_history SET nodes = '${nodesJsonStr}'::jsonb, connections = '${connectionsJsonStr}'::jsonb WHERE "versionId" = (SELECT "activeVersionId" FROM workflow_entity WHERE id = '${id}');
        `;
        fs.writeFileSync(sqlFile, sqlQuery, 'utf8');

        execSync(`docker cp ${sqlFile} n8n-autoscaling-postgres-1:/tmp/migrate_${name}.sql`);
        execSync(`docker exec -i n8n-autoscaling-postgres-1 psql -U postgres -d n8n -f /tmp/migrate_${name}.sql`);
        fs.unlinkSync(sqlFile);
        
        console.log(`  ${colors.green}✔ Successfully migrated ${name} to Airtable in database.${colors.reset}`);
      } else {
        console.log(`  - No nodes migrated.`);
      }
    }

    // 4. Restart n8n webhook and editor
    console.log(`\n- Restarting n8n services to reload configuration...`);
    execSync(`docker restart n8n-autoscaling-n8n-webhook-1 n8n-autoscaling-n8n-1`);

    console.log(`\n${colors.green}${colors.bold}🎉 ALL GOOGLE SHEETS NODES SUCCESSFULLY CONVERTED TO AIRTABLE IN N8N!${colors.reset}\n`);
    console.log(`${colors.bold}💡 Next Steps:${colors.reset}`);
    console.log(`1. Open n8n and link your Airtable account API/Personal Access Token in your Credentials.`);
    console.log(`2. For each Airtable node, pick your specific Airtable Base and Table from the dropdown.`);
    console.log(`3. Make sure to create the "Bookings" and "Captains" tables in Airtable with matching column names.`);

  } catch (error) {
    console.error(`\n${colors.red}✖ Error: ${error.message}${colors.reset}\n`);
  }
}

main();
