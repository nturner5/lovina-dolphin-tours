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

const WORKFLOW_ID = 'FXts3OY9D5wZr0PC'; // Lovina 3

const EMAIL_BODY = `=🌅 BALI DOLPHIN TOURS — BOOKING CONFIRMED! ⛵🐬\n\nHi {{ $node["Get Guest & Stripe Details Raw"].json.GuestName }},\n\nThank you for booking a private, ethical dolphin tour with Bali Dolphin Tours! Your private outrigger boat is secured for a quiet morning encounter on the sea.\n\n📅 EXCURSION DETAILS:\n• Booking ID: {{ $node["Get Guest & Stripe Details Raw"].json.BookingCode }}\n• Date: {{ $node["Get Guest & Stripe Details Raw"].json.Date }}\n• Meetup/Pickup Time: {{ $node["Get Guest & Stripe Details Raw"].json.PickupLocation === 'none' ? '6:30 AM (Meet at Beach)' : ($node["Get Guest & Stripe Details Raw"].json.PickupLocation === 'lovina' ? '6:30 AM (Hotel Lobby)' : ($node["Get Guest & Stripe Details Raw"].json.PickupLocation === 'ubud' ? '4:30 AM (Hotel Lobby)' : ($node["Get Guest & Stripe Details Raw"].json.PickupLocation === 'canggu-kuta' ? '4:00 AM (Hotel Lobby)' : '3:30 AM (Hotel Lobby)'))) }}\n• Departure Time: 07:00 AM WITA sharp\n• Guests: {{ $node["Get Guest & Stripe Details Raw"].json.Guests }} People\n• Assigned Captain: Captain {{ $node["Captain Signed Webhook"].json.body.captainName }}\n\n📍 LOCATION & COORDINATION:\n• Transfer Option: {{ $node["Get Guest & Stripe Details Raw"].json.PickupDescription }}\n• Specifics: {{ $node["Get Guest & Stripe Details Raw"].json.PickupLocation === 'none' ? 'Direct Meetup at the Lovina Beach Dolphin Statue (Kalibukbuk) at 6:30 AM. Here is the Google Maps link for directions: https://www.google.com/maps/search/?api=1&query=Lovina+Dolphin+Statue. Your captain will meet you by the statue.' : 'Our driver will pick you up directly from the lobby of: ' + $node["Get Guest & Stripe Details Raw"].json.HotelDetails }}\n\n💬 WHAT\\'S NEXT?\nYour captain (Captain {{ $node["Captain Signed Webhook"].json.body.captainName }}) will contact you directly via WhatsApp (at {{ $node["Get Guest & Stripe Details Raw"].json.GuestPhone }}) the afternoon before your excursion (by 5:00 PM Bali Time) to confirm water conditions and coordinate final details.\n\n⚓ THE ETHICAL PROMISE:\nWe are dedicated to sustainable tourism. Our captains operate under a strict code of behavior: keeping a 30-meter buffer, and never chasing or swarming pods. Thank you for supporting ethical dolphin tours in Lovina!\n\nSee you on the water! ⛵🐬\nBali Dolphin Tours Team`;

async function main() {
  console.log(`\n${colors.cyan}${colors.bold}⚙️ UPDATING CUSTOMER CONFIRMATION EMAIL IN WORKFLOW 3...${colors.reset}\n`);

  try {
    // 1. Fetch current nodes and connections from database
    const query = `SELECT json_build_object('nodes', nodes, 'connections', connections) FROM workflow_entity WHERE id = '${WORKFLOW_ID}';`;
    const command = `docker exec -i n8n-autoscaling-postgres-1 psql -U postgres -d n8n -t -A -c "${query}"`;
    const rawJson = execSync(command).toString().trim();

    if (!rawJson || rawJson === "") {
      throw new Error(`Failed to fetch workflow Lovina 3`);
    }

    const workflow = JSON.parse(rawJson);
    let nodes = workflow.nodes;
    let updatedCount = 0;

    // 2. Locate Gmail Node and rewrite its parameters
    nodes.forEach(node => {
      if (node.name === 'Send Guest Email Receipt') {
        node.parameters = {
          sendTo: '={{ $node["Get Guest & Stripe Details Raw"].json.GuestEmail }}',
          subject: '=Confirmed: Your Private Dolphin Excursion on {{ $node["Get Guest & Stripe Details Raw"].json.Date }} ⛵',
          message: EMAIL_BODY,
          options: {}
        };
        console.log(`  - Rewrote parameters for node: "${node.name}"`);
        updatedCount++;
      }
    });

    // 3. Write back to database if updated
    if (updatedCount > 0) {
      const nodesJsonStr = JSON.stringify(nodes).replace(/'/g, "''");
      const sqlFile = path.resolve(process.cwd(), `scripts/update_email.sql`);
      
      const sqlQuery = `
        UPDATE workflow_entity SET nodes = '${nodesJsonStr}'::jsonb WHERE id = '${WORKFLOW_ID}';
        UPDATE workflow_history SET nodes = '${nodesJsonStr}'::jsonb WHERE "versionId" = (SELECT "activeVersionId" FROM workflow_entity WHERE id = '${WORKFLOW_ID}');
      `;
      fs.writeFileSync(sqlFile, sqlQuery, 'utf8');

      execSync(`docker cp ${sqlFile} n8n-autoscaling-postgres-1:/tmp/update_email.sql`);
      execSync(`docker exec -i n8n-autoscaling-postgres-1 psql -U postgres -d n8n -f /tmp/update_email.sql`);
      fs.unlinkSync(sqlFile);
      
      console.log(`  ${colors.green}✔ Updated nodes in database.${colors.reset}`);
    } else {
      console.log(`  - Node "Send Guest Email Receipt" not found.`);
    }

    // 4. Restart n8n webhook and editor
    console.log(`\n- Restarting n8n services to reload configuration...`);
    execSync(`docker restart n8n-autoscaling-n8n-webhook-1 n8n-autoscaling-n8n-1`);

    console.log(`\n${colors.green}${colors.bold}🎉 CONFIRMATION EMAIL UPDATED COMPLETED COMPLETED COMPLETED!${colors.reset}\n`);

  } catch (error) {
    console.error(`\n${colors.red}✖ Error: ${error.message}${colors.reset}\n`);
  }
}

main();
