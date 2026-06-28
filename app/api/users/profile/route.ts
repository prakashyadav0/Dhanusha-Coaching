import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/Db';
import User from '@/models/User';
import { requireAuth } from '@/lib/apiAuth';

// GET /api/user/profile — return current user's public fields
export async function GET() {
  const { session, error } = await requireAuth();
  if (error) return error;

  try {
    await dbConnect();
    const user = await User.findById(session!.user.id)
      .select('name email number')
      .lean();

    if (!user) return NextResponse.json({ message: 'User not found' }, { status: 404 });

    return NextResponse.json({ user });
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}

// PATCH /api/user/profile
// Body can contain any combination of:
//   { name, number }           → update profile info
//   { oldPassword, newPassword } → change password
export async function PATCH(req: NextRequest) {
  const { session, error } = await requireAuth();
  if (error) return error;

  try {
    const body = await req.json();
    const { name, number, oldPassword, newPassword } = body;

    await dbConnect();

    // ── Password change ──────────────────────────────────────────────────
    if (oldPassword || newPassword) {
      if (!oldPassword || !newPassword) {
        return NextResponse.json(
          { message: 'Both old and new password are required' },
          { status: 400 }
        );
      }
      if (newPassword.length < 6) {
        return NextResponse.json(
          { message: 'New password must be at least 6 characters' },
          { status: 400 }
        );
      }

      // Must select +password since it is select:false on the schema
      const user = await User.findById(session!.user.id).select('+password');
      if (!user) return NextResponse.json({ message: 'User not found' }, { status: 404 });

      const valid = await bcrypt.compare(oldPassword, user.password);
      if (!valid) {
        return NextResponse.json(
          { message: 'Current password is incorrect' },
          { status: 400 }
        );
      }

      user.password = await bcrypt.hash(newPassword, 12);
      await user.save();

      return NextResponse.json({ message: 'Password changed successfully' });
    }

    // ── Profile info update ──────────────────────────────────────────────
    const update: Record<string, string> = {};
    if (name?.trim())   update.name   = name.trim();
    if (number?.trim()) update.number = number.trim();

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ message: 'Nothing to update' }, { status: 400 });
    }

    const updated = await User.findByIdAndUpdate(
      session!.user.id,
      update,
      { new: true, runValidators: true }
    ).select('name email number');

    return NextResponse.json({
      message: 'Profile updated successfully',
      user: updated,
    });
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}