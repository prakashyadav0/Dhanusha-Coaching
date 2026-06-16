import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/Db';
import Course from '@/models/Course';
import Order from '@/models/Order';
import { requireRole } from '@/lib/apiAuth';

const APP_URL             = process.env.NEXTAUTH_URL!;
const KHALTI_SECRET_KEY   = process.env.KHALTI_SECRET_KEY!;
const ESEWA_MERCHANT_CODE = process.env.ESEWA_MERCHANT_CODE!;
const KHALTI_INITIATE_URL = 'https://a.khalti.com/api/v2/epayment/initiate/';

// POST /api/payment/initiate
// Body: { courseId: string, method: 'khalti' | 'esewa' | 'bank' | 'free' }
export async function POST(req: NextRequest) {
  const { session, error } = await requireRole('user');
  if (error) return error;

  try {
    const { courseId, method = 'khalti' } = await req.json();

    if (!courseId) {
      return NextResponse.json({ message: 'courseId is required' }, { status: 400 });
    }

    await dbConnect();

    const course = await Course.findById(courseId);
    if (!course || !course.isPublished) {
      return NextResponse.json({ message: 'Course not found' }, { status: 404 });
    }

    // Already purchased guard
    const existing = await Order.findOne({
      user:   session!.user.id,
      course: courseId,
      status: 'paid',
    });
    if (existing) {
      return NextResponse.json({ message: 'You already own this course' }, { status: 409 });
    }

    // ── Free enroll ────────────────────────────────────────────────────────
    if (course.price === 0 || method === 'free') {
      const order = await Order.create({
        user:          session!.user.id,
        course:        courseId,
        amount:        0,
        status:        'paid',
        paymentMethod: 'free',
        paidAt:        new Date(),
      });
      const User = (await import('@/models/User')).default;
      await User.findByIdAndUpdate(session!.user.id, {
        $addToSet: { purchasedCourses: courseId },
      });
      return NextResponse.json({ message: 'Enrolled for free', order });
    }

    // ── Bank QR ────────────────────────────────────────────────────────────
    // Creates a pending order; admin manually verifies and marks it paid
    if (method === 'bank') {
      const order = await Order.create({
        user:          session!.user.id,
        course:        courseId,
        amount:        course.price,
        status:        'pending',
        paymentMethod: 'bank',
      });
      return NextResponse.json({
        message: 'Bank payment submitted. Access granted after verification.',
        orderId: order._id,
      });
    }

    // ── Khalti ────────────────────────────────────────────────────────────
    if (method === 'khalti') {
      const order = await Order.create({
        user:          session!.user.id,
        course:        courseId,
        amount:        course.price,
        status:        'pending',
        paymentMethod: 'khalti',
      });

      const khaltiRes = await fetch(KHALTI_INITIATE_URL, {
        method:  'POST',
        headers: {
          Authorization:  `Key ${KHALTI_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          return_url:           `${APP_URL}/api/payment/verify`,
          website_url:          APP_URL,
          amount:               course.price * 100, // paisa
          purchase_order_id:    order._id.toString(),
          purchase_order_name:  course.title,
          customer_info: {
            name:  session!.user.name,
            email: session!.user.email,
          },
        }),
      });

      if (!khaltiRes.ok) {
        const err = await khaltiRes.json();
        await Order.findByIdAndDelete(order._id); // cleanup failed order
        return NextResponse.json({ message: 'Khalti error', detail: err }, { status: 502 });
      }

      const khaltiData = await khaltiRes.json();
      await Order.findByIdAndUpdate(order._id, { pidx: khaltiData.pidx });

      return NextResponse.json({
        payment_url: khaltiData.payment_url,
        pidx:        khaltiData.pidx,
        orderId:     order._id,
      });
    }

    // ── eSewa ─────────────────────────────────────────────────────────────
    if (method === 'esewa') {
      const order = await Order.create({
        user:          session!.user.id,
        course:        courseId,
        amount:        course.price,
        status:        'pending',
        paymentMethod: 'esewa',
      });

      // eSewa v2 uses a form POST — we return the params to the client
      // and the client submits a hidden form to eSewa's endpoint
      const esewaParams = {
        amount:           course.price.toString(),
        tax_amount:       '0',
        total_amount:     course.price.toString(),
        transaction_uuid: order._id.toString(),
        product_code:     ESEWA_MERCHANT_CODE,
        product_service_charge: '0',
        product_delivery_charge: '0',
        success_url:      `${APP_URL}/api/payment/esewa-verify`,
        failure_url:      `${APP_URL}/payment/failed?reason=esewa_failed`,
        signed_field_names: 'total_amount,transaction_uuid,product_code',
      };

      // Signature: in production generate HMAC-SHA256, here we return params
      // and the client form-posts to eSewa directly
      return NextResponse.json({
        provider:     'esewa',
        esewa_url:    'https://rc-epay.esewa.com.np/api/epay/main/v2/form', // use live URL in production
        esewa_params: esewaParams,
        orderId:      order._id,
      });
    }

    return NextResponse.json({ message: 'Invalid payment method' }, { status: 400 });

  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}