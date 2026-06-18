'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { useState, useEffect, useCallback } from 'react';

interface Course { _id: string; title: string; price: number; }
interface Props { onClose?: () => void; }

const adminNav = [
  { label: 'Dashboard', href: '/admin/dashboard', icon: '🏠' },
  { label: 'Courses', href: '/admin/courses', icon: '📚' },
  { label: 'Notices', href: '/admin/notices', icon: '📢' },
  { label: 'Users', href: '/admin/users', icon: '👥' },
  { label: 'Payments', href: '/admin/payments', icon: '🏦' },
  { label: 'Link', href: '/admin/links', icon: '🔗' },
];

const teacherNav = [
  { label: 'Dashboard', href: '/team/dashboard', icon: '🏠' },
  { label: 'Notices', href: '/team/notices', icon: '📢' },
  { label: 'Notes', href: '/team/notes', icon: '📝' },
];

export default function Sidebar({ onClose }: Props) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const role = session?.user.role;

  const [allCourses, setAllCourses] = useState<Course[]>([]);
  const [purchasedIds, setPurchasedIds] = useState<Set<string>>(new Set());
  const [coursesOpen, setCoursesOpen] = useState(true);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [pendingPayments, setPendingPayments] = useState(0);

  // ── FIXED ROLE LABEL ───────────────────────────────────────
  const roleLabel =
    role === 'admin'
      ? 'Admin'
      : role === 'team member'
        ? 'Team Member'
        : 'Student';

  // ── FIXED ROLE COLOR ───────────────────────────────────────
  const roleColor =
    role === 'admin'
      ? 'bg-red-100 text-red-700'
      : role === 'team member'
        ? 'bg-amber-100 text-amber-700'
        : 'bg-indigo-100 text-indigo-700';

  // ── FIXED NAV ROLE MAPPING ─────────────────────────────────
  const nav =
    role === 'admin'
      ? adminNav
      : role === 'team member'
        ? teacherNav
        : [];

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(href + '/');
  }

  function linkCls(active: boolean) {
    return `flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium min-h-[44px] transition-colors ${
      active
        ? 'bg-indigo-50 text-indigo-700'
        : 'text-gray-600 hover:bg-gray-100 active:bg-gray-200'
    }`;
  }

  // ── ADMIN: pending payments ────────────────────────────────
  useEffect(() => {
    if (role !== 'admin') return;

    fetch('/api/admin/pending-orders?status=pending')
      .then(r => (r.ok ? r.json() : { orders: [] }))
      .then(d => setPendingPayments(d.orders?.length ?? 0))
      .catch(() => {});
  }, [role, pathname]);

  // ── USER: courses ───────────────────────────────────────────
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
    } catch {
      // silent
    } finally {
      setLoadingCourses(false);
    }
  }, [role]);

  useEffect(() => {
    loadCourses();
  }, [loadCourses]);

  useEffect(() => {
    window.addEventListener('course:purchased', loadCourses);
    return () => window.removeEventListener('course:purchased', loadCourses);
  }, [loadCourses]);

  return (
    <div className="h-full w-full bg-white border-r border-gray-200 flex flex-col overflow-hidden select-none">

      {/* BRAND */}
      <div className="shrink-0 flex items-center justify-between px-4 h-14 border-b border-gray-100">
        <Link
          href="/"
          onClick={onClose}
          className="text-lg font-bold text-red-600 tracking-tight"
        >
          Dhanusha Coaching
        </Link>
      </div>

      {/* USER INFO */}
      <div className="shrink-0 px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-sm font-bold">
            {session?.user.name?.[0]?.toUpperCase() ?? '?'}
          </div>

          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-800 truncate">
              {session?.user.name ?? '…'}
            </p>
            <p className="text-xs text-gray-400 truncate">
              {session?.user.email ?? ''}
            </p>
          </div>
        </div>

        <span className={`mt-2 inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full ${roleColor}`}>
          {roleLabel}
        </span>
      </div>

      {/* NAV */}
      <nav className="flex-1 overflow-y-auto px-2.5 py-2 space-y-0.5">

        {/* ADMIN / TEAM NAV */}
        {nav.map(item => (
          <Link
            key={item.href}
            href={item.href}
            onClick={onClose}
            className={linkCls(isActive(item.href))}
          >
            <span className="w-5 text-center">{item.icon}</span>
            <span className="truncate">{item.label}</span>

            {item.href === '/admin/payments' && pendingPayments > 0 && (
              <span className="ml-auto bg-red-500 text-white text-xs px-2 rounded-full">
                {pendingPayments}
              </span>
            )}
          </Link>
        ))}

        {/* USER NAV */}
        {role === 'user' && (
          <>
            <Link
              href="/user/dashboard"
              onClick={onClose}
              className={linkCls(pathname === '/user/dashboard')}
            >
              🏠 Dashboard
            </Link>

            <Link
              href="/user/exams"
              onClick={onClose}
              className={linkCls(pathname.startsWith('/user/exams'))}
            >
              📝 Exams
            </Link>

            <Link
              href="/user/live-classes"
              onClick={onClose}
              className={linkCls(pathname.startsWith('/user/live-classes'))}
            >
              🎥 Live Classes
            </Link>

            {/* COURSES */}
            <div className="pt-1">
              <button
                onClick={() => setCoursesOpen(o => !o)}
                className="w-full flex items-center justify-between px-3 py-2 text-xs font-bold text-gray-400 uppercase"
              >
                📚 Courses
              </button>

              {coursesOpen &&
                (loadingCourses ? (
                  <p className="px-3 text-xs text-gray-400">Loading...</p>
                ) : (
                  allCourses.map(course => {
                    const owned = purchasedIds.has(course._id);

                    return (
                      <Link
                        key={course._id}
                        href={
                          owned
                            ? `/user/courses/${course._id}/videos`
                            : '/user/dashboard'
                        }
                        onClick={onClose}
                        className="block px-3 py-2 text-sm rounded-lg hover:bg-gray-100"
                      >
                        {owned ? '🔓' : '🔒'} {course.title}
                      </Link>
                    );
                  })
                ))}
            </div>
          </>
        )}
      </nav>

      {/* SIGN OUT */}
      <div className="shrink-0 p-3 border-t border-gray-100">
        <button
          onClick={() => signOut({ callbackUrl: '/' })}
          className="w-full text-left text-red-600"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}