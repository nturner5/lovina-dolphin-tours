import Stripe from 'stripe';
import { unstable_cache } from 'next/cache';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-01-27.acacia' as any,
});

// Default static fallback pricing to prevent breaks
export const DEFAULT_PRICING = {
  tours: [
    { id: 'seven-am-ethical', name: '7:00 AM Private Dolphin Watching Tour', price: 812000, priceUsd: 45, time: '7:00 AM' },
    { id: 'dolphin-swim', name: '7:00 AM Private Dolphin Watching & Swimming Tour', price: 993000, priceUsd: 55, time: '7:00 AM' },
    { id: 'swim-snorkel', name: '7:00 AM Private Dolphin Watching Tour + Swim & Snorkel', price: 1173000, priceUsd: 65, time: '7:00 AM' },
  ],
  pickups: [
    { id: 'none', name: 'No Driver (Meet at Lovina Beach by 6:30 AM)', price: 0, priceUsd: 0 },
    { id: 'lovina', name: 'Free Local Shuttle (Lovina Beach Area - Pickup ~6:30 AM)', price: 0, priceUsd: 0 },
    { id: 'ubud', name: 'Ubud Round-trip Private Driver (Pickup ~4:30 AM)', price: 758000, priceUsd: 42 },
    { id: 'canggu-kuta', name: 'Canggu / Seminyak / Kuta Round-trip Private Driver (Pickup ~4:00 AM)', price: 1083000, priceUsd: 60 },
    { id: 'uluwatu', name: 'Uluwatu / Nusa Dua Round-trip Private Driver (Pickup ~3:30 AM)', price: 1408000, priceUsd: 78 },
  ]
};

// Fetch pricing data from Stripe, cached using Next.js unstable_cache
export const getPricingData = unstable_cache(
  async () => {
    if (!process.env.STRIPE_SECRET_KEY) {
      console.warn('STRIPE_SECRET_KEY is missing, returning default pricing fallback.');
      return DEFAULT_PRICING;
    }

    try {
      // Fetch active products with their default price objects expanded
      const products = await stripe.products.list({
        active: true,
        limit: 100,
        expand: ['data.default_price'],
      });

      const tours: any[] = [];
      const pickups: any[] = [];

      for (const product of products.data) {
        const defaultPrice = product.default_price as Stripe.Price | null;
        if (!defaultPrice) continue;

        const isIdr = defaultPrice.currency.toLowerCase() === 'idr';
        const stripePrice = (defaultPrice.unit_amount || 0) / 100;
        
        let price = 0;
        let priceUsd = 0;

        if (isIdr) {
          price = stripePrice;
          priceUsd = Math.round(price / 18053);
        } else {
          priceUsd = stripePrice;
          price = Math.round((priceUsd * 18053) / 1000) * 1000;
        }

        if (product.metadata.tour_id) {
          tours.push({
            id: product.metadata.tour_id,
            name: product.name,
            price: price,
            priceUsd: priceUsd,
            priceId: defaultPrice.id,
            time: product.metadata.time || '7:00 AM',
          });
        } else if (product.metadata.pickup_id) {
          pickups.push({
            id: product.metadata.pickup_id,
            name: product.name,
            price: price,
            priceUsd: priceUsd,
            priceId: defaultPrice.id,
          });
        }
      }

      // Sort lists to maintain consistent UI ordering
      tours.sort((a, b) => a.price - b.price);
      
      // Order pickups: free first, then by ascending price
      pickups.sort((a, b) => a.price - b.price);

      // If no matching products found, return default fallback
      if (tours.length === 0) {
        console.warn('No active Stripe products with tour_id metadata found. Using default fallback.');
        return DEFAULT_PRICING;
      }

      // Ensure "none" option exists in pickups
      if (!pickups.some(p => p.id === 'none')) {
        pickups.unshift({ id: 'none', name: 'No Driver (Meet at Lovina Beach by 6:30 AM)', price: 0 });
      }

      return { tours, pickups };
    } catch (err: any) {
      console.error('Error fetching Stripe prices, using defaults:', err.message);
      return DEFAULT_PRICING;
    }
  },
  ['stripe-pricing-cache'],
  {
    revalidate: 3600, // Revalidate every hour
    tags: ['pricing'], // Cache tag for on-demand revalidation
  }
);
