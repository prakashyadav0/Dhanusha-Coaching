import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/Db';
import Notice from '@/models/Notice';
import { requireAuth, requireRole } from '@/lib/apiAuth';

// GET /api/notices — authenticated users; optional ?courseId= filter
export async function GET(req: NextRequest) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const courseId = searchParams.get('courseId');

  try {
    await dbConnect();

    const filter: Record<string, any> = {};

    if (courseId) {
      filter.course = courseId;
    } else {
      // Platform-wide notices: target role must match or be 'all'
      filter.course = null;
      if (session!.user.role !== 'admin') {
        filter.targetRole = { $in: ['all', session!.user.role] };
      }
    }

    const notices = await Notice.find(filter)
      .sort({ isPinned: -1, createdAt: -1 })
      .populate('postedBy', 'name role');

    return NextResponse.json({ notices });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

// POST /api/notices — admin or teacher
export async function POST(req: NextRequest) {
  const { session, error } = await requireRole('admin', 'teacher');
  if (error) return error;

  try {
    const body = await req.json();
    const { title, body: noticeBody, targetRole, courseId, isPinned } = body;

    if (!title || !noticeBody) {
      return NextResponse.json(
        { message: 'title and body are required' },
        { status: 400 }
      );
    }

    // Teachers can only post to their own courses or targetRole 'user'
    if (session!.user.role === 'teacher' && targetRole === 'teacher') {
      return NextResponse.json(
        { message: 'Teachers cannot target the teacher role' },
        { status: 403 }
      );
    }

    await dbConnect();

    const notice = await Notice.create({
      title,
      body: noticeBody,
      postedBy: session!.user.id,
      targetRole: targetRole ?? 'all',
      course: courseId ?? null,
      isPinned: session!.user.role === 'admin' ? (isPinned ?? false) : false,
    });

    return NextResponse.json({ message: 'Notice posted', notice }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

// DELETE /api/notices?id=xxx — admin only
export async function DELETE(req: NextRequest) {
  const { error } = await requireRole('admin');
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ message: 'id is required' }, { status: 400 });

  try {
    await dbConnect();
    await Notice.findByIdAndDelete(id);
    return NextResponse.json({ message: 'Notice deleted' });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}