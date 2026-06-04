import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const colors = {
  reset: '\x1b[0m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  bold: '\x1b[1m',
  yellow: '\x1b[33m'
};

const WORKFLOW_ID = 'FXts3OY9D5wZr0PC'; // Lovina 3

async function main() {
  console.log(`\n${colors.cyan}${colors.bold}🔧 UPDATING GUEST CONFIRMATION COORDINATES IN LOVINA 3...${colors.reset}\n`);

  try {
    // 1. Fetch current workflow from DB
    console.log(`- Fetching Lovina 3 from Postgres...`);
    const query = `SELECT json_build_object('nodes', nodes, 'connections', connections) FROM workflow_entity WHERE id = '${WORKFLOW_ID}';`;
    const command = `docker exec -i n8n-autoscaling-postgres-1 psql -U postgres -d n8n -t -A -c "${query}"`;
    const rawJson = execSync(command).toString().trim();

    if (!rawJson || rawJson === "") {
      throw new Error("No data returned from database.");
    }

    const workflow = JSON.parse(rawJson);
    const nodes = workflow.nodes;

    // 2. Update "Google Calendar Event"
    const calendarNode = nodes.find(n => n.name === 'Google Calendar Event');
    if (!calendarNode) {
      throw new Error("Could not find 'Google Calendar Event' node in Lovina 3.");
    }

    console.log(`- Updating 'Google Calendar Event' node...`);
    calendarNode.parameters.additionalFields.location = 
      `={{ $node["Get Guest & Stripe Details"].json.PickupLocation === "none" ? "Lovina Beach Dolphin Statue (Kalibukbuk) — https://www.google.com/maps/search/?api=1&query=Lovina+Dolphin+Statue" : "Hotel Lobby Pickup: " + $node["Get Guest & Stripe Details"].json.HotelDetails }}`;

    calendarNode.parameters.additionalFields.description = 
      `=🌅 LOVINA ETHICAL MARINE — BOOKING CONFIRMED! ⛵🐬\n\nHi {{ $node["Get Guest & Stripe Details"].json.GuestName }},\n\nYour private vetted outrigger boat is secured for a quiet morning encounter on the Lovina sea!\n\n📅 EXCURSION DETAILS:\n• Booking ID: {{ $node["Get Guest & Stripe Details"].json.BookingCode }}\n• Date: {{ $node["Get Guest & Stripe Details"].json.Date }}\n• Pickup/Meetup Time: {{ $node["Get Guest & Stripe Details"].json.PickupLocation === 'none' ? '7:30 AM (Meet at Beach)' : ($node["Get Guest & Stripe Details"].json.PickupLocation === 'lovina' ? '7:30 AM (Hotel Lobby)' : ($node["Get Guest & Stripe Details"].json.PickupLocation === 'ubud' ? '5:30 AM (Hotel Lobby)' : ($node["Get Guest & Stripe Details"].json.PickupLocation === 'canggu-kuta' ? '5:00 AM (Hotel Lobby)' : '4:30 AM (Hotel Lobby)'))) }}\n• Departure Time: 08:00 AM WITA sharp\n• Guests: {{ $node["Get Guest & Stripe Details"].json.Guests }} People\n• Captain: Captain {{ $node["Captain Signed Webhook"].json.body.captainName }}\n\n📍 ARRANGEMENT DETAILS:\n• Type: {{ $node["Get Guest & Stripe Details"].json.PickupDescription }}\n• Details: {{ $node["Get Guest & Stripe Details"].json.PickupLocation === 'none' ? 'Direct Meetup at the Lovina Beach Dolphin Statue (Kalibukbuk) at 7:30 AM (Google Maps: https://www.google.com/maps/search/?api=1&query=Lovina+Dolphin+Statue). Please meet by the statue, where your captain will welcome you.' : 'Our private return transfer driver will pick you up from: ' + $node["Get Guest & Stripe Details"].json.HotelDetails }}\n\n💬 WHAT'S NEXT?\nYour captain (Captain {{ $node["Captain Signed Webhook"].json.body.captainName }}) will contact you directly via WhatsApp (at {{ $node["Get Guest & Stripe Details"].json.GuestPhone }}) the afternoon before your excursion (by 5:00 PM Bali Time) to confirm water conditions, coordinates, and coordinate final details.\n\n⚓ THE ETHICAL MARINE CONTRACT:\nWe enforce strict ethical boundaries: 30m neutral-engine buffers, no chasing, and parallel tracking only to respect dolphin pods. Thank you for supporting sustainable tourism in North Bali!\n\nSee you on the water! ⛵🐬`;

    // 3. Update "WhatsApp Guest Confirmed"
    const guestWhatsappNode = nodes.find(n => n.name === 'WhatsApp Guest Confirmed');
    if (!guestWhatsappNode) {
      throw new Error("Could not find 'WhatsApp Guest Confirmed' node in Lovina 3.");
    }

    console.log(`- Updating 'WhatsApp Guest Confirmed' node...`);
    const guestWhatsappBody = {
      messaging_product: "whatsapp",
      to: "{{ $node[\"Get Guest & Stripe Details\"].json.GuestPhone }}",
      type: "text",
      text: {
        body: `🌅 Lovina Ethical Marine — Booking Confirmed! ⛵\n\nHi {{ $node["Get Guest & Stripe Details"].json.GuestName }},\n\nThank you for choosing a quiet morning with us! Your private vetted outrigger boat is secured.\n\nExcursion Details:\n• Date: {{ $node["Get Guest & Stripe Details"].json.Date }}\n• Pickup/Meetup: {{ $node["Get Guest & Stripe Details"].json.PickupLocation === 'none' ? '7:30 AM (Meet at Beach)' : ($node["Get Guest & Stripe Details"].json.PickupLocation === 'lovina' ? '7:30 AM (Hotel Lobby)' : ($node["Get Guest & Stripe Details"].json.PickupLocation === 'ubud' ? '5:30 AM (Hotel Lobby)' : ($node["Get Guest & Stripe Details"].json.PickupLocation === 'canggu-kuta' ? '5:00 AM (Hotel Lobby)' : '4:30 AM (Hotel Lobby)'))) }}\n• Departure Time: 08:00 AM sharp\n• Guests: {{ $node["Get Guest & Stripe Details"].json.Guests }} People\n• Transfer: {{ $node["Get Guest & Stripe Details"].json.PickupDescription }}\n\n📍 COORDINATION:\n{{ $node["Get Guest & Stripe Details"].json.PickupLocation === 'none' ? 'We will meet at the Lovina Beach Dolphin Statue (Kalibukbuk) at 7:30 AM. Here is the Google Maps link for directions: https://www.google.com/maps/search/?api=1&query=Lovina+Dolphin+Statue' : 'Our driver will pick you up directly from: ' + $node["Get Guest & Stripe Details"].json.HotelDetails + ' at the time listed above.' }}\n\n🗓️ CALENDAR INVITE SENT:\nWe have sent a Google Calendar invite along with a booking receipt to your email ({{ $node["Get Guest & Stripe Details"].json.GuestEmail }}). Please add it to your calendar for quick offline access to directions.\n\n💬 WHAT'S NEXT:\nPlease look forward to hearing from your captain (Captain {{ $node["Captain Signed Webhook"].json.body.captainName }}) directly via WhatsApp the afternoon before your tour (by 5:00 PM Bali Time) to confirm final water conditions, coordinate pickup details, and share the Google Maps pin.\n\nSee you on the water! 🐬🌊\n\nHere's that Calendar Invite: {{ $('Google Calendar Event').item.json.htmlLink }}`
      }
    };
    guestWhatsappNode.parameters.jsonBody = "=" + JSON.stringify(guestWhatsappBody, null, 2);

    // 4. Update "WhatsApp Unlock Captain" (captain notification)
    const captainWhatsappNode = nodes.find(n => n.name === 'WhatsApp Unlock Captain');
    if (!captainWhatsappNode) {
      throw new Error("Could not find 'WhatsApp Unlock Captain' node in Lovina 3.");
    }

    console.log(`- Updating 'Unlock Captain Details' node...`);
    const captainWhatsappBody = {
      messaging_product: "whatsapp",
      to: "{{ $node[\"Captain Signed Webhook\"].json.body.captainPhone }}",
      type: "text",
      text: {
        body: `🔓 KONTRAK PERILAKU DISETUJUI: Detail Tamu Unlocked 🔓\n\nSelamat Kapten {{ $node["Captain Signed Webhook"].json.body.captainName }}, Anda telah menandatangani kontrak perilaku secara digital. Berikut adalah detail kontak tamu (Mohon hubungi tamu secara profesional atas nama Lovina Ethical Marine):\n\n👤 DETAIL TAMU:\n• Nama Tamu: {{ $node["Get Guest & Stripe Details"].json.GuestName }}\n• WhatsApp Tamu: {{ $node["Get Guest & Stripe Details"].json.GuestPhone }}\n• Email Tamu: {{ $node["Get Guest & Stripe Details"].json.GuestEmail }}\n\n📍 DETAIL PICKUP/JEMPUTAN:\n• Alamat Hotel & No Kamar: {{ $node["Get Guest & Stripe Details"].json.PickupLocation === 'none' ? 'Tidak ada pickup. Bertemu langsung di Pantai (Patung Lumba-Lumba Kalibukbuk) jam 07:30 AM.' : $node["Get Guest & Stripe Details"].json.HotelDetails }}\n\nMohon koordinasikan dengan tamu via WhatsApp sore sebelum keberangkatan (paling lambat jam 17:00 WITA) untuk konfirmasi cuaca dan koordinasi penjemputan.\n\nTerima kasih, selamat bertugas menjaga kelestarian laut Lovina! 🐬🌅`
      }
    };
    captainWhatsappNode.parameters.jsonBody = "=" + JSON.stringify(captainWhatsappBody, null, 2);

    // 5. Build SQL query and write to temp file
    console.log(`- Preparing SQL injection query...`);
    const nodesJsonStr = JSON.stringify(nodes).replace(/'/g, "''");
    const sqlFile = path.resolve(process.cwd(), 'scripts/update_guest_coordinates.sql');
    
    // We update both workflow_entity (primary) and workflow_history (latest history entry)
    const sqlQuery = `
      UPDATE workflow_entity SET nodes = '${nodesJsonStr}'::jsonb WHERE id = '${WORKFLOW_ID}';
      UPDATE workflow_history SET nodes = '${nodesJsonStr}'::jsonb WHERE "versionId" = (SELECT "activeVersionId" FROM workflow_entity WHERE id = '${WORKFLOW_ID}');
    `;
    fs.writeFileSync(sqlFile, sqlQuery, 'utf8');

    // 6. Copy and execute SQL in Postgres container
    console.log(`- Executing SQL script inside container...`);
    execSync(`docker cp ${sqlFile} n8n-autoscaling-postgres-1:/tmp/update_guest_coordinates.sql`);
    const dbOutput = execSync(`docker exec -i n8n-autoscaling-postgres-1 psql -U postgres -d n8n -f /tmp/update_guest_coordinates.sql`).toString();
    console.log(dbOutput.trim());

    // Clean up sql file
    fs.unlinkSync(sqlFile);

    // 7. Restart n8n webhook and editor to load changes
    console.log(`- Restarting n8n services to reload configuration...`);
    execSync(`docker restart n8n-autoscaling-n8n-webhook-1 n8n-autoscaling-n8n-1`);

    console.log(`\n${colors.green}${colors.bold}✔ GUEST COORDINATES IN LOVINA 3 UPDATED SUCCESSFULLY!${colors.reset}\n`);

  } catch (error) {
    console.error(`\n${colors.red}✖ Error: ${error.message}${colors.reset}\n`);
  }
}

main();
