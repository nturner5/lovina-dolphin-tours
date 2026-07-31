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
  console.log('🔄 Deploying Automated Telegram Booking Alert to Lovina: Semi-Automated Booking Flow...');
  const env = loadEnvLocal();
  
  const apiKey = env['N8N_API_KEY'];
  const botToken = env['TELEGRAM_BOT_TOKEN'];
  const chatId = env['TELEGRAM_CHAT_ID'];

  if (!apiKey || !botToken || !chatId) {
    console.error('✖ Error: Missing required variables in .env.local (N8N_API_KEY, TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID)');
    process.exit(1);
  }

  const workflowId = 'LovinaSemiAutoV1';
  console.log(`\n- Fetching workflow (${workflowId})...`);
  
  try {
    const getRes = await fetch(`https://n8n.balidolphintours.com/api/v1/workflows/${workflowId}`, {
      headers: { 'X-N8N-API-KEY': apiKey }
    });
    
    if (!getRes.ok) {
      throw new Error(`Failed to fetch workflow ${workflowId} (HTTP ${getRes.status})`);
    }
    
    const workflow = await getRes.json();
    
    // Check if the node already exists; if so, filter it out so we can re-add it cleanly
    workflow.nodes = workflow.nodes.filter(n => n.name !== 'Alert Nathan: Telegram New Booking');

    // Create the Telegram Alert node
    const telegramAlertNode = {
      parameters: {
        method: "POST",
        url: `https://api.telegram.org/bot${botToken}/sendMessage`,
        sendBody: true,
        specifyBody: "json",
        jsonBody: "={\n  \"chat_id\": \"" + chatId + "\",\n  \"text\": \"🔔 *New Booking Confirmed!*\\n\\n• *Booking Code*: {{ $('Create Booking Row').item.json.booking_code }}\\n• *Date*: {{ $('Set').item.json.TourDate }}\\n• *Guests*: {{ $('Set').item.json.Guests }}\\n• *Package*: {{ $('Create Booking Row').item.json.tour_id === 'seven-am-ethical' ? 'Dolphin Watching' : ($('Create Booking Row').item.json.tour_id === 'dolphin-swim' ? 'Watching & Swimming' : 'Watch, Swim & Snorkel') }}\\n• *Pickup*: {{ $('Set').item.json.PickupDescription || 'No pickup' }} ({{ $('Set').item.json.Hotel || 'N/A' }})\\n\\n👇 *Copy-Paste to Captain:*\\n```\\nHello, do you have an available private boat for a dolphin tour?\\n\\n• Date: {{ $('Set').item.json.TourDate }}\\n• Time: 7:00 AM\\n• Guests: {{ $('Set').item.json.Guests }} people (Private boat)\\n• Package: {{ $('Create Booking Row').item.json.tour_id === 'seven-am-ethical' ? 'Dolphin Watching' : ($('Create Booking Row').item.json.tour_id === 'dolphin-swim' ? 'Watching & Swimming' : 'Watch, Swim & Snorkel') }}\\n• Transport: {{ $('Set').item.json.PickupDescription && $('Set').item.json.PickupDescription !== 'none' ? $('Set').item.json.PickupDescription : 'None' }}\\n\\nAre you available to run this? Thanks!\\n```\",\n  \"parse_mode\": \"Markdown\"\n}",
        options: {}
      },
      id: "telegram-alert-new-booking-id",
      "name": "Alert Nathan: Telegram New Booking",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.1,
      "position": [
        1600,
        32
      ]
    };

    // Add node to workflow
    workflow.nodes.push(telegramAlertNode);

    // Update connections
    // Connect WhatsApp Alert Nathan -> Alert Nathan: Telegram New Booking
    workflow.connections['WhatsApp Alert Nathan'] = {
      main: [
        [
          {
            node: "Alert Nathan: Telegram New Booking",
            type: "main",
            index: 0
          }
        ]
      ]
    };

    console.log(`- Wired node: 'WhatsApp Alert Nathan' -> 'Alert Nathan: Telegram New Booking'.`);

    // Deactivate first to clear webhook hooks
    console.log(`- Deactivating workflow to clear webhook registrations...`);
    const deactivateRes = await fetch(`https://n8n.balidolphintours.com/api/v1/workflows/${workflowId}/deactivate`, {
      method: 'POST',
      headers: { 'X-N8N-API-KEY': apiKey }
    });
    if (deactivateRes.ok) {
      console.log('✔ Workflow deactivated.');
    } else {
      console.log(`⚠️ Warning: Deactivation returned HTTP ${deactivateRes.status}. Continuing...`);
    }

    const cleanSettings = {};
    if (workflow.settings) {
      if (workflow.settings.errorWorkflow) cleanSettings.errorWorkflow = workflow.settings.errorWorkflow;
      if (workflow.settings.timezone) cleanSettings.timezone = workflow.settings.timezone;
      if (workflow.settings.saveExecutionProgress !== undefined) cleanSettings.saveExecutionProgress = workflow.settings.saveExecutionProgress;
    }

    const updateRes = await fetch(`https://n8n.balidolphintours.com/api/v1/workflows/${workflowId}`, {
      method: 'PUT',
      headers: {
        'X-N8N-API-KEY': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: workflow.name,
        nodes: workflow.nodes,
        connections: workflow.connections,
        settings: cleanSettings
      })
    });
    
    if (!updateRes.ok) {
      const errTxt = await updateRes.text();
      throw new Error(`Failed to update workflow: ${errTxt}`);
    }
    console.log('✔ Workflow updated successfully.');

    // Wait 2 seconds for n8n database hooks to settle
    console.log('⏳ Waiting 2 seconds before activating...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Activate
    console.log(`- Activating workflow (ID: ${workflowId})...`);
    const activateRes = await fetch(`https://n8n.balidolphintours.com/api/v1/workflows/${workflowId}/activate`, {
      method: 'POST',
      headers: { 'X-N8N-API-KEY': apiKey }
    });
    if (activateRes.ok) {
      console.log('✔ Workflow is now ACTIVE!');
    } else {
      const actTxt = await activateRes.text();
      throw new Error(`Failed to activate workflow: ${activateRes.status} - ${actTxt}`);
    }

    console.log('\n🎉 SUCCESS! Automated Telegram Booking Alerts are deployed to production!');
  } catch (err) {
    console.error('✖ Error deploying booking alerts:', err.message);
    process.exit(1);
  }
}

main();
