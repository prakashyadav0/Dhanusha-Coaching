'use client';
import { useState, useEffect } from 'react';
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

/*
  ════════════════════════════════════════════════════════════════════════
  WHY THIS VERSION IS DIFFERENT — read this before touching scroll again.
  ════════════════════════════════════════════════════════════════════════

  Every previous attempt tried to make a FIXED-HEIGHT app shell (100dvh /
  100vh root, overflow-hidden, a single inner div with overflow-y-auto
  acting as "the" scroll container). That pattern is fragile on mobile
  because:
    - 100vh ignores the address bar show/hide animation
    - 100dvh fixes that, but then anything ELSE on the page (a modal with
      its own vh-based max-height, a global touch listener, a flex child
      missing min-h-0) can desync the browser's internal scroll-anchoring
      for that container, and once desynced it can stay "stuck" until a
      full reload.

  THE FIX: stop fighting the browser. Don't constrain the page height at
  all. Let html/body scroll NORMALLY, the way every simple website does.
  The sidebar becomes `position: sticky; top: 0; height: 100dvh` so it
  visually stays in place WITHOUT being `position: fixed` and without the
  page needing an artificial height cap. The mobile top bar becomes a
  real `sticky` header. There is now exactly ONE scrollable thing on the
  whole page: the browser's own document scroll. Nothing can desync that.
  ════════════════════════════════════════════════════════════════════════
*/

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname        = usePathname();

  // Close drawer on route change
  useEffect(() => { setOpen(false); }, [pathname]);

  // Lock page scroll ONLY while the mobile drawer is open
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const pageTitle = getPageTitle(pathname);

  return (
    // No height constraint here at all — this div is exactly as tall as
    // its content, just like a normal webpage. The browser's native
    // document scroll handles everything.
    <div className="lg:flex bg-gray-50">

      {/* Backdrop — tapping it closes the drawer (mobile only) */}
      <div
        aria-hidden
        onClick={() => setOpen(false)}
        className={`
          fixed inset-0 bg-black/50 z-30 lg:hidden
          transition-opacity duration-300
          ${open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}
        `}
      />

      {/*
        Sidebar.
        Mobile  → fixed drawer (off-canvas), slides in from left.
        Desktop → `sticky top-0` — NOT fixed. Sticky lets it stay pinned
                  to the viewport while scrolling, but it participates in
                  normal layout flow, so it can never desync page scroll.
      */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-40 w-[280px] max-w-[85vw]
          transition-transform duration-300 ease-in-out will-change-transform
          lg:sticky lg:top-0 lg:translate-x-0 lg:w-64 lg:h-dvh lg:shrink-0 lg:z-auto lg:transition-none
          ${open ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:shadow-none'}
        `}
      >
        <Sidebar onClose={() => setOpen(false)} />
      </aside>

      {/* Main column — no height constraint, grows with its content */}
      <div className="flex-1 min-w-0">

        {/*
          Mobile top bar — `sticky top-0`, NOT fixed. It scrolls away with
          the page on desktop (hidden via lg:hidden anyway) and stays
          pinned to the top of the viewport on mobile while the page
          underneath scrolls normally.
        */}
        <header className="lg:hidden sticky top-0 z-20 flex items-center gap-3 px-3 h-14 bg-white border-b border-gray-200">
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
          
        </header>

        {/* Page content — plain block, grows naturally, page scrolls past it */}
        <main className="p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}