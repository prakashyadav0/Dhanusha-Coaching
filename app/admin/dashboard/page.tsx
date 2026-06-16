import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/Db';
import Course from '@/models/Course';
import User from '@/models/User';
import Order from '@/models/Order';

async function getStats() {
  await dbConnect();
  const [totalCourses, totalUsers, totalOrders, revenue] = await Promise.all([
    Course.countDocuments(),
    User.countDocuments({ role: 'user' }),
    Order.countDocuments({ status: 'paid' }),
    Order.aggregate([
      { $match: { status: 'paid' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
  ]);
  return {
    totalCourses,
    totalUsers,
    totalOrders,
    revenue: revenue[0]?.total ?? 0,
  };
}

export default async function AdminDashboardPage() {
  const session = await getServerSession(authOptions);
  const stats = await getStats();

  const cards = [
    { label: 'Total Courses', value: stats.totalCourses, icon: '📚', color: 'bg-indigo-50 text-indigo-700' },
    { label: 'Students', value: stats.totalUsers, icon: '👥', color: 'bg-green-50 text-green-700' },
    { label: 'Paid Orders', value: stats.totalOrders, icon: '🛒', color: 'bg-amber-50 text-amber-700' },
    { label: 'Revenue (Rs.)', value: stats.revenue.toLocaleString(), icon: '💰', color: 'bg-pink-50 text-pink-700' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-1">
        Welcome back, {session?.user.name} 👋
      </h1>
      <p className="text-gray-500 text-sm mb-8">Here's what's happening on your platform.</p>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
        {cards.map((c) => (
          <div key={c.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className={`inline-flex items-center justify-center w-10 h-10 rounded-lg text-xl mb-3 ${c.color}`}>
              {c.icon}
            </div>
            <p className="text-2xl font-bold text-gray-900">{c.value}</p>
            <p className="text-sm text-gray-500">{c.label}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <h2 className="text-lg font-semibold text-gray-700 mb-4">Quick Actions</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Add New Course', href: '/admin/courses', icon: '➕' },
          { label: 'Post a Notice', href: '/admin/notices', icon: '📢' },
          { label: 'Manage Users', href: '/admin/users', icon: '👤' },
        ].map((a) => (
          <a
            key={a.href}
            href={a.href}
            className="flex items-center gap-3 bg-white border border-gray-100 rounded-xl px-5 py-4 hover:bg-indigo-50 hover:border-indigo-200 transition group"
          >
            <span className="text-2xl">{a.icon}</span>
            <span className="font-medium text-gray-700 group-hover:text-indigo-700 text-sm">
              {a.label}
            </span>
          </a>
        ))}
      </div>
    </div>
  );
}