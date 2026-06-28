'use client';
import { useState, useEffect } from 'react';

interface Course {
  _id: string;
  title: string;
  description?: string;
  thumbnail?: string;
  price: number;
  isPublished: boolean;
  totalVideos: number;
  totalNotes: number;
  enrolledCount?: number;
  enrolledUsers?: EnrolledUser[];
  teacher: { name: string };
}

interface EnrolledUser {
  _id: string;
  name: string;
  email: string;
  enrolledAt?: string;
}

interface Video {
  _id: string;
  title: string;
  description?: string;
  youtubeUrl: string;
  courseId: string;
}

interface Note {
  _id: string;
  title: string;
  description?: string;
  driveLink: string;
  courseId: string;
}

const inputCls =
  'w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500';

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [courseForm, setCourseForm] = useState({
    title: '',
    description: '',
    price: '',
    thumbnail: '',
  });
  const [videoForm, setVideoForm] = useState({
    title: '',
    description: '',
    youtubeUrl: '',
    courseId: '',
  });
  const [noteForm, setNoteForm] = useState({
    title: '',
    description: '',
    driveLink: '',
    courseId: '',
  });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  // Edit course
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);

  // Enrolled users modal
  const [showEnrolledModal, setShowEnrolledModal] = useState(false);
  const [enrolledUsers, setEnrolledUsers] = useState<EnrolledUser[]>([]);
  const [enrolledLoading, setEnrolledLoading] = useState(false);
  const [enrolledCourseTitle, setEnrolledCourseTitle] = useState('');

  // Videos management modal
  const [showVideosModal, setShowVideosModal] = useState(false);
  const [videos, setVideos] = useState<Video[]>([]);
  const [videosLoading, setVideosLoading] = useState(false);
  const [videosCourseId, setVideosCourseId] = useState('');
  const [videosCourseTitle, setVideosCourseTitle] = useState('');

  // Edit video
  const [editingVideo, setEditingVideo] = useState<Video | null>(null);
  const [showEditVideoModal, setShowEditVideoModal] = useState(false);
  const [editVideoForm, setEditVideoForm] = useState({
    title: '',
    description: '',
    youtubeUrl: '',
  });

  // Notes management modal
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [notes, setNotes] = useState<Note[]>([]);
  const [notesLoading, setNotesLoading] = useState(false);
  const [notesCourseTitle, setNotesCourseTitle] = useState('');

  // Edit note
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [showEditNoteModal, setShowEditNoteModal] = useState(false);
  const [editNoteForm, setEditNoteForm] = useState({
    title: '',
    description: '',
    driveLink: '',
  });

  async function fetchCourses() {
    const res = await fetch('/api/courses?all=true');
    const data = await res.json();
    setCourses(data.courses ?? []);
    setLoading(false);
  }

  useEffect(() => {
    fetchCourses();
  }, []);

  async function submit(url: string, body: object, onOk: () => void) {
    setSaving(true);
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    setSaving(false);
    if (res.ok) {
      onOk();
      fetchCourses();
    } else {
      const d = await res.json();
      setMsg(d.message);
    }
  }

  async function updateCourse() {
    if (!editingCourse) return;
    setSaving(true);
    const res = await fetch(`/api/courses/${editingCourse._id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: courseForm.title,
        description: courseForm.description,
        price: Number(courseForm.price),
        thumbnail: courseForm.thumbnail,
      }),
    });
    setSaving(false);
    if (res.ok) {
      setMsg('Course updated successfully!');
      setShowCourseModal(false);
      setEditingCourse(null);
      setIsEditMode(false);
      setCourseForm({ title: '', description: '', price: '', thumbnail: '' });
      fetchCourses();
    } else {
      const d = await res.json();
      setMsg(d.message);
    }
  }

  // Fetch enrolled users for a course
  async function fetchEnrolledUsers(course: Course) {
    setEnrolledCourseTitle(course.title);
    setShowEnrolledModal(true);
    setEnrolledLoading(true);
    try {
      const res = await fetch(`/api/orders?courseId=${course._id}`);
      const data = await res.json();
      setEnrolledUsers(data.users ?? []);
    } catch {
      setEnrolledUsers([]);
    } finally {
      setEnrolledLoading(false);
    }
  }

  // Fetch videos for a course
  async function fetchVideos(course: Course) {
    setVideosCourseId(course._id);
    setVideosCourseTitle(course.title);
    setShowVideosModal(true);
    setVideosLoading(true);
    try {
      const res = await fetch(`/api/videos?courseId=${course._id}`);
      const data = await res.json();
      setVideos(data.videos ?? []);
    } catch {
      setVideos([]);
    } finally {
      setVideosLoading(false);
    }
  }

  // Delete a video
  async function deleteVideo(videoId: string) {
    if (!confirm('Delete this video?')) return;
    const res = await fetch(`/api/videos?id=${videoId}`, { method: 'DELETE' });
    if (res.ok) {
      setVideos((prev) => prev.filter((v) => v._id !== videoId));
      fetchCourses();
    }
  }

  // Update a video
  async function updateVideo() {
    if (!editingVideo) return;
    setSaving(true);
    const res = await fetch(`/api/videos?id=${editingVideo._id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editVideoForm),
    });
    setSaving(false);
    if (res.ok) {
      setVideos((prev) =>
        prev.map((v) => (v._id === editingVideo._id ? { ...v, ...editVideoForm } : v))
      );
      setShowEditVideoModal(false);
      setEditingVideo(null);
    } else {
      const d = await res.json();
      setMsg(d.message);
    }
  }

  // Fetch notes for a course
  async function fetchNotes(course: Course) {
    setNotesCourseTitle(course.title);
    setShowNotesModal(true);
    setNotesLoading(true);
    try {
      const res = await fetch(`/api/notes?courseId=${course._id}`);
      const data = await res.json();
      setNotes(data.notes ?? []);
    } catch {
      setNotes([]);
    } finally {
      setNotesLoading(false);
    }
  }

  // Delete a note
  async function deleteNote(noteId: string) {
    if (!confirm('Delete this note?')) return;
    const res = await fetch(`/api/notes?id=${noteId}`, { method: 'DELETE' });
    if (res.ok) {
      setNotes((prev) => prev.filter((n) => n._id !== noteId));
      fetchCourses();
    }
  }

  // Update a note
  async function updateNote() {
    if (!editingNote) return;
    setSaving(true);
    const res = await fetch(`/api/notes?id=${editingNote._id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editNoteForm),
    });
    setSaving(false);
    if (res.ok) {
      setNotes((prev) =>
        prev.map((n) => (n._id === editingNote._id ? { ...n, ...editNoteForm } : n))
      );
      setShowEditNoteModal(false);
      setEditingNote(null);
    } else {
      const d = await res.json();
      setMsg(d.message);
    }
  }

  // Compute total revenue for a course
  function courseRevenue(course: Course) {
    return (course.enrolledCount ?? 0) * course.price;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Courses</h1>
        <button
          onClick={() => {
            setIsEditMode(false);
            setEditingCourse(null);
            setCourseForm({ title: '', description: '', price: '', thumbnail: '' });
            setShowCourseModal(true);
          }}
          className="bg-indigo-600 text-white px-3 sm:px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition"
        >
          + New Course
        </button>
      </div>

      {msg && (
        <div className="mb-4 bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-lg">
          {msg}
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : courses.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-2">📚</p>
          <p className="text-sm">No courses yet.</p>
        </div>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {courses.map((course) => (
            <div
              key={course._id}
              className="bg-white border border-gray-100 rounded-xl p-4 sm:p-5 shadow-sm"
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate">{course.title}</h3>
                  <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                    Rs. {course.price} · {course.totalVideos} videos · {course.totalNotes} notes
                  </p>

                  {/* Stats row */}
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <span
                      className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${
                        course.isPublished
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {course.isPublished ? 'Published' : 'Draft'}
                    </span>

                    <button
                      onClick={() => fetchEnrolledUsers(course)}
                      className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 hover:bg-indigo-100 transition cursor-pointer"
                    >
                      🎓 {course.enrolledCount ?? 0} enrolled
                    </button>

                    <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
                      💰 Rs. {courseRevenue(course).toLocaleString()} revenue
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 shrink-0">
                  {/* Manage Videos */}
                  <button
                    onClick={() => fetchVideos(course)}
                    className="text-xs bg-violet-50 text-violet-700 px-3 py-2 rounded-lg hover:bg-violet-100 transition"
                  >
                    📹 Videos
                  </button>
                  <button
                    onClick={() => {
                      setVideoForm({ title: '', description: '', youtubeUrl: '', courseId: course._id });
                      setShowVideoModal(true);
                    }}
                    className="text-xs bg-indigo-50 text-indigo-700 px-3 py-2 rounded-lg hover:bg-indigo-100 transition"
                  >
                    + Video
                  </button>

                  {/* Manage Notes */}
                  <button
                    onClick={() => fetchNotes(course)}
                    className="text-xs bg-amber-50 text-amber-700 px-3 py-2 rounded-lg hover:bg-amber-100 transition"
                  >
                    📄 Notes
                  </button>
                  <button
                    onClick={() => {
                      setNoteForm({ title: '', description: '', driveLink: '', courseId: course._id });
                      setShowNoteModal(true);
                    }}
                    className="text-xs bg-orange-50 text-orange-700 px-3 py-2 rounded-lg hover:bg-orange-100 transition"
                  >
                    + Note
                  </button>

                  <button
                    onClick={() => {
                      setEditingCourse(course);
                      setCourseForm({
                        title: course.title,
                        description: course.description || '',
                        price: String(course.price),
                        thumbnail: course.thumbnail || '',
                      });
                      setIsEditMode(true);
                      setShowCourseModal(true);
                    }}
                    className="text-xs bg-blue-50 text-blue-700 px-3 py-2 rounded-lg hover:bg-blue-100 transition"
                  >
                    Edit
                  </button>
                  <button
                    onClick={async () => {
                      await fetch(`/api/courses/${course._id}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ isPublished: !course.isPublished }),
                      });
                      fetchCourses();
                    }}
                    className="text-xs bg-gray-50 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-100 transition"
                  >
                    {course.isPublished ? 'Unpublish' : 'Publish'}
                  </button>
                  <button
                    onClick={async () => {
                      if (!confirm('Delete?')) return;
                      await fetch(`/api/courses/${course._id}`, { method: 'DELETE' });
                      fetchCourses();
                    }}
                    className="text-xs bg-red-50 text-red-700 px-3 py-2 rounded-lg hover:bg-red-100 transition"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Create/Edit Course Modal ── */}
      {showCourseModal && (
        <Modal
          title={isEditMode ? 'Edit Course' : 'Create New Course'}
          onClose={() => {
            setShowCourseModal(false);
            setEditingCourse(null);
            setIsEditMode(false);
          }}
        >
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (isEditMode) {
                await updateCourse();
              } else {
                submit('/api/courses', { ...courseForm, price: Number(courseForm.price) }, () => {
                  setMsg('Course created!');
                  setShowCourseModal(false);
                  setCourseForm({ title: '', description: '', price: '', thumbnail: '' });
                });
              }
            }}
            className="space-y-4"
          >
            <Field label="Title">
              <input
                required
                value={courseForm.title}
                onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value })}
                className={inputCls}
                placeholder="e.g. Class 12 Physics"
              />
            </Field>
            <Field label="Description">
              <textarea
                required
                value={courseForm.description}
                onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })}
                className={inputCls + ' h-24 resize-none'}
                placeholder="Brief course description..."
              />
            </Field>
            <Field label="Price (Rs.)">
              <input
                type="number"
                min="0"
                required
                value={courseForm.price}
                onChange={(e) => setCourseForm({ ...courseForm, price: e.target.value })}
                className={inputCls}
                placeholder="0 for free"
              />
            </Field>
            <Field label="Thumbnail URL (optional)">
              <input
                value={courseForm.thumbnail}
                onChange={(e) => setCourseForm({ ...courseForm, thumbnail: e.target.value })}
                className={inputCls}
                placeholder="https://..."
              />
            </Field>
            <Actions
              onCancel={() => {
                setShowCourseModal(false);
                setEditingCourse(null);
                setIsEditMode(false);
              }}
              saving={saving}
              label={isEditMode ? 'Update Course' : 'Create Course'}
            />
          </form>
        </Modal>
      )}

      {/* ── Add Video Modal ── */}
      {showVideoModal && (
        <Modal title="Add Video" onClose={() => setShowVideoModal(false)}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              submit('/api/videos', videoForm, () => {
                setMsg('Video added!');
                setShowVideoModal(false);
                setVideoForm({ title: '', description: '', youtubeUrl: '', courseId: '' });
              });
            }}
            className="space-y-4"
          >
            <Field label="Video Title">
              <input
                required
                value={videoForm.title}
                onChange={(e) => setVideoForm({ ...videoForm, title: e.target.value })}
                className={inputCls}
                placeholder="e.g. Chapter 1 - Introduction"
              />
            </Field>
            <Field label="YouTube URL">
              <input
                required
                value={videoForm.youtubeUrl}
                onChange={(e) => setVideoForm({ ...videoForm, youtubeUrl: e.target.value })}
                className={inputCls}
                placeholder="https://www.youtube.com/watch?v=..."
              />
            </Field>
            <Field label="Description (optional)">
              <textarea
                value={videoForm.description}
                onChange={(e) => setVideoForm({ ...videoForm, description: e.target.value })}
                className={inputCls + ' h-20 resize-none'}
                placeholder="Short description..."
              />
            </Field>
            <Actions onCancel={() => setShowVideoModal(false)} saving={saving} label="Add Video" />
          </form>
        </Modal>
      )}

      {/* ── Add Note Modal ── */}
      {showNoteModal && (
        <Modal title="Add Note" onClose={() => setShowNoteModal(false)}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              submit('/api/notes', noteForm, () => {
                setMsg('Note added!');
                setShowNoteModal(false);
                setNoteForm({ title: '', description: '', driveLink: '', courseId: '' });
              });
            }}
            className="space-y-4"
          >
            <Field label="Note Title">
              <input
                required
                value={noteForm.title}
                onChange={(e) => setNoteForm({ ...noteForm, title: e.target.value })}
                className={inputCls}
                placeholder="e.g. Chapter 1 Notes PDF"
              />
            </Field>
            <Field label="Google Drive Link">
              <input
                required
                value={noteForm.driveLink}
                onChange={(e) => setNoteForm({ ...noteForm, driveLink: e.target.value })}
                className={inputCls}
                placeholder="https://drive.google.com/..."
              />
            </Field>
            <Field label="Description (optional)">
              <textarea
                value={noteForm.description}
                onChange={(e) => setNoteForm({ ...noteForm, description: e.target.value })}
                className={inputCls + ' h-20 resize-none'}
                placeholder="Short description..."
              />
            </Field>
            <Actions onCancel={() => setShowNoteModal(false)} saving={saving} label="Add Note" />
          </form>
        </Modal>
      )}

      {/* ── Enrolled Users Modal ── */}
      {showEnrolledModal && (
        <Modal
          title={`Enrolled Students — ${enrolledCourseTitle}`}
          onClose={() => {
            setShowEnrolledModal(false);
            setEnrolledUsers([]);
          }}
        >
          {enrolledLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 bg-gray-100 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : enrolledUsers.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              <p className="text-3xl mb-2">🎓</p>
              <p className="text-sm">No students enrolled yet.</p>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-gray-500 mb-3">
                {enrolledUsers.length} student{enrolledUsers.length !== 1 ? 's' : ''}
              </p>
              {enrolledUsers.map((user) => (
                <div
                  key={user._id}
                  className="flex items-center justify-between px-3 py-2.5 bg-gray-50 rounded-lg border border-gray-100"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-800">{user.name}</p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                  </div>
                  {user.enrolledAt && (
                    <span className="text-xs text-gray-400 shrink-0 ml-2">
                      {new Date(user.enrolledAt).toLocaleDateString()}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
          <div className="pt-4">
            <button
              onClick={() => {
                setShowEnrolledModal(false);
                setEnrolledUsers([]);
              }}
              className="w-full px-4 py-2.5 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
            >
              Close
            </button>
          </div>
        </Modal>
      )}

      {/* ── Manage Videos Modal ── */}
      {showVideosModal && (
        <Modal
          title={`Videos — ${videosCourseTitle}`}
          onClose={() => {
            setShowVideosModal(false);
            setVideos([]);
          }}
        >
          {videosLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-14 bg-gray-100 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : videos.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              <p className="text-3xl mb-2">📹</p>
              <p className="text-sm">No videos added yet.</p>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-gray-500 mb-3">
                {videos.length} video{videos.length !== 1 ? 's' : ''}
              </p>
              {videos.map((video, idx) => (
                <div
                  key={video._id}
                  className="flex items-center justify-between px-3 py-2.5 bg-gray-50 rounded-lg border border-gray-100 gap-2"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">
                      <span className="text-gray-400 mr-1.5">{idx + 1}.</span>
                      {video.title}
                    </p>
                    {video.description && (
                      <p className="text-xs text-gray-500 truncate">{video.description}</p>
                    )}
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    <button
                      onClick={() => {
                        setEditingVideo(video);
                        setEditVideoForm({
                          title: video.title,
                          description: video.description || '',
                          youtubeUrl: video.youtubeUrl,
                        });
                        setShowEditVideoModal(true);
                      }}
                      className="text-xs bg-blue-50 text-blue-700 px-2.5 py-1.5 rounded-md hover:bg-blue-100 transition"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteVideo(video._id)}
                      className="text-xs bg-red-50 text-red-700 px-2.5 py-1.5 rounded-md hover:bg-red-100 transition"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="pt-4">
            <button
              onClick={() => {
                setShowVideosModal(false);
                setVideos([]);
              }}
              className="w-full px-4 py-2.5 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
            >
              Close
            </button>
          </div>
        </Modal>
      )}

      {/* ── Edit Video Modal ── */}
      {showEditVideoModal && editingVideo && (
        <Modal
          title="Edit Video"
          onClose={() => {
            setShowEditVideoModal(false);
            setEditingVideo(null);
          }}
        >
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              await updateVideo();
            }}
            className="space-y-4"
          >
            <Field label="Video Title">
              <input
                required
                value={editVideoForm.title}
                onChange={(e) => setEditVideoForm({ ...editVideoForm, title: e.target.value })}
                className={inputCls}
              />
            </Field>
            <Field label="YouTube URL">
              <input
                required
                value={editVideoForm.youtubeUrl}
                onChange={(e) => setEditVideoForm({ ...editVideoForm, youtubeUrl: e.target.value })}
                className={inputCls}
              />
            </Field>
            <Field label="Description (optional)">
              <textarea
                value={editVideoForm.description}
                onChange={(e) =>
                  setEditVideoForm({ ...editVideoForm, description: e.target.value })
                }
                className={inputCls + ' h-20 resize-none'}
              />
            </Field>
            <Actions
              onCancel={() => {
                setShowEditVideoModal(false);
                setEditingVideo(null);
              }}
              saving={saving}
              label="Save Changes"
            />
          </form>
        </Modal>
      )}

      {/* ── Manage Notes Modal ── */}
      {showNotesModal && (
        <Modal
          title={`Notes — ${notesCourseTitle}`}
          onClose={() => {
            setShowNotesModal(false);
            setNotes([]);
          }}
        >
          {notesLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-14 bg-gray-100 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : notes.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              <p className="text-3xl mb-2">📄</p>
              <p className="text-sm">No notes added yet.</p>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-gray-500 mb-3">
                {notes.length} note{notes.length !== 1 ? 's' : ''}
              </p>
              {notes.map((note, idx) => (
                <div
                  key={note._id}
                  className="flex items-center justify-between px-3 py-2.5 bg-gray-50 rounded-lg border border-gray-100 gap-2"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">
                      <span className="text-gray-400 mr-1.5">{idx + 1}.</span>
                      {note.title}
                    </p>
                    {note.description && (
                      <p className="text-xs text-gray-500 truncate">{note.description}</p>
                    )}
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    <a
                      href={note.driveLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs bg-emerald-50 text-emerald-700 px-2.5 py-1.5 rounded-md hover:bg-emerald-100 transition"
                    >
                      View
                    </a>
                    <button
                      onClick={() => {
                        setEditingNote(note);
                        setEditNoteForm({
                          title: note.title,
                          description: note.description || '',
                          driveLink: note.driveLink,
                        });
                        setShowEditNoteModal(true);
                      }}
                      className="text-xs bg-blue-50 text-blue-700 px-2.5 py-1.5 rounded-md hover:bg-blue-100 transition"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteNote(note._id)}
                      className="text-xs bg-red-50 text-red-700 px-2.5 py-1.5 rounded-md hover:bg-red-100 transition"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="pt-4">
            <button
              onClick={() => {
                setShowNotesModal(false);
                setNotes([]);
              }}
              className="w-full px-4 py-2.5 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
            >
              Close
            </button>
          </div>
        </Modal>
      )}

      {/* ── Edit Note Modal ── */}
      {showEditNoteModal && editingNote && (
        <Modal
          title="Edit Note"
          onClose={() => {
            setShowEditNoteModal(false);
            setEditingNote(null);
          }}
        >
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              await updateNote();
            }}
            className="space-y-4"
          >
            <Field label="Note Title">
              <input
                required
                value={editNoteForm.title}
                onChange={(e) => setEditNoteForm({ ...editNoteForm, title: e.target.value })}
                className={inputCls}
              />
            </Field>
            <Field label="Google Drive Link">
              <input
                required
                value={editNoteForm.driveLink}
                onChange={(e) => setEditNoteForm({ ...editNoteForm, driveLink: e.target.value })}
                className={inputCls}
              />
            </Field>
            <Field label="Description (optional)">
              <textarea
                value={editNoteForm.description}
                onChange={(e) =>
                  setEditNoteForm({ ...editNoteForm, description: e.target.value })
                }
                className={inputCls + ' h-20 resize-none'}
              />
            </Field>
            <Actions
              onCancel={() => {
                setShowEditNoteModal(false);
                setEditingNote(null);
              }}
              saving={saving}
              label="Save Changes"
            />
          </form>
        </Modal>
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

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 px-0 sm:px-4">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-100">
          <h2 className="text-base sm:text-lg font-bold text-gray-800 truncate pr-4">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none w-8 h-8 flex items-center justify-center shrink-0"
          >
            ×
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function Actions({
  onCancel,
  saving,
  label,
}: {
  onCancel: () => void;
  saving: boolean;
  label: string;
}) {
  return (
    <div className="flex gap-3 pt-2">
      <button
        type="button"
        onClick={onCancel}
        className="flex-1 sm:flex-none px-4 py-2.5 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
      >
        Cancel
      </button>
      <button
        type="submit"
        disabled={saving}
        className="flex-1 sm:flex-none px-4 py-2.5 text-sm text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-60 transition"
      >
        {saving ? 'Saving...' : label}
      </button>
    </div>
  );
}