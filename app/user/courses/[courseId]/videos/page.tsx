'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

interface Video {
  _id: string;
  title: string;
  description: string;
  youtubeId: string;
  order: number;
}

export default function UserVideosPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const [videos, setVideos] = useState<Video[]>([]);
  const [active, setActive] = useState<Video | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchVideos() {
      const res = await fetch(`/api/videos?courseId=${courseId}`);
      const data = await res.json();
      if (!res.ok) { setError(data.message); setLoading(false); return; }
      setVideos(data.videos);
      if (data.videos.length > 0) setActive(data.videos[0]);
      setLoading(false);
    }
    fetchVideos();
  }, [courseId]);

  if (loading) return <p className="text-gray-400 text-sm">Loading videos...</p>;
  if (error) return <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">{error}</div>;

  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <Link href="/user/dashboard" className="text-sm text-gray-400 hover:text-indigo-600 transition">← Dashboard</Link>
        <span className="text-gray-300">/</span>
        <span className="text-sm text-gray-600">Videos</span>
      </div>

      {videos.length === 0 ? (
        <p className="text-gray-400 text-sm">No videos added to this course yet.</p>
      ) : (
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Player */}
          <div className="flex-1">
            {active && (
              <>
                <div className="rounded-xl overflow-hidden bg-black aspect-video w-full mb-4">
                  <iframe
                    src={`https://www.youtube-nocookie.com/embed/${active.youtubeId}?autoplay=1`}
                    title={active.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full"
                  />
                </div>
                <h2 className="text-lg font-semibold text-gray-900">{active.title}</h2>
                {active.description && <p className="text-sm text-gray-500 mt-1">{active.description}</p>}
              </>
            )}
          </div>

          {/* Playlist */}
          <div className="lg:w-72 space-y-2">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Playlist ({videos.length})</h3>
            {videos.map((v, i) => (
              <button
                key={v._id}
                onClick={() => setActive(v)}
                className={`w-full text-left flex items-start gap-3 px-3 py-3 rounded-xl border transition ${
                  active?._id === v._id
                    ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                    : 'bg-white border-gray-100 hover:bg-gray-50 text-gray-700'
                }`}
              >
                <span className="text-xs mt-0.5 font-medium w-5 shrink-0">{i + 1}.</span>
                <div>
                  <p className="text-sm font-medium leading-tight">{v.title}</p>
                  {v.description && <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{v.description}</p>}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}