'use client';
import { useState } from 'react';
import { signIn, getSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const callbackUrl = searchParams.get('callbackUrl') || '';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setLoading(false);
      setError(result.error);
      return;
    }

    if (!result?.ok) {
      setLoading(false);
      setError('Something went wrong. Please try again.');
      return;
    }

    // ── Why this matters ──────────────────────────────────────────────────
    // signIn() resolving does NOT guarantee the session cookie has fully
    // propagated and is queryable yet. A plain fetch('/api/auth/session')
    // right after signIn() can intermittently return an empty session,
    // especially under slower network/DB conditions — causing the
    // "sometimes doesn't redirect" bug.
    //
    // getSession() is NextAuth's own client helper and is more reliable,
    // but to be fully safe we retry a few times with a short delay until
    // the session actually contains a user. This makes the redirect
    // deterministic regardless of cookie-write timing.
    let session = await getSession();
    let attempts = 0;
    while (!session?.user && attempts < 5) {
      await new Promise(r => setTimeout(r, 150));
      session = await getSession();
      attempts++;
    }

    setLoading(false);

    if (!session?.user) {
      // Extremely unlikely after retries, but fail safely instead of
      // silently doing nothing.
      setError('Signed in, but could not load your session. Please refresh and try again.');
      return;
    }

    const role = session.user.role;
    const destination =
      callbackUrl ||
      (role === 'admin' ? '/admin/dashboard' :
       role === 'teacher' ? '/teacher/dashboard' :
       '/user/dashboard');

    // router.refresh() forces the Next.js router cache to pick up the new
    // session before navigating, preventing middleware from briefly seeing
    // a stale/unauthenticated state and bouncing back to /login.
    router.refresh();
    router.push(destination);
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 w-full max-w-md p-8">
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-bold text-indigo-600">
            EduNepal
          </Link>
          <h2 className="text-gray-700 mt-2 text-sm">Sign in to your account</h2>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg mb-5">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg transition"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="text-indigo-600 font-medium hover:underline">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}