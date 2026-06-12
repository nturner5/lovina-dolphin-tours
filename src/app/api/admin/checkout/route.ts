import { NextResponse } from 'next/server';
import Stripe from 'stripe';

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

    const tourPrices: Record<string, number> = {
      'seven-am-ethical': 45,
      'swim-snorkel': 65,
    };

    const tourNames: Record<string, string> = {
      'seven-am-ethical': '7:00 AM Private Dolphin Watching Tour',
      'swim-snorkel': '7:00 AM Private Dolphin Watching Tour + Swim & Snorkel',
    };

    const price = tourPrices[tourId] || 45;
    const tourName = tourNames[tourId] || '7:00 AM Private Dolphin Watching Tour';

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
    } else if (pickupLocation === 'uluwatu') {
      pickupFee = 65;
      pickupName = 'Private Return Transfer — Uluwatu, Nusa Dua, Jimbaran';
      pickupDesc = `Private roundtrip transport from your hotel in Uluwatu, Nusa Dua, or Jimbaran to Lovina for your dolphin tour on ${date}.`;
    } else if (pickupLocation === 'lovina') {
      pickupName = 'Free Local Pickup — Lovina Beach Area';
      pickupDesc = `Complimentary local pickup within 2km of Lovina Beach on ${date}.`;
    }

    const lineItems: any[] = [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: `${tourName} (Private Boat)`,
            description: `Ethical Dolphin Tour for ${guests} guests on ${date}`,
          },
          unit_amount: price * 100,
        },
        quantity: Math.max(1, Number(guests) || 1), // Allow manual overrides
      },
    ];

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

    // Use or generate booking code
    const bCode = bookingCode || `LEM-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card', 'alipay', 'wechat_pay'],
      payment_method_options: {
        wechat_pay: {
          client: 'web',
        },
      },
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
