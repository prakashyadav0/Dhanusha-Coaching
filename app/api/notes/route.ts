import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/Db';
import Note from '@/models/Note';
import Order from '@/models/Order';
import { requireAuth, requireRole } from '@/lib/apiAuth';

// GET /api/notes?courseId=xxx — authenticated users who purchased the course
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

    const isPrivileged = ['admin', 'teacher'].includes(session!.user.role);

    if (!isPrivileged) {
      const order = await Order.findOne({
        user: session!.user.id,
        course: courseId,
        status: 'paid',
      });
      if (!order) {
        return NextResponse.json(
          { message: 'Purchase this course to access notes' },
          { status: 403 }
        );
      }
    }

    const notes = await Note.find({ course: courseId })
      .sort({ createdAt: -1 })
      .populate('postedBy', 'name role');

    return NextResponse.json({ notes });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

// POST /api/notes — admin or teacher
export async function POST(req: NextRequest) {
  const { session, error } = await requireRole('admin', 'teacher');
  if (error) return error;

  try {
    const body = await req.json();
    const { title, description, driveLink, courseId } = body;

    if (!title || !driveLink || !courseId) {
      return NextResponse.json(
        { message: 'title, driveLink and courseId are required' },
        { status: 400 }
      );
    }

    await dbConnect();

    const note = await Note.create({
      title,
      description: description ?? '',
      driveLink,
      course: courseId,
      postedBy: session!.user.id,
    });

    // Increment course notes counter
    const Course = (await import('@/models/Course')).default;
    await Course.findByIdAndUpdate(courseId, { $inc: { totalNotes: 1 } });

    return NextResponse.json({ message: 'Note added', note }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

// DELETE /api/notes?id=xxx — admin only
export async function DELETE(req: NextRequest) {
  const { error } = await requireRole('admin');
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ message: 'id is required' }, { status: 400 });

  try {
    await dbConnect();
    const note = await Note.findByIdAndDelete(id);
    if (note) {
      const Course = (await import('@/models/Course')).default;
      await Course.findByIdAndUpdate(note.course, { $inc: { totalNotes: -1 } });
    }
    return NextResponse.json({ message: 'Note deleted' });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}