import Link from 'next/link';
import Head from 'next/head';

export default function Hero() {
  return (
    <>
      {/* SEO Metadata */}
      <Head>
        <title>Dhanusha Coaching - Empowering Education in Nepal | Online & Physical Classes</title>
        <meta 
          name="description" 
          content="Dhanusha Coaching provides quality education through online and physical classes in Nepal. Join us for expert teaching, recorded courses, and personalized learning since 2015." 
        />
        <meta 
          name="keywords" 
          content="Dhanusha Coaching, coaching in Nepal, online classes Nepal, physical classes Janakpur, education Nepal, best coaching center" 
        />
        <meta name="robots" content="index, follow" />
        <meta property="og:title" content="Dhanusha Coaching - Empowering Education in Nepal" />
        <meta 
          property="og:description" 
          content="Quality education through online and physical classes. Expert teachers, recorded courses, and personalized learning." 
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://dhanushacoaching.com" />
        <meta property="og:image" content="/dhanusha.jpg.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Dhanusha Coaching - Empowering Education in Nepal" />
        <meta 
          name="twitter:description" 
          content="Quality education through online and physical classes in Nepal. Join Dhanusha Coaching today!" 
        />
        <link rel="canonical" href="https://dhanushacoaching.com" />
      </Head>

      <section className="relative overflow-hidden min-h-[600px] flex items-center ">
        {/* Background Images - Now Visible */}
        <div className="absolute inset-0">
          {/* Main Background Image */}
          <img
            src="/dhanusha.jpg.png"
            alt="Dhanusha Coaching - Education Center"
            className="absolute inset-0 w-full h-full object-cover"
            
          />

          {/* Secondary Background Images with Reduced Opacity */}
          <img
            src="/hero/hero-2.jpg"
            alt=""
            className="absolute top-0 right-0 w-1/3 h-full object-cover opacity-40 mix-blend-overlay"
            aria-hidden="true"
          />

          <img
            src="/hero/hero-3.jpg"
            alt=""
            className="absolute bottom-0 left-0 w-1/3 h-full object-cover opacity-30 mix-blend-overlay"
            aria-hidden="true"
          />

          {/* Gradient Overlay with Red Theme */}
          <div className="absolute inset-0 bg-gradient-to-r from-red-900/80 via-red-800/70 to-red-900/80" />
          
          {/* Additional Gradient for Better Readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-6xl mx-auto px-4 py-24 text-center text-white">
          {/* Badge */}
          <div className="inline-block bg-red-500/20 backdrop-blur-sm border border-red-400/30 rounded-full px-4 py-1.5 mb-6">
            <span className="text-sm font-medium text-red-200">
              🎓 Est. 2015 • Trusted by 5000+ Students
            </span>
          </div>

          {/* Main Heading */}
          <h1 className="text-4xl md:text-6xl font-bold mb-4 leading-tight">
            Empowering Education
            <span className="block text-red-400">For Every Student</span>
          </h1>

          {/* Subheading */}
          <p className="text-lg md:text-xl text-red-100 max-w-2xl mx-auto mb-8 leading-relaxed">
            Access recorded courses, notes, and notices from expert teachers — 
            available through both <span className="text-red-300 font-semibold">online</span> and <span className="text-red-300 font-semibold">physical</span> classes.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/register"
              className="inline-flex bg-red-600 hover:bg-red-700 text-white font-semibold px-8 py-3.5 rounded-lg transition-all transform hover:scale-105 shadow-lg hover:shadow-red-500/30"
            >
              Get Started Free
            </Link>
            <Link
              href="/user/dashboard"
              className="inline-flex bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white font-semibold px-8 py-3.5 rounded-lg transition-all border border-white/30 hover:border-white/50"
            >
              Explore Courses
            </Link>
          </div>

          {/* Trust Indicators */}
          
        </div>

        {/* Decorative Elements */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-t from-gray-50 to-transparent z-10" />
      </section>
    </>
  );
}