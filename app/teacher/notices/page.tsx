'use client';
import { useState, useEffect } from 'react';

interface Notice {
  _id: string;
  title: string;
  body: string;
  targetRole: string;
  postedBy: { name: string };
  createdAt: string;
}

export default function TeacherNoticesPage() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title: '', body: '', targetRole: 'user' });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  // Optionally filter by a courseId if needed in the future
  async function fetchNotices() {
    const res = await fetch('/api/notices');
    const data = await res.json();
    setNotices(data.notices);
    setLoading(false);
  }

  useEffect(() => { fetchNotices(); }, []);

  async function submitNotice(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch('/api/notices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (res.ok) {
      setMsg('Notice posted!');
      setShowModal(false);
      setForm({ title: '', body: '', targetRole: 'user' });
      fetchNotices();
    } else {
      const d = await res.json();
      setMsg(d.message);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Notices</h1>
        <button onClick={() => setShowModal(true)} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition">
          + Post Notice
        </button>
      </div>

      {msg && <div className="mb-4 bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-lg">{msg}</div>}

      {loading ? <p className="text-gray-400 text-sm">Loading...</p>
        : notices.length === 0 ? <p className="text-gray-400 text-sm">No notices yet.</p>
        : (
          <div className="space-y-3">
            {notices.map((n) => (
              <div key={n._id} className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
                <h3 className="font-semibold text-gray-900">{n.title}</h3>
                <p className="text-sm text-gray-600 mt-1">{n.body}</p>
                <p className="text-xs text-gray-400 mt-2">
                  By {n.postedBy?.name} · {new Date(n.createdAt).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )}

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-800">Post Notice</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
            </div>
            <form onSubmit={submitNotice} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input required value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Notice title" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Body</label>
                <textarea required value={form.body} onChange={e => setForm({...form, body: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm h-28 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Notice content..." />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition">Cancel</button>
                <button type="submit" disabled={saving} className="px-4 py-2 text-sm text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-60 transition">{saving ? 'Posting...' : 'Post'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}