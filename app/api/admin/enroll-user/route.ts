import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/Db';
import Order from '@/models/Order';
import User from '@/models/User';
import Course from '@/models/Course';
import { requireRole } from '@/lib/apiAuth';

// POST /api/admin/enroll-user
// Body: { userId, courseId, note?, price? }
// Grants a user access to a specific course — manual enrollment by admin.
// price defaults to 0 (free grant). Any price > 0 is recorded as a paid
// manual Order, so it counts toward revenue alongside Khalti/eSewa/bank orders.
export async function POST(req: NextRequest) {
  const { session, error } = await requireRole('admin');
  if (error) return error;

  try {
    const { userId, courseId, note, price } = await req.json();

    if (!userId || !courseId) {
      return NextResponse.json(
        { message: 'userId and courseId are required' },
        { status: 400 }
      );
    }

    // Normalize price — default to 0 (free), reject negative/garbage input
    const amount = Number(price);
    const safeAmount = Number.isFinite(amount) && amount > 0 ? amount : 0;

    await dbConnect();

    // Validate user and course both exist
    const [user, course] = await Promise.all([
      User.findById(userId).select('name email purchasedCourses'),
      Course.findById(courseId).select('title'),
    ]);

    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }
    if (!course) {
      return NextResponse.json({ message: 'Course not found' }, { status: 404 });
    }

    // Already enrolled guard — check both purchasedCourses array and paid orders
    const alreadyEnrolled = user.purchasedCourses.some(
      (id: any) => id.toString() === courseId
    );
    if (alreadyEnrolled) {
      return NextResponse.json(
        { message: `${user.name} already has access to "${course.title}"` },
        { status: 409 }
      );
    }

    // Create a manual order — this is the audit record. Paid or free, it's
    // still paymentMethod 'manual' (didn't go through a real gateway), but
    // amount now reflects whatever the admin charged.
    await Order.create({
      user:          userId,
      course:        courseId,
      amount:        safeAmount,
      status:        'paid',
      paymentMethod: 'manual',
      grantedBy:     session!.user.id,
      grantNote:     note?.trim() || (safeAmount > 0 ? 'Manual enrollment by admin' : 'Manual enrollment by admin (free)'),
      paidAt:        new Date(),
    });

    // Grant course access
    await User.findByIdAndUpdate(userId, {
      $addToSet: { purchasedCourses: courseId },
    });

    return NextResponse.json({
      message:
        safeAmount > 0
          ? `✓ ${user.name} has been enrolled in "${course.title}" (Rs. ${safeAmount})`
          : `✓ ${user.name} has been enrolled in "${course.title}"`,
    });
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}

// GET /api/admin/enroll-user — list all manually enrolled records
export async function GET() {
  const { error } = await requireRole('admin');
  if (error) return error;

  try {
    await dbConnect();

    const orders = await Order.find({ paymentMethod: 'manual' })
      .populate('user',       'name email')
      .populate('course',     'title')
      .populate('grantedBy',  'name')
      .populate('refundedBy', 'name')
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ orders });
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}