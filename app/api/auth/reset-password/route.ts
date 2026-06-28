import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/Db';
import User from '@/models/User';

export async function POST(req: NextRequest) {
  try {
    const { token, password } = await req.json();

    if (!token || typeof token !== 'string') {
      return NextResponse.json({ error: 'Reset token is required.' }, { status: 400 });
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters.' },
        { status: 400 }
      );
    }

    await dbConnect();

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
console.log('INCOMING RAW TOKEN:', token);
console.log('HASHED FOR LOOKUP:', hashedToken);

const user = await User.findOne({ resetToken: hashedToken })
  .select('+resetToken +resetTokenExpiry');
console.log('USER FOUND:', user?._id, 'DB TOKEN:', user?.resetToken);

    if (!user) {
      return NextResponse.json(
        { error: 'This reset link is invalid or has expired.' },
        { status: 400 }
      );
    }

    if (!user.resetTokenExpiry || user.resetTokenExpiry < new Date()) {
      return NextResponse.json(
        { error: 'This reset link is invalid or has expired.' },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    // updateOne avoids full schema validation (which would fail because
    // required fields like `number` weren't selected in the query above).
    await User.updateOne(
      { _id: user._id },
      {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
        $inc: { sessionVersion: 1 },
      }
    );

    return NextResponse.json({ message: 'Password updated successfully.' });
  } catch (error) {
    console.error('[reset-password]', error);
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
  }
}