import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

import dbConnect from '@/lib/Db';
import Course from '@/models/Course';
import { requireRole } from '@/lib/apiAuth';

type Context = {
  params: Promise<{
    courseId: string;
  }>;
};

// GET /api/courses/:courseId
export async function GET(
  _req: NextRequest,
  context: Context
) {
  try {
    await dbConnect();

    const { courseId } = await context.params;

    const course = await Course.findById(courseId).populate(
      'teacher',
      'name email avatar'
    );

    if (!course) {
      return NextResponse.json(
        { message: 'Course not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ course });
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message },
      { status: 500 }
    );
  }
}

// PATCH /api/courses/:courseId — admin only
export async function PATCH(
  req: NextRequest,
  context: Context
) {
  const { error } = await requireRole('admin');
  if (error) return error;

  try {
    await dbConnect();

    const { courseId } = await context.params;
    const body = await req.json();

    const course = await Course.findByIdAndUpdate(
      courseId,
      body,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!course) {
      return NextResponse.json(
        { message: 'Course not found' },
        { status: 404 }
      );
    }

    revalidatePath('/');

    return NextResponse.json({
      message: 'Course updated',
      course,
    });
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/courses/:courseId — admin only
export async function DELETE(
  _req: NextRequest,
  context: Context
) {
  const { error } = await requireRole('admin');
  if (error) return error;

  try {
    await dbConnect();

    const { courseId } = await context.params;

    const deleted = await Course.findByIdAndDelete(courseId);

    if (!deleted) {
      return NextResponse.json(
        { message: 'Course not found' },
        { status: 404 }
      );
    }

    revalidatePath('/');

    return NextResponse.json({
      message: 'Course deleted',
    });
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message },
      { status: 500 }
    );
  }
}