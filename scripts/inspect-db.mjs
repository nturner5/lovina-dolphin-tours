import { createClient } from '@supabase/supabase-js';
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
  const env = loadEnvLocal();
  const url = env['SUPABASE_URL'];
  const key = env['SUPABASE_SERVICE_ROLE_KEY'];

  if (!url || !key) {
    console.error('✖ Error: Supabase credentials not found in .env.local');
    process.exit(1);
  }

  const supabase = createClient(url, key);

  console.log('Fetching captains...');
  const { data: captains, error: capError } = await supabase.from('captains').select('*');
  if (capError) {
    console.error('Error fetching captains:', capError.message);
  } else {
    console.log('Captains:', captains);
  }

  console.log('\nFetching last 5 bookings...');
  const { data: bookings, error: bookError } = await supabase.from('bookings').select('*').order('created_at', { ascending: false }).limit(5);
  if (bookError) {
    console.error('Error fetching bookings:', bookError.message);
  } else {
    console.log('Last Bookings:', bookings.map(b => ({
      booking_code: b.booking_code,
      guest_name: b.guest_name,
      whatsapp_number: b.whatsapp_number,
      assigned_captain: b.assigned_captain,
      captain_phone: b.captain_phone,
      created_at: b.created_at
    })));
  }
}

main();
