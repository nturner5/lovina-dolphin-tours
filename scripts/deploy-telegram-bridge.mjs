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
  console.log('🔄 Upgrading Telegram-to-WhatsApp Support Bridge with /quote generator...');
  const env = loadEnvLocal();
  
  const apiKey = env['N8N_API_KEY'];
  const botToken = env['TELEGRAM_BOT_TOKEN'];
  const chatId = env['TELEGRAM_CHAT_ID'];
  const phoneId = env['META_PHONE_NUMBER_ID'];
  const metaToken = env['META_ACCESS_TOKEN'];
  const adminPassword = env['ADMIN_PASSWORD'] || 'Blhuanca15!';

  if (!apiKey || !botToken || !chatId || !phoneId || !metaToken) {
    console.error('✖ Error: Missing required variables in .env.local (N8N_API_KEY, TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, META_PHONE_NUMBER_ID, META_ACCESS_TOKEN)');
    process.exit(1);
  }

  // ==========================================
  // STEP 1: Update Lovina 2 (Bypass Chatwoot)
  // ==========================================
  const lovina2Id = 'BksrAXQCChEmzwIV';
  console.log(`\n- Fetching workflow Lovina 2 (${lovina2Id})...`);
  
  try {
    const getRes = await fetch(`https://n8n.balidolphintours.com/api/v1/workflows/${lovina2Id}`, {
      headers: { 'X-N8N-API-KEY': apiKey }
    });
    
    if (!getRes.ok) {
      throw new Error(`Failed to fetch Lovina 2 workflow (HTTP ${getRes.status})`);
    }
    
    const workflow = await getRes.json();
    
    // Filter out 'Forward to Chatwoot' node
    workflow.nodes = workflow.nodes.filter(n => n.name !== 'Forward to Chatwoot');
    
    // Rewire connections: Parse Payload Data -> Is Captain Action?
    delete workflow.connections['Forward to Chatwoot'];
    
    workflow.connections['Parse Payload Data'] = {
      main: [
        [
          {
            node: "Is Captain Action?",
            type: "main",
            index: 0
          }
        ]
      ]
    };
    
    console.log(`- Rewired Lovina 2: 'Parse Payload Data' -> 'Is Captain Action?' (Chatwoot bypassed).`);
    
    const cleanSettings = {};
    if (workflow.settings) {
      if (workflow.settings.errorWorkflow) cleanSettings.errorWorkflow = workflow.settings.errorWorkflow;
      if (workflow.settings.timezone) cleanSettings.timezone = workflow.settings.timezone;
      if (workflow.settings.saveExecutionProgress !== undefined) cleanSettings.saveExecutionProgress = workflow.settings.saveExecutionProgress;
    }

    const updateRes = await fetch(`https://n8n.balidolphintours.com/api/v1/workflows/${lovina2Id}`, {
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
      throw new Error(`Failed to update Lovina 2: ${errTxt}`);
    }
    console.log('✔ Lovina 2 updated successfully.');
  } catch (err) {
    console.error('✖ Error updating Lovina 2:', err.message);
    process.exit(1);
  }

  // ==========================================
  // STEP 2: Create Upgraded Telegram Reply Bridge Workflow (With Command Dispatcher, /pay & /quote)
  // ==========================================
  console.log('\n- Creating Telegram Reply & Checkout Bridge workflow...');
  
  const bridgePayload = {
    name: "Telegram: WhatsApp Reply Bridge",
    nodes: [
      {
        parameters: {
          httpMethod: "POST",
          path: "telegram-reply-callback",
          options: {}
        },
        id: "tg-webhook-trigger-id",
        name: "Telegram Webhook Trigger",
        type: "n8n-nodes-base.webhook",
        typeVersion: 1,
        position: [100, 250]
      },
      {
        parameters: {
          jsCode: `const message = items[0].json.body?.message;
if (!message) {
  return [{
    json: {
      isCommand: false,
      isDraft: false,
      isQuote: false,
      isReply: false
    }
  }];
}

const text = message.text || '';
const isCommand = /^\\/(draft|template|pay|link|create_booking|quote)/i.test(text);
const isDraft = /^\\/(draft|template)/i.test(text);
const isQuote = /^\\/quote/i.test(text);
const isReply = !!(message.reply_to_message?.text && message.reply_to_message.text.match(/📞 Phone:\\s*\\+?(\\d+)/));

return [{
  json: {
    isCommand,
    isDraft,
    isQuote,
    isReply,
    body: items[0].json.body
  }
}];`
        },
        id: "check-message-id",
        name: "Check Message",
        type: "n8n-nodes-base.code",
        typeVersion: 2,
        position: [300, 250]
      },
      {
        parameters: {
          conditions: {
            boolean: [
              {
                value1: "={{ $json.isCommand }}",
                value2: true
              }
            ]
          }
        },
        id: "is-command-id",
        name: "Is Command?",
        type: "n8n-nodes-base.if",
        typeVersion: 1,
        position: [500, 150]
      },
      {
        parameters: {
          conditions: {
            boolean: [
              {
                value1: "={{ $json.isDraft }}",
                value2: true
              }
            ]
          }
        },
        id: "is-draft-cmd-id",
        name: "Is /draft Command?",
        type: "n8n-nodes-base.if",
        typeVersion: 1,
        position: [700, 50]
      },
      {
        parameters: {
          conditions: {
            boolean: [
              {
                value1: "={{ $json.isQuote }}",
                value2: true
              }
            ]
          }
        },
        id: "is-quote-cmd-id",
        name: "Is /quote Command?",
        type: "n8n-nodes-base.if",
        typeVersion: 1,
        position: [700, 200]
      },
      {
        parameters: {
          method: "POST",
          url: `https://api.telegram.org/bot${botToken}/sendMessage`,
          sendBody: true,
          specifyBody: "json",
          jsonBody: "={\n  \"chat_id\": \"{{ $json.body.message.chat.id }}\",\n  \"text\": \"📋 *Captain & Driver Templates* (Tap code blocks to copy):\\n\\n*1. Captain Availability Check*\\n```\\nHello, do you have an available private boat for a customer of mine for a dolphin tour?\\n\\n• Date: \\n• Time:  (7:00 AM / 8:00 AM)\\n• Guests:   people (Private boat)\\n• Package: \\n• Transport: \\n• Breakfast: Coffee and fruit included\\n\\nAre you available to run this? Thanks!\\n```\\n\\n*2. Confirmed Booking Details (Captain)*\\n```\\nThanks. Here are the guest details:\\n\\n• Tour Time: \\n• Guest Name: \\n• Total:  people (Private boat tour)\\n• Package: \\n• Breakfast: Coffee and fruit included\\n• Guest WA Contact: \\n\\n*Driver Pickup:*\\n• Pickup Location: \\n• Pickup Time: \\n\\nPlease let me know once you have contacted the guest. Thanks!\\n```\\n\\n*3. Driver Request (English)*\\n```\\nHello, do you have an available driver for a customer transfer?\\n\\n• Date: \\n• Route: \\n• Pickup Time: \\n• Guest Name: \\n• Guest WA Contact: \\n• Pickup Location: \\n• Drop Location: \\n• Note: The customer will likely stop at 2-3 sightseeing spots along the way.\\n\\nCan you do this route? Thanks!\\n```\\n\\n*4. Driver Request (Bahasa Indonesia)*\\n```\\nHalo Bli, ada driver kosong untuk transfer tamu?\\n\\n• Tanggal: \\n• Rute: \\n• Jam Jemput: \\n• Nama Tamu: \\n• Kontak WA Tamu: \\n• Lokasi Jemput: \\n• Lokasi Drop: \\n• Catatan: Tamu kemungkinan akan berhenti di 2-3 tempat wisata di perjalanan.\\n\\nBisa jalan Bli? Suksma! 🚗\\n```\",\n  \"parse_mode\": \"Markdown\"\n}",
          options: {}
        },
        id: "send-templates-id",
        name: "Send WhatsApp Templates",
        type: "n8n-nodes-base.httpRequest",
        typeVersion: 4.1,
        position: [900, -50]
      },
      {
        parameters: {
          jsCode: `const message = items[0].json.body?.message;
if (!message) return [];

const text = message.text || '';
const args = text.split(/\\s+/).slice(1);

if (args.length === 0) {
  return [{
    json: {
      error: 'show_template',
      chatId: message.chat.id
    }
  }];
}

if (args.length < 3) {
  return [{
    json: {
      error: 'usage',
      chatId: message.chat.id
    }
  }];
}

const tourNum = Number(args[0]);
const guests = Number(args[1]);
const transNum = Number(args[2]);

if (isNaN(tourNum) || isNaN(guests) || isNaN(transNum)) {
  return [{
    json: {
      error: 'usage',
      chatId: message.chat.id
    }
  }];
}

let rate = 18053;
let pricingTours = [];
let pricingPickups = [];

try {
  const res = await fetch('https://www.balidolphintours.com/api/pricing');
  if (res.ok) {
    const data = await res.json();
    if (data.exchangeRate) {
      rate = data.exchangeRate;
    }
    if (data.tours) {
      pricingTours = data.tours;
    }
    if (data.pickups) {
      pricingPickups = data.pickups;
    }
  }
} catch (e) {}

let tourName = '';
let tourPrice = 0;
let checkoutUrl = '';
if (tourNum === 1) {
  tourName = 'Dolphin Watching Tour';
  tourPrice = pricingTours.find(t => t.id === 'seven-am-ethical')?.price || 812000;
  checkoutUrl = 'https://www.balidolphintours.com/checkout?tour=seven-am-ethical';
} else if (tourNum === 2) {
  tourName = 'Dolphin Watching & Swimming Tour';
  tourPrice = pricingTours.find(t => t.id === 'dolphin-swim')?.price || 993000;
  checkoutUrl = 'https://www.balidolphintours.com/checkout?tour=dolphin-swim';
} else if (tourNum === 3) {
  tourName = 'Dolphin Watching Tour + Swim & Snorkel';
  tourPrice = pricingTours.find(t => t.id === 'swim-snorkel')?.price || 1173000;
  checkoutUrl = 'https://www.balidolphintours.com/checkout?tour=swim-snorkel';
} else {
  return [{
    json: {
      error: 'invalid_tour',
      chatId: message.chat.id
    }
  }];
}

let pickupName = '';
let pickupPrice = 0;
let hasTransport = false;

if (transNum === 0) {
  pickupName = 'No Driver (Lovina Beach Area)';
  pickupPrice = 0;
} else if (transNum === 1) {
  pickupName = 'Ubud Round-trip Private Driver';
  pickupPrice = pricingPickups.find(p => p.id === 'ubud')?.price || 758000;
  hasTransport = true;
} else if (transNum === 2) {
  pickupName = 'Canggu / Seminyak / Kuta Round-trip Private Driver';
  pickupPrice = pricingPickups.find(p => p.id === 'canggu-kuta')?.price || 1083000;
  hasTransport = true;
} else if (transNum === 3) {
  pickupName = 'Uluwatu / Nusa Dua Round-trip Private Driver';
  pickupPrice = pricingPickups.find(p => p.id === 'uluwatu')?.price || 1408000;
  hasTransport = true;
} else {
  return [{
    json: {
      error: 'invalid_pickup',
      chatId: message.chat.id
    }
  }];
}

const idrTotal = (tourPrice * guests) + pickupPrice;
const usdTotal = Math.round(idrTotal / rate);
const idrFormatted = 'Rp ' + (idrTotal / 1000).toString().replace(/\\B(?=(\\d{3})+(?!\\d))/g, \".\") + 'k';

return [{
  json: {
    chatId: message.chat.id,
    tourName,
    guests,
    pickupName,
    hasTransport,
    usdTotal,
    idrFormatted,
    checkoutUrl
  }
}];`
        },
        id: "parse-quote-cmd-id",
        name: "Parse Quote Command",
        type: "n8n-nodes-base.code",
        typeVersion: 2,
        position: [900, 200]
      },
      {
        parameters: {
          conditions: {
            string: [
              {
                value1: "={{ $json.error }}",
                operation: "isNotEmpty"
              }
            ]
          }
        },
        id: "has-quote-error-id",
        name: "Has Quote Error?",
        type: "n8n-nodes-base.if",
        typeVersion: 1,
        position: [1100, 200]
      },
      {
        parameters: {
          method: "POST",
          url: `https://api.telegram.org/bot${botToken}/sendMessage`,
          sendBody: true,
          specifyBody: "json",
          jsonBody: "={\n  \"chat_id\": \"{{ $json.chatId }}\",\n  \"text\": \"📋 *Dolphin Tour Quote Helper*\\n\\n*Usage:*\\n`/quote <tour_num> <guests> <transport_num>`\\n\\n*Tours:*\\n• `1`: Dolphin Watching ($45/person)\\n• `2`: Watching & Swimming ($55/person)\\n• `3`: Watch, Swim & Snorkel ($65/person)\\n\\n*Transport:*\\n• `0`: None (beach meet)\\n• `1`: Ubud ($42 roundtrip)\\n• `2`: South Bali (Canggu/Kuta/Airport) ($60 roundtrip)\\n• `3`: Uluwatu ($78 roundtrip)\\n\\n*Example:*\\n`/quote 2 3 1` (3 guests, Swim tour, Ubud pickup)\",\n  \"parse_mode\": \"Markdown\"\n}",
          options: {}
        },
        id: "send-quote-error-id",
        name: "Send Quote Usage Error",
        type: "n8n-nodes-base.httpRequest",
        typeVersion: 4.1,
        position: [1300, 100]
      },
      {
        parameters: {
          method: "POST",
          url: `https://api.telegram.org/bot${botToken}/sendMessage`,
          sendBody: true,
          specifyBody: "json",
          jsonBody: "={\n  \"chat_id\": \"{{ $json.chatId }}\",\n  \"text\": \"📋 *Bali Dolphin Tours: Custom Quote*\\n\\nHere is your private tour itinerary and pricing summary:\\n\\n• *Package*: 7:00 AM Private {{ $json.tourName }}\\n• *Guests*: {{ $json.guests }} people (Private Boat)\\n• *Transport*: {{ $json.pickupName }}\\n\\n💰 *Total Pricing Summary:*\\n• *USD Price*: **${{ $json.usdTotal }} USD**\\n• *IDR Price*: **{{ $json.idrFormatted }}** (Roughly)\\n\\n✨ *Special Inclusions (For Free!):*\\n{{ $json.hasTransport ? '🚗 *Free Scenic Road Trip Stops:*\\\\nSince you booked private transport, you get up to 3 free sightseeing stops on the way back (e.g. Beratan Lake Temple, waterfalls, or coffee farms)!\\\\n👉 Read more: https://www.balidolphintours.com/blog/lovina-to-south-bali-our-favorite-road-trip-stops\\\\n\\\\n' : '' }}🌅 *Private Boat Charter:*\\nYour boat is 100% private. No strangers, just your group and a peaceful, non-intrusive parallel dolphin encounter.\\n\\n👇 *Book direct with us here:*\\n{{ $json.checkoutUrl }}\",\n  \"parse_mode\": \"Markdown\"\n}",
          options: {}
        },
        id: "send-quote-msg-id",
        name: "Send Quote Message",
        type: "n8n-nodes-base.httpRequest",
        typeVersion: 4.1,
        position: [1300, 240]
      },
      {
        parameters: {
          jsCode: `const message = items[0].json.body?.message;
if (!message) return [];

const text = message.text || '';

// Fetch dynamic pricing data once at the start of Parse Pay Command node
let rate = 18053;
let pricingTours = [];
let pricingPickups = [];

try {
  const res = await fetch('https://www.balidolphintours.com/api/pricing');
  if (res.ok) {
    const data = await res.json();
    if (data.exchangeRate) {
      rate = data.exchangeRate;
    }
    if (data.tours) {
      pricingTours = data.tours;
    }
    if (data.pickups) {
      pricingPickups = data.pickups;
    }
  }
} catch (e) {}

// Handle template submission
if (text.includes('/create_booking')) {
  const dateMatch = text.match(/•?\\s*Date:\\s*([^\\n]+)/i);
  const guestsMatch = text.match(/•?\\s*Guests:\\s*([^\\n]+)/i);
  const tourMatch = text.match(/•?\\s*Tour:\\s*([^\\n]+)/i);
  const pickupMatch = text.match(/•?\\s*Pickup:\\s*([^\\n]+)/i);
  const timeMatch = text.match(/•?\\s*Time:\\s*([^\\n]+)/i);
  const nameMatch = text.match(/•?\\s*Guest Name:\\s*([^\\n]+)/i);

  if (!dateMatch || !guestsMatch || !tourMatch || !pickupMatch) {
    return [{
      json: {
        error: 'missing_fields',
        chatId: message.chat.id
      }
    }];
  }

  const rawDate = dateMatch[1].trim();
  const guests = Number(guestsMatch[1].trim());
  const rawTour = tourMatch[1].trim().toLowerCase();
  const rawPickup = pickupMatch[1].trim().toLowerCase();
  const rawTime = timeMatch ? timeMatch[1].trim() : '7:00 AM';
  const guestName = nameMatch ? nameMatch[1].trim() : 'Manual Telegram Booking';

  let tourName = '';
  let tourId = 'seven-am-ethical';
  if (rawTour.includes('swim')) {
    tourId = 'dolphin-swim';
    tourName = 'Dolphin Watching & Swimming Tour';
  } else if (rawTour.includes('snorkel')) {
    tourId = 'swim-snorkel';
    tourName = 'Dolphin Watching Tour + Swim & Snorkel';
  } else {
    tourName = 'Dolphin Watching Tour';
  }
  
  let pickupName = '';
  let pickupLocation = 'none';
  let hasTransport = false;
  if (rawPickup.includes('ubud')) {
    pickupLocation = 'ubud';
    pickupName = 'Ubud Round-trip Private Driver';
    hasTransport = true;
  } else if (rawPickup.includes('canggu') || rawPickup.includes('seminyak') || rawPickup.includes('kuta') || rawPickup.includes('south')) {
    pickupLocation = 'canggu-kuta';
    pickupName = 'Canggu / Seminyak / Kuta Round-trip Private Driver';
    hasTransport = true;
  } else if (rawPickup.includes('uluwatu') || rawPickup.includes('nusadua')) {
    pickupLocation = 'uluwatu';
    pickupName = 'Uluwatu / Nusa Dua Round-trip Private Driver';
    hasTransport = true;
  } else {
    pickupName = 'No Driver (Lovina Beach Area)';
  }

  if (!/^\\d{4}-\\d{2}-\\d{2}$/.test(rawDate)) {
    return [{
      json: {
        error: 'date_format',
        chatId: message.chat.id,
        provided: rawDate
      }
    }];
  }

  if (isNaN(guests) || guests <= 0) {
    return [{
      json: {
        error: 'guests_format',
        chatId: message.chat.id,
        provided: guestsMatch[1]
      }
    }];
  }

  const tourPrice = pricingTours.find(t => t.id === tourId)?.price || 
    (tourId === 'seven-am-ethical' ? 812000 : tourId === 'dolphin-swim' ? 993000 : 1173000);
  const pickupPrice = pickupLocation === 'none' ? 0 : (pricingPickups.find(p => p.id === pickupLocation)?.price || 
    (pickupLocation === 'ubud' ? 758000 : pickupLocation === 'canggu-kuta' ? 1083000 : 1408000));

  const idrTotal = (tourPrice * guests) + pickupPrice;
  const usdTotal = Math.round(idrTotal / rate);
  const idrFormatted = 'Rp ' + (idrTotal / 1000).toString().replace(/\\B(?=(\\d{3})+(?!\\d))/g, \".\") + 'k';

  return [{
    json: {
      command: 'pay',
      chatId: message.chat.id,
      tourId,
      date: rawDate,
      guests,
      pickupLocation,
      tourTime: rawTime,
      guestName,
      tourName,
      pickupName,
      hasTransport,
      usdTotal,
      idrFormatted
    }
  }];
}

// Handle positional command /pay <date> <guests> <tour> <pickup> [time]
const args = text.split(/\\s+/).slice(1);
if (args.length === 0) {
  return [{
    json: {
      error: 'show_template',
      chatId: message.chat.id
    }
  }];
}

if (args.length < 4) {
  return [{
    json: {
      error: 'usage',
      chatId: message.chat.id
    }
  }];
}

const rawDate = args[0]; 
const guests = Number(args[1]);
const rawTour = args[2].toLowerCase();
const rawPickup = args[3].toLowerCase();
const rawTime = args[4] || '7:00 AM';

let tourName = '';
let tourId = 'seven-am-ethical';
if (rawTour === 'swim') {
  tourId = 'dolphin-swim';
  tourName = 'Dolphin Watching & Swimming Tour';
} else if (rawTour === 'snorkel') {
  tourId = 'swim-snorkel';
  tourName = 'Dolphin Watching Tour + Swim & Snorkel';
} else {
  tourName = 'Dolphin Watching Tour';
}

let pickupName = '';
let pickupLocation = 'none';
let hasTransport = false;
if (rawPickup === 'ubud') {
  pickupLocation = 'ubud';
  pickupName = 'Ubud Round-trip Private Driver';
  hasTransport = true;
} else if (rawPickup === 'canggu' || rawPickup === 'seminyak' || rawPickup === 'kuta' || rawPickup === 'south' || rawPickup === 'canggu-kuta') {
  pickupLocation = 'canggu-kuta';
  pickupName = 'Canggu / Seminyak / Kuta Round-trip Private Driver';
  hasTransport = true;
} else if (rawPickup === 'uluwatu' || rawPickup === 'nusadua') {
  pickupLocation = 'uluwatu';
  pickupName = 'Uluwatu / Nusa Dua Round-trip Private Driver';
  hasTransport = true;
} else {
  pickupName = 'No Driver (Lovina Beach Area)';
}

if (!/^\\d{4}-\\d{2}-\\d{2}$/.test(rawDate)) {
  return [{
    json: {
      error: 'date_format',
      chatId: message.chat.id,
      provided: rawDate
    }
  }];
}

if (isNaN(guests) || guests <= 0) {
  return [{
    json: {
      error: 'guests_format',
      chatId: message.chat.id,
      provided: args[1]
    }
  }];
}

const tourPrice = pricingTours.find(t => t.id === tourId)?.price || 
  (tourId === 'seven-am-ethical' ? 812000 : tourId === 'dolphin-swim' ? 993000 : 1173000);
const pickupPrice = pickupLocation === 'none' ? 0 : (pricingPickups.find(p => p.id === pickupLocation)?.price || 
  (pickupLocation === 'ubud' ? 758000 : pickupLocation === 'canggu-kuta' ? 1083000 : 1408000));

const idrTotal = (tourPrice * guests) + pickupPrice;
const usdTotal = Math.round(idrTotal / rate);
const idrFormatted = 'Rp ' + (idrTotal / 1000).toString().replace(/\\B(?=(\\d{3})+(?!\\d))/g, \".\") + 'k';

return [{
  json: {
    command: 'pay',
    chatId: message.chat.id,
    tourId,
    date: rawDate,
    guests,
    pickupLocation,
    tourTime: rawTime,
    guestName: 'Manual Telegram Booking',
    tourName,
    pickupName,
    hasTransport,
    usdTotal,
    idrFormatted
  }
}];`
        },
        id: "parse-pay-args-id",
        name: "Parse Pay Command",
        type: "n8n-nodes-base.code",
        typeVersion: 2,
        position: [900, 500]
      },
      {
        parameters: {
          conditions: {
            string: [
              {
                value1: "={{ $json.error }}",
                operation: "isNotEmpty"
              }
            ]
          }
        },
        id: "has-parse-error-id",
        name: "Has Parse Error?",
        type: "n8n-nodes-base.if",
        typeVersion: 1,
        position: [1100, 500]
      },
      {
        parameters: {
          conditions: {
            string: [
              {
                value1: "={{ $json.error }}",
                value2: "show_template"
              }
            ]
          }
        },
        id: "is-show-template-id",
        name: "Is Show Template?",
        type: "n8n-nodes-base.if",
        typeVersion: 1,
        position: [1300, 400]
      },
      {
        parameters: {
          method: "POST",
          url: `https://api.telegram.org/bot${botToken}/sendMessage`,
          sendBody: true,
          specifyBody: "json",
          jsonBody: "={\n  \"chat_id\": \"{{ $json.chatId }}\",\n  \"text\": \"✍️ *Stripe Link Generator*\\n\\nCopy the block below, edit the details, and send it back to generate a link:\\n\\n```\\n/create_booking\\n• Date: 2026-08-05\\n• Guests: 3\\n• Tour: swim\\n• Pickup: ubud\\n• Time: 7:00 AM\\n• Guest Name: John Doe\\n```\\n\\n*Options:*\\n• Tour: `watching` / `swim` / `snorkel`\\n• Pickup: `none` / `ubud` / `canggu` (south Bali)\",\n  \"parse_mode\": \"Markdown\"\n}",
          options: {}
        },
        id: "send-interactive-template-id",
        name: "Send Interactive Template",
        type: "n8n-nodes-base.httpRequest",
        typeVersion: 4.1,
        position: [1500, 330]
      },
      {
        parameters: {
          method: "POST",
          url: `https://api.telegram.org/bot${botToken}/sendMessage`,
          sendBody: true,
          specifyBody: "json",
          jsonBody: "={\n  \"chat_id\": \"{{ $json.chatId }}\",\n  \"text\": \"⚠️ *Invalid /pay command syntax!*\\n\\n*Usage:*\\n`/pay <date> <guests> <tour> <pickup> [time]`\\n\\n*Options:*\\n• Tour: `ethical`, `swim`, `snorkel`, `transport`\\n• Pickup: `none`, `ubud`, `canggu`\\n\\n*Or just type:* `/pay` to get a copy-paste form!\",\n  \"parse_mode\": \"Markdown\"\n}",
          options: {}
        },
        id: "send-pay-error-id",
        name: "Send Pay Usage Error",
        type: "n8n-nodes-base.httpRequest",
        typeVersion: 4.1,
        position: [1500, 470]
      },
      {
        parameters: {
          method: "POST",
          url: "https://balidolphintours.com/api/admin/checkout",
          sendHeaders: true,
          headerParameters: {
            parameters: [
              {
                name: "x-admin-password",
                value: adminPassword
              },
              {
                name: "Content-Type",
                value: "application/json"
              }
            ]
          },
          sendBody: true,
          specifyBody: "json",
          jsonBody: "={\n  \"tourId\": \"{{ $json.tourId }}\",\n  \"date\": \"{{ $json.date }}\",\n  \"guests\": {{ $json.guests }},\n  \"pickupLocation\": \"{{ $json.pickupLocation }}\",\n  \"tourTime\": \"{{ $json.tourTime }}\",\n  \"name\": \"{{ $json.guestName }}\"\n}",
          options: {}
        },
        id: "create-checkout-link-id",
        name: "Create Stripe Checkout Link",
        type: "n8n-nodes-base.httpRequest",
        typeVersion: 4.1,
        position: [1300, 600]
      },
      {
        parameters: {
          method: "POST",
          url: `https://api.telegram.org/bot${botToken}/sendMessage`,
          sendBody: true,
          specifyBody: "json",
          jsonBody: "={\n  \"chat_id\": \"{{ $('Parse Pay Command').item.json.chatId }}\",\n  \"text\": \"📋 *Bali Dolphin Tours: Booking Details*\\n\\nHere is your private tour itinerary and secure link to checkout and reserve your spot:\\n\\n• *Name*: **{{ $('Parse Pay Command').item.json.guestName }}**\\n• *Package*: **{{ $('Parse Pay Command').item.json.tourTime }} Private {{ $('Parse Pay Command').item.json.tourName }}**\\n• *Date*: **{{ $('Parse Pay Command').item.json.date }}**\\n• *Guests*: **{{ $('Parse Pay Command').item.json.guests }} people** (Private Boat)\\n• *Transport*: **{{ $('Parse Pay Command').item.json.pickupName }}**\\n\\n💰 *Total Pricing Summary:*\\n• *USD Price*: **${{ $('Parse Pay Command').item.json.usdTotal }} USD**\\n• *IDR Price*: **{{ $('Parse Pay Command').item.json.idrFormatted }}** (Roughly)\\n\\n✨ *Inclusions & Features:*\\n• 🌅 *100% Private Boat*: Reserved strictly for your group. No sharing with strangers.\\n• 🐬 *Ethical Cruising*: Vetted local captain following strict parallel approach rules.\\n{{ $('Parse Pay Command').item.json.hasTransport ? '• 🚗 *Free Scenic Stopovers*: Since you booked private driver transport, you get up to 3 free sightseeing stops on the way back (waterfalls, temples, or coffee farms)!\\\\n👉 Read more: https://www.balidolphintours.com/blog/lovina-to-south-bali-our-favorite-road-trip-stops\\\\n\\\\n' : '' }}\\n👇 *Click below to book & secure your private boat:*\\n{{ $json.url }}\",\n  \"parse_mode\": \"Markdown\"\n}",
          options: {}
        },
        id: "send-checkout-link-id",
        name: "Send Checkout Link",
        type: "n8n-nodes-base.httpRequest",
        typeVersion: 4.1,
        position: [1500, 600]
      },
      {
        parameters: {
          conditions: {
            boolean: [
              {
                value1: "={{ $json.isReply }}",
                value2: true
              }
            ]
          }
        },
        id: "is-reply-id",
        name: "Is Valid Reply?",
        type: "n8n-nodes-base.if",
        typeVersion: 1,
        position: [500, 750]
      },
      {
        parameters: {
          jsCode: `const message = items[0].json.body?.message;
if (!message) return [];

const replyTo = message.reply_to_message;
if (!replyTo || !replyTo.text) return [];

const phoneMatch = replyTo.text.match(/📞 Phone:\\s*\\+?(\\d+)/);
if (!phoneMatch) return [];

const recipientPhone = phoneMatch[1];
const replyText = message.text || '';
const caption = message.caption || '';

let mediaType = null;
let fileId = null;

if (message.photo && message.photo.length > 0) {
  mediaType = 'image';
  // Get largest photo size
  fileId = message.photo[message.photo.length - 1].file_id;
} else if (message.video) {
  mediaType = 'video';
  fileId = message.video.file_id;
} else if (message.document) {
  mediaType = 'document';
  fileId = message.document.file_id;
}

return [{
  json: {
    recipientPhone,
    replyText,
    caption,
    mediaType,
    fileId
  }
}];`
        },
        id: "parse-message-id",
        name: "Parse Telegram Message",
        type: "n8n-nodes-base.code",
        typeVersion: 2,
        position: [700, 730]
      },
      {
        parameters: {
          conditions: {
            string: [
              {
                value1: "={{ $json.mediaType }}",
                operation: "isNotEmpty"
              }
            ]
          }
        },
        id: "is-media-id",
        name: "Is Media?",
        type: "n8n-nodes-base.if",
        typeVersion: 1,
        position: [900, 730]
      },
      {
        parameters: {
          method: "GET",
          url: `https://api.telegram.org/bot${botToken}/getFile`,
          sendQuery: true,
          queryParameters: {
            parameters: [
              {
                name: "file_id",
                value: "={{ $json.fileId }}"
              }
            ]
          },
          options: {}
        },
        id: "get-file-id",
        name: "Get Telegram File Path",
        type: "n8n-nodes-base.httpRequest",
        typeVersion: 4.1,
        position: [1100, 810]
      },
      {
        parameters: {
          method: "POST",
          url: `https://graph.facebook.com/v19.0/${phoneId}/messages`,
          sendHeaders: true,
          headerParameters: {
            parameters: [
              {
                name: "Authorization",
                value: `Bearer ${metaToken}`
              },
              {
                name: "Content-Type",
                value: "application/json"
              }
            ]
          },
          sendBody: true,
          specifyBody: "json",
          jsonBody: `={\n  "messaging_product": "whatsapp",\n  "recipient_type": "individual",\n  "to": "{{ $('Parse Telegram Message').item.json.recipientPhone }}",\n  "type": "{{ $('Parse Telegram Message').item.json.mediaType }}",\n  "{{ $('Parse Telegram Message').item.json.mediaType }}": {\n    "link": "https://api.telegram.org/file/bot${botToken}/{{ $json.result.file_path }}",\n    "caption": "{{ $('Parse Telegram Message').item.json.caption }}"\n  }\n}`,
          options: {}
        },
        id: "meta-send-media-id",
        name: "Send WhatsApp Media Message",
        type: "n8n-nodes-base.httpRequest",
        typeVersion: 4.1,
        position: [1300, 810]
      },
      {
        parameters: {
          method: "POST",
          url: `https://graph.facebook.com/v19.0/${phoneId}/messages`,
          sendHeaders: true,
          headerParameters: {
            parameters: [
              {
                name: "Authorization",
                value: `Bearer ${metaToken}`
              },
              {
                name: "Content-Type",
                value: "application/json"
              }
            ]
          },
          sendBody: true,
          specifyBody: "json",
          jsonBody: "={\n  \"messaging_product\": \"whatsapp\",\n  \"recipient_type\": \"individual\",\n  \"to\": \"{{ $json.recipientPhone }}\",\n  \"type\": \"text\",\n  \"text\": {\n    \"body\": \"{{ $json.replyText }}\"\n  }\n}",
          options: {}
        },
        id: "meta-send-text-id",
        name: "Send WhatsApp Text Message",
        type: "n8n-nodes-base.httpRequest",
        typeVersion: 4.1,
        position: [1100, 970]
      }
    ],
    connections: {
      "Telegram Webhook Trigger": {
        main: [
          [
            {
              "node": "Check Message",
              "type": "main",
              "index": 0
            }
          ]
        ]
      },
      "Check Message": {
        main: [
          [
            {
              "node": "Is Command?",
              "type": "main",
              "index": 0
            }
          ]
        ]
      },
      "Is Command?": {
        main: [
          [
            {
              "node": "Is /draft Command?",
              "type": "main",
              "index": 0
            }
          ],
          [
            {
              "node": "Is Valid Reply?",
              "type": "main",
              "index": 0
            }
          ]
        ]
      },
      "Is /draft Command?": {
        main: [
          [
            {
              "node": "Send WhatsApp Templates",
              "type": "main",
              "index": 0
            }
          ],
          [
            {
              "node": "Is /quote Command?",
              "type": "main",
              "index": 0
            }
          ]
        ]
      },
      "Is /quote Command?": {
        main: [
          [
            {
              "node": "Parse Quote Command",
              "type": "main",
              "index": 0
            }
          ],
          [
            {
              "node": "Parse Pay Command",
              "type": "main",
              "index": 0
            }
          ]
        ]
      },
      "Parse Quote Command": {
        main: [
          [
            {
              "node": "Has Quote Error?",
              "type": "main",
              "index": 0
            }
          ]
        ]
      },
      "Has Quote Error?": {
        main: [
          [
            {
              "node": "Send Quote Usage Error",
              "type": "main",
              "index": 0
            }
          ],
          [
            {
              "node": "Send Quote Message",
              "type": "main",
              "index": 0
            }
          ]
        ]
      },
      "Parse Pay Command": {
        main: [
          [
            {
              "node": "Has Parse Error?",
              "type": "main",
              "index": 0
            }
          ]
        ]
      },
      "Has Parse Error?": {
        main: [
          [
            {
              "node": "Is Show Template?",
              "type": "main",
              "index": 0
            }
          ],
          [
            {
              "node": "Create Stripe Checkout Link",
              "type": "main",
              "index": 0
            }
          ]
        ]
      },
      "Is Show Template?": {
        main: [
          [
            {
              "node": "Send Interactive Template",
              "type": "main",
              "index": 0
            }
          ],
          [
            {
              "node": "Send Pay Usage Error",
              "type": "main",
              "index": 0
            }
          ]
        ]
      },
      "Create Stripe Checkout Link": {
        main: [
          [
            {
              "node": "Send Checkout Link",
              "type": "main",
              "index": 0
            }
          ]
        ]
      },
      "Is Valid Reply?": {
        main: [
          [
            {
              "node": "Parse Telegram Message",
              "type": "main",
              "index": 0
            }
          ],
          []
        ]
      },
      "Parse Telegram Message": {
        main: [
          [
            {
              "node": "Is Media?",
              "type": "main",
              "index": 0
            }
          ]
        ]
      },
      "Is Media?": {
        main: [
          [
            {
              "node": "Get Telegram File Path",
              "type": "main",
              "index": 0
            }
          ],
          [
            {
              "node": "Send WhatsApp Text Message",
              "type": "main",
              "index": 0
            }
          ]
        ]
      },
      "Get Telegram File Path": {
        main: [
          [
            {
              "node": "Send WhatsApp Media Message",
              "type": "main",
              "index": 0
            }
          ]
        ]
      }
    },
    settings: {
      errorWorkflow: "GlobalErrHandler"
    }
  };

  let bridgeId = null;
  try {
    const listRes = await fetch('https://n8n.balidolphintours.com/api/v1/workflows', {
      headers: { 'X-N8N-API-KEY': apiKey }
    });
    if (listRes.ok) {
      const listData = await listRes.json();
      const match = listData.data.find(w => w.name === "Telegram: WhatsApp Reply Bridge");
      if (match) {
        bridgeId = match.id;
        console.log(`- Found existing bridge workflow with ID: ${bridgeId}`);
      }
    }
  } catch (err) {
    console.warn('⚠️ Error checking existing workflows:', err.message);
  }

  if (bridgeId) {
    const updateUrl = `https://n8n.balidolphintours.com/api/v1/workflows/${bridgeId}`;
    const res = await fetch(updateUrl, {
      method: 'PUT',
      headers: {
        'X-N8N-API-KEY': apiKey,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(bridgePayload)
    });
    if (!res.ok) {
      throw new Error(`Failed to update bridge workflow: ${await res.text()}`);
    }
    console.log('✔ Telegram Reply Bridge updated successfully.');
  } else {
    const res = await fetch('https://n8n.balidolphintours.com/api/v1/workflows', {
      method: 'POST',
      headers: {
        'X-N8N-API-KEY': apiKey,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(bridgePayload)
    });
    if (!res.ok) {
      throw new Error(`Failed to create bridge workflow: ${await res.text()}`);
    }
    const data = await res.json();
    bridgeId = data.id;
    console.log(`✔ Telegram Reply Bridge created (ID: ${bridgeId}).`);
  }

  // Activate the bridge workflow
  console.log(`- Activating the bridge workflow (ID: ${bridgeId})...`);
  const activateRes = await fetch(`https://n8n.balidolphintours.com/api/v1/workflows/${bridgeId}/activate`, {
    method: 'POST',
    headers: { 'X-N8N-API-KEY': apiKey }
  });
  if (activateRes.ok) {
    console.log('✔ Telegram Reply Bridge workflow is now ACTIVE!');
  } else {
    console.error('✖ Failed to activate bridge workflow:', activateRes.status, await activateRes.text());
    process.exit(1);
  }

  // ==========================================
  // STEP 3: Register Webhook with Telegram
  // ==========================================
  const webhookUrl = 'https://n8n.balidolphintours.com/webhook/telegram-reply-callback';
  console.log(`\n- Registering webhook with Telegram API: ${webhookUrl}`);
  
  try {
    const tgRes = await fetch(`https://api.telegram.org/bot${botToken}/setWebhook?url=${webhookUrl}`);
    const tgData = await tgRes.json();
    if (tgData.ok) {
      console.log('✔ Telegram bot webhook registered successfully!');
    } else {
      throw new Error(tgData.description || 'Unknown Telegram error');
    }
  } catch (err) {
    console.error('✖ Failed to register Telegram webhook:', err.message);
    process.exit(1);
  }

  console.log('\n🎉 SUCCESS! Telegram-to-WhatsApp Support Bridge is fully upgraded!');
}

main();
