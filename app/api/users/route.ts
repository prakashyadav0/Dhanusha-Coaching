import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/Db';
import User from '@/models/User';
import { requireRole } from '@/lib/apiAuth';

// GET /api/users — admin only
export async function GET(req: NextRequest) {
  const { error } = await requireRole('admin');
  if (error) return error;

  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const role = searchParams.get('role');

    const filter: Record<string, any> = role ? { role } : {};
    const users = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 });

    return NextResponse.json({ users });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

// PATCH /api/users — admin can update role or isActive
// Body: { userId, role?, isActive? }
export async function PATCH(req: NextRequest) {
  const { error } = await requireRole('admin');
  if (error) return error;

  try {
    const { userId, role, isActive } = await req.json();
    if (!userId) {
      return NextResponse.json({ message: 'userId is required' }, { status: 400 });
    }

    await dbConnect();

    const update: Record<string, any> = {};
    if (role) update.role = role;
    if (isActive !== undefined) update.isActive = isActive;

    const user = await User.findByIdAndUpdate(userId, update, { new: true }).select(
      '-password'
    );

    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'User updated', user });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}