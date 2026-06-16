import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/Db';
import Order from '@/models/Order';
import User from '@/models/User';
import { requireRole } from '@/lib/apiAuth';

// POST /api/admin/approve-order
// Body: { orderId: string, action: 'approve' | 'reject' }
export async function POST(req: NextRequest) {
  const { session, error } = await requireRole('admin');
  if (error) return error;

  try {
    const { orderId, action } = await req.json();

    if (!orderId || !action) {
      return NextResponse.json({ message: 'orderId and action are required' }, { status: 400 });
    }

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json({ message: 'action must be approve or reject' }, { status: 400 });
    }

    await dbConnect();

    const order = await Order.findById(orderId);
    if (!order) {
      return NextResponse.json({ message: 'Order not found' }, { status: 404 });
    }

    if (order.paymentMethod !== 'bank') {
      return NextResponse.json({ message: 'Only bank orders can be manually approved' }, { status: 400 });
    }

    if (order.status !== 'pending') {
      return NextResponse.json({ message: `Order is already ${order.status}` }, { status: 409 });
    }

    if (action === 'approve') {
      // Mark order as paid
      await Order.findByIdAndUpdate(orderId, {
        status:     'paid',
        paidAt:     new Date(),
        approvedBy: session!.user.id,
        approvedAt: new Date(),
      });

      // Grant course access to the user
      await User.findByIdAndUpdate(order.user, {
        $addToSet: { purchasedCourses: order.course },
      });

      return NextResponse.json({
        message: 'Order approved. User now has access to the course.',
      });
    }

    // action === 'reject'
    await Order.findByIdAndUpdate(orderId, { status: 'failed' });

    return NextResponse.json({ message: 'Order rejected.' });
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}