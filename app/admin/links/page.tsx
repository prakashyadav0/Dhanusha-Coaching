'use client';
import { useState, useEffect } from 'react';

interface LinkItem {
  _id: string;
  title: string;
  url: string;
  type: 'live_class' | 'exam' | 'syllabus';
  description: string;
  isActive: boolean;
  startsAt?: string;
  course?: { _id: string; title: string } | null;
  postedBy: { name: string };
  createdAt: string;
}

interface Course {
  _id: string;
  title: string;
}

const inputCls =
  'w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white';

const TYPE_META = {
  live_class: { label: 'Live Class', emoji: '🔴', color: 'bg-red-50 text-red-700 border-red-200' },
  exam:       { label: 'Exam',       emoji: '📝', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  syllabus:   { label: 'Syllabus',   emoji: '📄', color: 'bg-blue-50 text-blue-700 border-blue-200' },
};

export default function AdminLinksPage() {
  const [links,        setLinks]        = useState<LinkItem[]>([]);
  const [courses,      setCourses]      = useState<Course[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [typeTab,      setTypeTab]      = useState<'all' | 'live_class' | 'exam' | 'syllabus'>('all');
  const [scopeFilter,  setScopeFilter]  = useState<'all' | 'platform' | string>('all');
  const [showModal,    setShowModal]    = useState(false);
  const [saving,       setSaving]       = useState(false);
  const [msg,          setMsg]          = useState<{ text: string; ok: boolean } | null>(null);
  const [editingId,    setEditingId]    = useState<string | null>(null); // track edit

  const [form, setForm] = useState({
    title: '', url: '', type: 'live_class', description: '', startsAt: '', courseId: '',
  });

  // ── Fetch ─────────────────────────────────────────────────────────────────
  async function fetchLinks() {
    setLoading(true);
    const q = typeTab === 'all' ? '' : `&type=${typeTab}`;
    const res = await fetch(`/api/links?all=true${q}`);
    const data = await res.json();
    setLinks(data.links ?? []);
    setLoading(false);
  }

  async function fetchCourses() {
    const res = await fetch('/api/courses?all=true');
    const data = await res.json();
    setCourses(data.courses ?? []);
  }

  useEffect(() => { fetchCourses(); }, []);
  useEffect(() => { fetchLinks(); }, [typeTab]);

  // ── Reset form & modal state ──────────────────────────────────────────
  function resetForm() {
    setForm({ title: '', url: '', type: 'live_class', description: '', startsAt: '', courseId: '' });
    setEditingId(null);
    setShowModal(false);
  }

  // ── Open modal for editing ─────────────────────────────────────────────
  function openEditModal(link: LinkItem) {
    setEditingId(link._id);
    setForm({
      title:       link.title,
      url:         link.url,
      type:        link.type,
      description: link.description || '',
      startsAt:    link.startsAt ? new Date(link.startsAt).toISOString().slice(0, 16) : '',
      courseId:    link.course?._id || '',
    });
    setShowModal(true);
  }

  // ── Create or Update ────────────────────────────────────────────────────
  async function submitLink(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const payload = {
      title:       form.title,
      url:         form.url,
      type:        form.type,
      description: form.description,
      startsAt:    form.startsAt || undefined,
      courseId:    form.courseId || undefined,
    };

    let res;
    if (editingId) {
      // Update
      res = await fetch(`/api/links?id=${editingId}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
      });
    } else {
      // Create
      res = await fetch('/api/links', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
      });
    }

    const data = await res.json();
    setSaving(false);

    if (res.ok) {
      setMsg({ text: editingId ? 'Link updated!' : 'Link created!', ok: true });
      resetForm();
      fetchLinks();
    } else {
      setMsg({ text: data.message, ok: false });
    }
    setTimeout(() => setMsg(null), 4000);
  }

  // ── Toggle active ──────────────────────────────────────────────────────────
  async function toggleActive(link: LinkItem) {
    await fetch(`/api/links?id=${link._id}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ isActive: !link.isActive }),
    });
    fetchLinks();
  }

  // ── Delete ─────────────────────────────────────────────────────────────────
  async function deleteLink(id: string) {
    if (!confirm('Delete this link?')) return;
    await fetch(`/api/links?id=${id}`, { method: 'DELETE' });
    fetchLinks();
  }

  const typeTabs = [
    { key: 'all',        label: 'All Links',    emoji: '🔗' },
    { key: 'live_class', label: 'Live Classes', emoji: '🔴' },
    { key: 'exam',       label: 'Exams',        emoji: '📝' },
    { key: 'syllabus',   label: 'Syllabus',     emoji: '📄' },
  ] as const;

  const visibleLinks = links.filter(link => {
    if (scopeFilter === 'all') return true;
    if (scopeFilter === 'platform') return !link.course;
    return link.course?._id === scopeFilter;
  });

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5 sm:mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Live Classes, Exams & Syllabus</h1>
          <p className="text-gray-500 text-sm mt-0.5">Post external links for sessions, exams, and syllabus.</p>
        </div>
        <button
          onClick={() => {
            setEditingId(null);
            setForm({ title: '', url: '', type: 'live_class', description: '', startsAt: '', courseId: '' });
            setShowModal(true);
          }}
          className="shrink-0 bg-indigo-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition"
        >
          + Add Link
        </button>
      </div>

      {msg && (
        <div className={`mb-4 text-sm px-4 py-3 rounded-xl border ${msg.ok ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
          {msg.text}
        </div>
      )}

      {/* Type tabs */}
      <div className="flex gap-2 mb-3 overflow-x-auto pb-1">
        {typeTabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTypeTab(t.key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition ${
              typeTab === t.key
                ? 'bg-indigo-600 text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:border-indigo-300'
            }`}
          >
            {t.emoji} {t.label}
          </button>
        ))}
      </div>

      {/* Scope filter pills */}
      <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
        <button
          onClick={() => setScopeFilter('all')}
          className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition ${
            scopeFilter === 'all' ? 'bg-gray-800 text-white' : 'bg-white border border-gray-200 text-gray-500 hover:border-gray-300'
          }`}
        >
          All Scopes
        </button>
        <button
          onClick={() => setScopeFilter('platform')}
          className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition ${
            scopeFilter === 'platform' ? 'bg-gray-800 text-white' : 'bg-white border border-gray-200 text-gray-500 hover:border-gray-300'
          }`}
        >
          🌐 Platform-wide
        </button>
        {courses.map(c => (
          <button
            key={c._id}
            onClick={() => setScopeFilter(c._id)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition ${
              scopeFilter === c._id ? 'bg-gray-800 text-white' : 'bg-white border border-gray-200 text-gray-500 hover:border-gray-300'
            }`}
          >
            📚 {c.title}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      ) : visibleLinks.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">🔗</p>
          <p className="text-sm">No links in this scope yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {visibleLinks.map(link => {
            const meta = TYPE_META[link.type];
            return (
              <div key={link._id} className={`bg-white border rounded-xl p-4 sm:p-5 shadow-sm ${!link.isActive ? 'opacity-60' : ''}`}>
                <div className="flex flex-col sm:flex-row sm:items-start gap-3">

                  {/* Type badge + content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border ${meta.color}`}>
                        {meta.emoji} {meta.label}
                      </span>
                      {link.course ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                          📚 {link.course.title}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-50 text-gray-600 border border-gray-200">
                          🌐 Platform-wide
                        </span>
                      )}
                      {!link.isActive && (
                        <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Inactive</span>
                      )}
                    </div>

                    <h3 className="font-semibold text-gray-900 text-sm sm:text-base">{link.title}</h3>

                    {link.description && (
                      <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{link.description}</p>
                    )}

                    <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-400">
                      {link.startsAt && (
                        <span>🕐 {new Date(link.startsAt).toLocaleString()}</span>
                      )}
                      <span>By {link.postedBy?.name}</span>
                      <span>{new Date(link.createdAt).toLocaleDateString()}</span>
                    </div>

                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 mt-2 text-xs text-indigo-600 hover:underline"
                    >
                      🔗 {link.url.length > 50 ? link.url.slice(0, 50) + '…' : link.url}
                    </a>
                  </div>

                  {/* Actions */}
                  <div className="flex sm:flex-col gap-2 shrink-0">
                    <button
                      onClick={() => openEditModal(link)}
                      className="flex-1 sm:flex-none text-xs px-3 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition"
                    >
                      ✎ Edit
                    </button>
                    <button
                      onClick={() => toggleActive(link)}
                      className={`flex-1 sm:flex-none text-xs px-3 py-2 rounded-lg border font-medium transition ${
                        link.isActive
                          ? 'border-gray-200 text-gray-600 hover:bg-gray-50'
                          : 'border-green-200 text-green-700 hover:bg-green-50'
                      }`}
                    >
                      {link.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                      onClick={() => deleteLink(link._id)}
                      className="flex-1 sm:flex-none text-xs px-3 py-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Add / Edit Link Modal ────────────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 px-0 sm:px-4">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-lg max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-100">
              <h2 className="text-base sm:text-lg font-bold text-gray-800">
                {editingId ? 'Edit Link' : 'Add Link'}
              </h2>
              <button
                onClick={resetForm}
                className="w-9 h-9 flex items-center justify-center rounded-xl text-gray-400 hover:bg-gray-100 transition text-xl"
              >
                ×
              </button>
            </div>

            <form onSubmit={submitLink} className="p-5 space-y-4">

              {/* Type selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['live_class', 'exam', 'syllabus'] as const).map(t => {
                    const m = TYPE_META[t];
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setForm({ ...form, type: t })}
                        className={`flex items-center justify-center gap-2 py-3 rounded-xl border-2 text-sm font-semibold transition ${
                          form.type === t
                            ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                            : 'border-gray-200 text-gray-600 hover:border-gray-300'
                        }`}
                      >
                        {m.emoji} {m.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Scope selector */}
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
                    ? 'Only students enrolled in this course will see this link.'
                    : 'Visible to every logged-in user.'}
                </p>
              </div>

              <Field label="Title">
                <input
                  required
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  className={inputCls}
                  placeholder={form.type === 'live_class' ? 'e.g. Physics Live Class – Chapter 5' : form.type === 'exam' ? 'e.g. Mid-term Exam 2025' : 'e.g. Course Syllabus 2026'}
                />
              </Field>

              <Field label="External URL">
                <input
                  required
                  type="url"
                  value={form.url}
                  onChange={e => setForm({ ...form, url: e.target.value })}
                  className={inputCls}
                  placeholder="https://meet.google.com/... or https://forms.gle/..."
                />
              </Field>

              <Field label="Description (optional)">
                <textarea
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  className={inputCls + ' h-20 resize-none'}
                  placeholder="Brief info about this session or exam..."
                />
              </Field>

              <Field label="Scheduled Date & Time (optional)">
                <input
                  type="datetime-local"
                  value={form.startsAt}
                  onChange={e => setForm({ ...form, startsAt: e.target.value })}
                  className={inputCls}
                />
              </Field>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 px-4 py-3 text-sm text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-3 text-sm text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 disabled:opacity-60 transition font-semibold"
                >
                  {saving ? (editingId ? 'Updating...' : 'Adding...') : (editingId ? 'Update Link' : 'Add Link')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {children}
    </div>
  );
}