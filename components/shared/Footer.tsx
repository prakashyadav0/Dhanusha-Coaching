import Link from "next/link";
import { 
  FaFacebook, 
  FaYoutube, 
  FaTiktok, 
  FaInstagram, 
  FaTwitter,
  FaPhone,
  FaEnvelope,
  FaMapMarkerAlt,
  FaClock
} from "react-icons/fa";

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white">
      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          
          {/* Column 1: Brand Info */}
          <div>
            <h3 className="text-2xl font-bold text-red-500 mb-4">
              Dhanusha Coaching
            </h3>
            <p className="text-gray-400 text-sm leading-relaxed mb-4">
              Empowering students to achieve their dreams through quality education since 2015.
            </p>
            {/* Social Media - One Line Icons Only */}
            <div className="flex space-x-9">
              <Link 
                href="https://facebook.com/dhanushacoaching" 
                target="_blank"
                className="text-gray-400 hover:text-red-500 transition-colors text-2xl"
                aria-label="Facebook"
              >
                <FaFacebook />
              </Link>
              <Link 
                href="https://youtube.com/@dhanushacoaching" 
                target="_blank"
                className="text-gray-400 hover:text-red-500 transition-colors text-2xl"
                aria-label="YouTube"
              >
                <FaYoutube />
              </Link>
              <Link 
                href="https://www.tiktok.com/@dhanushacoaching" 
                target="_blank"
                className="text-gray-400 hover:text-red-500 transition-colors text-2xl"
                aria-label="TikTok"
              >
                <FaTiktok />
              </Link>
              
              
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div>
            <h4 className="text-lg font-semibold mb-4 text-white">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-gray-400 hover:text-red-500 transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-gray-400 hover:text-red-500 transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/user/dashboard" className="text-gray-400 hover:text-red-500 transition-colors">
                  Courses
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-gray-400 hover:text-red-500 transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Contact Info */}
          <div>
            <h4 className="text-lg font-semibold mb-4 text-white">Contact Info</h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-3 text-gray-400">
                <FaMapMarkerAlt className="text-red-500 mt-1 flex-shrink-0" />
                <span>Janakpur, Nepal</span>
              </li>
              <li className="flex items-start gap-3 text-gray-400">
                <FaPhone className="text-red-500 mt-1 flex-shrink-0" />
                <span>+977-9817840154</span>
              </li>
              <li className="flex items-start gap-3 text-gray-400">
                <FaEnvelope className="text-red-500 mt-1 flex-shrink-0" />
                <span>dhanushacoaching@gmail.com</span>
              </li>
              <li className="flex items-start gap-3 text-gray-400">
                <FaClock className="text-red-500 mt-1 flex-shrink-0" />
                <span>Mon-Sat: 7:00 AM - 6:00 PM</span>
              </li>
            </ul>
          </div>

          {/* Column 4: Quick Contact */}
          <div>
            <h4 className="text-lg font-semibold mb-4 text-white">Get in Touch</h4>
            <p className="text-gray-400 text-sm mb-4">
              Have questions? Reach out to us anytime.
            </p>
            <Link
              href="/contact"
              className="inline-block bg-red-600 hover:bg-red-700 text-white font-semibold px-6 py-2 rounded-lg transition-colors"
            >
              Contact Us
            </Link>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 mt-10 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-gray-400 text-sm">
            © {new Date().getFullYear()} Dhanusha Coaching. All rights reserved.
          </p>
          <div className="flex gap-6 text-sm">
            <Link href="/privacy" className="text-gray-400 hover:text-red-500 transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="text-gray-400 hover:text-red-500 transition-colors">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}