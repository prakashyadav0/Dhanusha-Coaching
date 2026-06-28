'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

interface Stats {
  totalCourses: number;
  totalUsers:   number;
  totalOrders:  number;
  revenue:      number;
}

interface CourseRevenue {
  courseId: string;
  title:    string;
  revenue:  number;
  orders:   number;
}

export default function AdminDashboardPage() {
  const { data: session } = useSession();
  const [stats,        setStats]        = useState<Stats | null>(null);
  const [showRevModal, setShowRevModal] = useState(false);
  const [breakdown,    setBreakdown]    = useState<CourseRevenue[]>([]);
  const [revLoading,   setRevLoading]   = useState(false);

  useEffect(() => {
    async function fetchStats() {
      try {
        const [coursesRes, usersRes, revRes] = await Promise.all([
          fetch('/api/courses?all=true'),
          fetch('/api/users'),
          fetch('/api/admin/revenue-breakdown'),
        ]);
        const [c, u, r] = await Promise.all([
          coursesRes.json(),
          usersRes.json(),
          revRes.json(),
        ]);
        setStats({
          totalCourses: c.courses?.length ?? 0,
          totalUsers:   (u.users ?? []).filter((x: any) => x.role === 'user').length,
          totalOrders:  (r.breakdown ?? []).reduce((s: number, x: any) => s + x.orders, 0),
          revenue:      r.total ?? 0,
        });
        setBreakdown(r.breakdown ?? []);
      } catch (e) {
        console.error(e);
      }
    }
    fetchStats();
  }, []);

  async function openRevenue() {
    setShowRevModal(true);
    // breakdown already loaded on mount — no extra fetch needed
  }

  const maxRevenue = Math.max(...breakdown.map(c => c.revenue), 1);

  const cards = [
    {
      label:   'Total Courses',
      value:   stats?.totalCourses.toLocaleString() ?? '—',
      icon:    '📚',
      color:   'bg-indigo-50 text-indigo-700',
      onClick: undefined as (() => void) | undefined,
    },
    {
      label:   'Students',
      value:   stats?.totalUsers.toLocaleString() ?? '—',
      icon:    '👥',
      color:   'bg-green-50 text-green-700',
      onClick: undefined,
    },
    {
      label:   'Paid Orders',
      value:   stats?.totalOrders.toLocaleString() ?? '—',
      icon:    '🛒',
      color:   'bg-amber-50 text-amber-700',
      onClick: undefined,
    },
    {
      label:   'Revenue (Rs.)',
      value:   stats?.revenue != null ? `Rs. ${stats.revenue.toLocaleString()}` : '—',
      icon:    '💰',
      color:   'bg-pink-50 text-pink-700',
      onClick: openRevenue,   // ← clickable
    },
  ];

  return (
    <div>
      <h1 className="text-xl sm:text-2xl font-bold text-gray-800 mb-1">
        Welcome back, {session?.user.name} 👋
      </h1>
      <p className="text-gray-500 text-sm mb-6 sm:mb-8">
        Here's what's happening on your platform.
      </p>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5 mb-8 sm:mb-10">
        {cards.map((c) => (
          <div
            key={c.label}
            onClick={c.onClick}
            className={`bg-white rounded-xl border border-gray-100 shadow-sm p-4 sm:p-5 select-none ${
              c.onClick
                ? 'cursor-pointer hover:shadow-md hover:border-pink-200 transition group'
                : ''
            }`}
          >
            <div className={`inline-flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-lg text-lg sm:text-xl mb-2 sm:mb-3 ${c.color}`}>
              {c.icon}
            </div>
            <p className="text-xl sm:text-2xl font-bold text-gray-900">{c.value}</p>
            <p className="text-xs sm:text-sm text-gray-500">{c.label}</p>
            {c.onClick && (
              <p className="text-xs text-pink-500 mt-1.5 group-hover:underline font-medium">
                View by course →
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <h2 className="text-base sm:text-lg font-semibold text-gray-700 mb-3 sm:mb-4">
        Quick Actions
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        {[
          { label: 'Add New Course', href: '/admin/courses', icon: '➕' },
          { label: 'Post a Notice',  href: '/admin/notices', icon: '📢' },
          { label: 'Manage Users',   href: '/admin/users',   icon: '👤' },
        ].map((a) => (
          <Link
            key={a.href}
            href={a.href}
            className="flex items-center gap-3 bg-white border border-gray-100 rounded-xl px-4 sm:px-5 py-4 hover:bg-indigo-50 hover:border-indigo-200 transition group"
          >
            <span className="text-2xl">{a.icon}</span>
            <span className="font-medium text-gray-700 group-hover:text-indigo-700 text-sm">
              {a.label}
            </span>
          </Link>
        ))}
      </div>

      {/* ── Revenue Breakdown Modal ─────────────────────────────────────── */}
      {showRevModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 px-0 sm:px-4">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-xl max-h-[90vh] overflow-y-auto">

            {/* Header */}
            <div className="sticky top-0 bg-white z-10 flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-100">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-gray-900">
                  💰 Revenue by Course
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Total: <span className="font-bold text-gray-700">
                    Rs. {stats?.revenue.toLocaleString() ?? 0}
                  </span>{' '}
                  from{' '}
                  <span className="font-bold text-gray-700">
                    {stats?.totalOrders} orders
                  </span>
                </p>
              </div>
              <button
                onClick={() => setShowRevModal(false)}
                className="w-9 h-9 flex items-center justify-center rounded-xl text-gray-400 hover:bg-gray-100 transition text-xl"
              >
                ×
              </button>
            </div>

            <div className="p-5">
              {revLoading ? (
                <div className="space-y-3">
                  {[1,2,3,4].map(i => (
                    <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : breakdown.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <p className="text-4xl mb-2">💰</p>
                  <p className="text-sm">No paid orders yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {breakdown.map((course, i) => {
                    const pct   = Math.round((course.revenue / maxRevenue) * 100);
                    const share = ((course.revenue / (stats?.revenue ?? 1)) * 100).toFixed(1);

                    return (
                      <div key={course.courseId} className="bg-gray-50 border border-gray-100 rounded-xl p-4">
                        <div className="flex items-start justify-between gap-3 mb-2.5">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="shrink-0 text-xs font-bold text-gray-400 w-5 text-center">
                                #{i + 1}
                              </span>
                              <p className="font-semibold text-gray-900 text-sm truncate">
                                {course.title}
                              </p>
                            </div>
                            <p className="text-xs text-gray-500 ml-7">
                              {course.orders} {course.orders === 1 ? 'order' : 'orders'} · {share}% of total revenue
                            </p>
                          </div>
                          <div className="shrink-0 text-right">
                            <p className="font-bold text-gray-900">
                              Rs. {course.revenue.toLocaleString()}
                            </p>
                          </div>
                        </div>

                        {/* Progress bar */}
                        <div className="w-full bg-gray-200 rounded-full h-1.5 ml-7" style={{ width: 'calc(100% - 1.75rem)' }}>
                          <div
                            className="bg-pink-500 h-1.5 rounded-full transition-all duration-700"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}

                  {/* Grand total */}
                  <div className="flex items-center justify-between bg-pink-50 border border-pink-100 rounded-xl px-5 py-4 mt-1">
                    <div>
                      <p className="font-bold text-gray-800">Total Revenue</p>
                      <p className="text-xs text-gray-500 mt-0.5">{stats?.totalOrders} paid orders across {breakdown.length} courses</p>
                    </div>
                    <p className="font-bold text-pink-700 text-lg">
                      Rs. {stats?.revenue.toLocaleString() ?? 0}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}