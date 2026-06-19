import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import dbConnect from '@/lib/Db';
import Course from '@/models/Course';
import { requireRole } from '@/lib/apiAuth';

type Params = { params: { courseId: string } };

// GET /api/courses/:courseId
export async function GET(_req: NextRequest, { params }: Params) {
  try {
    await dbConnect();
    const course = await Course.findById(params.courseId).populate(
      'teacher',
      'name email avatar'
    );
    if (!course) {
      return NextResponse.json({ message: 'Course not found' }, { status: 404 });
    }
    return NextResponse.json({ course });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

// PATCH /api/courses/:courseId — admin only
export async function PATCH(req: NextRequest, { params }: Params) {
  const { error } = await requireRole('admin');
  if (error) return error;

  try {
    await dbConnect();
    const body = await req.json();
    const course = await Course.findByIdAndUpdate(params.courseId, body, {
      new: true,
      runValidators: true,
    });
    if (!course) {
      return NextResponse.json({ message: 'Course not found' }, { status: 404 });
    }

    // Bust the cache for the public home page so the change shows immediately
    revalidatePath('/');

    return NextResponse.json({ message: 'Course updated', course });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

// DELETE /api/courses/:courseId — admin only
export async function DELETE(_req: NextRequest, { params }: Params) {
  const { error } = await requireRole('admin');
  if (error) return error;

  try {
    await dbConnect();
    await Course.findByIdAndDelete(params.courseId);

    // Bust the cache for the public home page so the deletion shows immediately
    revalidatePath('/');

    return NextResponse.json({ message: 'Course deleted' });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}