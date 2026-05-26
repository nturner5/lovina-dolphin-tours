import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-01-27.acacia' as any,
});

export async function POST(req: Request) {
  try {
    const { tourId, date, guests, tourName, price, pickupLocation } = await req.json();

    // Calculate pickup price and name
    let pickupFee = 0;
    let pickupName = '';
    let pickupDesc = '';

    if (pickupLocation === 'ubud') {
      pickupFee = 35;
      pickupName = 'Private Return Transfer — Ubud';
      pickupDesc = `Private roundtrip transport from your hotel in Ubud to Lovina for your dolphin tour on ${date}.`;
    } else if (pickupLocation === 'canggu-kuta') {
      pickupFee = 50;
      pickupName = 'Private Return Transfer — Canggu, Seminyak, Kuta';
      pickupDesc = `Private roundtrip transport from your hotel in Canggu, Seminyak, or Kuta to Lovina for your dolphin tour on ${date}.`;
    } else if (pickupLocation === 'lovina') {
      pickupName = 'Free Local Pickup — Lovina Beach Area';
      pickupDesc = `Complimentary local pickup within 2km of Lovina Beach on ${date}.`;
    }

    const lineItems: any[] = [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: tourName,
            description: `Ethical Dolphin Tour for ${guests} guests on ${date}`,
          },
          unit_amount: price * 100,
        },
        quantity: 1,
      },
    ];

    // If there is a paid transfer fee, add it as a separate line item
    if (pickupFee > 0) {
      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: {
            name: pickupName,
            description: pickupDesc,
          },
          unit_amount: pickupFee * 100,
        },
        quantity: 1,
      });
    }

    const session = await stripe.checkout.sessions.create({
      line_items: lineItems,
      mode: 'payment',
      success_url: `${req.headers.get('origin')}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get('origin')}/checkout`,
      metadata: {
        tourId,
        date,
        guests: guests.toString(),
        pickupLocation: pickupLocation || 'none',
        pickupFee: pickupFee.toString(),
        pickupDescription: pickupName || 'None',
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
