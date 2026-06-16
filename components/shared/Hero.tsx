import Link from 'next/link';

export default function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* Background Images */}
      <div className="absolute inset-0">
        <img
          src="/hero-1.png"
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />

        <img
          src="/hero/hero-2.jpg"
          alt=""
          className="absolute top-0 right-0 w-1/3 h-full object-cover opacity-30"
        />

        <img
          src="/hero/hero-3.jpg"
          alt=""
          className="absolute bottom-0 left-0 w-1/3 h-full object-cover opacity-20"
        />

        {/* Overlay */}
        <div className="absolute inset-0 bg-indigo-900/70" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 py-24 text-center text-white">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          Learn Anything, Anytime
        </h1>

        <p className="text-indigo-100 text-lg max-w-2xl mx-auto mb-8">
          Access recorded courses, notes, and notices from expert teachers —
          all in one place.
        </p>

        <Link
          href="/register"
          className="inline-flex bg-white text-indigo-600 font-semibold px-6 py-3 rounded-lg hover:bg-indigo-50 transition"
        >
          Get Started Free
        </Link>
      </div>
    </section>
  );
}