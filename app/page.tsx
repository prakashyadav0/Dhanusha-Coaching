import Link from 'next/link';
import dbConnect from '@/lib/Db';
import Course from '@/models/Course';
import '@/models/User';
import Hero from '@/components/shared/Hero';
import MapSection from '@/components/shared/MapSection';

// ─── Incremental Static Regeneration ────────────────────────────────────────
// The page is statically generated and cached, then rebuilt in the background
// at most once every 60 seconds. So instead of every visitor triggering a
// fresh DB query, only one rebuild does — everyone else gets the cached HTML.
// Course edits (publish/unpublish, price, title, thumbnail) show up within
// 60 seconds, without needing a redeploy.
export const revalidate = 60;

async function getCourses() {
  await dbConnect();
  const courses = await Course.find({
    isPublished: true,
  })
    .populate('teacher', 'name')
    .sort({ createdAt: -1 })
    .lean();
  return JSON.parse(JSON.stringify(courses));
}

export default async function HomePage() {
  const courses = await getCourses();
  return (
    <>
      <Hero />
      <div className="bg-gray-50">
        {/* Courses */}
        <section className="max-w-6xl mx-auto px-4 py-16">
          <h2 className="text-2xl font-bold text-gray-800 mb-8">
            Available Courses
          </h2>
          {courses.length === 0 ? (
            <p className="text-gray-500 text-center py-16">
              No courses published yet.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((course: any) => (
                <div
                  key={course._id}
                  className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition"
                >
                  {course.thumbnail ? (
                    <img
                      src={course.thumbnail}
                      alt={course.title}
                      className="w-full h-44 object-cover"
                    />
                  ) : (
                    <div className="w-full h-44 bg-indigo-100 flex items-center justify-center">
                      <span className="text-indigo-400 text-5xl">📚</span>
                    </div>
                  )}
                  <div className="p-5">
                    <h3 className="font-semibold text-gray-900 text-lg mb-1 line-clamp-2">
                      {course.title}
                    </h3>
                    <p className="text-gray-500 text-sm mb-3 line-clamp-2">
                      {course.description}
                    </p>
                    <p className="text-sm text-gray-400 mb-4">
                      By {course.teacher?.name ?? 'Unknown'}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-indigo-600 font-bold text-lg">
                        {course.price === 0
                          ? 'Free'
                          : `Rs. ${course.price}`}
                      </span>
                      <Link
                        href="/login"
                        className="bg-indigo-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
                      >
                        Enroll Now
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
      <MapSection />
    </>
  );
}