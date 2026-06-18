import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getPricingData } from '@/lib/pricing-server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-01-27.acacia' as any,
});

export async function POST(req: Request) {
  try {
    const password = req.headers.get('x-admin-password');
    if (password !== (process.env.ADMIN_PASSWORD || 'Blhuanca15!')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      tourId,
      date,
      guests,
      name,
      email,
      whatsappNumber,
      pickupLocation,
      hotelDetails,
      bookingCode,
    } = await req.json();

    // Fetch dynamic pricing data from the cache / Stripe
    const pricing = await getPricingData();

    let price = 0;
    let tourName = '';

    if (tourId === 'transport-only') {
      price = 0;
      tourName = 'Private Return Transfer Upgrade';
    } else {
      const tour = pricing.tours.find((t: any) => t.id === tourId);
      if (!tour) {
        return NextResponse.json({ error: `Invalid tour choice: ${tourId}` }, { status: 400 });
      }
      price = tour.price;
      tourName = tour.name;
    }

    // Find the chosen pickup option
    const pickup = pricing.pickups.find((p: any) => p.id === pickupLocation);
    if (!pickup) {
      return NextResponse.json({ error: `Invalid pickup choice: ${pickupLocation}` }, { status: 400 });
    }

    const pickupFee = pickup.price;
    const pickupName = pickup.name;
    const pickupDesc = pickupLocation === 'none'
      ? 'No transfer selected. Meet at the beach.'
      : `Private return transport from your hotel in ${pickupLocation} to Lovina for your dolphin tour on ${date}.`;

    const lineItems: any[] = [];

    if (price > 0) {
      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: {
            name: `${tourName} (Private Boat)`,
            description: `Ethical Dolphin Tour for ${guests} guests on ${date}`,
          },
          unit_amount: price * 100, // Secure price from Stripe cache
        },
        quantity: Math.max(1, Number(guests) || 1), // Allow manual overrides
      });
    }

    if (pickupFee > 0) {
      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: {
            name: pickupName,
            description: pickupDesc,
          },
          unit_amount: pickupFee * 100, // Secure price from Stripe cache
        },
        quantity: 1,
      });
    }

    // Use or generate booking code
    const bCode = bookingCode || `LEM-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    const session = await stripe.checkout.sessions.create({
      payment_method_configuration: 'pmc_1RbC3sHRvUE6uR41Bexh095q',
      customer_email: email || undefined,
      line_items: lineItems,
      mode: 'payment',
      success_url: `${req.headers.get('origin') || 'https://balidolphintours.com'}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get('origin') || 'https://balidolphintours.com'}/checkout`,
      metadata: {
        bookingCode: bCode,
        tourId,
        date,
        guests: guests.toString(),
        pickupLocation: pickupLocation || 'none',
        pickupFee: pickupFee.toString(),
        pickupDescription: pickupName || 'None',
        whatsappNumber: whatsappNumber || 'none',
        hotelDetails: hotelDetails || 'none',
        manualBooking: 'true',
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
