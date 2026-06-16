import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-white">
      <div className="max-w-6xl mx-auto px-4 py-12">

        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">

          {/* Brand */}
          <div>
            <h3 className="text-xl font-bold text-red-600">
              Dhanusha Coaching
            </h3>

            <p className="mt-3 text-sm text-gray-500 leading-6">
              Learn anytime with recorded courses, notes, and notices
              from expert teachers.
            </p>
          </div>

          {/* Platform */}
          <div>
            <h4 className="font-semibold text-red-600 mb-4">
              Platform
            </h4>

            <div className="space-y-3">
              <Link
                href="/"
                className="block text-sm text-gray-500 hover:text-indigo-600"
              >
                Courses
              </Link>

              <Link
                href="/login"
                className="block text-sm text-gray-500 hover:text-indigo-600"
              >
                Login
              </Link>

              <Link
                href="/register"
                className="block text-sm text-gray-500 hover:text-indigo-600"
              >
                Register
              </Link>
            </div>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-semibold text-red-600 mb-4">
              Support
            </h4>

            <div className="space-y-3">
              <Link
                href="/contact"
                className="block text-sm text-gray-500 hover:text-indigo-600"
              >
                Contact
              </Link>

              <Link
                href="/faq"
                className="block text-sm text-gray-500 hover:text-indigo-600"
              >
                FAQ
              </Link>

              <Link
                href="/privacy"
                className="block text-sm text-gray-500 hover:text-indigo-600"
              >
                Privacy Policy
              </Link>
            </div>
          </div>

          {/* CTA */}
          <div>
            <h4 className="font-semibold text-red-600 mb-4">
              Start Learning
            </h4>

            <p className="text-sm text-gray-500 mb-4">
              Join thousands of students and begin today.
            </p>

            <Link
              href="/register"
              className="inline-flex bg-indigo-600 text-white px-5 py-2 rounded-lg hover:bg-indigo-700 transition"
            >
              Get Started
            </Link>
          </div>

        </div>

        {/* Bottom */}
        <div className="border-t border-gray-200 mt-10 pt-6 text-center">
          <p className="text-sm text-gray-600">
            © {new Date().getFullYear()} Dhanusha Coaching. All rights reserved.
          </p>
        </div>

      </div>
    </footer>
  );
}