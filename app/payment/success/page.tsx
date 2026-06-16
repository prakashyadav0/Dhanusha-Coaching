import Link from 'next/link';

export default function PaymentSuccessPage({
  searchParams,
}: {
  searchParams: { courseId?: string };
}) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 w-full max-w-md p-10 text-center">
        <div className="text-6xl mb-5">🎉</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
        <p className="text-gray-500 text-sm mb-8">
          You now have full access to your course. Start learning right away!
        </p>
        <div className="flex flex-col gap-3">
          {searchParams.courseId && (
            <Link
              href={`/user/courses/${searchParams.courseId}/videos`}
              className="bg-indigo-600 text-white font-semibold py-3 rounded-xl hover:bg-indigo-700 transition"
            >
              Start Watching ▶
            </Link>
          )}
          <Link
            href="/user/dashboard"
            className="bg-gray-100 text-gray-700 font-medium py-3 rounded-xl hover:bg-gray-200 transition"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}