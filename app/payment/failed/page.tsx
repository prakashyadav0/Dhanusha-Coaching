import Link from 'next/link';

const reasons: Record<string, string> = {
  cancelled: 'You cancelled the payment.',
  missing_params: 'Payment verification failed due to missing data.',
  lookup_failed: 'Could not verify payment with Khalti.',
  not_completed: 'Payment was not completed.',
  amount_mismatch: 'Payment amount did not match.',
  order_not_found: 'Order not found.',
  server_error: 'A server error occurred. Please try again.',
};

export default function PaymentFailedPage({
  searchParams,
}: {
  searchParams: { reason?: string };
}) {
  const msg = reasons[searchParams.reason ?? ''] ?? 'Payment could not be completed.';

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 w-full max-w-md p-10 text-center">
        <div className="text-6xl mb-5">😞</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Failed</h1>
        <p className="text-gray-500 text-sm mb-8">{msg}</p>
        <div className="flex flex-col gap-3">
          <Link
            href="/user/dashboard"
            className="bg-indigo-600 text-white font-semibold py-3 rounded-xl hover:bg-indigo-700 transition"
          >
            Try Again
          </Link>
          <Link
            href="/"
            className="bg-gray-100 text-gray-700 font-medium py-3 rounded-xl hover:bg-gray-200 transition"
          >
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}