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
  scheduledAt?: string | null;
  isPublished: boolean;
}

interface Course {
  _id: string;
  title: string;
}

const inputCls =
  'w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white';

const emptyForm = {
  title: '',
  body: '',
  targetRole: 'all',
  isPinned: false,
  courseId: '',
  scheduleType: 'now' as 'now' | 'scheduled',
  scheduledDate: '',
  scheduledTime: '',
};

export default function AdminNoticesPage() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingNotice, setEditingNotice] = useState<Notice | null>(null);
  const [scopeFilter, setScopeFilter] = useState<'all' | 'platform' | string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'scheduled'>('all');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [form, setForm] = useState({ ...emptyForm });

  // ── Fetch ─────────────────────────────────────────────────────────────────
  async function fetchNotices() {
    setLoading(true);
    const [platformRes, ...courseResList] = await Promise.all([
      fetch('/api/notices?includeScheduled=true'),
      ...courses.map(c => fetch(`/api/notices?courseId=${c._id}&includeScheduled=true`)),
    ]);

    const platformData = await platformRes.json();
    const courseDataList = await Promise.all(courseResList.map(r => r.json()));

    const merged: Notice[] = [
      ...(platformData.notices ?? []),
      ...courseDataList.flatMap(d => d.notices ?? []),
    ];

    const unique = Array.from(new Map(merged.map(n => [n._id, n])).values())
      .sort((a, b) => {
        const dateA = a.scheduledAt ?? a.createdAt;
        const dateB = b.scheduledAt ?? b.createdAt;
        return new Date(dateB).getTime() - new Date(dateA).getTime();
      });

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

  // ── Open modal (create or edit) ───────────────────────────────────────────
  function openCreate() {
    setEditingNotice(null);
    setForm({ ...emptyForm });
    setShowModal(true);
  }

  function openEdit(n: Notice) {
    setEditingNotice(n);
    let scheduledDate = '';
    let scheduledTime = '';
    if (n.scheduledAt) {
      const d = new Date(n.scheduledAt);
      scheduledDate = d.toISOString().split('T')[0];
      scheduledTime = d.toTimeString().slice(0, 5);
    }
    setForm({
      title: n.title,
      body: n.body,
      targetRole: n.targetRole,
      isPinned: n.isPinned,
      courseId: n.course?._id ?? '',
      scheduleType: n.scheduledAt ? 'scheduled' : 'now',
      scheduledDate,
      scheduledTime,
    });
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditingNotice(null);
    setForm({ ...emptyForm });
  }

  // ── Submit (create or update) ─────────────────────────────────────────────
  async function submitNotice(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    let scheduledAt: string | undefined;
    if (form.scheduleType === 'scheduled' && form.scheduledDate && form.scheduledTime) {
      scheduledAt = new Date(`${form.scheduledDate}T${form.scheduledTime}`).toISOString();
      if (new Date(scheduledAt) <= new Date() && !editingNotice) {
        setMsg({ text: 'Scheduled time must be in the future.', type: 'error' });
        setSaving(false);
        return;
      }
    }

    const payload = {
      title: form.title,
      body: form.body,
      targetRole: form.targetRole,
      isPinned: form.isPinned,
      courseId: form.courseId || undefined,
      scheduledAt: scheduledAt ?? null,
    };

    const res = editingNotice
      ? await fetch(`/api/notices?id=${editingNotice._id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      : await fetch('/api/notices', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

    setSaving(false);
    if (res.ok) {
      setMsg({ text: editingNotice ? 'Notice updated!' : 'Notice posted!', type: 'success' });
      closeModal();
      fetchNotices();
    } else {
      const d = await res.json();
      setMsg({ text: d.message ?? 'Something went wrong.', type: 'error' });
    }
    setTimeout(() => setMsg(null), 4000);
  }

  async function deleteNotice(id: string) {
    if (!confirm('Delete this notice?')) return;
    await fetch(`/api/notices?id=${id}`, { method: 'DELETE' });
    fetchNotices();
  }

  // ── Filter ────────────────────────────────────────────────────────────────
  const visibleNotices = notices.filter(n => {
    const scopeOk =
      scopeFilter === 'all' ||
      (scopeFilter === 'platform' && !n.course) ||
      n.course?._id === scopeFilter;

    const statusOk =
      statusFilter === 'all' ||
      (statusFilter === 'published' && n.isPublished) ||
      (statusFilter === 'scheduled' && !n.isPublished && n.scheduledAt);

    return scopeOk && statusOk;
  });

  // ── Helpers ───────────────────────────────────────────────────────────────
  function formatScheduled(iso: string) {
    const d = new Date(iso);
    return d.toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  }

  // Min datetime for the scheduler (now, rounded to next minute)
  const minDateTime = new Date(Date.now() + 60_000).toISOString().slice(0, 16);

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Notices</h1>
        <button
          onClick={openCreate}
          className="bg-indigo-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition shrink-0"
        >
          + Post Notice
        </button>
      </div>

      {msg && (
        <div className={`mb-4 text-sm px-4 py-3 rounded-xl border ${
          msg.type === 'success'
            ? 'bg-green-50 border-green-200 text-green-700'
            : 'bg-red-50 border-red-200 text-red-700'
        }`}>
          {msg.text}
        </div>
      )}

      {/* Scope filter pills */}
      <div className="flex gap-2 mb-3 overflow-x-auto pb-1">
        {[
          { id: 'all', label: 'All' },
          { id: 'platform', label: '🌐 Platform-wide' },
          ...courses.map(c => ({ id: c._id, label: `📚 ${c.title}` })),
        ].map(f => (
          <button
            key={f.id}
            onClick={() => setScopeFilter(f.id)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition ${
              scopeFilter === f.id
                ? 'bg-indigo-600 text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:border-indigo-300'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Status filter pills */}
      <div className="flex gap-2 mb-5">
        {(['all', 'published', 'scheduled'] as const).map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1 rounded-full text-xs font-medium capitalize transition ${
              statusFilter === s
                ? 'bg-gray-800 text-white'
                : 'bg-white border border-gray-200 text-gray-500 hover:border-gray-400'
            }`}
          >
            {s === 'scheduled' ? '🕐 Scheduled' : s === 'published' ? '✅ Published' : 'All status'}
          </button>
        ))}
      </div>

      {/* Notice list */}
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
            <div
              key={n._id}
              className={`bg-white border rounded-xl p-4 sm:p-5 shadow-sm ${
                !n.isPublished && n.scheduledAt
                  ? 'border-amber-200 bg-amber-50/40'
                  : 'border-gray-100'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                    {n.isPinned && (
                      <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                        📌 Pinned
                      </span>
                    )}
                    {!n.isPublished && n.scheduledAt && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                        🕐 {formatScheduled(n.scheduledAt)}
                      </span>
                    )}
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
                <div className="shrink-0 flex flex-col gap-1">
                  <button
                    onClick={() => openEdit(n)}
                    className="text-xs text-indigo-500 hover:text-indigo-700 hover:bg-indigo-50 px-2 py-1 rounded transition text-right"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => deleteNotice(n._id)}
                    className="text-xs text-red-500 hover:text-red-700 hover:bg-red-50 px-2 py-1 rounded transition"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Create / Edit Modal ───────────────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 px-0 sm:px-4">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-100">
              <h2 className="text-base sm:text-lg font-bold text-gray-800">
                {editingNotice ? 'Edit Notice' : 'Post Notice'}
              </h2>
              <button
                onClick={closeModal}
                className="w-9 h-9 flex items-center justify-center rounded-xl text-gray-400 hover:bg-gray-100 transition text-xl"
              >
                ×
              </button>
            </div>

            <form onSubmit={submitNotice} className="p-5 space-y-4">

              {/* Scope */}
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
                    ? 'Only students enrolled in this course will see this.'
                    : 'Visible to everyone based on the target role below.'}
                </p>
              </div>

              {/* Title */}
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

              {/* Body */}
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

              {/* Target role */}
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

              {/* ── Schedule ──────────────────────────────────────────────── */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">When to publish</label>
                <div className="flex gap-2 mb-3">
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, scheduleType: 'now' })}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium border transition ${
                      form.scheduleType === 'now'
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white text-gray-600 border-gray-300 hover:border-indigo-400'
                    }`}
                  >
                    Publish now
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, scheduleType: 'scheduled' })}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium border transition ${
                      form.scheduleType === 'scheduled'
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white text-gray-600 border-gray-300 hover:border-indigo-400'
                    }`}
                  >
                    🕐 Schedule
                  </button>
                </div>

                {form.scheduleType === 'scheduled' && (
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <label className="block text-xs text-gray-500 mb-1">Date</label>
                      <input
                        type="date"
                        required
                        value={form.scheduledDate}
                        min={new Date().toISOString().split('T')[0]}
                        onChange={e => setForm({ ...form, scheduledDate: e.target.value })}
                        className={inputCls}
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs text-gray-500 mb-1">Time</label>
                      <input
                        type="time"
                        required
                        value={form.scheduledTime}
                        onChange={e => setForm({ ...form, scheduledTime: e.target.value })}
                        className={inputCls}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Pin */}
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
                  onClick={closeModal}
                  className="flex-1 px-4 py-2.5 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-2.5 text-sm text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-60 transition"
                >
                  {saving
                    ? 'Saving...'
                    : editingNotice
                    ? 'Save changes'
                    : form.scheduleType === 'scheduled'
                    ? 'Schedule notice'
                    : 'Post notice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}