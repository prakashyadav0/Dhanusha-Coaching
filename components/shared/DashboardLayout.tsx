'use client';
import { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';

const PAGE_TITLES: Record<string, string> = {
  '/admin/dashboard':  'Dashboard',
  '/admin/courses':    'Courses',
  '/admin/notices':    'Notices',
  '/admin/users':      'Users',
  '/admin/payments':   'Bank Payments',
  '/teacher/dashboard':'Dashboard',
  '/teacher/notices':  'Notices',
  '/teacher/notes':    'Notes',
  '/user/dashboard':   'Dashboard',
};

function getPageTitle(pathname: string): string {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
  if (pathname.includes('/videos'))  return 'Videos';
  if (pathname.includes('/notes'))   return 'Notes';
  if (pathname.includes('/notices')) return 'Notices';
  return '';
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
    <div className="flex h-screen overflow-hidden bg-gray-50">

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

      <aside
        className={`
          fixed inset-y-0 left-0 z-40
          w-[280px] max-w-[85vw]
          transition-transform duration-300 ease-in-out
          will-change-transform
          lg:static lg:translate-x-0 lg:w-64 lg:z-auto lg:transition-none lg:shrink-0
          ${open ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:shadow-none'}
        `}
      >
        <Sidebar onClose={() => setOpen(false)} />
      </aside>

      {/* Main content column */}
      <div className="flex flex-col flex-1 min-w-0 h-full">

        {/* Mobile top bar — hidden on lg */}
        <header className="lg:hidden shrink-0 flex items-center gap-3 px-3 h-14 bg-white border-b border-gray-200 z-20">
          <button
            onClick={() => setOpen(true)}
            aria-label="Open menu"
            className="flex items-center justify-center w-10 h-10 rounded-xl text-gray-600 hover:bg-gray-100 active:bg-gray-200 transition -ml-1"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="flex-1 text-sm font-semibold text-gray-800 truncate">
            {pageTitle}
          </span>
          <span className="text-sm font-bold text-red-600 shrink-0">Dhanusha Coaching</span>
        </header>

        {/* Scrollable page content */}
        <main className="flex-1 overflow-y-auto overscroll-contain">
          <div className="flex flex-col min-h-full p-4 sm:p-6 lg:p-8">
            {/* Page content */}
            <div className="flex-1">
              {children}
            </div>

            {/* --- FOOTER --- */}
            <footer className="mt-8 pt-4 border-t border-gray-200 text-center text-xs text-gray-500">
              &copy; {new Date().getFullYear()} Dhanusha Coaching. All rights reserved.
            </footer>
          </div>
        </main>
      </div>
    </div>
  );
}