'use client';
import { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';

const PAGE_TITLES: Record<string, string> = {
  '/admin/dashboard':   'Dashboard',
  '/admin/courses':     'Courses',
  '/admin/notices':     'Notices',
  '/admin/users':       'Users',
  '/admin/payments':    'Bank Payments',
  '/admin/links':       'Live Classes & Exams',
  '/teacher/dashboard': 'Dashboard',
  '/teacher/notices':   'Notices',
  '/teacher/notes':     'Notes',
  '/user/dashboard':    'Dashboard',
  '/user/live-classes': 'Live Classes',
  '/user/exams':        'Exams',
};

function getPageTitle(pathname: string): string {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
  if (pathname.includes('/videos'))  return 'Videos';
  if (pathname.includes('/notes'))   return 'Notes';
  if (pathname.includes('/notices')) return 'Notices';
  return 'EduNepal';
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname        = usePathname();
  const touchStartX     = useRef(0);
  const touchStartY     = useRef(0);

  // Close drawer on route change
  useEffect(() => { setOpen(false); }, [pathname]);

  // Lock body scroll when drawer is open on mobile
  useEffect(() => {
    if (open) {
      document.body.style.overflow    = 'hidden';
      document.body.style.touchAction = 'none';
    } else {
      document.body.style.overflow    = '';
      document.body.style.touchAction = '';
    }
    return () => {
      document.body.style.overflow    = '';
      document.body.style.touchAction = '';
    };
  }, [open]);

  // Swipe-right from left edge → open; swipe-left while open → close
  useEffect(() => {
    function onTouchStart(e: TouchEvent) {
      touchStartX.current = e.touches[0].clientX;
      touchStartY.current = e.touches[0].clientY;
    }
    function onTouchEnd(e: TouchEvent) {
      const dx = e.changedTouches[0].clientX - touchStartX.current;
      const dy = Math.abs(e.changedTouches[0].clientY - touchStartY.current);
      if (dy > Math.abs(dx)) return; // vertical scroll — ignore
      if (!open && dx > 60 && touchStartX.current < 40) setOpen(true);
      if (open  && dx < -60) setOpen(false);
    }
    document.addEventListener('touchstart', onTouchStart, { passive: true });
    document.addEventListener('touchend',   onTouchEnd,   { passive: true });
    return () => {
      document.removeEventListener('touchstart', onTouchStart);
      document.removeEventListener('touchend',   onTouchEnd);
    };
  }, [open]);

  const pageTitle = getPageTitle(pathname);

  return (
    /*
      ── Why "stuck scrolling in the middle" happened ──────────────────────
      The old root used `h-screen` (= 100vh) with `overflow-hidden`, and put
      the actual scroll container inside as a flex child with `overflow-y-auto`.
      On mobile browsers, 100vh does NOT account for the address bar
      collapsing/expanding as you scroll — it's measured against the LARGEST
      possible viewport. That mismatch causes the inner scroll container's
      height to be miscalculated, so content gets visually clipped partway
      through and stops scrolling before reaching the bottom/footer.

      Fix: use 100dvh (dynamic viewport height) with a 100vh fallback via
      min-h, and ensure there is exactly ONE scroll container for the page
      content — no nested overflow traps competing for touch scroll events.
    */
    <div
      className="flex flex-col lg:flex-row bg-gray-50"
      style={{ height: '100dvh', minHeight: '100vh' }}
    >

      {/* Backdrop — tapping it closes the drawer */}
      <div
        aria-hidden
        onClick={() => setOpen(false)}
        className={`
          fixed inset-0 bg-black/50 z-30 lg:hidden
          transition-opacity duration-300
          ${open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}
        `}
      />

      {/* Sidebar
          Mobile  → fixed drawer, slides in from left (w-[280px], max 85vw)
          Desktop → static column, always visible (lg:w-64)
      */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-40
          w-[280px] max-w-[85vw]
          transition-transform duration-300 ease-in-out
          will-change-transform
          lg:static lg:translate-x-0 lg:w-64 lg:z-auto lg:transition-none lg:shrink-0
          ${open ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:shadow-none'}
        `}
        style={{ height: '100dvh' }}
      >
        <Sidebar onClose={() => setOpen(false)} />
      </aside>

      {/* Main content column — exactly one scroll container lives here */}
      <div className="flex flex-col flex-1 min-w-0 min-h-0">

        {/* Mobile top bar — hidden on lg, NOT part of the scroll area */}
        <header className="lg:hidden shrink-0 flex items-center gap-3 px-3 h-14 bg-white border-b border-gray-200 z-20">
          {/* Hamburger — large tap target */}
          <button
            onClick={() => setOpen(true)}
            aria-label="Open menu"
            className="flex items-center justify-center w-10 h-10 rounded-xl text-gray-600 hover:bg-gray-100 active:bg-gray-200 transition -ml-1"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {/* Page title */}
          <span className="flex-1 text-sm font-semibold text-gray-800 truncate">
            {pageTitle}
          </span>

          {/* Brand mark */}
          <span className="text-sm font-bold text-indigo-600 shrink-0"></span>
        </header>

        {/*
          THE scroll container.
          - flex-1 + min-h-0 is required inside a flex column for overflow
            to work correctly (without min-h-0, flex children refuse to
            shrink below their content size, which silently breaks scrolling).
          - overscroll-behavior-y: contain stops "scroll chaining" — i.e.
            prevents the page from rubber-banding into pulling the body
            behind it once you hit the top/bottom.
          - -webkit-overflow-scrolling: touch gives native momentum
            scrolling on iOS Safari.
        */}
        <main
          className="flex-1 min-h-0 overflow-y-auto overscroll-y-contain"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          <div className="p-4 sm:p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}