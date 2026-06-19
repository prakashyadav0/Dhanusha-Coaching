'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

interface LinkItem {
  _id: string;
  title: string;
  url: string;
  description: string;
  startsAt?: string;
  course?: { _id: string; title: string } | null;
  postedBy: { name: string };
  createdAt: string;
}

export default function ExamsPage() {
  const [links,   setLinks]   = useState<LinkItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // No courseId param → API automatically returns platform-wide links
    // PLUS links scoped to courses this user has purchased.
    fetch('/api/links?type=exam')
      .then(r => r.json())
      .then(d => { setLinks(d.links ?? []); setLoading(false); });
  }, []);

  if (loading) {
    return (
      <div className="space-y-3">
        {[1,2,3].map(i => <div key={i} className="h-32 bg-gray-100 rounded-2xl animate-pulse" />)}
      </div>
    );
  }

  return (
    <div>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-4 text-sm">
        <Link href="/user/dashboard" className="text-gray-400 hover:text-indigo-600 transition">← Dashboard</Link>
        <span className="text-gray-300">/</span>
        <span className="text-gray-600">Exams</span>
      </div>

      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-xl">📝</div>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Exams</h1>
          <p className="text-sm text-gray-500">Exams for everyone &amp; your enrolled courses</p>
        </div>
      </div>

      {links.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-5xl mb-3">📝</p>
          <p className="font-medium text-gray-500">No exams available right now.</p>
          <p className="text-sm mt-1">
            Enroll in a course to unlock more exams, or check back soon!
          </p>
        </div>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {links.map(link => (
            <div
              key={link._id}
              className="bg-white border border-gray-100 rounded-2xl p-4 sm:p-5 shadow-sm hover:shadow-md transition"
            >
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                {/* Icon */}
                <div className="shrink-0 w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-2xl">
                  📝
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    {/* Scope badge */}
                    {link.course ? (
                      <span className="text-xs font-semibold bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-full border border-indigo-100">
                        📚 {link.course.title}
                      </span>
                    ) : (
                      <span className="text-xs font-semibold bg-gray-100 text-gray-600 px-2.5 py-0.5 rounded-full">
                        🌐 For Everyone
                      </span>
                    )}
                  </div>

                  <h3 className="font-semibold text-gray-900 text-base sm:text-lg">{link.title}</h3>

                  {link.description && (
                    <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{link.description}</p>
                  )}

                  {link.startsAt && (
                    <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                      🕐 {new Date(link.startsAt).toLocaleString()}
                    </p>
                  )}
                </div>

                {/* Start exam button */}
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold px-5 py-3 rounded-xl transition w-full sm:w-auto"
                >
                  📝 Start Exam
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}