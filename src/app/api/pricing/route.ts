import { NextResponse } from 'next/server';
import { getPricingData } from '@/lib/pricing-server';

export async function GET() {
  try {
    const pricing = await getPricingData();
    return NextResponse.json(pricing);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
