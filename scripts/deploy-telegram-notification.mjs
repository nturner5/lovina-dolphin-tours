import fs from 'fs';
import path from 'path';

function loadEnvLocal() {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) return {};
  const content = fs.readFileSync(envPath, 'utf8');
  const env = {};
  content.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const firstEquals = trimmed.indexOf('=');
    if (firstEquals === -1) return;
    const key = trimmed.substring(0, firstEquals).trim();
    let val = trimmed.substring(firstEquals + 1).trim();
    if (val.startsWith('"') && val.endsWith('"')) {
      val = val.substring(1, val.length - 1);
    } else if (val.startsWith("'") && val.endsWith("'")) {
      val = val.substring(1, val.length - 1);
    }
    env[key] = val;
  });
  return env;
}

async function main() {
  console.log('🔄 Deploying Telegram incoming notification branch to n8n...');
  const env = loadEnvLocal();
  
  const apiKey = env['N8N_API_KEY'];
  const botToken = env['TELEGRAM_BOT_TOKEN'];
  const chatId = env['TELEGRAM_CHAT_ID'];

  if (!apiKey || !botToken || !chatId) {
    console.error('✖ Error: Missing N8N_API_KEY, TELEGRAM_BOT_TOKEN, or TELEGRAM_CHAT_ID in .env.local');
    process.exit(1);
  }

  // Load the backed-up workflows JSON
  const backupFile = path.resolve(process.cwd(), 'scripts/n8n_public_workflows_backup.json');
  if (!fs.existsSync(backupFile)) {
    console.error(`✖ Error: Backup file not found at ${backupFile}`);
    process.exit(1);
  }

  const backupData = JSON.parse(fs.readFileSync(backupFile, 'utf8'));

  // Find target workflow "Lovina 2: Bidding Claim & Contract Request" (Active one)
  const workflow = backupData.find(w => w.id === 'BksrAXQCChEmzwIV');
  if (!workflow) {
    console.error('✖ Error: Could not find workflow BksrAXQCChEmzwIV in backup file.');
    process.exit(1);
  }

  console.log(`- Loaded workflow: "${workflow.name}" (ID: ${workflow.id})`);

  // 1. Update JS code in "Parse Payload Data"
  const parsePayloadNode = workflow.nodes.find(n => n.name === 'Parse Payload Data');
  if (!parsePayloadNode) {
    console.error('✖ Error: "Parse Payload Data" node not found in workflow.');
    process.exit(1);
  }

  parsePayloadNode.parameters.jsCode = `// Enrich payload variables passed in the button click safely
let body = null;
const json = items[0].json;

if (json && json.entry) {
  body = json;
} else if (json && json.body) {
  if (json.body.entry) {
    body = json.body;
  } else if (json.body.body && json.body.body.entry) {
    body = json.body.body;
  }
}

const output = { ...json };

if (!body || !body.entry || !body.entry[0]) {
  output.isCaptainAction = false;
  output.isGuestMessage = false;
  return [{ json: output }];
}

const change = body.entry[0].changes?.[0];
const value = change?.value;
const messages = value?.messages;

if (!messages || !messages[0]) {
  output.isCaptainAction = false;
  output.isGuestMessage = false;
  return [{ json: output }];
}

const message = messages[0];
const payload = message.button?.payload;

// Check if it's a captain action button click
if (payload && payload.startsWith('claim_')) {
  const parts = payload.split('_');
  if (parts.length >= 4) {
    const bookingCode = parts.slice(1, -2).join('_');
    const captainName = parts[parts.length - 2];
    const captainPhone = parts[parts.length - 1];

    output.isCaptainAction = true;
    output.isGuestMessage = false;
    output.bookingCode = bookingCode;
    output.captainName = captainName;
    output.captainPhone = captainPhone;
    return [{ json: output }];
  }
}

// If messages exist and it's not a captain claim click, it is a guest/customer message!
output.isCaptainAction = false;
output.isGuestMessage = true;
output.guestPhone = message.from || '';
output.guestName = value.contacts?.[0]?.profile?.name || 'Unknown Guest';

// Parse text/message body safely
let textBody = '';
if (message.text && message.text.body) {
  textBody = message.text.body;
} else if (message.button && message.button.text) {
  textBody = message.button.text;
} else if (message.type) {
  textBody = \`[Media/Type: \${message.type}]\`;
} else {
  textBody = '[Empty or Unknown Message]';
}
output.messageText = textBody;

return [{ json: output }];`;

  console.log('✔ Updated "Parse Payload Data" JS logic.');

  // 2. Add or update "Is Guest Message?" IF node
  let isGuestNode = workflow.nodes.find(n => n.name === 'Is Guest Message?');
  if (!isGuestNode) {
    isGuestNode = {
      parameters: {
        conditions: {
          boolean: [
            {
              value1: '={{ $(\'Parse Payload Data\').item.json.isGuestMessage }}',
              value2: true
            }
          ]
        }
      },
      id: '761d710c-99e2-45e0-88df-22ef88b17c80',
      name: 'Is Guest Message?',
      type: 'n8n-nodes-base.if',
      typeVersion: 1,
      position: [272, 448]
    };
    workflow.nodes.push(isGuestNode);
    console.log('✔ Added "Is Guest Message?" IF node.');
  } else {
    isGuestNode.parameters.conditions = {
      boolean: [
        {
          value1: '={{ $(\'Parse Payload Data\').item.json.isGuestMessage }}',
          value2: true
        }
      ]
    };
    console.log('✔ Updated "Is Guest Message?" IF node condition.');
  }

  // 2b. Update "Is Captain Action?" condition to refer directly to Parse Payload Data
  const isCaptainNode = workflow.nodes.find(n => n.name === 'Is Captain Action?');
  if (isCaptainNode) {
    isCaptainNode.parameters.conditions = {
      boolean: [
        {
          value1: '={{ $(\'Parse Payload Data\').item.json.isCaptainAction }}',
          value2: true
        }
      ]
    };
    console.log('✔ Updated "Is Captain Action?" condition to refer to Parse Payload Data.');
  }

  // 3. Add or update "Alert Nathan: Telegram Notification" HTTP Request node
  let telegramNode = workflow.nodes.find(n => n.name === 'Alert Nathan: Telegram Notification');
  const telegramJsonBody = `={\n  "chat_id": "${chatId}",\n  "text": "💬 *New Guest WhatsApp Message!*\\n\\n👤 *Name*: {{ $('Parse Payload Data').item.json.guestName }}\\n📞 *Phone*: +{{ $('Parse Payload Data').item.json.guestPhone }}\\n\\n💬 *Message*:\\n\\\"{{ $('Parse Payload Data').item.json.messageText }}\\\"\\n\\n👉 Reply on Chatwoot: https://app.chatwoot.com",\n  "parse_mode": "Markdown"\n}`;

  if (!telegramNode) {
    telegramNode = {
      parameters: {
        method: 'POST',
        url: `https://api.telegram.org/bot${botToken}/sendMessage`,
        sendHeaders: false,
        sendBody: true,
        specifyBody: 'json',
        jsonBody: telegramJsonBody,
        options: {}
      },
      id: 'c1f7a80b-2df8-4f81-a98f-ee2bf68a30bf',
      name: 'Alert Nathan: Telegram Notification',
      type: 'n8n-nodes-base.httpRequest',
      typeVersion: 4.1,
      position: [496, 448]
    };
    workflow.nodes.push(telegramNode);
    console.log('✔ Added "Alert Nathan: Telegram Notification" node.');
  } else {
    // Update token & chat id parameters
    telegramNode.parameters.url = `https://api.telegram.org/bot${botToken}/sendMessage`;
    telegramNode.parameters.jsonBody = telegramJsonBody;
    console.log('✔ Updated "Alert Nathan: Telegram Notification" configuration.');
  }

  // 4. Update Connections
  // Link "Is Captain Action?" False branch (index 1) to "Is Guest Message?"
  if (!workflow.connections['Is Captain Action?']) {
    workflow.connections['Is Captain Action?'] = { main: [[], []] };
  }
  
  // Clear any existing connections on "Is Captain Action?" output 1 (False) and bind it to "Is Guest Message?"
  workflow.connections['Is Captain Action?'].main[1] = [
    {
      node: 'Is Guest Message?',
      type: 'main',
      index: 0
    }
  ];

  // Link "Is Guest Message?" True branch (index 0) to "Alert Nathan: Telegram Notification"
  workflow.connections['Is Guest Message?'] = {
    main: [
      [
        {
          node: 'Alert Nathan: Telegram Notification',
          type: 'main',
          index: 0
        }
      ],
      []
    ]
  };

  console.log('✔ Configured connection pathways.');

  // 5. Send PUT request to n8n Public API to update and publish the live workflow
  const url = `https://n8n.balidolphintours.com/api/v1/workflows/${workflow.id}`;
  console.log(`- Publishing workflow update to: ${url}`);

  try {
    const res = await fetch(url, {
      method: 'PUT',
      headers: {
        'X-N8N-API-KEY': apiKey,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        name: workflow.name,
        nodes: workflow.nodes,
        connections: workflow.connections,
        settings: {
          errorWorkflow: workflow.settings.errorWorkflow
        }
      })
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Failed to update workflow (HTTP ${res.status}): ${errorText}`);
    }

    const payload = await res.json();
    console.log(`\n🎉 SUCCESS! Telegram notification workflow deployed to production n8n (ID: ${payload.id})`);
  } catch (err) {
    console.error('\n✖ Deployment failed:', err.message);
    process.exit(1);
  }
}

main();
