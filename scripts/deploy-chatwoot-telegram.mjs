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
  console.log('🔄 Deploying Chatwoot Telegram Notification Workflow to n8n...');
  const env = loadEnvLocal();
  
  const apiKey = env['N8N_API_KEY'];
  const botToken = env['TELEGRAM_BOT_TOKEN'];
  const chatId = env['TELEGRAM_CHAT_ID'];

  if (!apiKey || !botToken || !chatId) {
    console.error('✖ Error: Missing N8N_API_KEY, TELEGRAM_BOT_TOKEN, or TELEGRAM_CHAT_ID in .env.local');
    process.exit(1);
  }

  const telegramJsonBody = `={\n  "chat_id": "${chatId}",\n  "text": "💬 *New Guest WhatsApp Message!*\\n\\n👤 *Name*: {{ $('Chatwoot Webhook Trigger').item.json.sender ? $('Chatwoot Webhook Trigger').item.json.sender.name : \\\"Unknown\\\" }}\\n📞 *Phone*: {{ $('Chatwoot Webhook Trigger').item.json.sender ? $('Chatwoot Webhook Trigger').item.json.sender.phone_number : \\\"Unknown\\\" }}\\n\\n💬 *Message*:\\n\\\"{{ $('Chatwoot Webhook Trigger').item.json.content }}\\\"\\n\\n👉 Reply on Chatwoot: https://app.chatwoot.com/app/accounts/{{ $('Chatwoot Webhook Trigger').item.json.account.id }}/inbox/{{ $('Chatwoot Webhook Trigger').item.json.inbox.id }}/conversations/{{ $('Chatwoot Webhook Trigger').item.json.conversation.id }}\",\n  "parse_mode": "Markdown"\n}`;

  const workflowPayload = {
    name: "Chatwoot: Inbound Telegram Alert",
    nodes: [
      {
        parameters: {
          httpMethod: "POST",
          path: "chatwoot-incoming-message",
          options: {}
        },
        id: "chatwoot-webhook-trigger-id",
        name: "Chatwoot Webhook Trigger",
        type: "n8n-nodes-base.webhook",
        typeVersion: 1,
        position: [250, 250]
      },
      {
        parameters: {
          conditions: {
            string: [
              {
                value1: "={{ $json.message_type }}",
                operation: "equal",
                value2: "incoming"
              },
              {
                value1: "={{ $json.event }}",
                operation: "equal",
                value2: "message_created"
              }
            ]
          }
        },
        id: "is-incoming-id",
        name: "Is Incoming Message?",
        type: "n8n-nodes-base.if",
        typeVersion: 1,
        position: [480, 250]
      },
      {
        parameters: {
          method: "POST",
          url: `https://api.telegram.org/bot${botToken}/sendMessage`,
          sendHeaders: false,
          sendBody: true,
          specifyBody: "json",
          jsonBody: telegramJsonBody,
          options: {}
        },
        id: "telegram-alert-id",
        name: "Alert Nathan: Telegram Notification",
        type: "n8n-nodes-base.httpRequest",
        typeVersion: 4.1,
        position: [720, 230]
      }
    ],
    connections: {
      "Chatwoot Webhook Trigger": {
        main: [
          [
            {
              "node": "Is Incoming Message?",
              "type": "main",
              "index": 0
            }
          ]
        ]
      },
      "Is Incoming Message?": {
        main: [
          [
            {
              "node": "Alert Nathan: Telegram Notification",
              "type": "main",
              "index": 0
            }
          ],
          []
        ]
      }
    },
    settings: {
      errorWorkflow: "GlobalErrHandler"
    }
  };

  // 1. Fetch current list of workflows to check for existing one
  let existingId = null;
  try {
    const listRes = await fetch('https://n8n.balidolphintours.com/api/v1/workflows', {
      headers: { 'X-N8N-API-KEY': apiKey }
    });
    if (listRes.ok) {
      const listData = await listRes.json();
      const match = listData.data.find(w => w.name === "Chatwoot: Inbound Telegram Alert");
      if (match) {
        existingId = match.id;
        console.log(`- Found existing workflow with ID: ${existingId}`);
      }
    }
  } catch (err) {
    console.warn('⚠️ Error checking existing workflows:', err.message);
  }

  let finalId = existingId;

  if (existingId) {
    // Update existing workflow
    const updateUrl = `https://n8n.balidolphintours.com/api/v1/workflows/${existingId}`;
    console.log(`- Updating existing workflow at: ${updateUrl}`);
    const res = await fetch(updateUrl, {
      method: 'PUT',
      headers: {
        'X-N8N-API-KEY': apiKey,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(workflowPayload)
    });
    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Failed to update workflow (HTTP ${res.status}): ${errorText}`);
    }
    console.log('✔ Successfully updated workflow JSON.');
  } else {
    // Create new workflow
    const createUrl = 'https://n8n.balidolphintours.com/api/v1/workflows';
    console.log(`- Creating new workflow at: ${createUrl}`);
    const res = await fetch(createUrl, {
      method: 'POST',
      headers: {
        'X-N8N-API-KEY': apiKey,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(workflowPayload)
    });
    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Failed to create workflow (HTTP ${res.status}): ${errorText}`);
    }
    const data = await res.json();
    finalId = data.id;
    console.log(`✔ Successfully created new workflow (ID: ${finalId}).`);
  }

  // 2. Activate the workflow
  console.log(`- Activating the workflow (ID: ${finalId})...`);
  const activateUrl = `https://n8n.balidolphintours.com/api/v1/workflows/${finalId}/activate`;
  const activateRes = await fetch(activateUrl, {
    method: 'POST',
    headers: {
      'X-N8N-API-KEY': apiKey,
      'Content-Type': 'application/json'
    }
  });

  if (activateRes.ok) {
    console.log('\n🎉 SUCCESS! Chatwoot Telegram alert workflow is now ACTIVE and listening! (ID: ' + finalId + ')');
    console.log('\n👉 Production Webhook URL to paste in Chatwoot:');
    console.log(`   https://n8n.balidolphintours.com/webhook/chatwoot-incoming-message`);
  } else {
    const errorText = await activateRes.text();
    console.error('✖ Webhook activation failed:', activateRes.status, errorText);
    process.exit(1);
  }
}

main();
