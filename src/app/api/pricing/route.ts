import { NextResponse } from 'next/server';
import { getPricingData, getExchangeRate } from '@/lib/pricing-server';

export async function GET() {
  try {
    const pricing = await getPricingData();
    const rate = await getExchangeRate();
    return NextResponse.json({ ...pricing, exchangeRate: rate });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
