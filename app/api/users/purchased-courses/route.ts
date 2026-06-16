import { NextResponse } from 'next/server';
import dbConnect from '@/lib/Db';
import User from '@/models/User';
import { requireAuth } from '@/lib/apiAuth';

// GET /api/user/purchased-courses
// Returns full course objects the logged-in user has purchased.
export async function GET() {
  const { session, error } = await requireAuth();
  if (error) return error;

  try {
    await dbConnect();

    const user = await User.findById(session!.user.id)
      .select('purchasedCourses')
      .populate({
        path: 'purchasedCourses',
        populate: { path: 'teacher', select: 'name' },
      })
      .lean();

    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ courses: user.purchasedCourses ?? [] });
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}