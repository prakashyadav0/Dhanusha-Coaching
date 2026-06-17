import Link from "next/link";
import Image from "next/image";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-red-600 mb-4">
            About Dhanusha Coaching
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Empowering students to achieve their dreams through quality education since 2015
          </p>
        </div>

        {/* Mission & Vision */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <div className="bg-red-50 rounded-xl p-6 border border-red-200 hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl">🎯</span>
              <h2 className="text-2xl font-semibold text-red-700">Our Mission</h2>
            </div>
            <p className="text-gray-700 leading-relaxed">
              To provide accessible, high-quality education that nurtures critical thinking, 
              fosters creativity, and prepares students for academic excellence and lifelong success.
            </p>
          </div>

          <div className="bg-red-50 rounded-xl p-6 border border-red-200 hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl">👁️</span>
              <h2 className="text-2xl font-semibold text-red-700">Our Vision</h2>
            </div>
            <p className="text-gray-700 leading-relaxed">
              To become Nepal's leading educational institution, recognized for innovative 
              teaching methods, personalized learning, and producing outstanding academic results.
            </p>
          </div>
        </div>

        {/* Story Section */}
        <div className="bg-white rounded-xl shadow-lg p-8 md:p-10 mb-12">
          <div className="flex items-center gap-3 mb-6">
            <span className="text-3xl">📖</span>
            <h2 className="text-2xl font-semibold text-red-700">Our Story</h2>
          </div>
          <div className="space-y-4 text-gray-700 leading-relaxed">
            <p>
              Founded in 2015 in the heart of Janakpur, Dhanusha Coaching started with a simple 
              yet powerful vision: to bridge the gap between traditional education and modern 
              learning needs. What began as a small tutoring center with just 10 students has 
              grown into a trusted educational institution serving hundreds of students annually.
            </p>
            <p>
              Our journey has been driven by a passionate team of educators who believe that 
              every student has unique potential waiting to be unlocked. Over the years, we've 
              helped thousands of students excel in their academic pursuits and achieve their 
              career goals.
            </p>
            <p>
              Today, we offer both online and physical classes, ensuring that quality education 
              is accessible to students regardless of their location or learning preferences.
            </p>
          </div>
        </div>

        {/* Values Section */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold text-red-700 text-center mb-8">
            Our Core Values
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl p-6 text-center shadow-md hover:shadow-lg transition-shadow border-t-4 border-red-600">
              <div className="text-4xl mb-3">⭐</div>
              <h3 className="font-semibold text-gray-800 mb-2">Excellence</h3>
              <p className="text-gray-600 text-sm">Striving for the highest standards in education</p>
            </div>

            <div className="bg-white rounded-xl p-6 text-center shadow-md hover:shadow-lg transition-shadow border-t-4 border-red-600">
              <div className="text-4xl mb-3">🤝</div>
              <h3 className="font-semibold text-gray-800 mb-2">Integrity</h3>
              <p className="text-gray-600 text-sm">Honesty and transparency in all our dealings</p>
            </div>

            <div className="bg-white rounded-xl p-6 text-center shadow-md hover:shadow-lg transition-shadow border-t-4 border-red-600">
              <div className="text-4xl mb-3">💡</div>
              <h3 className="font-semibold text-gray-800 mb-2">Innovation</h3>
              <p className="text-gray-600 text-sm">Embracing modern teaching methods and technology</p>
            </div>

            <div className="bg-white rounded-xl p-6 text-center shadow-md hover:shadow-lg transition-shadow border-t-4 border-red-600">
              <div className="text-4xl mb-3">❤️</div>
              <h3 className="font-semibold text-gray-800 mb-2">Care</h3>
              <p className="text-gray-600 text-sm">Supporting each student's individual journey</p>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="bg-red-600 rounded-xl p-8 mb-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center text-white">
            <div>
              <div className="text-3xl md:text-4xl font-bold">10+</div>
              <div className="text-sm opacity-90">Years of Excellence</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold">5000+</div>
              <div className="text-sm opacity-90">Students Trained</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold">50+</div>
              <div className="text-sm opacity-90">Expert Teachers</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold">95%</div>
              <div className="text-sm opacity-90">Success Rate</div>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center bg-red-50 rounded-xl p-8 border border-red-200">
          <h2 className="text-2xl font-semibold text-red-700 mb-4">
            Ready to Start Your Learning Journey?
          </h2>
          <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
            Join thousands of successful students who have transformed their academic careers with us.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/contact"
              className="px-6 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors"
            >
              Contact Us
            </Link>
            <Link
              href="/courses"
              className="px-6 py-3 bg-white text-red-600 font-semibold rounded-lg border-2 border-red-600 hover:bg-red-50 transition-colors"
            >
              Explore Courses
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}