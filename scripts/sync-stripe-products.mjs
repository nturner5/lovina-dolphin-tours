import Stripe from 'stripe';
import dotenv from 'dotenv';
import path from 'path';

// Load .env.local variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

if (!process.env.STRIPE_SECRET_KEY) {
  console.error('Error: STRIPE_SECRET_KEY is not defined in .env.local');
  process.exit(1);
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-01-27.acacia',
});

const productsToCreate = [
  // --- TOURS ---
  {
    type: 'tour',
    tour_id: 'seven-am-ethical',
    name: '7:00 AM Private Dolphin Watching Tour',
    price: 45.00,
    time: '7:00 AM',
    description: 'Premium private outrigger tour to view wild Spinner and Bottlenose dolphins in Lovina, Bali. Conducted with a strict 100% ethical parallel approach policy (no chasing). Includes local coffee, tea, and fresh fruits.'
  },
  {
    type: 'tour',
    tour_id: 'dolphin-swim',
    name: '7:00 AM Private Dolphin Watching & Swimming Tour',
    price: 55.00,
    time: '7:00 AM',
    description: 'Private outrigger tour featuring wild dolphin watching and swimming. Slide into the water alongside wild dolphin families using our specialized, safe outrigger holding bars. Includes premium life jackets and refreshments.'
  },
  {
    type: 'tour',
    tour_id: 'swim-snorkel',
    name: '7:00 AM Private Dolphin Watching Tour + Swim & Snorkel',
    price: 65.00,
    time: '7:00 AM',
    description: 'Our ultimate double encounter. View and swim with wild dolphins, then sail to Lovina’s vibrant coral reefs to snorkel with tropical marine life. All premium snorkeling gear, fins, and boat transfers included.'
  },
  // --- PICKUPS ---
  {
    type: 'pickup',
    pickup_id: 'ubud',
    name: 'Ubud Round-trip Private Driver',
    price: 42.00,
    description: 'Private round-trip hotel transfer from Ubud to Lovina Beach in a clean, air-conditioned vehicle. Driver pickup at approximately 4:30 AM.'
  },
  {
    type: 'pickup',
    pickup_id: 'canggu-kuta',
    name: 'Canggu / Seminyak / Kuta Round-trip Private Driver',
    price: 60.00,
    description: 'Private round-trip hotel transfer from Canggu, Seminyak, Legian, or Kuta to Lovina Beach. Driver pickup at approximately 4:00 AM.'
  },
  {
    type: 'pickup',
    pickup_id: 'uluwatu',
    name: 'Uluwatu / Nusa Dua Round-trip Private Driver',
    price: 78.00,
    description: 'Private round-trip hotel transfer from Uluwatu, Jimbaran, or Nusa Dua to Lovina Beach. Driver pickup at approximately 3:30 AM.'
  },
  {
    type: 'pickup',
    pickup_id: 'lovina',
    name: 'Free Local Shuttle (Lovina Beach Area)',
    price: 0.00,
    description: 'Complimentary local outrigger shuttle transfer within the Lovina Beach area. Pickup at approximately 6:30 AM.'
  }
];

async function run() {
  console.log('Starting Stripe product synchronization...');
  
  // 1. Fetch existing products first to avoid creating duplicates
  const existingProducts = await stripe.products.list({ active: true, limit: 100 });
  
  for (const item of productsToCreate) {
    // Check if this tour or pickup metadata already exists
    let match = false;
    if (item.type === 'tour') {
      match = existingProducts.data.some(p => p.metadata.tour_id === item.tour_id);
    } else {
      match = existingProducts.data.some(p => p.metadata.pickup_id === item.pickup_id);
    }

    if (match) {
      console.log(`- Product with ID tag "${item.type === 'tour' ? item.tour_id : item.pickup_id}" already exists. Skipping.`);
      continue;
    }

    console.log(`Creating product: ${item.name} ($${item.price})...`);
    
    // Create the product in Stripe
    const product = await stripe.products.create({
      name: item.name,
      description: item.description,
      metadata: item.type === 'tour' 
        ? { tour_id: item.tour_id, time: item.time } 
        : { pickup_id: item.pickup_id },
      default_price_data: {
        currency: 'usd',
        unit_amount: item.price * 100,
      }
    });

    console.log(`Successfully created Stripe Product ID: ${product.id}`);
  }

  console.log('Stripe product synchronization complete! 🎉');
}

run().catch(err => {
  console.error('Error synchronizing products with Stripe:', err);
});
