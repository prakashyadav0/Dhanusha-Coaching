'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

interface Notice {
  _id: string;
  title: string;
  body: string;
  isPinned: boolean;
  postedBy: { name: string };
  createdAt: string;
}

export default function UserCourseNoticesPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchNotices() {
      const res = await fetch(`/api/notices?courseId=${courseId}`);
      const data = await res.json();
      setNotices(data.notices ?? []);
      setLoading(false);
    }
    fetchNotices();
  }, [courseId]);

  if (loading) return <p className="text-gray-400 text-sm">Loading notices...</p>;

  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <Link href="/user/dashboard" className="text-sm text-gray-400 hover:text-indigo-600 transition">← Dashboard</Link>
        <span className="text-gray-300">/</span>
        <span className="text-sm text-gray-600">Notices</span>
      </div>

      <h1 className="text-2xl font-bold text-gray-800 mb-6">📢 Course Notices</h1>

      {notices.length === 0 ? (
        <p className="text-gray-400 text-sm">No notices for this course yet.</p>
      ) : (
        <div className="space-y-3">
          {notices.map((n) => (
            <div key={n._id} className={`rounded-xl border p-5 ${n.isPinned ? 'bg-amber-50 border-amber-200' : 'bg-white border-gray-100'} shadow-sm`}>
              {n.isPinned && <span className="text-xs font-medium text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full mb-2 inline-block">📌 Pinned</span>}
              <h3 className="font-semibold text-gray-900">{n.title}</h3>
              <p className="text-sm text-gray-600 mt-1">{n.body}</p>
              <p className="text-xs text-gray-400 mt-2">
                By {n.postedBy?.name} · {new Date(n.createdAt).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}