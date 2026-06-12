import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { randomUUID } from 'crypto';

const colors = {
  reset: '\x1b[0m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  bold: '\x1b[1m'
};

const WORKFLOW_ID = 'LovinaSemiAutoV1';
const VERSION_ID = randomUUID();

// Define nodes for hosted environment (uses Brevo HTTP node instead of Gmail node)
const nodes = [
  {
    "parameters": {
      "httpMethod": "POST",
      "path": "stripe-webhook",
      "options": {}
    },
    "id": "7a23a184-db90-45a0-97d7-ff0df174cbbd",
    "name": "Webhook",
    "type": "n8n-nodes-base.webhook",
    "position": [
      100,
      300
    ],
    "webhookId": "c42c49a4-3c67-4628-a012-1332feb93329",
    "typeVersion": 2.1
  },
  {
    "parameters": {
      "options": {},
      "assignments": {
        "assignments": [
          {
            "id": "asgn-1",
            "name": "GuestName",
            "type": "string",
            "value": "={{ $json.body.data.object.customer_details.name }}"
          },
          {
            "id": "asgn-2",
            "name": "GuestEmail",
            "type": "string",
            "value": "={{ $json.body.data.object.customer_details.email }}"
          },
          {
            "id": "asgn-3",
            "name": "GuestPhone",
            "type": "string",
            "value": "={{ $json.body.data.object.metadata.whatsappNumber }}"
          },
          {
            "id": "asgn-4",
            "name": "BookingCode",
            "type": "string",
            "value": "={{ $json.body.data.object.metadata.bookingCode }}"
          },
          {
            "id": "asgn-5",
            "name": "TourDate",
            "type": "string",
            "value": "={{ $json.body.data.object.metadata.date }}"
          },
          {
            "id": "asgn-6",
            "name": "Guests",
            "type": "string",
            "value": "={{ $json.body.data.object.metadata.guests }}"
          },
          {
            "id": "asgn-7",
            "name": "Hotel",
            "type": "string",
            "value": "={{ $json.body.data.object.metadata.hotelDetails }}"
          },
          {
            "id": "asgn-8",
            "name": "PickupDescription",
            "type": "string",
            "value": "={{ $json.body.data.object.metadata.pickupDescription }}"
          },
          {
            "id": "asgn-9",
            "name": "PickupLocation",
            "type": "string",
            "value": "={{ $json.body.data.object.metadata.pickupLocation }}"
          }
        ]
      }
    },
    "id": "6250a92c-5c1a-4e46-bd79-e300d80587fb",
    "name": "Set",
    "type": "n8n-nodes-base.set",
    "position": [
      300,
      300
    ],
    "typeVersion": 3.4
  },
  {
    "parameters": {
      "calendar": {
        "__rl": true,
        "mode": "list",
        "value": "nthn6828@gmail.com",
        "cachedResultName": "nthn6828@gmail.com"
      },
      "summary": "=⛵ Private Dolphin Tour (Bali Dolphin Tours) — {{ $json.GuestName }}",
      "start": "={{ $json.TourDate }}T08:00:00+08:00",
      "end": "={{ $json.TourDate }}T11:30:00+08:00",
      "additionalFields": {
        "attendees": [
          "={{ $json.GuestEmail }}"
        ],
        "description": "=🌅 BALI DOLPHIN TOURS — BOOKING CONFIRMED! ⛵🐬\n\nHi {{ $json.GuestName }},\n\nYour private vetted outrigger boat is secured for a quiet morning encounter on the Lovina sea!\n\n📅 EXCURSION DETAILS:\n• Booking ID: {{ $json.BookingCode }}\n• Date: {{ $json.TourDate }}\n• Meetup/Pickup Time: {{ $json.PickupLocation === 'none' ? '7:30 AM (Meet at Beach)' : ($json.PickupLocation === 'lovina' ? '7:30 AM (Hotel Lobby)' : ($json.PickupLocation === 'ubud' ? '5:30 AM (Hotel Lobby)' : ($json.PickupLocation === 'canggu-kuta' ? '5:00 AM (Hotel Lobby)' : '4:30 AM (Hotel Lobby)'))) }}\n• Departure Time: 08:00 AM WITA sharp\n• Guests: {{ $json.Guests }} People\n\n📍 ARRANGEMENT DETAILS:\n• Type: {{ $json.PickupDescription }}\n• Details: {{ $json.PickupLocation === 'none' ? 'Direct Meetup at the Lovina Beach Dolphin Statue (Kalibukbuk) at 7:30 AM (Google Maps: https://www.google.com/maps/search/?api=1&query=Lovina+Dolphin+Statue). Please meet by the statue.' : 'Our private return transfer driver will pick you up from: ' + $json.Hotel }}\n\n💬 WHAT'S NEXT?\nOur team will contact you directly via WhatsApp (at {{ $json.GuestPhone }}) the afternoon before your excursion (by 5:00 PM Bali Time) to confirm water conditions, driver details, and final coordination.\n\n⚓ THE ETHICAL PROMISE:\nWe are dedicated to sustainable tourism. Our captains operate under a strict code of behavior: keeping a 30-meter buffer, keeping a safe parallel distance, and never chasing or swarming pods. Thank you for supporting ethical dolphin tours in Lovina!\n\nSee you on the water! ⛵🐬",
        "location": "={{ $json.PickupLocation === \"none\" ? \"Lovina Beach Dolphin Statue (Kalibukbuk) — https://www.google.com/maps/search/?api=1&query=Lovina+Dolphin+Statue\" : \"Hotel Lobby Pickup: \" + $json.Hotel }}"
      }
    },
    "id": "c5a439d5-ce34-4a1a-98c0-fe1fd52e4c64",
    "name": "Google Calendar Event",
    "type": "n8n-nodes-base.googleCalendar",
    "position": [
      500,
      300
    ],
    "typeVersion": 1.2,
    "credentials": {
      "googleCalendarOAuth2Api": {
        "id": "WX8uiiTgVXodmWgH",
        "name": "Google Calendar account"
      }
    },
    "onError": "continueErrorOutput"
  },
  {
    "parameters": {
      "method": "POST",
      "url": "https://api.brevo.com/v3/smtp/email",
      "sendHeaders": true,
      "headerParameters": {
        "parameters": [
          {
            "name": "api-key",
            "value": "BREVO_API_KEY_PLACEHOLDER"
          },
          {
            "name": "Content-Type",
            "value": "application/json"
          }
        ]
      },
      "sendBody": true,
      "specifyBody": "json",
      "jsonBody": "={\n  \"sender\": { \"name\": \"Bali Dolphin Tours\", \"email\": \"booking@balidolphintours.com\" },\n  \"to\": [ { \"email\": \"{{ $json.GuestEmail }}\", \"name\": \"{{ $json.GuestName }}\" } ],\n  \"subject\": \"Confirmed: Your Private Dolphin Excursion on {{ $json.TourDate }} ⛵\",\n  \"textContent\": \"🌅 BALI DOLPHIN TOURS — BOOKING CONFIRMED! ⛵🐬\\n\\nHi {{ $json.GuestName }},\\n\\nThank you for booking a private, ethical dolphin tour with Bali Dolphin Tours! Your private outrigger boat is secured for a quiet morning encounter on the sea.\\n\\n📅 EXCURSION DETAILS:\\n• Booking ID: {{ $json.BookingCode }}\\n• Date: {{ $json.TourDate }}\\n• Meetup/Pickup Time: {{ $json.PickupLocation === 'none' ? '7:30 AM (Meet at Beach)' : ($json.PickupLocation === 'lovina' ? '7:30 AM (Hotel Lobby)' : ($json.PickupLocation === 'ubud' ? '5:30 AM (Hotel Lobby)' : ($json.PickupLocation === 'canggu-kuta' ? '5:00 AM (Hotel Lobby)' : '4:30 AM (Hotel Lobby)'))) }}\\n• Departure Time: 08:00 AM WITA sharp\\n• Guests: {{ $json.Guests }} People\\n\\n📍 LOCATION & COORDINATION:\\n• Transfer Option: {{ $json.PickupDescription }}\\n• Specifics: {{ $json.PickupLocation === 'none' ? 'Direct Meetup at the Lovina Beach Dolphin Statue (Kalibukbuk) at 7:30 AM. Here is the Google Maps link for directions: https://www.google.com/maps/search/?api=1&query=Lovina+Dolphin+Statue. Your captain will meet you by the statue.' : 'Our driver will pick you up directly from: ' + $json.Hotel }}\\n\\n💬 WHAT'S NEXT?\\nOur team will contact you directly via WhatsApp (at {{ $json.GuestPhone }}) the afternoon before your excursion (by 5:00 PM Bali Time) to confirm water conditions and coordinate driver details.\\n\\n⚓ THE ETHICAL PROMISE:\\nWe are dedicated to sustainable tourism. Our captains operate under a strict code of behavior: keeping a 30-meter buffer, keeping a safe parallel distance, and never chasing or swarming pods. Thank you for supporting ethical dolphin tours in Lovina!\\n\\nSee you on the water! ⛵🐬\\nBali Dolphin Tours Team\"\n}",
      "options": {}
    },
    "id": "d5a439d5-ce34-4a1a-98c0-fe1fd52e4c64",
    "name": "Send Guest Email Receipt",
    "type": "n8n-nodes-base.httpRequest",
    "position": [
      700,
      300
    ],
    "typeVersion": 4.1,
    "onError": "continueRegularOutput"
  },
  {
    "parameters": {
      "method": "POST",
      "url": "https://graph.facebook.com/v19.0/1204724732717395/messages",
      "sendHeaders": true,
      "headerParameters": {
        "parameters": [
          {
            "name": "Authorization",
            "value": "Bearer EAAW3tqcsDUIBRh1XTAxJ7EWIoTUPtJx1ZCeCczfZCxrtjPALOjZCS3VfNsgPi5JDruY7b3S5YBdwPHqyZAbr0SfwAPk85ysykZABx9TkipmiQsSRHoLAJxfvML53trnk4Ej7N9QyojyiaXUZB3qLM4GQpUZClFbYq3L6ZCWFb604VlrtaPcgeNZCQY4lwiUNNewZDZD"
          },
          {
            "name": "Content-Type",
            "value": "application/json"
          }
        ]
      },
      "sendBody": true,
      "specifyBody": "json",
      "jsonBody": "={\n  \"messaging_product\": \"whatsapp\",\n  \"recipient_type\": \"individual\",\n  \"to\": \"{{ $json.GuestPhone }}\",\n  \"type\": \"template\",\n  \"template\": {\n    \"name\": \"lem_guest_confirmation_v2\",\n    \"language\": {\n      \"code\": \"en_US\"\n    },\n    \"components\": [\n      {\n        \"type\": \"body\",\n        \"parameters\": [\n          { \"type\": \"text\", \"text\": \"{{ $json.GuestName }}\" },\n          { \"type\": \"text\", \"text\": \"{{ $json.TourDate }}\" },\n          { \"type\": \"text\", \"text\": \"{{ $json.Guests }}\" },\n          { \"type\": \"text\", \"text\": \"Private Anti-Sunrise Dolphin Encounter\" },\n          { \"type\": \"text\", \"text\": \"{{ $json.PickupLocation === 'none' ? 'Self-Drive (Meet at 7:30 AM)' : $json.PickupDescription + ' (' + $json.Hotel + ')' }}\" }\n        ]\n      }\n    ]\n  }\n}",
      "options": {}
    },
    "id": "e5a439d5-ce34-4a1a-98c0-fe1fd52e4c64",
    "name": "WhatsApp Guest Confirmed",
    "type": "n8n-nodes-base.httpRequest",
    "position": [
      900,
      300
    ],
    "typeVersion": 4
  },
  {
    "parameters": {
      "method": "POST",
      "url": "https://graph.facebook.com/v19.0/1204724732717395/messages",
      "sendHeaders": true,
      "headerParameters": {
        "parameters": [
          {
            "name": "Authorization",
            "value": "Bearer EAAW3tqcsDUIBRh1XTAxJ7EWIoTUPtJx1ZCeCczfZCxrtjPALOjZCS3VfNsgPi5JDruY7b3S5YBdwPHqyZAbr0SfwAPk85ysykZABx9TkipmiQsSRHoLAJxfvML53trnk4Ej7N9QyojyiaXUZB3qLM4GQpUZClFbYq3L6ZCWFb604VlrtaPcgeNZCQY4lwiUNNewZDZD"
          },
          {
            "name": "Content-Type",
            "value": "application/json"
          }
        ]
      },
      "sendBody": true,
      "specifyBody": "json",
      "jsonBody": "={\n  \"messaging_product\": \"whatsapp\",\n  \"recipient_type\": \"individual\",\n  \"to\": \"6285190422839\",\n  \"type\": \"text\",\n  \"text\": {\n    \"body\": \"🚨 NEW BOOKING SUCCESSFUL! 🐬⛵\\n\\n• Code: {{ $json.BookingCode }}\\n• Name: {{ $json.GuestName }}\\n• Date: {{ $json.TourDate }}\\n• Guests: {{ $json.Guests }} pax\\n• Phone: {{ $json.GuestPhone }}\\n• Hotel: {{ $json.Hotel }}\\n• Transfer: {{ $json.PickupDescription }}\\n\\n👉 Assign captain manually now!\"\n  }\n}",
      "options": {}
    },
    "id": "f5a439d5-ce34-4a1a-98c0-fe1fd52e4c64",
    "name": "WhatsApp Alert Nathan",
    "type": "n8n-nodes-base.httpRequest",
    "position": [
      1100,
      300
    ],
    "typeVersion": 4
  }
];

// Define connections
const connections = {
  "Webhook": {
    "main": [
      [
        {
          "node": "Set",
          "type": "main",
          "index": 0
        }
      ]
    ]
  },
  "Set": {
    "main": [
      [
        {
          "node": "Google Calendar Event",
          "type": "main",
          "index": 0
        }
      ]
    ]
  },
  "Google Calendar Event": {
    "main": [
      [
        {
          "node": "Send Guest Email Receipt",
          "type": "main",
          "index": 0
        }
      ]
    ]
  },
  "Send Guest Email Receipt": {
    "main": [
      [
        {
          "node": "WhatsApp Guest Confirmed",
          "type": "main",
          "index": 0
        }
      ]
    ]
  },
  "WhatsApp Guest Confirmed": {
    "main": [
      [
        {
          "node": "WhatsApp Alert Nathan",
          "type": "main",
          "index": 0
        }
      ]
    ]
  }
};

async function main() {
  console.log(`\n${colors.cyan}${colors.bold}🔧 CREATING AND DEPLOYING SEMI-AUTOMATED BOOKING WORKFLOW TO HOSTED N8N...${colors.reset}\n`);

  try {
    const nodesJsonStr = JSON.stringify(nodes).replace(/'/g, "''");
    const connectionsJsonStr = JSON.stringify(connections).replace(/'/g, "''");

    const sqlQuery = `
      -- Delete existing if exists in SQLite database
      UPDATE workflow_entity SET "activeVersionId" = NULL WHERE id = '${WORKFLOW_ID}';
      DELETE FROM workflow_history WHERE "workflowId" = '${WORKFLOW_ID}';
      DELETE FROM workflow_entity WHERE id = '${WORKFLOW_ID}';

      -- 1. Insert workflow entity first, with activeVersionId = NULL
      INSERT INTO workflow_entity (
        id,
        name,
        active,
        nodes,
        connections,
        settings,
        meta,
        "versionId",
        "activeVersionId",
        "createdAt",
        "updatedAt",
        "isArchived",
        "versionCounter"
      ) VALUES (
        '${WORKFLOW_ID}',
        'Lovina: Semi-Automated Booking Flow',
        0,
        '${nodesJsonStr}',
        '${connectionsJsonStr}',
        '{"executionOrder":"v1"}',
        '{}',
        '${VERSION_ID}',
        NULL,
        datetime('now'),
        datetime('now'),
        0,
        1
      );

      -- 2. Insert workflow history
      INSERT INTO workflow_history (
        "versionId",
        "workflowId",
        name,
        nodes,
        connections,
        authors,
        autosaved,
        description,
        "createdAt",
        "updatedAt"
      ) VALUES (
        '${VERSION_ID}',
        '${WORKFLOW_ID}',
        'Lovina: Semi-Automated Booking Flow',
        '${nodesJsonStr}',
        '${connectionsJsonStr}',
        'antigravity-cli',
        0,
        'Semi-automated booking confirmation workflow for guests and admin alerts.',
        datetime('now'),
        datetime('now')
      );

      -- 3. Update workflow_entity to set activeVersionId
      UPDATE workflow_entity SET "activeVersionId" = '${VERSION_ID}' WHERE id = '${WORKFLOW_ID}';

      -- 4. Insert sharing relationship so it is visible in n8n UI
      DELETE FROM shared_workflow WHERE "workflowId" = '${WORKFLOW_ID}';
      INSERT INTO shared_workflow (
        "workflowId",
        "projectId",
        role,
        "createdAt",
        "updatedAt"
      ) VALUES (
        '${WORKFLOW_ID}',
        (SELECT "projectId" FROM shared_workflow LIMIT 1),
        'workflow:owner',
        datetime('now'),
        datetime('now')
      );
    `;

    const localSqlFile = path.resolve(process.cwd(), 'scripts/create_semi_automated_remote.sql');
    fs.writeFileSync(localSqlFile, sqlQuery, 'utf8');

    console.log(`- Copying SQL script to hosted VM...`);
    execSync(`gcloud compute scp ${localSqlFile} n8n-server:/tmp/create_semi_automated_remote.sql --zone=us-central1-a`);

    console.log(`- Executing SQL script in hosted SQLite database...`);
    const sqlCommand = `sudo sqlite3 /var/lib/docker/volumes/n8n-docker_n8n_data/_data/database.sqlite < /tmp/create_semi_automated_remote.sql`;
    const executionOutput = execSync(`gcloud compute ssh n8n-server --zone=us-central1-a --command="${sqlCommand}"`).toString();
    console.log(executionOutput ? executionOutput.trim() : '- Database commands executed successfully.');

    // Clean up local SQL file
    fs.unlinkSync(localSqlFile);

    console.log(`- Restarting hosted n8n service to reload database...`);
    execSync(`gcloud compute ssh n8n-server --zone=us-central1-a --command="sudo docker restart n8n-docker-n8n-1"`);

    console.log(`\n${colors.green}${colors.bold}✔ SEMI-AUTOMATED BOOKING WORKFLOW DEPLOYED SUCCESSFULLY TO HOSTED N8N!${colors.reset}\n`);

  } catch (error) {
    console.error(`${colors.red}✖ Error: ${error.message}${colors.reset}`);
  }
}

main();
