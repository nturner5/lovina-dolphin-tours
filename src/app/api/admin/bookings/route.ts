import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getSupabase } from '@/lib/supabase';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-01-27.acacia' as any,
});

// Helper to check admin authentication
function checkAuth(req: Request) {
  const password = req.headers.get('x-admin-password');
  return password === (process.env.ADMIN_PASSWORD || 'Blhuanca15!');
}

export async function GET(req: Request) {
  try {
    if (!checkAuth(req)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .order('date', { ascending: false })
      .limit(100);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Map Supabase snake_case fields to uppercase Airtable-like keys
    const bookings = (data || []).map((record: any) => ({
      id: record.id,
      BookingCode: record.booking_code,
      Date: record.date,
      Guests: record.guests,
      PickupLocation: record.pickup_location,
      PickupDescription: record.pickup_description,
      WhatsappNumber: record.whatsapp_number,
      GuestPhone: record.guest_phone,
      HotelDetails: record.hotel_details,
      AssignedCaptain: record.assigned_captain,
      CaptainPhone: record.captain_phone,
      RulesSigned: record.rules_signed,
      SignatureTime: record.signature_time,
      GuestName: record.guest_name,
      GuestEmail: record.guest_email,
      createdTime: record.created_at,
    }));

    return NextResponse.json({ bookings });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    if (!checkAuth(req)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, fields } = await req.json();

    if (!id || !fields) {
      return NextResponse.json({ error: 'Missing record id or fields' }, { status: 400 });
    }

    // Map uppercase fields to Supabase snake_case columns
    const updateFields: any = {};
    if (fields.Date !== undefined) updateFields.date = fields.Date;
    if (fields.Guests !== undefined) updateFields.guests = Number(fields.Guests);
    if (fields.AssignedCaptain !== undefined) updateFields.assigned_captain = fields.AssignedCaptain;
    if (fields.CaptainPhone !== undefined) updateFields.captain_phone = fields.CaptainPhone;
    if (fields.HotelDetails !== undefined) updateFields.hotel_details = fields.HotelDetails;
    if (fields.PickupLocation !== undefined) updateFields.pickup_location = fields.PickupLocation;
    if (fields.PickupDescription !== undefined) updateFields.pickup_description = fields.PickupDescription;
    if (fields.WhatsappNumber !== undefined) {
      updateFields.whatsapp_number = fields.WhatsappNumber;
      updateFields.guest_phone = fields.WhatsappNumber;
    }
    if (fields.RulesSigned !== undefined) updateFields.rules_signed = fields.RulesSigned;
    if (fields.SignatureTime !== undefined) updateFields.signature_time = fields.SignatureTime;
    if (fields.GuestName !== undefined) updateFields.guest_name = fields.GuestName;
    if (fields.GuestEmail !== undefined) updateFields.guest_email = fields.GuestEmail;

    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('bookings')
      .update(updateFields)
      .eq('id', id)
      .select();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, record: data[0] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST endpoint serves cancellation/refunds and manual cash booking creation
export async function POST(req: Request) {
  try {
    if (!checkAuth(req)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { action } = body;

    const supabase = getSupabase();

    if (action === 'cancel') {
      const { bookingCode, recordId } = body;
      if (!bookingCode || !recordId) {
        return NextResponse.json({ error: 'Missing bookingCode or recordId' }, { status: 400 });
      }

      let refundStatus = 'No Stripe payment found (marked as cancelled).';

      // 1. Find the Stripe checkout session matching the booking code
      try {
        const sessions = await stripe.checkout.sessions.list({
          limit: 100,
        });
        const session = sessions.data.find(
          (s) => s.metadata && s.metadata.bookingCode === bookingCode
        );
        if (session && session.payment_intent) {
          // Issue full refund via Stripe
          await stripe.refunds.create({
            payment_intent: session.payment_intent as string,
          });
          refundStatus = `Refunded Stripe payment intent: ${session.payment_intent}`;
        }
      } catch (stripeErr: any) {
        console.error('Stripe refund warning:', stripeErr);
        refundStatus = `Stripe refund skipped/failed: ${stripeErr.message}`;
      }

      // 2. Mark booking as CANCELLED in Supabase
      const { error: dbErr } = await supabase
        .from('bookings')
        .update({
          assigned_captain: 'CANCELLED',
          rules_signed: 'CANCELLED',
        })
        .eq('id', recordId);

      if (dbErr) {
        return NextResponse.json({ error: `Stripe refunded successfully but Supabase update failed: ${dbErr.message}` }, { status: 500 });
      }

      return NextResponse.json({ success: true, refundStatus });
    } 
    
    if (action === 'create') {
      const { fields } = body;
      if (!fields) {
        return NextResponse.json({ error: 'Missing fields for creation' }, { status: 400 });
      }

      const insertRow = {
        booking_code: fields.BookingCode,
        date: fields.Date,
        guests: Number(fields.Guests),
        pickup_location: fields.PickupLocation,
        pickup_description: fields.PickupDescription,
        whatsapp_number: fields.WhatsappNumber,
        guest_phone: fields.WhatsappNumber,
        hotel_details: fields.HotelDetails,
        guest_name: fields.GuestName,
        guest_email: fields.GuestEmail,
        assigned_captain: fields.AssignedCaptain || 'PENDING',
        rules_signed: fields.RulesSigned || 'PENDING',
        tour_id: fields.tourId || 'seven-am-ethical',
      };

      const { data, error } = await supabase
        .from('bookings')
        .insert([insertRow])
        .select();

      if (error) {
        return NextResponse.json({ error: `Supabase record creation failed: ${error.message}` }, { status: 500 });
      }

      return NextResponse.json({ success: true, record: data[0] });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
