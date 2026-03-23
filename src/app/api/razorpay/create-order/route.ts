import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { amount } = await req.json();

    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret || keyId === 'your-razorpay-key-id-here' || keySecret === 'your-razorpay-key-secret-here') {
      return NextResponse.json({ error: 'Razorpay keys not configured. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in environment variables.' }, { status: 500 });
    }

    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString('base64')}`,
      },
      body: JSON.stringify({
        amount: Math.round(amount * 100), // convert rupees to paise
        currency: 'INR',
        receipt: `receipt_${Date.now()}`,
      }),
    });

    const order = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: order.error?.description || order.error?.reason || 'Failed to create Razorpay order' },
        { status: 400 }
      );
    }

    return NextResponse.json({ orderId: order.id, amount: order.amount, currency: order.currency });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
