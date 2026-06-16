'use client';

import {
  useEffect,
  useState,
} from 'react';

import Link from 'next/link';

import {
  useRouter,
} from 'next/navigation';

export default function VerifyPage() {

  const router =
    useRouter();

  const [
    otp,
    setOtp,
  ] =
    useState('');

  const [
    email,
    setEmail,
  ] =
    useState('');

  const [
    loading,
    setLoading,
  ] =
    useState(false);

  const [
    error,
    setError,
  ] =
    useState('');

  useEffect(() => {

    const stored =
      sessionStorage.getItem(
        'register_email'
      );

    const token =
      sessionStorage.getItem(
        'register_token'
      );

    if (
      !stored ||
      !token
    ) {
      router.replace(
        '/register'
      );

      return;
    }

    setEmail(
      stored
    );

  }, [
    router,
  ]);

  async function handleVerify(
    e: React.FormEvent
  ) {

    e.preventDefault();

    try {

      setLoading(
        true
      );

      setError(
        ''
      );

      const token =
        sessionStorage.getItem(
          'register_token'
        );

      const res =
        await fetch(
          '/api/auth/register/verify',
          {
            method:
              'POST',

            headers:
            {
              'Content-Type':
                'application/json',
            },

            body:
              JSON.stringify(
                {
                  otp,
                  token,
                }
              ),
          }
        );

      const data =
        await res.json();

      if (
        !res.ok
      ) {

        setError(
          data.message ||
            'Verification failed'
        );

        return;

      }

      sessionStorage.removeItem(
        'register_token'
      );

      sessionStorage.removeItem(
        'register_email'
      );

      router.push(
        '/login?verified=true'
      );

    } catch {

      setError(
        'Something went wrong'
      );

    } finally {

      setLoading(
        false
      );

    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">

      <div className="w-full max-w-md rounded-2xl border bg-white p-8 shadow-sm">

        <div className="text-center">

          <h1 className="text-2xl font-bold">
            Verify Email
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            OTP sent to
          </p>

          <p className="font-medium text-indigo-600">
            {email}
          </p>

        </div>

        {error && (
          <div className="mt-5 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <form
          onSubmit={
            handleVerify
          }
          className="mt-6 space-y-4"
        >

          <input
            value={otp}
            onChange={(e)=>
              setOtp(
                e.target.value
              )
            }
            required
            maxLength={6}
            placeholder="Enter OTP"
            className="w-full rounded-lg border px-4 py-3 text-center text-lg tracking-[8px] focus:ring-2 focus:ring-indigo-500 outline-none"
          />

          <button
            disabled={
              loading
            }
            className="w-full rounded-lg bg-indigo-600 py-3 font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            {
              loading
                ? 'Verifying...'
                : 'Verify Account'
            }
          </button>

        </form>

        <p className="mt-6 text-center text-sm">

          Wrong email?

          <Link
            href="/register"
            className="ml-1 text-indigo-600"
          >
            Register again
          </Link>

        </p>

      </div>

    </div>
  );
}