import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/Db';
import Video from '@/models/Video';
import Order from '@/models/Order';
import { requireAuth, requireRole } from '@/lib/apiAuth';

function extractYoutubeId(url: string): string {
  const match = url.match(/(?:youtu\.be\/|v=|embed\/)([^&\n?#]+)/);
  return match ? match[1] : '';
}

// GET /api/videos?courseId=xxx — authenticated users who purchased the course
export async function GET(req: NextRequest) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const courseId = searchParams.get('courseId');

  if (!courseId) {
    return NextResponse.json({ message: 'courseId is required' }, { status: 400 });
  }

  try {
    await dbConnect();

    // Admins and teachers bypass purchase check
    const isPrivileged = ['admin', 'teacher'].includes(session!.user.role);

    if (!isPrivileged) {
      const order = await Order.findOne({
        user: session!.user.id,
        course: courseId,
        status: 'paid',
      });
      if (!order) {
        return NextResponse.json(
          { message: 'Purchase this course to access videos' },
          { status: 403 }
        );
      }
    }

    const videos = await Video.find({ course: courseId })
      .sort({ order: 1, createdAt: 1 })
      .populate('postedBy', 'name');

    return NextResponse.json({ videos });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

// POST /api/videos — admin only
export async function POST(req: NextRequest) {
  const { session, error } = await requireRole('admin');
  if (error) return error;

  try {
    const body = await req.json();
    const { title, description, youtubeUrl, courseId, order } = body;

    if (!title || !youtubeUrl || !courseId) {
      return NextResponse.json(
        { message: 'title, youtubeUrl and courseId are required' },
        { status: 400 }
      );
    }

    const youtubeId = extractYoutubeId(youtubeUrl);
    if (!youtubeId) {
      return NextResponse.json(
        { message: 'Invalid YouTube URL' },
        { status: 400 }
      );
    }

    await dbConnect();

    const video = await Video.create({
      title,
      description: description ?? '',
      youtubeUrl,
      youtubeId,
      course: courseId,
      postedBy: session!.user.id,
      order: order ?? 0,
    });

    // Increment course video counter
    const Course = (await import('@/models/Course')).default;
    await Course.findByIdAndUpdate(courseId, { $inc: { totalVideos: 1 } });

    return NextResponse.json({ message: 'Video added', video }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

// DELETE /api/videos?id=xxx — admin only
export async function DELETE(req: NextRequest) {
  const { error } = await requireRole('admin');
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ message: 'id is required' }, { status: 400 });

  try {
    await dbConnect();
    const video = await Video.findByIdAndDelete(id);
    if (video) {
      const Course = (await import('@/models/Course')).default;
      await Course.findByIdAndUpdate(video.course, { $inc: { totalVideos: -1 } });
    }
    return NextResponse.json({ message: 'Video deleted' });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}