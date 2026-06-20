import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import dbConnect from '@/lib/Db';
import Course from '@/models/Course';
import Order from '@/models/Order';
import { requireRole } from '@/lib/apiAuth';

// GET /api/courses — public list of published courses
export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const all = searchParams.get('all'); // admin passes ?all=true to see unpublished

    const filter = all ? {} : { isPublished: true };

    const courses = await Course.find(filter)
      .populate('teacher', 'name email avatar')
      .sort({ createdAt: -1 })
      .lean();

    // Only the admin "all courses" view needs enrollment counts —
    // skip this extra query for the public home page for performance.
    if (all && courses.length > 0) {
      const counts = await Order.aggregate([
        { $match: { status: 'paid', course: { $in: courses.map(c => c._id) } } },
        { $group: { _id: '$course', count: { $sum: 1 } } },
      ]);

      const countMap = new Map(counts.map(c => [c._id.toString(), c.count]));

      const coursesWithCounts = courses.map(c => ({
        ...c,
        enrolledCount: countMap.get(c._id.toString()) ?? 0,
      }));

      return NextResponse.json({ courses: coursesWithCounts });
    }

    return NextResponse.json({ courses });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

// POST /api/courses — admin only
export async function POST(req: NextRequest) {
  const { session, error } = await requireRole('admin');
  if (error) return error;

  try {
    const body = await req.json();
    const { title, description, price, thumbnail, teacherId } = body;

    if (!title || !description || price === undefined) {
      return NextResponse.json(
        { message: 'title, description and price are required' },
        { status: 400 }
      );
    }

    await dbConnect();

    const course = await Course.create({
      title,
      description,
      price,
      thumbnail: thumbnail ?? '',
      teacher: teacherId ?? session!.user.id,
    });

    // Bust the cache for the public home page so the new course shows immediately
    revalidatePath('/');

    return NextResponse.json({ message: 'Course created', course }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}