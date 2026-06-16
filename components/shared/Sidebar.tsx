'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { useState, useEffect, useCallback } from 'react';

interface Course { _id: string; title: string; price: number; }
interface Props   { onClose?: () => void; }

const adminNav = [
  { label: 'Dashboard', href: '/admin/dashboard', icon: '🏠' },
  { label: 'Courses',   href: '/admin/courses',   icon: '📚' },
  { label: 'Notices',   href: '/admin/notices',   icon: '📢' },
  { label: 'Users',     href: '/admin/users',     icon: '👥' },
  { label: 'Payments',  href: '/admin/payments',  icon: '🏦' },
  { label: 'Link',  href: '/admin/links',  icon: '🔗' },
];

const teacherNav = [
  { label: 'Dashboard', href: '/teacher/dashboard', icon: '🏠' },
  { label: 'Notices',   href: '/teacher/notices',   icon: '📢' },
  { label: 'Notes',     href: '/teacher/notes',     icon: '📝' },
];

export default function Sidebar({ onClose }: Props) {
  const { data: session } = useSession();
  const pathname          = usePathname();
  const role              = session?.user.role;

  const [allCourses,      setAllCourses]      = useState<Course[]>([]);
  const [purchasedIds,    setPurchasedIds]    = useState<Set<string>>(new Set());
  const [coursesOpen,     setCoursesOpen]     = useState(true);
  const [loadingCourses,  setLoadingCourses]  = useState(false);
  const [pendingPayments, setPendingPayments] = useState(0);

  // ── Admin: pending bank-payment badge ────────────────────────────────────
  useEffect(() => {
    if (role !== 'admin') return;
    fetch('/api/admin/pending-orders?status=pending')
      .then(r => r.ok ? r.json() : { orders: [] })
      .then(d => setPendingPayments(d.orders?.length ?? 0))
      .catch(() => {});
  }, [role, pathname]);

  // ── User: load all courses + purchased set ────────────────────────────────
  const loadCourses = useCallback(async () => {
    if (role !== 'user') return;
    setLoadingCourses(true);
    try {
      const [ar, pr] = await Promise.all([
        fetch('/api/courses'),
        fetch('/api/user/purchased-courses'),
      ]);
      const [ad, pd] = await Promise.all([ar.json(), pr.json()]);
      setAllCourses(ad.courses ?? []);
      setPurchasedIds(new Set((pd.courses ?? []).map((c: Course) => c._id)));
    } catch { /* non-fatal */ }
    finally { setLoadingCourses(false); }
  }, [role]);

  useEffect(() => { loadCourses(); }, [loadCourses]);
  useEffect(() => {
    window.addEventListener('course:purchased', loadCourses);
    return () => window.removeEventListener('course:purchased', loadCourses);
  }, [loadCourses]);

  // ── Derived ───────────────────────────────────────────────────────────────
  const roleLabel = role === 'admin' ? 'Admin' : role === 'teacher' ? 'Teacher' : 'Student';
  const roleColor =
    role === 'admin'   ? 'bg-red-100 text-red-700'    :
    role === 'teacher' ? 'bg-amber-100 text-amber-700' :
                         'bg-indigo-100 text-indigo-700';
  const nav = role === 'admin' ? adminNav : role === 'teacher' ? teacherNav : [];

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(href + '/');
  }

  // Shared link class — min 44px height for mobile tap targets
  function linkCls(active: boolean) {
    return `flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium min-h-[44px] transition-colors ${
      active
        ? 'bg-indigo-50 text-indigo-700'
        : 'text-gray-600 hover:bg-gray-100 active:bg-gray-200'
    }`;
  }

  return (
    /*
      Full height, flex column.
      pb-safe adds safe-area-inset-bottom padding for notched iPhones.
    */
    <div className="h-full w-full bg-white border-r border-gray-200 flex flex-col overflow-hidden select-none">

      {/* ── Brand + close button ─────────────────────────────────────────── */}
      <div className="shrink-0 flex items-center justify-between px-4 h-14 border-b border-gray-100">
        <Link
          href="/"
          onClick={onClose}
          className="text-lg font-bold text-red-600 tracking-tight"
        >
          Dhanusha Coaching
        </Link>
        {/* Close button: 44×44 tap target, hidden on desktop */}
        <button
          onClick={onClose}
          aria-label="Close menu"
          className="lg:hidden flex items-center justify-center w-10 h-10 -mr-1 rounded-xl text-gray-400 hover:bg-gray-100 active:bg-gray-200 transition"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* ── User info ────────────────────────────────────────────────────── */}
      <div className="shrink-0 px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          {/* Avatar initial */}
          <div className="shrink-0 w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-sm font-bold">
            {session?.user.name?.[0]?.toUpperCase() ?? '?'}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-800 truncate leading-snug">
              {session?.user.name ?? '…'}
            </p>
            <p className="text-xs text-gray-400 truncate">{session?.user.email ?? ''}</p>
          </div>
        </div>
        <span className={`mt-2 inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full ${roleColor}`}>
          {roleLabel}
        </span>
      </div>

      {/* ── Nav (scrollable) ─────────────────────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto overscroll-contain px-2.5 py-2 space-y-0.5">

        {/* Admin / Teacher flat nav */}
        {nav.map(item => (
          <Link
            key={item.href}
            href={item.href}
            onClick={onClose}
            className={linkCls(isActive(item.href))}
          >
            <span className="text-base w-5 text-center shrink-0 leading-none">{item.icon}</span>
            <span className="truncate flex-1">{item.label}</span>
            {/* Red badge for pending bank payments */}
            {item.href === '/admin/payments' && pendingPayments > 0 && (
              <span className="shrink-0 bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center leading-tight">
                {pendingPayments}
              </span>
            )}
          </Link>
        ))}

        {/* User nav */}
        {role === 'user' && (
          <>
            {/* Dashboard */}
            <Link
              href="/user/dashboard"
              onClick={onClose}
              className={linkCls(pathname === '/user/dashboard')}
            >
              <span className="text-base w-5 text-center shrink-0">🏠</span>
              <span className="truncate">Dashboard</span>
            </Link>
            {/* Exams */}
    <Link
      href="/user/exams"
      onClick={onClose}
      className={linkCls(pathname.startsWith('/user/exams'))}
    >
      <span className="text-base w-5 text-center shrink-0">📝</span>
      <span className="truncate">Exams</span>
    </Link>

    {/* Live Classes */}
    <Link
      href="/user/live-classes"
      onClick={onClose}
      className={linkCls(pathname.startsWith('/user/live-classes'))}
    >
      <span className="text-base w-5 text-center shrink-0">🎥</span>
      <span className="truncate">Live Classes</span>
    </Link>

            {/* Courses collapsible section */}
            <div className="pt-1">
              <button
                onClick={() => setCoursesOpen(o => !o)}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold text-gray-400 uppercase tracking-widest hover:text-gray-600 hover:bg-gray-50 active:bg-gray-100 transition-colors min-h-[36px]"
              >
                <span className="flex items-center gap-2">
                  <span className="text-sm">📚</span>
                  <span>Courses</span>
                  {allCourses.length > 0 && (
                    <span className="bg-gray-100 text-gray-500 text-xs px-1.5 py-0.5 rounded-full font-medium normal-case">
                      {allCourses.length}
                    </span>
                  )}
                </span>
                <svg
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${coursesOpen ? 'rotate-90' : ''}`}
                  fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>

              {coursesOpen && (
                <div className="mt-0.5 space-y-0.5">
                  {loadingCourses ? (
                    <div className="px-3 py-2 space-y-2">
                      {[1,2,3].map(i => (
                        <div key={i} className="h-10 bg-gray-100 rounded-xl animate-pulse" />
                      ))}
                    </div>
                  ) : allCourses.length === 0 ? (
                    <p className="px-3 py-2 text-xs text-gray-400 italic">No courses available.</p>
                  ) : allCourses.map(course => {
                    const owned   = purchasedIds.has(course._id);
                    const baseUrl = `/user/courses/${course._id}`;
                    const inside  = pathname.startsWith(baseUrl);

                    return (
                      <div key={course._id}>
                        {owned ? (
                          <Link
                            href={`${baseUrl}/videos`}
                            onClick={onClose}
                            className={`flex items-center gap-2.5 px-3 py-3 rounded-xl text-sm min-h-[44px] transition-colors ${
                              inside
                                ? 'bg-indigo-50 text-indigo-700 font-semibold'
                                : 'text-gray-700 hover:bg-gray-100 active:bg-gray-200'
                            }`}
                          >
                            <span className="shrink-0 text-sm w-5 text-center">🔓</span>
                            <span className="truncate">{course.title}</span>
                          </Link>
                        ) : (
                          <Link
                            href="/user/dashboard"
                            onClick={onClose}
                            title={`Unlock · ${course.price === 0 ? 'Free' : `Rs. ${course.price}`}`}
                            className="group flex items-center gap-2.5 px-3 py-3 rounded-xl text-sm min-h-[44px] text-gray-400 hover:bg-gray-50 active:bg-gray-100 transition-colors"
                          >
                            <span className="shrink-0 text-sm w-5 text-center">🔒</span>
                            <span className="truncate flex-1 min-w-0">{course.title}</span>
                            {/* Price hint — visible on hover (desktop) and always on mobile */}
                            <span className="shrink-0 text-xs bg-indigo-50 text-indigo-500 px-1.5 py-0.5 rounded-lg font-medium whitespace-nowrap
                              opacity-0 group-hover:opacity-100 lg:group-hover:opacity-100 transition-opacity">
                              {course.price === 0 ? 'Free' : `Rs.${course.price}`}
                            </span>
                          </Link>
                        )}

                        {/* Sub-links when inside a purchased course */}
                        {owned && inside && (
                          <div className="ml-8 mt-0.5 mb-1 pl-3 border-l-2 border-indigo-100 space-y-0.5">
                            {[
                              { label: 'Videos',  href: `${baseUrl}/videos`,  icon: '▶' },
                              { label: 'Notes',   href: `${baseUrl}/notes`,   icon: '📝' },
                              { label: 'Notices', href: `${baseUrl}/notices`, icon: '📢' },
                            ].map(sub => (
                              <Link
                                key={sub.href}
                                href={sub.href}
                                onClick={onClose}
                                className={`flex items-center gap-2 px-2.5 py-2.5 rounded-xl text-xs font-medium min-h-[40px] transition-colors ${
                                  pathname === sub.href
                                    ? 'bg-indigo-100 text-indigo-700'
                                    : 'text-gray-500 hover:bg-gray-100 active:bg-gray-200'
                                }`}
                              >
                                <span className="shrink-0">{sub.icon}</span>
                                {sub.label}
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </nav>

      {/* ── Sign out ─────────────────────────────────────────────────────── */}
      {/*
        pb-safe-or-4 → on notched iPhones, adds bottom padding equal to
        the home indicator height; falls back to 1rem on other devices.
        We approximate this with pb-6 (safe enough for most devices).
      */}
      <div className="shrink-0 px-2.5 pt-2 pb-6 border-t border-gray-100" style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}>
        <button
          onClick={() => signOut({ callbackUrl: '/' })}
          className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium min-h-[44px] text-gray-600 hover:bg-red-50 hover:text-red-600 active:bg-red-100 transition-colors"
        >
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h6a2 2 0 012 2v1" />
          </svg>
          Sign Out
        </button>
      </div>
    </div>
  );
}