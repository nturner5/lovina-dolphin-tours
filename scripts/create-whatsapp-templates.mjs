import fs from 'fs';
import path from 'path';

// Load .env.local file to extract META_ACCESS_TOKEN and WABA_ID
const envPath = path.resolve(process.cwd(), '.env.local');
let token = process.env.META_ACCESS_TOKEN;
let wabaId = process.env.META_WABA_ID || '4305390753007174';

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  
  const tokenMatch = envContent.match(/META_ACCESS_TOKEN=["']?([^"'\r\n]+)["']?/);
  if (tokenMatch && tokenMatch[1]) {
    token = tokenMatch[1];
  }

  const wabaMatch = envContent.match(/META_WABA_ID=["']?([^"'\r\n]+)["']?/);
  if (wabaMatch && wabaMatch[1]) {
    wabaId = wabaMatch[1];
  }
}

if (!token) {
  console.error('\x1b[31mError: META_ACCESS_TOKEN is not set in process.env or .env.local!\x1b[0m');
  console.error('Please add the following line to your .env.local file:');
  console.error('META_ACCESS_TOKEN="your_meta_access_token"\n');
  process.exit(1);
}

const WABA_ID = wabaId;
const GRAPH_API_URL = `https://graph.facebook.com/v20.0/${WABA_ID}/message_templates`;

const templates = [
  {
    name: 'lem_guest_confirmation_v2',
    category: 'UTILITY',
    language: 'en_US',
    allow_category_change: true,
    components: [
      {
        type: 'BODY',
        text: 'Hi {{1}}! 🐬 Your private dolphin encounter with Bali Dolphin Tours is confirmed for {{2}} ({{3}} guests).\n\nDetails:\n- Tour: {{4}}\n- Pickup/Meetup: {{5}}\n\nIf you selected Self-Drive (No Driver), we will meet at the Lovina Beach Dolphin Statue (Kalibukbuk) at 6:30 AM (Google Maps: https://www.google.com/maps/search/?api=1&query=Lovina+Dolphin+Statue).\n\nOtherwise, our captain will coordinate your pickup details via WhatsApp shortly. Get ready for a premium, quiet sea experience! ⛵',
        example: {
          body_text: [
            ['John', 'May 29, 2026', '2', 'Private Anti-Sunrise Dolphin Encounter', 'Self-Drive (Meet at 6:30 AM)']
          ]
        }
      }
    ]
  },
  {
    name: 'lem_captain_dispatch',
    category: 'UTILITY',
    language: 'id',
    allow_category_change: true,
    components: [
      {
        type: 'BODY',
        text: 'Halo Kapten {{1}}! Ada tugas baru untuk Bali Dolphin Tours.\n\nDetail Tugas:\n- Kode Booking: {{2}}\n- Tanggal: {{3}}\n- Jumlah Tamu: {{4}}\n\nUntuk membuka detail kontak tamu dan alamat hotel, silakan baca dan tanda tangani Kontrak Perilaku Kapten di link berikut:\n{{5}}\n\nHarap selesaikan tanda tangan sebelum memulai pelayaran. Terima kasih!',
        example: {
          body_text: [
            ['Wayan', 'LEM-1024', '29 Mei 2026', '2', 'https://balidolphintours.com/captain-agreement?bookingId=LEM-1024']
          ]
        }
      }
    ]
  },
  {
    name: 'lem_captain_unlock',
    category: 'UTILITY',
    language: 'id',
    allow_category_change: true,
    components: [
      {
        type: 'BODY',
        text: 'Terima kasih Kapten {{1}}! Kontrak Perilaku Kapten untuk Booking {{2}} telah ditandatangani. Berikut adalah detail kontak tamu untuk koordinasi penjemputan:\n\n- Nama Tamu: {{3}}\n- WhatsApp Tamu: {{4}}\n- Alamat/Hotel Tamu: {{5}}\n- Penjemputan: {{6}}\n\nSelamat berlayar! Pastikan standar Four Seasons tetap terjaga ⛵🐬',
        example: {
          body_text: [
            ['Wayan', 'LEM-1024', 'John Doe', '+6281234567890', 'Ubud Hanging Gardens Villa 4', 'Ubud Add-on ($35)']
          ]
        }
      }
    ]
  },
  {
    name: 'lem_marketing_broadcast',
    category: 'MARKETING',
    language: 'en_US',
    allow_category_change: true,
    components: [
      {
        type: 'BODY',
        text: 'Hi {{1}}! 🐬 Ready for the ultimate sea experience in Bali? Book your private \'Anti-Sunrise\' dolphin tour with Bali Dolphin Tours.\n\nWe start at 7:00 AM after the crowds leave for a quiet, respectful encounter. Save 10% on your booking today!\n\nDiscount Code: {{2}}\nBook Now: {{3}}\n\nWe look forward to welcoming you on board!',
        example: {
          body_text: [
            ['John', 'DOLPHIN10', 'https://balidolphintours.com/checkout']
          ]
        }
      }
    ]
  },
  {
    name: 'bidding_missed_alert',
    category: 'UTILITY',
    language: 'id',
    allow_category_change: true,
    components: [
      {
        type: 'BODY',
        text: 'Halo {{1}}! Maaf, tugas dengan kode booking {{2}} sudah diambil oleh kapten lain. Terima kasih atas responnya dan sampai jumpa di tugas berikutnya! ⛵🐬',
        example: {
          body_text: [
            ['Wayan', 'LEM-K3RF']
          ]
        }
      }
    ]
  },
  {
    name: 'booking_alert_nathan_v1',
    category: 'UTILITY',
    language: 'en_US',
    allow_category_change: true,
    components: [
      {
        type: 'BODY',
        text: '🚨 NEW BOOKING SUCCESSFUL! 🐬⛵\n\n• Code: {{1}}\n• Name: {{2}}\n• Date: {{3}}\n• Guests: {{4}} pax\n• Phone: {{5}}\n• Hotel: {{6}}\n• Transfer: {{7}}\n\n👉 Assign captain manually now!',
        example: {
          body_text: [
            ['LEM-K3RF', 'John Doe', '2026-06-25', '4', '+12083164406', 'Hilton Lovina', 'Canggu Add-on ($50)']
          ]
        }
      }
    ]
  }
];

async function createTemplates() {
  console.log(`\n\x1b[36mInitializing WhatsApp Template Creation for WABA ID: ${WABA_ID}...\x1b[0m\n`);

  for (const template of templates) {
    console.log(`Sending request for "${template.name}" [${template.language}]...`);
    
    try {
      const response = await fetch(GRAPH_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(template)
      });

      const data = await response.json();

      if (response.ok) {
        console.log(`\x1b[32m✔ Successfully created: ${template.name} (ID: ${data.id})\x1b[0m\n`);
      } else {
        console.error(`\x1b[31m✖ Failed to create "${template.name}":\x1b[0m`, data.error ? data.error.message : data);
        console.log('');
      }
    } catch (error) {
      console.error(`\x1b[31m✖ Error creating "${template.name}":\x1b[0m`, error.message);
      console.log('');
    }
  }

  console.log('\x1b[36mFinished processing templates.\x1b[0m\n');
}

createTemplates();
