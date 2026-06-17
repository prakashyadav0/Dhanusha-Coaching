import Link from "next/link";

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="max-w-4xl w-full bg-white rounded-2xl shadow-lg p-8 md:p-12">
        <h1 className="text-4xl font-bold text-red-600 text-center mb-4">
          Contact Us
        </h1>

        <p className="text-gray-600 text-center mb-10">
          Have questions about our courses or services? Feel free to contact us.
        </p>

        {/* Contact Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          {/* Online Classes Card */}
          <div className="border border-red-200 rounded-xl p-6 bg-red-50 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl">💻</span>
              <h2 className="text-xl font-semibold text-red-700">Online Classes</h2>
            </div>
            <div className="space-y-2 text-gray-700">
              <p>
                <span className="font-medium">📧 Email:</span> dhanushacoaching@gmail.com
              </p>
              <p>
                <span className="font-medium">📞 Phone:</span> +977-9801628001
              </p>
              <p>
                <span className="font-medium">📞 Phone:</span> +977-9806355000
              </p>
              
              <p className="text-sm text-gray-500 mt-2">
                ⏰ Mon-Fri: 6:00 AM - 9:00 PM
              </p>
            </div>
          </div>

          {/* Physical Classes Card */}
          <div className="border border-red-200 rounded-xl p-6 bg-red-50 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl">🏫</span>
              <h2 className="text-xl font-semibold text-red-700">Physical Classes</h2>
            </div>
            <div className="space-y-2 text-gray-700">
              <p>
                <span className="font-medium">📧 Email:</span> dhanushacoaching@gmail.com
              </p>
              <p>
                <span className="font-medium">📞 Phone:</span> +977-9817840154
              </p>
              <p>
                <span className="font-medium">📞 Phone:</span> +977-9844162947
              </p>
              <p>
                <span className="font-medium">📍 Address:</span> Janakpur, Nepal
              </p>
              <p className="text-sm text-gray-500 mt-2">
                ⏰ Mon-Sat: 7:00 AM - 6:00 PM
              </p>
            </div>
          </div>
        </div>

        {/* Quick Contact Form */}
        
        {/* Social Links */}
        <div>
          <h2 className="text-2xl font-semibold text-center text-red-700 mb-6">
            Follow Us
          </h2>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="https://facebook.com/dhanushacoaching"
              target="_blank"
              className="px-5 py-3 bg-blue-600 text-white rounded-lg hover:opacity-90 transition"
            >
              Facebook
            </Link>

            <Link
              href="https://youtube.com/@dhanushacoaching"
              target="_blank"
              className="px-5 py-3 bg-red-600 text-white rounded-lg hover:opacity-90 transition"
            >
              YouTube
            </Link>

            <Link
              href="https://tiktok.com/@dhanushacoaching"
              target="_blank"
              className="px-5 py-3 bg-black text-white rounded-lg hover:opacity-90 transition"
            >
              TikTok
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}