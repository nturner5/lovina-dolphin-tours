import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getPricingData } from '@/lib/pricing-server';
import { getSupabase } from '@/lib/supabase';

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
      customTourPrice,
      customPickupPrice,
      tourTime,
    } = await req.json();

    // Fetch dynamic pricing data from the cache / Stripe
    const pricing = await getPricingData();

    let price = 0;
    let tourName = '';
    let defaultTime = '7:00 AM';

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
      defaultTime = tour.time || '7:00 AM';
    }

    // Apply custom price override for the tour if provided
    if (customTourPrice !== undefined && customTourPrice !== null && customTourPrice !== '') {
      const parsedCustomPrice = Number(customTourPrice);
      if (!isNaN(parsedCustomPrice)) {
        price = parsedCustomPrice;
      }
    }

    // Find the chosen pickup option
    const pickup = pricing.pickups.find((p: any) => p.id === pickupLocation);
    if (!pickup) {
      return NextResponse.json({ error: `Invalid pickup choice: ${pickupLocation}` }, { status: 400 });
    }

    let pickupFee = pickup.price;
    const pickupName = pickup.name;
    const pickupDesc = pickupLocation === 'none'
      ? 'No transfer selected. Meet at the beach.'
      : `Private return transport from your hotel in ${pickupLocation} to Lovina for your dolphin tour on ${date}.`;

    // Apply custom price override for the transfer if provided
    if (customPickupPrice !== undefined && customPickupPrice !== null && customPickupPrice !== '') {
      const parsedCustomPickupPrice = Number(customPickupPrice);
      if (!isNaN(parsedCustomPickupPrice)) {
        pickupFee = parsedCustomPickupPrice;
      }
    }

    const lineItems: any[] = [];

    if (price > 0 || (price === 0 && tourId !== 'transport-only')) {
      // Allow creating line item even if manual override is set to 0 (free promotional tour)
      lineItems.push({
        price_data: {
          currency: 'idr',
          product_data: {
            name: `${tourName} (Private Boat)`,
            description: `Ethical Dolphin Tour for ${guests} guests on ${date}`,
          },
          unit_amount: Math.round(price), // IDR is zero-decimal
        },
        quantity: Math.max(1, Number(guests) || 1),
      });
    }

    if (pickupFee > 0) {
      lineItems.push({
        price_data: {
          currency: 'idr',
          product_data: {
            name: pickupName,
            description: pickupDesc,
          },
          unit_amount: Math.round(pickupFee), // IDR is zero-decimal
        },
        quantity: 1,
      });
    }

    // Use or generate booking code
    const bCode = bookingCode || `LEM-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const chosenTime = tourTime || defaultTime;

    const isTestMode = process.env.STRIPE_SECRET_KEY?.startsWith('sk_test_');

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
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
        tourTime: chosenTime,
      },
    };

    if (!isTestMode) {
      sessionParams.payment_method_configuration = 'pmc_1RbC3sHRvUE6uR41Bexh095q';
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    // Pre-insert pending booking into Supabase for short URL redirection
    try {
      const supabase = getSupabase();
      const insertRow = {
        booking_code: bCode,
        date,
        guests: Number(guests),
        pickup_location: pickupLocation || 'none',
        pickup_description: pickupName || 'None',
        whatsapp_number: whatsappNumber || 'none',
        guest_phone: whatsappNumber || 'none',
        hotel_details: hotelDetails || 'none',
        guest_name: name || 'Manual Link Booking',
        guest_email: email || '',
        assigned_captain: 'PENDING',
        rules_signed: 'PENDING',
        tour_id: tourId || 'seven-am-ethical',
        stripe_checkout_url: session.url,
      };

      const { error: dbErr } = await supabase
        .from('bookings')
        .insert([insertRow]);

      if (dbErr) {
        console.warn('Supabase pre-log warning (ignored if database not migrated yet):', dbErr.message);
      }
    } catch (dbErr: any) {
      console.warn('Supabase pre-log connection error:', dbErr.message);
    }

    const shortUrl = `${req.headers.get('origin') || 'https://balidolphintours.com'}/pay/${bCode}`;
    return NextResponse.json({ url: shortUrl });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
