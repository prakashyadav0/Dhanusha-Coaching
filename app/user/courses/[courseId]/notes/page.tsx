'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

interface Note {
  _id: string;
  title: string;
  description: string;
  driveLink: string;
  postedBy: { name: string };
  createdAt: string;
}

export default function UserNotesPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchNotes() {
      const res = await fetch(`/api/notes?courseId=${courseId}`);
      const data = await res.json();
      if (!res.ok) { setError(data.message); setLoading(false); return; }
      setNotes(data.notes);
      setLoading(false);
    }
    fetchNotes();
  }, [courseId]);

  if (loading) return <p className="text-gray-400 text-sm">Loading notes...</p>;
  if (error) return <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">{error}</div>;

  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <Link href="/user/dashboard" className="text-sm text-gray-400 hover:text-indigo-600 transition">← Dashboard</Link>
        <span className="text-gray-300">/</span>
        <span className="text-sm text-gray-600">Notes</span>
      </div>

      <h1 className="text-2xl font-bold text-gray-800 mb-6">📝 Notes</h1>

      {notes.length === 0 ? (
        <p className="text-gray-400 text-sm">No notes added to this course yet.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {notes.map((note) => (
            <div key={note._id} className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm hover:shadow-md transition">
              <div className="text-3xl mb-3">📄</div>
              <h3 className="font-semibold text-gray-900 mb-1">{note.title}</h3>
              {note.description && <p className="text-sm text-gray-500 mb-3">{note.description}</p>}
              <p className="text-xs text-gray-400 mb-4">
                By {note.postedBy?.name} · {new Date(note.createdAt).toLocaleDateString()}
              </p>
              <a
                href={note.driveLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
              >
                Open in Drive ↗
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}