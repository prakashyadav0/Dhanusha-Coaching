'use client';
import { useState, useEffect } from 'react';

interface Notice {
  _id: string;
  title: string;
  body: string;
  targetRole: string;
  isPinned: boolean;
  course?: { _id: string; title: string } | null;
  postedBy: { name: string };
  createdAt: string;
}

interface Course {
  _id: string;
  title: string;
}

const inputCls =
  'w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white';

export default function AdminNoticesPage() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [scopeFilter, setScopeFilter] = useState<'all' | 'platform' | string>('all'); // 'all' | 'platform' | courseId
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const [form, setForm] = useState({
    title: '',
    body: '',
    targetRole: 'all',
    isPinned: false,
    courseId: '', // '' = platform-wide notice
  });

  // ── Fetch ─────────────────────────────────────────────────────────────────
  async function fetchNotices() {
    setLoading(true);
    // Fetch ALL notices: platform-wide (no courseId) + every course's notices
    // Our /api/notices endpoint filters by courseId if given, or returns
    // platform-wide notices if not. We fetch both and merge for the admin view.
    const [platformRes, ...courseResList] = await Promise.all([
      fetch('/api/notices'), // platform-wide only
      ...courses.map(c => fetch(`/api/notices?courseId=${c._id}`)),
    ]);

    const platformData = await platformRes.json();
    const courseDataList = await Promise.all(courseResList.map(r => r.json()));

    const merged: Notice[] = [
      ...(platformData.notices ?? []),
      ...courseDataList.flatMap(d => d.notices ?? []),
    ];

    // De-duplicate by _id (in case) and sort by newest first
    const unique = Array.from(new Map(merged.map(n => [n._id, n])).values())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    setNotices(unique);
    setLoading(false);
  }

  async function fetchCourses() {
    const res = await fetch('/api/courses?all=true');
    const data = await res.json();
    setCourses(data.courses ?? []);
  }

  useEffect(() => { fetchCourses(); }, []);
  useEffect(() => { if (courses.length >= 0) fetchNotices(); }, [courses]);

  // ── Submit ────────────────────────────────────────────────────────────────
  async function submitNotice(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch('/api/notices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: form.title,
        body: form.body,
        targetRole: form.targetRole,
        isPinned: form.isPinned,
        courseId: form.courseId || undefined, // omit if platform-wide
      }),
    });
    setSaving(false);
    if (res.ok) {
      setMsg('Notice posted!');
      setShowModal(false);
      setForm({ title: '', body: '', targetRole: 'all', isPinned: false, courseId: '' });
      fetchNotices();
    } else {
      const d = await res.json();
      setMsg(d.message);
    }
    setTimeout(() => setMsg(''), 4000);
  }

  async function deleteNotice(id: string) {
    if (!confirm('Delete this notice?')) return;
    await fetch(`/api/notices?id=${id}`, { method: 'DELETE' });
    fetchNotices();
  }

  // ── Filter for display ───────────────────────────────────────────────────
  const visibleNotices = notices.filter(n => {
    if (scopeFilter === 'all') return true;
    if (scopeFilter === 'platform') return !n.course;
    return n.course?._id === scopeFilter;
  });

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Notices</h1>
        <button
          onClick={() => setShowModal(true)}
          className="bg-indigo-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition shrink-0"
        >
          + Post Notice
        </button>
      </div>

      {msg && (
        <div className="mb-4 bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-xl">
          {msg}
        </div>
      )}

      {/* Scope filter pills */}
      <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
        <button
          onClick={() => setScopeFilter('all')}
          className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition ${
            scopeFilter === 'all' ? 'bg-indigo-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-indigo-300'
          }`}
        >
          All
        </button>
        <button
          onClick={() => setScopeFilter('platform')}
          className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition ${
            scopeFilter === 'platform' ? 'bg-indigo-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-indigo-300'
          }`}
        >
          🌐 Platform-wide
        </button>
        {courses.map(c => (
          <button
            key={c._id}
            onClick={() => setScopeFilter(c._id)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition ${
              scopeFilter === c._id ? 'bg-indigo-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-indigo-300'
            }`}
          >
            📚 {c.title}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      ) : visibleNotices.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-2">📢</p>
          <p className="text-sm">No notices in this scope yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {visibleNotices.map(n => (
            <div key={n._id} className="bg-white border border-gray-100 rounded-xl p-4 sm:p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                    {n.isPinned && (
                      <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                        📌 Pinned
                      </span>
                    )}
                    {/* Scope badge: course-specific or platform-wide */}
                    {n.course ? (
                      <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-medium">
                        📚 {n.course.title}
                      </span>
                    ) : (
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium">
                        🌐 Platform-wide
                      </span>
                    )}
                    <span className="text-xs bg-gray-50 text-gray-500 px-2 py-0.5 rounded-full capitalize border border-gray-100">
                      {n.targetRole}
                    </span>
                  </div>
                  <h3 className="font-semibold text-gray-900 text-sm sm:text-base">{n.title}</h3>
                  <p className="text-sm text-gray-600 mt-1 line-clamp-3">{n.body}</p>
                  <p className="text-xs text-gray-400 mt-2">
                    By {n.postedBy?.name} · {new Date(n.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={() => deleteNotice(n._id)}
                  className="shrink-0 text-xs text-red-500 hover:text-red-700 hover:bg-red-50 px-2 py-1 rounded transition"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Post Notice Modal ─────────────────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 px-0 sm:px-4">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-100">
              <h2 className="text-base sm:text-lg font-bold text-gray-800">Post Notice</h2>
              <button
                onClick={() => setShowModal(false)}
                className="w-9 h-9 flex items-center justify-center rounded-xl text-gray-400 hover:bg-gray-100 transition text-xl"
              >
                ×
              </button>
            </div>

            <form onSubmit={submitNotice} className="p-5 space-y-4">

              {/* Scope selector — course or platform-wide */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Post to</label>
                <select
                  value={form.courseId}
                  onChange={e => setForm({ ...form, courseId: e.target.value })}
                  className={inputCls}
                >
                  <option value="">🌐 Platform-wide (all students)</option>
                  {courses.map(c => (
                    <option key={c._id} value={c._id}>📚 {c.title}</option>
                  ))}
                </select>
                <p className="text-xs text-gray-400 mt-1">
                  {form.courseId
                    ? 'Only students enrolled in this course will see this notice.'
                    : 'Visible to everyone based on the target role below.'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  required
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  className={inputCls}
                  placeholder="Notice title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Body</label>
                <textarea
                  required
                  value={form.body}
                  onChange={e => setForm({ ...form, body: e.target.value })}
                  className={inputCls + ' h-28 resize-none'}
                  placeholder="Notice content..."
                />
              </div>

              {/* Target role — only relevant for platform-wide notices */}
              {!form.courseId && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Target</label>
                  <select
                    value={form.targetRole}
                    onChange={e => setForm({ ...form, targetRole: e.target.value })}
                    className={inputCls}
                  >
                    <option value="all">Everyone</option>
                    <option value="user">Students only</option>
                    <option value="teacher">Team members only</option>
                  </select>
                </div>
              )}

              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isPinned}
                  onChange={e => setForm({ ...form, isPinned: e.target.checked })}
                  className="rounded w-4 h-4"
                />
                Pin this notice
              </label>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2.5 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-2.5 text-sm text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-60 transition"
                >
                  {saving ? 'Posting...' : 'Post Notice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}