import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import dbConnect from '@/lib/Db';
import User from '@/models/User';
import { sendPasswordResetEmail } from '@/lib/mail';

// Basic in-memory rate limiter: max 3 requests per email per 15 minutes.
// Replace with Redis (e.g. Upstash) in production for multi-instance deployments.
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 15 * 60 * 1000; // 15 min
const MAX_REQUESTS = 3;

function isRateLimited(email: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(email);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(email, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }

  if (entry.count >= MAX_REQUESTS) return true;

  entry.count += 1;
  return false;
}

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email is required.' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    if (isRateLimited(normalizedEmail)) {
      return NextResponse.json(
        { error: 'Too many requests. Please wait before trying again.' },
        { status: 429 }
      );
    }

    await dbConnect();

    const user = await User.findOne({ email: normalizedEmail });

    // Always return the same response whether the email exists or not —
    // this prevents email enumeration attacks.
    if (!user) {
      return NextResponse.json({
        message: 'If that email is registered, you will receive a reset link shortly.',
      });
    }

    // Generate a cryptographically secure random token
    const rawToken = crypto.randomBytes(32).toString('hex');
const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

console.log('RAW TOKEN:', rawToken);
console.log('HASHED TOKEN SAVED:', hashedToken);

await User.updateOne(
  { _id: user._id },
  {
    resetToken: hashedToken,
    resetTokenExpiry: new Date(Date.now() + 60 * 60 * 1000),
  }
);

// Verify it was actually saved
const check = await User.findById(user._id).select('+resetToken +resetTokenExpiry');
console.log('DB AFTER SAVE:', check?.resetToken, check?.resetTokenExpiry);

    const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${rawToken}`;

    await sendPasswordResetEmail(user.email, user.name, resetUrl);

    return NextResponse.json({
      message: 'If that email is registered, you will receive a reset link shortly.',
    });
  } catch (error) {
    console.error('[forgot-password]', error);
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
  }
}