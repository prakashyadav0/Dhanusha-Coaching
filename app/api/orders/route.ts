import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/Db';
import Order from '@/models/Order';
import { requireRole } from '@/lib/apiAuth';

// GET /api/orders?courseId=xxx — admin only
// Returns all paid orders for a course, used to show enrolled students + revenue.
export async function GET(req: NextRequest) {
  const { error } = await requireRole('admin');
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const courseId = searchParams.get('courseId');

  if (!courseId) {
    return NextResponse.json({ message: 'courseId is required' }, { status: 400 });
  }

  try {
    await dbConnect();

    const orders = await Order.find({ course: courseId, status: 'paid' })
      .populate('user', 'name email')
      .sort({ paidAt: -1, createdAt: -1 })
      .lean();

    const users = orders.map((o) => {
      const u = o.user as any;
      return {
        _id:         u._id,
        name:        u.name,
        email:       u.email,
        amount:      o.amount,
        paymentMethod: o.paymentMethod,
        enrolledAt:  o.paidAt ?? o.createdAt,
      };
    });

    const totalRevenue = orders.reduce((sum, o) => sum + o.amount, 0);

    return NextResponse.json({ users, totalRevenue, total: users.length });
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}