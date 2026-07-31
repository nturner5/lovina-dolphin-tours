import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getPricingData } from '@/lib/pricing-server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-01-27.acacia' as any,
});

export async function POST(req: Request) {
  try {
    const { tourId, date, guests, pickupLocation, whatsappNumber, hotelDetails, billingCurrency = 'idr' } = await req.json();

    // Fetch dynamic pricing data from the cache / Stripe
    const pricing = await getPricingData();

    // Find the chosen tour
    const tour = pricing.tours.find((t: any) => t.id === tourId);
    if (!tour) {
      return NextResponse.json({ error: `Invalid tour choice: ${tourId}` }, { status: 400 });
    }

    // Find the chosen pickup option
    const pickup = pricing.pickups.find((p: any) => p.id === pickupLocation);
    if (!pickup) {
      return NextResponse.json({ error: `Invalid pickup choice: ${pickupLocation}` }, { status: 400 });
    }

    const currency = billingCurrency.toLowerCase() === 'usd' ? 'usd' : 'idr';

    // Calculate pickup price and name
    const pickupFee = currency === 'usd' ? (pickup.priceUsd || 0) : (pickup.price || 0);
    const tourPrice = currency === 'usd' ? (tour.priceUsd || 0) : (tour.price || 0);
    const pickupName = pickup.name;
    const pickupDesc = pickupLocation === 'none'
      ? 'No transfer selected. Meet at the beach.'
      : `Private roundtrip transport from your hotel in ${pickupLocation} to Lovina for your dolphin tour on ${date}.`;

    const lineItems: any[] = [
      {
        price_data: {
          currency: currency,
          product_data: {
            name: `${tour.name} (Private Boat)`,
            description: `Ethical Dolphin Tour for ${guests} guests on ${date}`,
          },
          unit_amount: tourPrice * 100, // Stripe expects USD/IDR in sub-units (cents/sen)
        },
        // Enforce guest count scaling by using quantity
        quantity: Math.max(2, Number(guests) || 2),
      },
    ];

    // If there is a paid transfer fee, add it as a separate line item
    if (pickupFee > 0) {
      lineItems.push({
        price_data: {
          currency: currency,
          product_data: {
            name: pickupName,
            description: pickupDesc,
          },
          unit_amount: pickupFee * 100, // Stripe expects USD/IDR in sub-units (cents/sen)
        },
        quantity: 1,
      });
    }



    // Generate a 4-character pronounceable uppercase booking code (e.g. LEM-K3RF)
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let shortCode = '';
    for (let i = 0; i < 4; i++) {
      shortCode += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const bookingCode = `LEM-${shortCode}`;

    const isTestMode = process.env.STRIPE_SECRET_KEY?.startsWith('sk_test_');

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      line_items: lineItems,
      mode: 'payment',
      success_url: `${req.headers.get('origin')}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get('origin')}/checkout`,
      metadata: {
        bookingCode,
        tourId,
        date,
        guests: guests.toString(),
        pickupLocation: pickupLocation || 'none',
        pickupFee: pickupFee.toString(),
        pickupDescription: pickupName || 'None',
        whatsappNumber: whatsappNumber || 'none',
        hotelDetails: hotelDetails || 'none',
      },
    };

    if (!isTestMode) {
      sessionParams.payment_method_configuration = 'pmc_1RbC3sHRvUE6uR41Bexh095q';
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
