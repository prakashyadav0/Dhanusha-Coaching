'use client';
import { useState, useEffect } from 'react';

interface Course {
  _id: string; title: string; price: number;
  isPublished: boolean; totalVideos: number; totalNotes: number;
  teacher: { name: string };
}

const inputCls = 'w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500';

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [courseForm, setCourseForm] = useState({ title: '', description: '', price: '', thumbnail: '' });
  const [videoForm, setVideoForm] = useState({ title: '', description: '', youtubeUrl: '', courseId: '' });
  const [noteForm, setNoteForm]   = useState({ title: '', description: '', driveLink: '', courseId: '' });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  async function fetchCourses() {
    const res = await fetch('/api/courses?all=true');
    const data = await res.json();
    setCourses(data.courses ?? []);
    setLoading(false);
  }
  useEffect(() => { fetchCourses(); }, []);

  async function submit(url: string, body: object, onOk: () => void) {
    setSaving(true);
    const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    setSaving(false);
    if (res.ok) { onOk(); fetchCourses(); }
    else { const d = await res.json(); setMsg(d.message); }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Courses</h1>
        <button onClick={() => setShowCourseModal(true)} className="bg-indigo-600 text-white px-3 sm:px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition">
          + New Course
        </button>
      </div>

      {msg && <div className="mb-4 bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-lg">{msg}</div>}

      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />)}</div>
      ) : courses.length === 0 ? (
        <div className="text-center py-16 text-gray-400"><p className="text-4xl mb-2">📚</p><p className="text-sm">No courses yet.</p></div>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {courses.map(course => (
            <div key={course._id} className="bg-white border border-gray-100 rounded-xl p-4 sm:p-5 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate">{course.title}</h3>
                  <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                    Rs. {course.price} · {course.totalVideos} videos · {course.totalNotes} notes
                  </p>
                  <span className={`mt-2 inline-block text-xs font-medium px-2 py-0.5 rounded-full ${course.isPublished ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {course.isPublished ? 'Published' : 'Draft'}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2 shrink-0">
                  <button onClick={() => { setVideoForm({ title: '', description: '', youtubeUrl: '', courseId: course._id }); setShowVideoModal(true); }} className="text-xs bg-indigo-50 text-indigo-700 px-3 py-2 rounded-lg hover:bg-indigo-100 transition">+ Video</button>
                  <button onClick={() => { setNoteForm({ title: '', description: '', driveLink: '', courseId: course._id }); setShowNoteModal(true); }} className="text-xs bg-amber-50 text-amber-700 px-3 py-2 rounded-lg hover:bg-amber-100 transition">+ Note</button>
                  <button onClick={async () => { await fetch(`/api/courses/${course._id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isPublished: !course.isPublished }) }); fetchCourses(); }} className="text-xs bg-gray-50 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-100 transition">{course.isPublished ? 'Unpublish' : 'Publish'}</button>
                  <button onClick={async () => { if (!confirm('Delete?')) return; await fetch(`/api/courses/${course._id}`, { method: 'DELETE' }); fetchCourses(); }} className="text-xs bg-red-50 text-red-700 px-3 py-2 rounded-lg hover:bg-red-100 transition">Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Course Modal */}
      {showCourseModal && (
        <Modal title="Create New Course" onClose={() => setShowCourseModal(false)}>
          <form onSubmit={e => { e.preventDefault(); submit('/api/courses', { ...courseForm, price: Number(courseForm.price) }, () => { setMsg('Course created!'); setShowCourseModal(false); setCourseForm({ title: '', description: '', price: '', thumbnail: '' }); }); }} className="space-y-4">
            <Field label="Title"><input required value={courseForm.title} onChange={e => setCourseForm({...courseForm, title: e.target.value})} className={inputCls} placeholder="e.g. Class 12 Physics" /></Field>
            <Field label="Description"><textarea required value={courseForm.description} onChange={e => setCourseForm({...courseForm, description: e.target.value})} className={inputCls + ' h-24 resize-none'} placeholder="Brief course description..." /></Field>
            <Field label="Price (Rs.)"><input type="number" min="0" required value={courseForm.price} onChange={e => setCourseForm({...courseForm, price: e.target.value})} className={inputCls} placeholder="0 for free" /></Field>
            <Field label="Thumbnail URL (optional)"><input value={courseForm.thumbnail} onChange={e => setCourseForm({...courseForm, thumbnail: e.target.value})} className={inputCls} placeholder="https://..." /></Field>
            <Actions onCancel={() => setShowCourseModal(false)} saving={saving} label="Create Course" />
          </form>
        </Modal>
      )}

      {/* Add Video Modal */}
      {showVideoModal && (
        <Modal title="Add Video" onClose={() => setShowVideoModal(false)}>
          <form onSubmit={e => { e.preventDefault(); submit('/api/videos', videoForm, () => { setMsg('Video added!'); setShowVideoModal(false); setVideoForm({ title: '', description: '', youtubeUrl: '', courseId: '' }); }); }} className="space-y-4">
            <Field label="Video Title"><input required value={videoForm.title} onChange={e => setVideoForm({...videoForm, title: e.target.value})} className={inputCls} placeholder="e.g. Chapter 1 - Introduction" /></Field>
            <Field label="YouTube URL"><input required value={videoForm.youtubeUrl} onChange={e => setVideoForm({...videoForm, youtubeUrl: e.target.value})} className={inputCls} placeholder="https://www.youtube.com/watch?v=..." /></Field>
            <Field label="Description (optional)"><textarea value={videoForm.description} onChange={e => setVideoForm({...videoForm, description: e.target.value})} className={inputCls + ' h-20 resize-none'} placeholder="Short description..." /></Field>
            <Actions onCancel={() => setShowVideoModal(false)} saving={saving} label="Add Video" />
          </form>
        </Modal>
      )}

      {/* Add Note Modal */}
      {showNoteModal && (
        <Modal title="Add Note" onClose={() => setShowNoteModal(false)}>
          <form onSubmit={e => { e.preventDefault(); submit('/api/notes', noteForm, () => { setMsg('Note added!'); setShowNoteModal(false); setNoteForm({ title: '', description: '', driveLink: '', courseId: '' }); }); }} className="space-y-4">
            <Field label="Note Title"><input required value={noteForm.title} onChange={e => setNoteForm({...noteForm, title: e.target.value})} className={inputCls} placeholder="e.g. Chapter 1 Notes PDF" /></Field>
            <Field label="Google Drive Link"><input required value={noteForm.driveLink} onChange={e => setNoteForm({...noteForm, driveLink: e.target.value})} className={inputCls} placeholder="https://drive.google.com/..." /></Field>
            <Field label="Description (optional)"><textarea value={noteForm.description} onChange={e => setNoteForm({...noteForm, description: e.target.value})} className={inputCls + ' h-20 resize-none'} placeholder="Short description..." /></Field>
            <Actions onCancel={() => setShowNoteModal(false)} saving={saving} label="Add Note" />
          </form>
        </Modal>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>{children}</div>;
}
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 px-0 sm:px-4">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-100">
          <h2 className="text-base sm:text-lg font-bold text-gray-800">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none w-8 h-8 flex items-center justify-center">×</button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
function Actions({ onCancel, saving, label }: { onCancel: () => void; saving: boolean; label: string }) {
  return (
    <div className="flex gap-3 pt-2">
      <button type="button" onClick={onCancel} className="flex-1 sm:flex-none px-4 py-2.5 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition">Cancel</button>
      <button type="submit" disabled={saving} className="flex-1 sm:flex-none px-4 py-2.5 text-sm text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-60 transition">{saving ? 'Saving...' : label}</button>
    </div>
  );
}