import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const colors = {
  reset: '\x1b[0m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  bold: '\x1b[1m',
};

const ACTIVE_WORKFLOW_IDS = [
  'AgmgY3RKpcafK4bb', // Lovina 1
  'yKfMVXPuEPaBUwrh', // Lovina 2
  'FXts3OY9D5wZr0PC', // Lovina 3
];

async function main() {
  console.log(`\n${colors.cyan}${colors.bold}🔄 MIGRATING N8N ACTIVE WORKFLOWS FROM AIRTABLE TO SUPABASE...${colors.reset}\n`);

  for (const workflowId of ACTIVE_WORKFLOW_IDS) {
    try {
      console.log(`- Fetching workflow ID: ${workflowId}...`);
      
      // 1. Fetch nodes and connections from Postgres
      const query = `SELECT json_build_object('nodes', nodes, 'connections', connections, 'name', name) FROM workflow_entity WHERE id = '${workflowId}';`;
      const rawJson = execSync(`docker exec -i n8n-autoscaling-postgres-1 psql -U postgres -d n8n -t -A -c "${query}"`).toString().trim();
      
      if (!rawJson) {
        throw new Error(`Workflow ${workflowId} not found in database.`);
      }

      const workflow = JSON.parse(rawJson);
      let nodes = workflow.nodes || [];
      let connections = workflow.connections || [];
      console.log(`  Found workflow name: "${workflow.name}"`);

      let modified = false;

      // 2. Translate Airtable nodes to Supabase nodes
      nodes = nodes.map(node => {
        if (node.type !== 'n8n-nodes-base.airtable') {
          return node;
        }

        console.log(`  Replacing Airtable node: "${node.name}"...`);
        modified = true;

        const baseSupabaseNode = {
          id: node.id,
          name: node.name,
          type: 'n8n-nodes-base.supabase',
          typeVersion: 1,
          position: node.position,
          maxTries: node.maxTries,
          retryOnFail: node.retryOnFail,
          waitBetweenTries: node.waitBetweenTries,
          credentials: {
            supabaseApi: {
              id: 'supabase-credentials-placeholder', // User can update this inside n8n UI
              name: 'Supabase account'
            }
          }
        };

        // Custom parameter mapping based on node name
        if (node.name === 'Get Captains List Raw') {
          return {
            ...baseSupabaseNode,
            parameters: {
              operation: 'get',
              table: 'captains',
              selectProps: 'captain_name, whatsapp_number, priority',
              options: {
                sort: {
                  property: [
                    {
                      field: 'priority',
                      direction: 'asc'
                    }
                  ]
                }
              }
            }
          };
        }

        if (node.name === 'Create Booking Row') {
          return {
            ...baseSupabaseNode,
            parameters: {
              operation: 'upsert',
              table: 'bookings',
              fields: {
                booking_code: '={{ $json.body.data.object.metadata.bookingCode }}',
                date: '={{ $json.body.data.object.metadata.date }}',
                guests: '={{ Number($json.body.data.object.metadata.guests) }}',
                pickup_location: '={{ $json.body.data.object.metadata.pickupLocation }}',
                pickup_description: '={{ $json.body.data.object.metadata.pickupDescription }}',
                whatsapp_number: '={{ $json.body.data.object.metadata.whatsappNumber }}',
                guest_phone: '={{ $json.body.data.object.customer_details.phone }}',
                hotel_details: '={{ $json.body.data.object.metadata.hotelDetails }}',
                guest_name: '={{ $json.body.data.object.customer_details.name }}',
                guest_email: '={{ $json.body.data.object.customer_details.email }}',
                tour_id: '={{ $json.body.data.object.metadata.tourId || \'seven-am-ethical\' }}'
              },
              onConflict: 'booking_code'
            }
          };
        }

        if (node.name === 'Check Current Assignment Raw') {
          return {
            ...baseSupabaseNode,
            parameters: {
              operation: 'get',
              table: 'bookings',
              where: {
                conditions: [
                  {
                    key: 'booking_code',
                    operator: 'eq',
                    value: '={{ $(\'Parse Payload Data\').item.json.bookingCode }}'
                  }
                ]
              }
            }
          };
        }

        if (node.name === 'Assign Captain in Sheets') {
          return {
            ...baseSupabaseNode,
            parameters: {
              operation: 'update',
              table: 'bookings',
              id: '={{ $(\'Check Current Assignment Raw\').item.json.id }}',
              fields: {
                assigned_captain: '={{ $(\'Is Captain Action?\').item.json.captainName }}',
                captain_phone: '={{ $(\'Is Captain Action?\').item.json.captainPhone }}'
              }
            }
          };
        }

        if (node.name === 'Get Guest & Stripe Details Raw') {
          return {
            ...baseSupabaseNode,
            parameters: {
              operation: 'get',
              table: 'bookings',
              where: {
                conditions: [
                  {
                    key: 'booking_code',
                    operator: 'eq',
                    value: '={{ $(\'Get Signed Payload\').item.json.bookingId }}'
                  }
                ]
              }
            }
          };
        }

        if (node.name === 'Log Signature in Sheets') {
          return {
            ...baseSupabaseNode,
            parameters: {
              operation: 'update',
              table: 'bookings',
              id: '={{ $(\'Get Guest & Stripe Details Raw\').item.json.id }}',
              fields: {
                rules_signed: 'signed',
                signature_time: '={{ $(\'Get Signed Payload\').item.json.signedAt }}'
              }
            }
          };
        }

        // Default fallback
        return {
          ...baseSupabaseNode,
          parameters: {
            operation: 'get',
            table: 'bookings'
          }
        };
      });

      if (modified) {
        // 3. Update nodes in Postgres
        const nodesJsonStr = JSON.stringify(nodes).replace(/'/g, "''");
        
        const sqlFile = path.resolve(process.cwd(), `scripts/temp_migration_${workflowId}.sql`);
        const sqlQuery = `
          UPDATE workflow_entity SET nodes = '${nodesJsonStr}'::jsonb WHERE id = '${workflowId}';
          UPDATE workflow_history SET nodes = '${nodesJsonStr}'::jsonb WHERE "versionId" = (SELECT "activeVersionId" FROM workflow_entity WHERE id = '${workflowId}');
        `;
        fs.writeFileSync(sqlFile, sqlQuery, 'utf8');

        // Copy and run
        execSync(`docker cp ${sqlFile} n8n-autoscaling-postgres-1:/tmp/migration.sql`);
        execSync(`docker exec -i n8n-autoscaling-postgres-1 psql -U postgres -d n8n -f /tmp/migration.sql`);
        
        fs.unlinkSync(sqlFile);
        console.log(`${colors.green}  ✔ Successfully migrated workflow ${workflowId} to Supabase nodes.${colors.reset}`);
      } else {
        console.log(`  No Airtable nodes found in this workflow.`);
      }

    } catch (err) {
      console.error(`${colors.red}  ✖ Error migrating workflow ${workflowId}: ${err.message}${colors.reset}`);
    }
  }

  // 4. Restart n8n to reload configurations
  try {
    console.log(`\n- Restarting n8n services to apply database node migrations...`);
    execSync(`docker restart n8n-autoscaling-n8n-webhook-1 n8n-autoscaling-n8n-1`);
    console.log(`${colors.green}${colors.bold}✔ N8N SERVICES RESTARTED AND UPDATED SUCCESSFULLY!${colors.reset}\n`);
  } catch (err) {
    console.error(`${colors.red}✖ Failed to restart n8n services: ${err.message}${colors.reset}`);
  }
}

main();
