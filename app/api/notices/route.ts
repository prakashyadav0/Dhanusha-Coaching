import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/Db';
import Notice from '@/models/Notice';
import { requireAuth, requireRole } from '@/lib/apiAuth';

// GET /api/notices
// ?courseId=   — filter to a specific course (omit for platform-wide)
// ?includeScheduled=true — admin only: include future-scheduled notices
export async function GET(req: NextRequest) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const courseId = searchParams.get('courseId');
  const includeScheduled = searchParams.get('includeScheduled') === 'true';
  const isAdmin = session!.user.role === 'admin';

  try {
    await dbConnect();

    const filter: Record<string, any> = {};

    // ── Scope: course-specific or platform-wide ───────────────────────────
    if (courseId) {
      filter.course = courseId;
    } else {
      filter.course = { $in: [null, undefined] };
      // Non-admins only see notices targeted at their role
      if (!isAdmin) {
        filter.targetRole = { $in: ['all', session!.user.role] };
      }
    }

    // ── Schedule: only show notices whose time has arrived ────────────────
    // Admins requesting includeScheduled=true see everything (for the admin UI).
    // Everyone else — including admins browsing as users — only sees notices
    // where scheduledAt is null/missing OR scheduledAt is in the past.
    if (!isAdmin || !includeScheduled) {
      filter.$or = [
        { scheduledAt: null },
        { scheduledAt: { $exists: false } },
        { scheduledAt: { $lte: new Date() } },
      ];
    }

    const notices = await Notice.find(filter)
      .sort({ isPinned: -1, createdAt: -1 })
      .populate('postedBy', 'name role')
      .populate('course', 'title');

    return NextResponse.json({ notices });
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}

// POST /api/notices — admin or teacher
export async function POST(req: NextRequest) {
  const { session, error } = await requireRole('admin', 'teacher');
  if (error) return error;

  try {
    const body = await req.json();
    const { title, body: noticeBody, targetRole, courseId, isPinned, scheduledAt } = body;

    if (!title || !noticeBody) {
      return NextResponse.json(
        { message: 'title and body are required' },
        { status: 400 }
      );
    }

    if (session!.user.role === 'teacher' && targetRole === 'teacher') {
      return NextResponse.json(
        { message: 'Teachers cannot target the teacher role' },
        { status: 403 }
      );
    }

    // ── Validate scheduledAt ──────────────────────────────────────────────
    let parsedScheduledAt: Date | null = null;
    if (scheduledAt) {
      parsedScheduledAt = new Date(scheduledAt);
      if (isNaN(parsedScheduledAt.getTime())) {
        return NextResponse.json({ message: 'Invalid scheduledAt date' }, { status: 400 });
      }
      if (parsedScheduledAt <= new Date()) {
        return NextResponse.json(
          { message: 'Scheduled time must be in the future' },
          { status: 400 }
        );
      }
    }

    await dbConnect();

    const notice = await Notice.create({
      title,
      body: noticeBody,
      postedBy: session!.user.id,
      targetRole: targetRole ?? 'all',
      course: courseId ?? null,
      isPinned: session!.user.role === 'admin' ? (isPinned ?? false) : false,
      scheduledAt: parsedScheduledAt,
    });

    return NextResponse.json({ message: 'Notice posted', notice }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}

// PATCH /api/notices?id=xxx — admin or teacher (edit any field including schedule)
export async function PATCH(req: NextRequest) {
  const { session, error } = await requireRole('admin', 'teacher');
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ message: 'id is required' }, { status: 400 });

  try {
    const body = await req.json();
    const { title, body: noticeBody, targetRole, courseId, isPinned, scheduledAt } = body;

    await dbConnect();

    const notice = await Notice.findById(id);
    if (!notice) {
      return NextResponse.json({ message: 'Notice not found' }, { status: 404 });
    }

    // Teachers can only edit their own notices
    if (
      session!.user.role === 'teacher' &&
      notice.postedBy.toString() !== session!.user.id
    ) {
      return NextResponse.json(
        { message: 'Not authorised to edit this notice' },
        { status: 403 }
      );
    }

    // ── Validate new scheduledAt if provided ──────────────────────────────
    let parsedScheduledAt: Date | null | undefined = undefined; // undefined = not changing
    if (scheduledAt !== undefined) {
      if (scheduledAt === null) {
        // Explicitly clearing the schedule — publish immediately
        parsedScheduledAt = null;
      } else {
        parsedScheduledAt = new Date(scheduledAt);
        if (isNaN(parsedScheduledAt.getTime())) {
          return NextResponse.json({ message: 'Invalid scheduledAt date' }, { status: 400 });
        }
        if (parsedScheduledAt <= new Date()) {
          return NextResponse.json(
            { message: 'Scheduled time must be in the future' },
            { status: 400 }
          );
        }
      }
    }

    const updates: Record<string, any> = {};
    if (title !== undefined)       updates.title      = title;
    if (noticeBody !== undefined)  updates.body       = noticeBody;
    if (targetRole !== undefined)  updates.targetRole = targetRole;
    if (courseId !== undefined)    updates.course     = courseId || null;
    if (isPinned !== undefined && session!.user.role === 'admin') {
      updates.isPinned = isPinned;
    }
    if (parsedScheduledAt !== undefined) {
      updates.scheduledAt = parsedScheduledAt; // null clears it, Date reschedules it
    }

    const updated = await Notice.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true }
    )
      .populate('postedBy', 'name role')
      .populate('course', 'title');

    return NextResponse.json({ message: 'Notice updated', notice: updated });
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 });
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
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}