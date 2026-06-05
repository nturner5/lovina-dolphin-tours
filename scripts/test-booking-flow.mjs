import fs from 'fs';
import path from 'path';
import readline from 'readline';

// Utility for terminal colors
const colors = {
  reset: '\x1b[0m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  bold: '\x1b[1m',
  gray: '\x1b[90m'
};

// Load .env.local variables
const envPath = path.resolve(process.cwd(), '.env.local');
const envVars = {};

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split(/\r?\n/).forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?$/);
    if (match) {
      let key = match[1];
      let value = match[2] || '';
      // Remove surrounding quotes if present
      if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
      if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
      envVars[key] = value;
    }
  });
}

// Config Defaults & Extracted Values
let metaToken = process.env.META_ACCESS_TOKEN || envVars.META_ACCESS_TOKEN || '';
let n8nCaptainWebhook = process.env.N8N_CAPTAIN_AGREEMENT_WEBHOOK_URL || envVars.N8N_CAPTAIN_AGREEMENT_WEBHOOK_URL || 'http://localhost:5678/webhook/captain-signed-webhook';
let n8nStripeWebhook = envVars.N8N_STRIPE_WEBHOOK_URL || 'http://localhost:5678/webhook/stripe';
let phoneId = envVars.META_PHONE_NUMBER_ID || '';
let wabaId = '4305390753007174'; // From create-whatsapp-templates.mjs

// Helper function to write to .env.local
function saveEnvVar(key, value) {
  envVars[key] = value;
  let content = '';
  for (const [k, v] of Object.entries(envVars)) {
    content += `${k}="${v}"\n`;
  }
  fs.writeFileSync(envPath, content, 'utf8');
  console.log(`${colors.green}✔ Saved ${key} to .env.local${colors.reset}`);
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const askQuestion = (query) => new Promise((resolve) => rl.question(query, resolve));

async function main() {
  console.clear();
  console.log(`\n${colors.cyan}${colors.bold}⛵ BALI DOLPHIN TOURS — WORKFLOW TEST SUITE ⛵${colors.reset}`);
  console.log(`${colors.gray}Verify and test your n8n workflows and Meta WhatsApp integration end-to-end.${colors.reset}\n`);

  // Verify basic configurations
  if (!metaToken) {
    console.log(`${colors.red}⚠ Warning: META_ACCESS_TOKEN is missing in .env.local.${colors.reset}`);
    metaToken = await askQuestion(`${colors.yellow}Please enter your Meta Graph API Access Token (or press Enter to skip WhatsApp direct tests): ${colors.reset}`);
    if (metaToken.trim()) {
      saveEnvVar('META_ACCESS_TOKEN', metaToken.trim());
    }
  }

  // Active Menu
  while (true) {
    console.log(`\n${colors.bold}Select a testing operation:${colors.reset}`);
    console.log(`${colors.cyan}1)${colors.reset} Simuler Stripe Webhook (Stripe -> n8n)`);
    console.log(`${colors.cyan}2)${colors.reset} Simuler Captain Agreement Signing (Next.js -> n8n)`);
    console.log(`${colors.cyan}3)${colors.reset} Send Live WhatsApp Template Directly (Verify Meta Credentials)`);
    console.log(`${colors.cyan}4)${colors.reset} Update Webhook URLs & Phone ID Configuration`);
    console.log(`${colors.cyan}5)${colors.reset} Exit`);

    const choice = (await askQuestion(`\n${colors.yellow}Enter selection (1-5): ${colors.reset}`)).trim();

    if (choice === '1') {
      await simulateStripeWebhook();
    } else if (choice === '2') {
      await simulateCaptainSignature();
    } else if (choice === '3') {
      await sendLiveWhatsAppTemplate();
    } else if (choice === '4') {
      await configureSettings();
    } else if (choice === '5') {
      console.log(`\n${colors.green}Exiting Bali Dolphin Tours testing tool. Fair winds! ⛵ Dolphin speed!${colors.reset}\n`);
      rl.close();
      break;
    } else {
      console.log(`${colors.red}Invalid option, please choose 1-5.${colors.reset}`);
    }
  }
}

async function simulateStripeWebhook() {
  console.log(`\n${colors.cyan}${colors.bold}--- SIMULATE STRIPE WEBHOOK (checkout.session.completed) ---${colors.reset}`);
  console.log(`${colors.gray}This sends a mock Stripe payload to your local/production n8n Stripe webhook.${colors.reset}\n`);

  // Gather parameters
  const guestName = (await askQuestion(`${colors.yellow}Guest Name [Nathan Turner]: ${colors.reset}`)).trim() || 'Nathan Turner';
  const guestPhone = (await askQuestion(`${colors.yellow}Guest WhatsApp Number [+61412345678]: ${colors.reset}`)).trim() || '+61412345678';
  const tourChoice = await askQuestion(`${colors.yellow}Tour type (1 for 8AM ethical, 2 for swim-snorkel) [2]: ${colors.reset}`);
  const tourId = tourChoice === '1' ? 'seven-am-ethical' : 'swim-snorkel';
  const tourName = tourId === 'seven-am-ethical' ? '7:00 AM Private Dolphin Watching Tour' : '7:00 AM Private Dolphin Watching Tour + Swim & Snorkel';
  const tourPrice = tourId === 'seven-am-ethical' ? 45 : 65;
  const guestCount = (await askQuestion(`${colors.yellow}Number of guests [2]: ${colors.reset}`)).trim() || '2';
  const date = (await askQuestion(`${colors.yellow}Booking Date (YYYY-MM-DD) [2026-06-08]: ${colors.reset}`)).trim() || '2026-06-08';
  const pickup = await askQuestion(`${colors.yellow}Pickup Option (none, lovina, ubud, canggu-kuta, uluwatu) [ubud]: ${colors.reset}`) || 'ubud';
  
  let pickupDesc = 'No Driver';
  let pickupFee = '0';
  if (pickup === 'lovina') { pickupDesc = 'Free Local Shuttle'; }
  else if (pickup === 'ubud') { pickupDesc = 'Private Return Transfer — Ubud'; pickupFee = '35'; }
  else if (pickup === 'canggu-kuta') { pickupDesc = 'Private Return Transfer — Canggu, Seminyak, Kuta'; pickupFee = '50'; }
  else if (pickup === 'uluwatu') { pickupDesc = 'Private Return Transfer — Uluwatu, Nusa Dua'; pickupFee = '65'; }

  const hotel = (await askQuestion(`${colors.yellow}Hotel Details [Ubud Hanging Gardens, Villa 12]: ${colors.reset}`)).trim() || 'Ubud Hanging Gardens, Villa 12';
  
  // Format target n8n endpoint
  const targetUrl = (await askQuestion(`${colors.yellow}Target n8n Stripe Webhook URL [${n8nStripeWebhook}]: ${colors.reset}`)).trim() || n8nStripeWebhook;
  if (targetUrl !== n8nStripeWebhook) {
    n8nStripeWebhook = targetUrl;
    saveEnvVar('N8N_STRIPE_WEBHOOK_URL', targetUrl);
  }

  // Construct standard Stripe Checkout event payload
  const mockSessionId = 'cs_test_' + Math.random().toString(36).substring(2, 15);
  const payload = {
    id: 'evt_test_' + Math.random().toString(36).substring(2, 9),
    object: 'event',
    type: 'checkout.session.completed',
    created: Math.floor(Date.now() / 1000),
    data: {
      object: {
        id: mockSessionId,
        object: 'checkout.session',
        amount_total: (tourPrice * Number(guestCount) + Number(pickupFee)) * 100,
        currency: 'usd',
        customer_details: {
          email: `${guestName.toLowerCase().replace(/\s+/g, '')}@example.com`,
          name: guestName,
          phone: guestPhone
        },
        metadata: {
          tourId: tourId,
          date: date,
          guests: guestCount.toString(),
          pickupLocation: pickup,
          pickupFee: pickupFee.toString(),
          pickupDescription: pickupDesc,
          whatsappNumber: guestPhone,
          hotelDetails: hotel
        },
        payment_status: 'paid',
        status: 'complete'
      }
    }
  };

  console.log(`\n${colors.cyan}Sending payload to: ${targetUrl}...${colors.reset}`);
  
  try {
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'stripe-signature': 't=12345,v1=mock_signature' // Mock signature just in case n8n checks
      },
      body: JSON.stringify(payload)
    });

    const responseText = await response.text();
    if (response.ok) {
      console.log(`\n${colors.green}${colors.bold}✔ Mock Stripe webhook successfully dispatched!${colors.reset}`);
      console.log(`${colors.gray}Status: ${response.status} ${response.statusText}${colors.reset}`);
      console.log(`${colors.gray}n8n Response: ${responseText || '(Empty success response)'}${colors.reset}`);
      
      console.log(`\n${colors.bold}💡 NEXT STEP FOR MANUAL END-TO-END FLOW:${colors.reset}`);
      console.log(`Your n8n workflow should now parse this and send a WhatsApp message to the captain.`);
      console.log(`The captain's message should contain this link for signing the agreement:`);
      console.log(`${colors.cyan}http://localhost:3000/captain-agreement?bookingId=${mockSessionId}&name=Wayan&phone=%2B12083164406${colors.reset}`);
      console.log(`${colors.gray}(Replace localhost:3000 with your production domain as needed.)${colors.reset}`);
    } else {
      console.error(`\n${colors.red}✖ Failed to dispatch webhook (HTTP ${response.status}):${colors.reset}`, responseText);
    }
  } catch (error) {
    console.error(`\n${colors.red}✖ Network Error sending to n8n:${colors.reset}`, error.message);
    console.log(`${colors.yellow}Please ensure your n8n local instance is running (usually via n8n start on port 5678).${colors.reset}`);
  }

  await askQuestion(`\nPress Enter to return to menu...`);
}

async function simulateCaptainSignature() {
  console.log(`\n${colors.cyan}${colors.bold}--- SIMULATE CAPTAIN AGREEMENT SIGNATURE (Next.js -> n8n) ---${colors.reset}`);
  console.log(`${colors.gray}This simulates a captain signing the rules on your web page, which triggers /api/captain-agreement and routes to n8n.${colors.reset}\n`);

  // Gather parameters
  const bookingId = (await askQuestion(`${colors.yellow}Booking ID (e.g. cs_test_...) [cs_test_placeholder]: ${colors.reset}`)).trim() || 'cs_test_placeholder';
  const captainName = (await askQuestion(`${colors.yellow}Captain Name [Wayan]: ${colors.reset}`)).trim() || 'Wayan';
  const captainPhone = (await askQuestion(`${colors.yellow}Captain WhatsApp Phone Number [+12083164406]: ${colors.reset}`)).trim() || '+12083164406';
  
  // Format local API URL
  const localApiUrl = 'http://localhost:3000/api/captain-agreement';
  console.log(`${colors.gray}This will call your local Next.js route: ${localApiUrl}${colors.reset}`);
  console.log(`${colors.gray}Ensure your Next.js development server is running (npm run dev) on port 3000.${colors.reset}\n`);

  const confirm = await askQuestion(`${colors.yellow}Proceed with POST to ${localApiUrl}? (y/n) [y]: ${colors.reset}`);
  if (confirm.toLowerCase() === 'n') return;

  const payload = {
    bookingId,
    captainName,
    captainPhone,
    signedAt: new Date().toISOString()
  };

  try {
    const response = await fetch(localApiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    if (response.ok) {
      console.log(`\n${colors.green}${colors.bold}✔ Captain Agreement recorded successfully!${colors.reset}`);
      console.log(`${colors.gray}Status: ${response.status} ${response.statusText}${colors.reset}`);
      console.log(`${colors.gray}Next.js Endpoint Response: ${JSON.stringify(data, null, 2)}${colors.reset}`);
      console.log(`\n${colors.bold}💡 WHAT HAPPENED:${colors.reset}`);
      console.log(`Next.js forwarded this event to: ${colors.cyan}${n8nCaptainWebhook}${colors.reset}`);
      console.log(`n8n will now process the signature and send the WhatsApp template ${colors.bold}lem_captain_unlock${colors.reset} to the captain's phone (${captainPhone}), showing the guest's coordinates.`);
    } else {
      console.error(`\n${colors.red}✖ Failed to submit agreement to Next.js API (HTTP ${response.status}):${colors.reset}`, data);
      console.log(`${colors.yellow}Tip: Make sure you ran 'npm run dev' and Next.js is running at http://localhost:3000.${colors.reset}`);
    }
  } catch (error) {
    console.error(`\n${colors.red}✖ Network Error sending to Next.js server:${colors.reset}`, error.message);
    console.log(`${colors.yellow}Please ensure Next.js dev server is running on http://localhost:3000.${colors.reset}`);
  }

  await askQuestion(`\nPress Enter to return to menu...`);
}

async function sendLiveWhatsAppTemplate() {
  console.log(`\n${colors.cyan}${colors.bold}--- SEND LIVE WHATSAPP TEMPLATE DIRECTLY ---${colors.reset}`);
  console.log(`${colors.gray}This tests your Meta credentials & WABA templates by sending an approved template directly from Meta to your phone.${colors.reset}\n`);

  if (!metaToken) {
    console.log(`${colors.red}✖ Error: META_ACCESS_TOKEN is required for this action.${colors.reset}`);
    await askQuestion(`Press Enter to return...`);
    return;
  }

  if (!phoneId) {
    console.log(`${colors.yellow}Your META_PHONE_NUMBER_ID is not configured in .env.local.${colors.reset}`);
    const inputPhoneId = (await askQuestion(`${colors.yellow}Please enter your Meta WhatsApp Phone Number ID (from App Dashboard): ${colors.reset}`)).trim();
    if (!inputPhoneId) {
      console.log(`${colors.red}Cancelled.${colors.reset}`);
      return;
    }
    phoneId = inputPhoneId;
    saveEnvVar('META_PHONE_NUMBER_ID', phoneId);
  }

  console.log(`Using Phone Number ID: ${colors.cyan}${phoneId}${colors.reset}`);

  // Recipient
  const recipient = (await askQuestion(`${colors.yellow}Send Test WhatsApp to (international format e.g., +61412345678): ${colors.reset}`)).trim();
  if (!recipient) {
    console.log(`${colors.red}Cancelled.${colors.reset}`);
    return;
  }

  // Select Template
  console.log(`\n${colors.bold}Choose Template to send:${colors.reset}`);
  console.log(`${colors.cyan}1)${colors.reset} lem_guest_confirmation_v2 (English)`);
  console.log(`${colors.cyan}2)${colors.reset} lem_captain_dispatch (Indonesian)`);
  console.log(`${colors.cyan}3)${colors.reset} lem_captain_unlock (Indonesian)`);
  console.log(`${colors.cyan}4)${colors.reset} lem_marketing_broadcast (English)`);
  
  const tempChoice = (await askQuestion(`\nSelect (1-4): ${colors.reset}`)).trim();

  let templateBody = {};
  
  if (tempChoice === '1') {
    templateBody = {
      name: 'lem_guest_confirmation_v2',
      language: { code: 'en_US' },
      components: [
        {
          type: 'body',
          parameters: [
            { type: 'text', text: 'Nathan' }, // Guest name
            { type: 'text', text: 'June 8, 2026' }, // Date
            { type: 'text', text: '3' }, // Guests count
            { type: 'text', text: '7:00 AM Private Dolphin Watching Tour + Swim & Snorkel' }, // Tour
            { type: 'text', text: 'Self-Drive (Meet at 6:30 AM)' } // Pickup
          ]
        }
      ]
    };
  } else if (tempChoice === '2') {
    templateBody = {
      name: 'lem_captain_dispatch',
      language: { code: 'id' },
      components: [
        {
          type: 'body',
          parameters: [
            { type: 'text', text: 'Wayan' }, // Captain Name
            { type: 'text', text: 'LEM-MOCK-777' }, // Booking ID
            { type: 'text', text: '8 Juni 2026' }, // Date
            { type: 'text', text: '3' }, // Guests
            { type: 'text', text: `http://localhost:3000/captain-agreement?bookingId=LEM-MOCK-777&name=Wayan&phone=${encodeURIComponent(recipient)}` } // Agreement link
          ]
        }
      ]
    };
  } else if (tempChoice === '3') {
    templateBody = {
      name: 'lem_captain_unlock',
      language: { code: 'id' },
      components: [
        {
          type: 'body',
          parameters: [
            { type: 'text', text: 'Wayan' }, // Captain Name
            { type: 'text', text: 'LEM-MOCK-777' }, // Booking ID
            { type: 'text', text: 'Nathan Turner' }, // Guest Name
            { type: 'text', text: recipient }, // Guest WhatsApp (using recipient number for testing)
            { type: 'text', text: 'Ubud Hanging Gardens, Villa 12' }, // Hotel Details
            { type: 'text', text: 'Private Return Transfer — Ubud' } // Pickup
          ]
        }
      ]
    };
  } else if (tempChoice === '4') {
    templateBody = {
      name: 'lem_marketing_broadcast',
      language: { code: 'en_US' },
      components: [
        {
          type: 'body',
          parameters: [
            { type: 'text', text: 'Nathan' },
            { type: 'text', text: 'DOLPHIN10' },
            { type: 'text', text: 'https://balidolphintours.com/checkout' }
          ]
        }
      ]
    };
  } else {
    console.log(`${colors.red}Invalid template choice.${colors.reset}`);
    await askQuestion(`Press Enter to return...`);
    return;
  }

  // Build full payload
  const payload = {
    messaging_product: 'whatsapp',
    to: recipient.replace(/\+/g, '').trim(), // Meta requires no '+' prefix in phone numbers
    type: 'template',
    template: templateBody
  };

  const metaSendUrl = `https://graph.facebook.com/v20.0/${phoneId}/messages`;

  console.log(`\n${colors.cyan}POSTing to Meta API: ${metaSendUrl}...${colors.reset}`);
  try {
    const response = await fetch(metaSendUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${metaToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const responseData = await response.json();
    if (response.ok) {
      console.log(`\n${colors.green}${colors.bold}✔ WhatsApp Template successfully sent!${colors.reset}`);
      console.log(`${colors.gray}Response: ${JSON.stringify(responseData, null, 2)}${colors.reset}`);
    } else {
      console.error(`\n${colors.red}✖ Meta API rejected the message (HTTP ${response.status}):${colors.reset}`);
      console.error(JSON.stringify(responseData.error || responseData, null, 2));
      console.log(`\n${colors.yellow}Troubleshooting tips:${colors.reset}`);
      console.log(`1. Make sure your WhatsApp phone number (${recipient}) is added as a Sandbox recipient in your Meta App if in developer mode.`);
      console.log(`2. Double check if the templates are fully approved under the names shown.`);
      console.log(`3. Check if your META_PHONE_NUMBER_ID is correct.`);
    }
  } catch (error) {
    console.error(`\n${colors.red}✖ Network Error calling Meta Graph API:${colors.reset}`, error.message);
  }

  await askQuestion(`\nPress Enter to return to menu...`);
}

async function configureSettings() {
  console.log(`\n${colors.cyan}${colors.bold}--- UPDATE WEBHOOK & METRICS CONFIGURATION ---${colors.reset}`);
  console.log(`${colors.gray}View or update your n8n URLs and Meta API configurations.${colors.reset}\n`);

  console.log(`${colors.bold}Current Configs:${colors.reset}`);
  console.log(`- META_ACCESS_TOKEN: ${metaToken ? colors.green + 'Set' : colors.red + 'Not Set'}${colors.reset}`);
  console.log(`- META_PHONE_NUMBER_ID: ${phoneId ? colors.cyan + phoneId : colors.red + 'Not Set'}${colors.reset}`);
  console.log(`- N8N_STRIPE_WEBHOOK_URL: ${colors.cyan}${n8nStripeWebhook}${colors.reset}`);
  console.log(`- N8N_CAPTAIN_AGREEMENT_WEBHOOK_URL: ${colors.cyan}${n8nCaptainWebhook}${colors.reset}`);
  console.log(`- SANITY_PROJECT_ID: ${colors.cyan}${envVars.NEXT_PUBLIC_SANITY_PROJECT_ID || 'Not Set'}${colors.reset}`);
  console.log('');

  const keyToEdit = await askQuestion(`${colors.yellow}Enter number to edit (1: Stripe Webhook, 2: Captain Webhook, 3: Phone Number ID, 4: Cancel) [4]: ${colors.reset}`);
  
  if (keyToEdit === '1') {
    const val = (await askQuestion(`${colors.yellow}Enter new N8N Stripe Webhook URL: ${colors.reset}`)).trim();
    if (val) {
      n8nStripeWebhook = val;
      saveEnvVar('N8N_STRIPE_WEBHOOK_URL', val);
    }
  } else if (keyToEdit === '2') {
    const val = (await askQuestion(`${colors.yellow}Enter new N8N Captain Signed Webhook URL: ${colors.reset}`)).trim();
    if (val) {
      n8nCaptainWebhook = val;
      saveEnvVar('N8N_CAPTAIN_AGREEMENT_WEBHOOK_URL', val);
    }
  } else if (keyToEdit === '3') {
    const val = (await askQuestion(`${colors.yellow}Enter new Meta Phone Number ID: ${colors.reset}`)).trim();
    if (val) {
      phoneId = val;
      saveEnvVar('META_PHONE_NUMBER_ID', val);
    }
  }

  await askQuestion(`\nPress Enter to return to menu...`);
}

main().catch(err => {
  console.error(`${colors.red}Fatal error inside test runner:${colors.reset}`, err);
  rl.close();
});
