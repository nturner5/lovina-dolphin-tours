import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const password = req.headers.get('x-admin-password');
    const correctPassword = process.env.ADMIN_PASSWORD || 'Bdhuanca15!';
    if (password !== correctPassword) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { url, body, headers } = await req.json();

    if (!url) {
      return NextResponse.json({ error: 'Target URL is required' }, { status: 400 });
    }

    // Forward the POST request from the server side to bypass CORS blocks
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      body: JSON.stringify(body)
    });

    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      data = text;
    }

    return NextResponse.json({
      status: response.status,
      statusText: response.statusText,
      data
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
