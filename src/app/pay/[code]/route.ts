import { NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    if (!code) {
      return NextResponse.redirect(new URL('/checkout', request.url));
    }

    const supabase = getSupabase();
    const { data: booking, error } = await supabase
      .from('bookings')
      .select('stripe_checkout_url')
      .eq('booking_code', code)
      .maybeSingle();

    if (error || !booking || !booking.stripe_checkout_url) {
      console.error('Redirect failed for code:', code, error);
      return NextResponse.redirect(new URL('/checkout', request.url));
    }

    // Redirect the customer directly to the secure Stripe Checkout page
    return NextResponse.redirect(booking.stripe_checkout_url);
  } catch (err: any) {
    console.error('Short link redirect exception:', err);
    return NextResponse.redirect(new URL('/checkout', request.url));
  }
}
