import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/Db';
import Order from '@/models/Order';
import User from '@/models/User';
import Course from '@/models/Course';
import { requireRole } from '@/lib/apiAuth';

// POST /api/admin/disenroll-user
// Body: { userId, courseId }
// Revokes a user's access to a course. The matching paid Order (if any) is
// marked 'refunded' rather than deleted, so revenue stats drop it while
// keeping a full audit trail of who revoked it and when.
export async function POST(req: NextRequest) {
  const { session, error } = await requireRole('admin');
  if (error) return error;

  try {
    const { userId, courseId } = await req.json();

    if (!userId || !courseId) {
      return NextResponse.json(
        { message: 'userId and courseId are required' },
        { status: 400 }
      );
    }

    await dbConnect();

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

    const isEnrolled = user.purchasedCourses.some(
      (id: any) => id.toString() === courseId
    );
    if (!isEnrolled) {
      return NextResponse.json(
        { message: `${user.name} doesn't have access to "${course.title}"` },
        { status: 409 }
      );
    }

    // Revoke access
    await User.findByIdAndUpdate(userId, {
      $pull: { purchasedCourses: courseId },
    });

    // Mark the most recent paid order for this user+course as refunded,
    // so it no longer counts toward revenue. Keeps the record for history
    // instead of deleting it.
    await Order.findOneAndUpdate(
      { user: userId, course: courseId, status: 'paid' },
      {
        status:     'refunded',
        refundedBy: session!.user.id,
        refundedAt: new Date(),
      },
      { sort: { createdAt: -1 } }
    );

    return NextResponse.json({
      message: `${user.name} has been disenrolled from "${course.title}"`,
    });
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}