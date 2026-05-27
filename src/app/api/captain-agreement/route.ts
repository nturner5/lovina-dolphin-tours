import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { bookingId, captainName, captainPhone, signedAt } = await req.json();

    // Check if n8n webhook URL is configured
    const n8nWebhookUrl = process.env.N8N_CAPTAIN_AGREEMENT_WEBHOOK_URL;

    if (n8nWebhookUrl) {
      // Forward the signed agreement payload to n8n to trigger the lead unlock dispatch!
      const response = await fetch(n8nWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId,
          captainName,
          captainPhone,
          signedAt,
          status: 'signed',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to notify n8n automation engine');
      }
    } else {
      console.warn('N8N_CAPTAIN_AGREEMENT_WEBHOOK_URL is not set in environment. Staging signed agreement in server logs:', {
        bookingId,
        captainName,
        captainPhone,
        signedAt,
      });
    }

    return NextResponse.json({ success: true, message: 'Agreement recorded successfully' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
