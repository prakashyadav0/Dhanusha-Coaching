import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function proxy(req) {
    const { pathname } = req.nextUrl;
    const role = req.nextauth.token?.role as string | undefined;

    // Admin routes → only admin
    if (pathname.startsWith('/admin') && role !== 'admin') {
      return NextResponse.redirect(new URL('/login?error=unauthorized', req.url));
    }

    // Teacher routes → teacher or admin
    if (
      pathname.startsWith('/teacher') &&
      role !== 'teacher' &&
      role !== 'admin'
    ) {
      return NextResponse.redirect(new URL('/login?error=unauthorized', req.url));
    }

    // User routes → any authenticated user
    if (pathname.startsWith('/user') && !role) {
      return NextResponse.redirect(new URL('/login', req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      // Let withAuth call middleware() only when a token exists
      // (unauthenticated requests get redirected to signIn page automatically)
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: ['/admin/:path*', '/teacher/:path*', '/user/:path*'],
};