import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/Db';
import Order from '@/models/Order';
import User from '@/models/User';
import Course from '@/models/Course';
import { requireRole } from '@/lib/apiAuth';

// POST /api/admin/enroll-user
// Body: { userId, courseId, note? }
// Grants a user access to a specific course for free — manual enrollment by admin.
export async function POST(req: NextRequest) {
  const { session, error } = await requireRole('admin');
  if (error) return error;

  try {
    const { userId, courseId, note } = await req.json();

    if (!userId || !courseId) {
      return NextResponse.json(
        { message: 'userId and courseId are required' },
        { status: 400 }
      );
    }

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

    // Create a paid manual order — this is the audit record
    await Order.create({
      user:          userId,
      course:        courseId,
      amount:        0,               // free — admin granted
      status:        'paid',
      paymentMethod: 'manual',
      grantedBy:     session!.user.id,
      grantNote:     note?.trim() || 'Manual enrollment by admin',
      paidAt:        new Date(),
    });

    // Grant course access
    await User.findByIdAndUpdate(userId, {
      $addToSet: { purchasedCourses: courseId },
    });

    return NextResponse.json({
      message: `✓ ${user.name} has been enrolled in "${course.title}"`,
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
      .populate('user',      'name email')
      .populate('course',    'title')
      .populate('grantedBy', 'name')
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ orders });
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}