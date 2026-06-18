import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import Link from 'next/link';

export default async function TeacherDashboardPage() {
  const session = await getServerSession(authOptions);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-1">
        Welcome, {session?.user.name} 👋
      </h1>
      <p className="text-gray-500 text-sm mb-8">Manage your notices and notes for students.</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <Link
          href="/teacher/notices"
          className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm hover:shadow-md hover:border-indigo-200 transition group"
        >
          <div className="text-3xl mb-3">📢</div>
          <h2 className="font-semibold text-gray-900 group-hover:text-indigo-700 transition">Notices</h2>
          <p className="text-sm text-gray-500 mt-1">Post important announcements for students.</p>
        </Link>
        <Link
          href="/teacher/notes"
          className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm hover:shadow-md hover:border-amber-200 transition group"
        >
          <div className="text-3xl mb-3">📝</div>
          <h2 className="font-semibold text-gray-900 group-hover:text-amber-700 transition">Notes</h2>
          <p className="text-sm text-gray-500 mt-1">Share Google Drive links with your students.</p>
        </Link>
      </div>
    </div>
  );
}