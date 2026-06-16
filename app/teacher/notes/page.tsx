'use client';
import { useState, useEffect } from 'react';

interface Note {
  _id: string;
  title: string;
  description: string;
  driveLink: string;
  course: { title: string };
  postedBy: { name: string };
  createdAt: string;
}

interface Course { _id: string; title: string; }

export default function TeacherNotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', driveLink: '', courseId: '' });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  async function fetchData() {
    const [notesRes, coursesRes] = await Promise.all([
      fetch('/api/notes?courseId=all').catch(() => null),
      fetch('/api/courses?all=true'),
    ]);
    const coursesData = await coursesRes.json();
    setCourses(coursesData.courses);
    setLoading(false);
  }

  // Fetch notes per course since our API requires courseId
  useEffect(() => { fetchData(); }, []);

  async function submitNote(e: React.FormEvent) {
    e.preventDefault();
    if (!form.courseId) { setMsg('Please select a course'); return; }
    setSaving(true);
    const res = await fetch('/api/notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (res.ok) {
      setMsg('Note added!');
      setShowModal(false);
      setForm({ title: '', description: '', driveLink: '', courseId: '' });
    } else {
      const d = await res.json();
      setMsg(d.message);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Notes</h1>
        <button onClick={() => setShowModal(true)} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition">
          + Add Note
        </button>
      </div>

      {msg && <div className="mb-4 bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-lg">{msg}</div>}

      <p className="text-sm text-gray-500 mb-6">Use the course pages in the admin panel to browse notes per course. Use the button above to post a new note.</p>

      {/* Courses grid for quick access */}
      {loading ? <p className="text-gray-400 text-sm">Loading...</p> : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {courses.map((c) => (
            <div key={c._id} className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
              <p className="font-medium text-gray-800 text-sm mb-2">{c.title}</p>
              <button
                onClick={() => { setForm({ title: '', description: '', driveLink: '', courseId: c._id }); setShowModal(true); }}
                className="text-xs bg-amber-50 text-amber-700 px-3 py-1.5 rounded-lg hover:bg-amber-100 transition"
              >
                + Add Note to this Course
              </button>
            </div>
          ))}
          {courses.length === 0 && <p className="text-gray-400 text-sm col-span-3">No courses available.</p>}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-800">Add Note</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
            </div>
            <form onSubmit={submitNote} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Course</label>
                <select required value={form.courseId} onChange={e => setForm({...form, courseId: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <option value="">Select a course</option>
                  {courses.map(c => <option key={c._id} value={c._id}>{c.title}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Note Title</label>
                <input required value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="e.g. Chapter 3 Summary" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Google Drive Link</label>
                <input required value={form.driveLink} onChange={e => setForm({...form, driveLink: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="https://drive.google.com/..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description (optional)</label>
                <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm h-20 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Brief description..." />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition">Cancel</button>
                <button type="submit" disabled={saving} className="px-4 py-2 text-sm text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-60 transition">{saving ? 'Saving...' : 'Add Note'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}