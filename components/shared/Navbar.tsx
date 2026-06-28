'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useSession, signOut } from 'next-auth/react';
import { useState, useEffect } from 'react';

export default function Navbar() {
  const { data: session } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);

  const dashboardHref =
    session?.user.role === 'admin'
      ? '/admin/dashboard'
      : session?.user.role === 'teacher'
      ? '/teacher/dashboard'
      : '/user/dashboard';

  // Close mobile menu on scroll
  useEffect(() => {
    if (!menuOpen) return;

    const handleScroll = () => {
      setMenuOpen(false);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [menuOpen]);

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-20 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between relative">
        
        {/* Logo + Site Name */}
        <Link
          href="/"
          className="flex items-center gap-3"
        >
          <Image
            src="/logo.webp"
            alt="Dhanusha Coaching"
            width={45}
            height={45}
            className="rounded-lg"
            priority
          />
          <span className="text-xl font-bold text-red-600">
            Dhanusha Coaching
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden sm:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
          <Link
            href="/"
            className="text-sm font-medium text-gray-600 hover:text-indigo-600 transition"
          >
            Home
          </Link>
          <Link
            href="/user/dashboard"
            className="text-sm font-medium text-gray-600 hover:text-indigo-600 transition"
          >
            Courses
          </Link>
          <Link
            href="/about"
            className="text-sm font-medium text-gray-600 hover:text-indigo-600 transition"
          >
            About Us
          </Link>
          <Link
            href="/contact"
            className="text-sm font-medium text-gray-600 hover:text-indigo-600 transition"
          >
            Contact Us
          </Link>
        </div>

        {/* Right Side Auth Buttons */}
        <div className="hidden sm:flex items-center gap-4">
          {session ? (
            <>
              <Link
                href={dashboardHref}
                className="text-sm text-gray-600 hover:text-indigo-600 transition"
              >
                Dashboard
              </Link>

              <button
                onClick={() => signOut({ callbackUrl: '/' })}
                className="text-sm bg-gray-100 hover:bg-red-500 hover:text-white px-4 py-2 rounded-lg transition"
              >
                Sign Out
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm text-gray-600 hover:text-indigo-600"
              >
                Login
              </Link>

              <Link
                href="/register"
                className="text-sm bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
              >
                Register
              </Link>
            </>
          )}
        </div>

        {/* Mobile Hamburger */}
        <button
          className="sm:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          {menuOpen ? (
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          ) : (
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile Menu – always rendered, with smooth slide transition */}
      <div
        className={`
          sm:hidden border-t border-gray-100 bg-white
          overflow-hidden transition-all duration-300 ease-in-out
          ${menuOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}
        `}
      >
        <div className="px-4 py-3 space-y-2">
          <Link
            href="/"
            onClick={() => setMenuOpen(false)}
            className="block text-sm text-gray-700 py-2"
          >
            Home
          </Link>
          
          <Link
            href="/user/dashboard"
            onClick={() => setMenuOpen(false)}
            className="block text-sm text-gray-700 py-2"
          >
            Courses
          </Link>
          <Link
            href="/about"
            onClick={() => setMenuOpen(false)}
            className="block text-sm text-gray-700 py-2"
          >
            About Us
          </Link>

          <Link
            href="/contact"
            onClick={() => setMenuOpen(false)}
            className="block text-sm text-gray-700 py-2"
          >
            Contact Us
          </Link>

          {session ? (
            <>
              <Link
                href={dashboardHref}
                onClick={() => setMenuOpen(false)}
                className="block text-sm text-gray-700 py-2 hover:text-indigo-600"
              >
                Dashboard
              </Link>

              <button
                onClick={() => signOut({ callbackUrl: '/' })}
                className="block w-full text-left text-sm text-red-600 py-2"
              >
                Sign Out
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                onClick={() => setMenuOpen(false)}
                className="block text-sm text-gray-700 py-2"
              >
                Login
              </Link>

              <Link
                href="/register"
                onClick={() => setMenuOpen(false)}
                className="block text-sm bg-indigo-600 text-white px-4 py-2 rounded-lg text-center"
              >
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}