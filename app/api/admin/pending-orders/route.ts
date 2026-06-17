import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/Db';
import Order from '@/models/Order';
import { requireRole } from '@/lib/apiAuth';

// GET /api/admin/pending-orders
// Returns all pending bank payment orders for admin review
export async function GET(req: NextRequest) {
  const { error } = await requireRole('admin');
  if (error) return error;

  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const statusParam = searchParams.get('status');
    const status =
      statusParam === 'pending' ||
      statusParam === 'paid' ||
      statusParam === 'failed' ||
      statusParam === 'refunded'
        ? statusParam
        : 'pending';

    const orders = await Order.find({
      paymentMethod: 'bank',
      status,
    })
      .populate('user',   'name email')
      .populate('course', 'title price thumbnail')
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ orders });
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}