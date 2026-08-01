import Stripe from 'stripe';
import { unstable_cache } from 'next/cache';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-01-27.acacia' as any,
});

// Dynamic exchange rate fetcher with multiple fallback sources and short timeout
export const getExchangeRate = unstable_cache(
  async () => {
    // Source 1: Frankfurter API
    try {
      const res = await fetch('https://api.frankfurter.app/latest?from=USD&to=IDR', { signal: AbortSignal.timeout(3000) });
      if (res.ok) {
        const data = await res.json();
        const rate = data.rates?.IDR;
        if (rate && typeof rate === 'number' && rate > 10000) {
          console.log(`Frankfurter exchange rate: 1 USD = ${rate} IDR`);
          return rate;
        }
      }
    } catch (e: any) {
      console.warn('Frankfurter exchange rate fetch failed:', e.message);
    }

    // Source 2: JSDelivr Currency API
    try {
      const res = await fetch('https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json', { signal: AbortSignal.timeout(3000) });
      if (res.ok) {
        const data = await res.json();
        const rate = data.usd?.idr;
        if (rate && typeof rate === 'number' && rate > 10000) {
          console.log(`JSDelivr exchange rate: 1 USD = ${rate} IDR`);
          return rate;
        }
      }
    } catch (e: any) {
      console.warn('JSDelivr exchange rate fetch failed:', e.message);
    }

    // Default static fallback
    return 18053;
  },
  ['usd-idr-exchange-rate-cache'],
  { revalidate: 86400 } // 24 hours cache
);

// Default static fallback pricing to prevent breaks
export const DEFAULT_PRICING = {
  tours: [
    { id: 'seven-am-ethical', name: 'Dolphin Watching', price: 812000, priceUsd: 45, time: '7:00 AM' },
    { id: 'dolphin-swim', name: 'Dolphin Watching & Swim', price: 993000, priceUsd: 55, time: '7:00 AM' },
    { id: 'swim-snorkel', name: 'Dolphin Watching & Swim & Reef Snorkel', price: 1173000, priceUsd: 65, time: '7:00 AM' },
  ],
  pickups: [
    { id: 'none', name: 'No Driver (Meet at Lovina Beach by 6:30 AM)', price: 0, priceUsd: 0 },
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
      const rate = await getExchangeRate();

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
          priceUsd = Math.round(price / rate);
        } else {
          priceUsd = stripePrice;
          price = Math.round((priceUsd * rate) / 1000) * 1000;
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
          if (product.metadata.pickup_id === 'lovina') continue;
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
