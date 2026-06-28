import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/Db';
import Link from '@/models/Link';
import { requireAuth, requireRole } from '@/lib/apiAuth';

// GET /api/links?type=live_class|exam|syllabus
export async function GET(req: NextRequest) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type');
  const all = searchParams.get('all');
  const courseId = searchParams.get('courseId');

  try {
    await dbConnect();

    const filter: Record<string, any> = {};

    if (type) filter.type = type;

    if (all !== 'true') filter.isActive = true;

    const isAdmin = session!.user.role === 'admin';

    if (courseId) {
      if (!isAdmin) {
        const User = (await import('@/models/User')).default;

        const user = await User.findById(session!.user.id)
          .select('purchasedCourses')
          .lean();

        const owns = (user?.purchasedCourses ?? [])
          .map(String)
          .includes(courseId);

        if (!owns) {
          return NextResponse.json({ links: [] });
        }
      }

      filter.course = courseId;
    } else if (!isAdmin) {
      const User = (await import('@/models/User')).default;

      const user = await User.findById(session!.user.id)
        .select('purchasedCourses')
        .lean();

      const ownedCourseIds = (user?.purchasedCourses ?? []).map((id: any) =>
        id.toString()
      );

      filter.$or = [
        { course: null },
        { course: { $in: ownedCourseIds } },
      ];
    }

    const links = await Link.find(filter)
      .populate('postedBy', 'name')
      .populate('course', 'title')
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ links });
  } catch (err: any) {
    return NextResponse.json(
      { message: err.message },
      { status: 500 }
    );
  }
}

// POST /api/links
export async function POST(req: NextRequest) {
  const { session, error } = await requireRole('admin');
  if (error) return error;

  try {
    const body = await req.json();

    const {
      title,
      url,
      type,
      description,
      courseId,
      startsAt,
    } = body;

    if (!title || !url || !type) {
      return NextResponse.json(
        {
          message: 'title, url and type are required',
        },
        { status: 400 }
      );
    }

    if (
      !['live_class', 'exam', 'syllabus'].includes(type)
    ) {
      return NextResponse.json(
        {
          message:
            'type must be live_class, exam or syllabus',
        },
        { status: 400 }
      );
    }

    await dbConnect();

    const link = await Link.create({
      title,
      url,
      type,
      description: description ?? '',
      course: courseId ?? null,
      startsAt: startsAt ? new Date(startsAt) : null,
      isActive: true,
      postedBy: session!.user.id,
    });

    return NextResponse.json(
      {
        message: 'Link created successfully',
        link,
      },
      { status: 201 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { message: err.message },
      { status: 500 }
    );
  }
}

// PATCH /api/links?id=xxxx
export async function PATCH(req: NextRequest) {
  const { error } = await requireRole('admin');
  if (error) return error;

  const { searchParams } = new URL(req.url);

  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json(
      { message: 'id required' },
      { status: 400 }
    );
  }

  try {
    await dbConnect();

    const body = await req.json();

    const link = await Link.findByIdAndUpdate(
      id,
      body,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!link) {
      return NextResponse.json(
        { message: 'Link not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Link updated successfully',
      link,
    });
  } catch (err: any) {
    return NextResponse.json(
      { message: err.message },
      { status: 500 }
    );
  }
}

// DELETE /api/links?id=xxxx
export async function DELETE(req: NextRequest) {
  const { error } = await requireRole('admin');
  if (error) return error;

  const { searchParams } = new URL(req.url);

  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json(
      { message: 'id required' },
      { status: 400 }
    );
  }

  try {
    await dbConnect();

    const link = await Link.findByIdAndDelete(id);

    if (!link) {
      return NextResponse.json(
        { message: 'Link not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Link deleted successfully',
    });
  } catch (err: any) {
    return NextResponse.json(
      { message: err.message },
      { status: 500 }
    );
  }
}