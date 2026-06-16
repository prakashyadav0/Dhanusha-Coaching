import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/Db';
import Order from '@/models/Order';
import User from '@/models/User';

const KHALTI_SECRET_KEY = process.env.KHALTI_SECRET_KEY!;
const KHALTI_LOOKUP_URL = 'https://a.khalti.com/api/v2/epayment/lookup/';
const APP_URL = process.env.NEXTAUTH_URL!;

// GET /api/payment/verify?pidx=xxx&purchase_order_id=xxx&status=Completed
// Khalti redirects here after payment
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const pidx = searchParams.get('pidx');
  const purchaseOrderId = searchParams.get('purchase_order_id');
  const status = searchParams.get('status'); // 'Completed' | 'User canceled'

  if (!pidx || !purchaseOrderId) {
    return NextResponse.redirect(`${APP_URL}/payment/failed?reason=missing_params`);
  }

  if (status !== 'Completed') {
    return NextResponse.redirect(`${APP_URL}/payment/failed?reason=cancelled`);
  }

  try {
    await dbConnect();

    // Lookup with Khalti to confirm
    const lookupRes = await fetch(KHALTI_LOOKUP_URL, {
      method: 'POST',
      headers: {
        Authorization: `Key ${KHALTI_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ pidx }),
    });

    if (!lookupRes.ok) {
      return NextResponse.redirect(`${APP_URL}/payment/failed?reason=lookup_failed`);
    }

    const lookup = await lookupRes.json();

    if (lookup.status !== 'Completed') {
      return NextResponse.redirect(`${APP_URL}/payment/failed?reason=not_completed`);
    }

    // Find the order
    const order = await Order.findById(purchaseOrderId);
    if (!order) {
      return NextResponse.redirect(`${APP_URL}/payment/failed?reason=order_not_found`);
    }

    // Guard: amount must match (paisa to NPR)
    const expectedPaisa = order.amount * 100;
    if (lookup.total_amount !== expectedPaisa) {
      return NextResponse.redirect(`${APP_URL}/payment/failed?reason=amount_mismatch`);
    }

    // Already processed (double-tap guard)
    if (order.status === 'paid') {
      return NextResponse.redirect(`${APP_URL}/user/dashboard?already=true`);
    }

    // Mark paid
    await Order.findByIdAndUpdate(purchaseOrderId, {
      status: 'paid',
      transactionId: lookup.transaction_id,
      paidAt: new Date(),
    });

    // Grant access to the user
    await User.findByIdAndUpdate(order.user, {
      $addToSet: { purchasedCourses: order.course },
    });

    return NextResponse.redirect(
      `${APP_URL}/payment/success?courseId=${order.course}`
    );
  } catch (error: any) {
    console.error('Payment verify error:', error);
    return NextResponse.redirect(`${APP_URL}/payment/failed?reason=server_error`);
  }
}