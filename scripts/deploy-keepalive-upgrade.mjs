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
  console.log('🔄 Upgrading Supabase Keep-Alive and Global Error Handler...');
  const env = loadEnvLocal();
  
  const apiKey = env['N8N_API_KEY'];
  const botToken = env['TELEGRAM_BOT_TOKEN'];
  const chatId = env['TELEGRAM_CHAT_ID'];

  if (!apiKey || !botToken || !chatId) {
    console.error('✖ Error: Missing required variables in .env.local (N8N_API_KEY, TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID)');
    process.exit(1);
  }

  // ==========================================
  // STEP 1: Upgrade Supabase Keep-Alive Cron
  // ==========================================
  const cronId = 'b5CZ57rRyo2yHK9S';
  console.log(`\n- Fetching workflow Supabase Keep-Alive Cron (${cronId})...`);
  
  try {
    const getRes = await fetch(`https://n8n.balidolphintours.com/api/v1/workflows/${cronId}`, {
      headers: { 'X-N8N-API-KEY': apiKey }
    });
    
    if (!getRes.ok) {
      throw new Error(`Failed to fetch cron workflow (HTTP ${getRes.status})`);
    }
    
    const workflow = await getRes.json();
    
    // 1. Update Schedule Trigger to 12 hours
    const triggerNode = workflow.nodes.find(n => n.type === 'n8n-nodes-base.scheduleTrigger');
    if (triggerNode) {
      triggerNode.parameters = {
        rule: {
          interval: [
            {
              field: "hours",
              hoursInterval: 12
            }
          ]
        }
      };
      console.log('✔ Updated Schedule Trigger to run every 12 hours.');
    }
    
    // 2. Update Supabase Query node to perform write (INSERT) operation
    const queryNode = workflow.nodes.find(n => n.name === 'Supabase Query');
    if (queryNode) {
      queryNode.parameters = {
        operation: "insert",
        table: "keep_alive",
        fields: {
          dummy: "ping"
        }
      };
      console.log('✔ Updated Supabase Query node to perform INSERT on table "keep_alive".');
    }
    
    // Clean settings
    const cleanSettings = {};
    if (workflow.settings) {
      if (workflow.settings.errorWorkflow) cleanSettings.errorWorkflow = workflow.settings.errorWorkflow;
      if (workflow.settings.timezone) cleanSettings.timezone = workflow.settings.timezone;
    }

    const updateRes = await fetch(`https://n8n.balidolphintours.com/api/v1/workflows/${cronId}`, {
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
      throw new Error(`Failed to update Cron: ${await updateRes.text()}`);
    }
    
    // Activate it
    console.log('- Re-activating Cron workflow...');
    await fetch(`https://n8n.balidolphintours.com/api/v1/workflows/${cronId}/activate`, {
      method: 'POST',
      headers: { 'X-N8N-API-KEY': apiKey }
    });
    console.log('✔ Supabase Keep-Alive Cron is updated and active.');
    
  } catch (err) {
    console.error('✖ Error upgrading Cron:', err.message);
    process.exit(1);
  }

  // ==========================================
  // STEP 2: Upgrade Global Error Handler
  // ==========================================
  const errId = 'GlobalErrHandler';
  console.log(`\n- Fetching workflow Global Error Handler (${errId})...`);
  
  try {
    const getRes = await fetch(`https://n8n.balidolphintours.com/api/v1/workflows/${errId}`, {
      headers: { 'X-N8N-API-KEY': apiKey }
    });
    
    if (!getRes.ok) {
      throw new Error(`Failed to fetch Global Error Handler (HTTP ${getRes.status})`);
    }
    
    const workflow = await getRes.json();
    
    // Check if Telegram node already exists, if so filter it out
    workflow.nodes = workflow.nodes.filter(n => n.name !== 'Alert Admin: Telegram System Error');
    
    // Add Telegram node
    const telegramNode = {
      parameters: {
        method: "POST",
        url: `https://api.telegram.org/bot${botToken}/sendMessage`,
        sendHeaders: false,
        sendBody: true,
        specifyBody: "json",
        jsonBody: `={\n  "chat_id": "${chatId}",\n  "text": "🚨 *n8n SYSTEM ERROR ALERT* 🚨\\n\\n• *Workflow*: {{ $json.workflow.name }} (ID: \`{{ $json.workflow.id }}\`)\\n• *Node*: {{ $json.execution.error ? $json.execution.error.node.name : \\\"Unknown\\\" }}\\n• *Message*: \`{{ $json.execution.error ? $json.execution.error.message : \\\"No error message\\\" }}\`\\n\\n🔗 *Check Execution Log*:\\n{{ $json.execution.url }}",\n  "parse_mode": "Markdown"\n}`,
        options: {}
      },
      id: "telegram-error-alert-id",
      name: "Alert Admin: Telegram System Error",
      type: "n8n-nodes-base.httpRequest",
      typeVersion: 4.1,
      position: [544, 384]
    };
    
    workflow.nodes.push(telegramNode);
    
    // Update connections to trigger BOTH Brevo and Telegram nodes in parallel
    workflow.connections['Error Trigger'] = {
      main: [
        [
          {
            node: "Alert Admin: Gmail System Error",
            type: "main",
            index: 0
          },
          {
            node: "Alert Admin: Telegram System Error",
            type: "main",
            index: 0
          }
        ]
      ]
    };
    
    console.log('✔ Connected Telegram System Error alert node in parallel with Brevo.');
    
    // Clean settings
    const cleanSettings = {};
    if (workflow.settings) {
      if (workflow.settings.errorWorkflow) cleanSettings.errorWorkflow = workflow.settings.errorWorkflow;
      if (workflow.settings.timezone) cleanSettings.timezone = workflow.settings.timezone;
    }

    const updateRes = await fetch(`https://n8n.balidolphintours.com/api/v1/workflows/${errId}`, {
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
      throw new Error(`Failed to update Global Error Handler: ${await updateRes.text()}`);
    }
    
    // Activate it
    console.log('- Re-activating Global Error Handler...');
    await fetch(`https://n8n.balidolphintours.com/api/v1/workflows/${errId}/activate`, {
      method: 'POST',
      headers: { 'X-N8N-API-KEY': apiKey }
    });
    console.log('✔ Global Error Handler is updated and active.');
    
  } catch (err) {
    console.error('✖ Error upgrading Global Error Handler:', err.message);
    process.exit(1);
  }

  console.log('\n🎉 SUCCESS! All keep-alive and error notification upgrades deployed successfully!');
}

main();
