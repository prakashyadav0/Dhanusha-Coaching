import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function getSession() {
  return getServerSession(authOptions);
}

/** Returns the session or a 401 NextResponse */
export async function requireAuth() {
  const session = await getSession();
  if (!session) {
    return {
      session: null,
      error: NextResponse.json({ message: 'Unauthorized' }, { status: 401 }),
    };
  }
  return { session, error: null };
}

/** Returns the session only if user has one of the allowed roles */
export async function requireRole(...roles: string[]) {
  const { session, error } = await requireAuth();
  if (error) return { session: null, error };

  if (!roles.includes(session!.user.role)) {
    return {
      session: null,
      error: NextResponse.json({ message: 'Forbidden' }, { status: 403 }),
    };
  }
  return { session, error: null };
}