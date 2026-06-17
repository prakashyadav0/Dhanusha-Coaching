'use client';
import { useState, useEffect } from 'react';

interface Course {
  _id: string;
  title: string;
  description: string;
  thumbnail: string;
  price: number;
  totalVideos: number;
  totalNotes: number;
  teacher: { name: string };
}

interface Notice {
  _id: string;
  title: string;
  body: string;
  isPinned: boolean;
}

type PaymentMethod = 'khalti' | 'esewa' | 'bank';

// ── Bank QR config — put your bank QR image in /public/bank-qr.png ──────────
const BANK_NAME    = 'Nepal Investment Mega Bank';
const BANK_ACCOUNT = '0012345678901';
const BANK_HOLDER  = 'EduNepal Pvt. Ltd.';

export default function UserDashboardPage() {
  const [allCourses,   setAllCourses]   = useState<Course[]>([]);
  const [purchasedIds, setPurchasedIds] = useState<Set<string>>(new Set());
  const [notices,      setNotices]      = useState<Notice[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [msg,          setMsg]          = useState('');

  // Modal state
  const [selectedCourse,   setSelectedCourse]   = useState<Course | null>(null);
  const [paymentMethod,    setPaymentMethod]    = useState<PaymentMethod>('khalti');
  const [paying,           setPaying]           = useState(false);
  const [showQRConfirm,    setShowQRConfirm]    = useState(false);

  // ── Fetch ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    async function fetchAll() {
      try {
        const [coursesRes, purchasedRes, noticesRes] = await Promise.all([
          fetch('/api/courses'),
          fetch('/api/users/purchased-courses'),
          fetch('/api/notices'),
        ]);

        // Parse each response individually — if one fails, the others still work
        const safeJson = async (res: Response, fallback: any) => {
          if (!res.ok) {
            console.error(`API error ${res.status} for ${res.url}`);
            return fallback;
          }
          const text = await res.text();
          try {
            return JSON.parse(text);
          } catch {
            console.error(`Non-JSON response from ${res.url}:`, text.slice(0, 200));
            return fallback;
          }
        };

        const [c, p, n] = await Promise.all([
          safeJson(coursesRes,   { courses: [] }),
          safeJson(purchasedRes, { courses: [] }),
          safeJson(noticesRes,   { notices: [] }),
        ]);

        setAllCourses(c.courses ?? []);
        setPurchasedIds(new Set((p.courses ?? []).map((x: Course) => x._id)));
        setNotices(n.notices ?? []);
      } catch (e) {
        console.error('Dashboard fetch error:', e);
      } finally {
        setLoading(false);
      }
    }
    fetchAll();
  }, []);

  // ── Payment handler ───────────────────────────────────────────────────────
  async function handlePay() {
    if (!selectedCourse) return;
    setPaying(true);
    setMsg('');

    try {
      // Free course
      if (selectedCourse.price === 0) {
        const res  = await fetch('/api/payment/initiate', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ courseId: selectedCourse._id, method: 'free' }),
        });
        const data = await res.json();
        if (res.ok) {
          setPurchasedIds(prev => new Set([...prev, selectedCourse._id]));
          setMsg(`✓ Enrolled in "${selectedCourse.title}"!`);
          setSelectedCourse(null);
          window.dispatchEvent(new Event('course:purchased'));
        } else {
          setMsg(data.message || 'Something went wrong.');
        }
        return;
      }

      // Bank QR — show confirm step
      if (paymentMethod === 'bank') {
        setShowQRConfirm(true);
        return;
      }

      // Khalti or eSewa
      const res  = await fetch('/api/payment/initiate', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ courseId: selectedCourse._id, method: paymentMethod }),
      });
      const data = await res.json();

      if (data.payment_url) {
        window.location.href = data.payment_url;
      } else {
        setMsg(data.message || 'Payment initiation failed.');
      }
    } catch {
      setMsg('Network error. Please try again.');
    } finally {
      setPaying(false);
    }
  }

  // ── Bank QR manual confirm ────────────────────────────────────────────────
  async function handleBankConfirm() {
    if (!selectedCourse) return;
    setPaying(true);
    try {
      const res  = await fetch('/api/payment/initiate', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ courseId: selectedCourse._id, method: 'bank' }),
      });
      const data = await res.json();
      if (res.ok) {
        setShowQRConfirm(false);
        setSelectedCourse(null);
        setMsg('✓ Payment submitted! Access will be granted after manual verification (within 24hrs).');
      } else {
        setMsg(data.message || 'Error submitting bank payment.');
      }
    } catch {
      setMsg('Network error.');
    } finally {
      setPaying(false);
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {[1,2,3,4,5,6].map(i => (
          <div key={i} className="h-64 bg-gray-100 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  const myCourses      = allCourses.filter(c =>  purchasedIds.has(c._id));
  const lockedCourses  = allCourses.filter(c => !purchasedIds.has(c._id));

  return (
    <div className="pb-8">
      <h1 className="text-xl sm:text-2xl font-bold text-gray-800 mb-1">My Dashboard</h1>
      <p className="text-gray-500 text-sm mb-6">Manage your courses and learning progress.</p>

      {/* Flash message */}
      {msg && (
        <div className="mb-5 bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-xl">
          {msg}
        </div>
      )}

      {/* Notices */}
      {notices.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">📢 Notices</h2>
          <div className="space-y-2">
            {notices.map(n => (
              <div key={n._id} className={`rounded-xl px-4 py-3 border text-sm ${n.isPinned ? 'bg-amber-50 border-amber-200' : 'bg-white border-gray-100'}`}>
                <p className="font-semibold text-gray-800">{n.title}</p>
                <p className="text-gray-600 mt-0.5">{n.body}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* My Courses */}
      {myCourses.length > 0 && (
        <div className="mb-10">
          <h2 className="text-base sm:text-lg font-semibold text-gray-700 mb-4">📚 My Courses</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {myCourses.map(course => (
              <CourseCard
                key={course._id}
                course={course}
                owned={true}
                onDetails={() => {}}
              />
            ))}
          </div>
        </div>
      )}

      {/* Available Courses */}
      {lockedCourses.length > 0 && (
        <div>
          <h2 className="text-base sm:text-lg font-semibold text-gray-700 mb-4">🛒 Available Courses</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {lockedCourses.map(course => (
              <CourseCard
                key={course._id}
                course={course}
                owned={false}
                onDetails={() => {
                  setSelectedCourse(course);
                  setPaymentMethod('khalti');
                  setShowQRConfirm(false);
                  setMsg('');
                }}
              />
            ))}
          </div>
        </div>
      )}

      {allCourses.length === 0 && (
        <div className="text-center py-20 text-gray-400">
          <p className="text-5xl mb-3">📚</p>
          <p>No courses available yet.</p>
        </div>
      )}

      {/* ── Course Detail + Payment Modal ──────────────────────────────── */}
      {selectedCourse && !showQRConfirm && (
        <Modal onClose={() => setSelectedCourse(null)}>
          <div className="flex flex-col sm:flex-row gap-5">

            {/* Left: course details */}
            <div className="sm:w-64 shrink-0">
              {selectedCourse.thumbnail ? (
                <img src={selectedCourse.thumbnail} alt={selectedCourse.title} className="w-full h-40 object-cover rounded-xl" />
              ) : (
                <div className="w-full h-40 bg-indigo-50 rounded-xl flex items-center justify-center text-5xl">📚</div>
              )}
              <div className="mt-4 space-y-2">
                <InfoRow icon="👨‍🏫" label="Teacher"   value={selectedCourse.teacher?.name ?? '—'} />
                <InfoRow icon="▶"     label="Videos"    value={`${selectedCourse.totalVideos} lessons`} />
                <InfoRow icon="📝"    label="Notes"     value={`${selectedCourse.totalNotes} files`} />
                <InfoRow icon="💰"    label="Price"     value={selectedCourse.price === 0 ? 'Free' : `Rs. ${selectedCourse.price}`} highlight />
              </div>
            </div>

            {/* Right: description + payment */}
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-bold text-gray-900 mb-2 leading-snug">
                {selectedCourse.title}
              </h2>
              <p className="text-sm text-gray-600 mb-5 leading-relaxed">
                {selectedCourse.description}
              </p>

              {selectedCourse.price === 0 ? (
                /* Free enroll */
                <button
                  onClick={handlePay}
                  disabled={paying}
                  className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition"
                >
                  {paying ? 'Enrolling...' : '✓ Enroll for Free'}
                </button>
              ) : (
                /* Payment method picker */
                <>
                  <p className="text-sm font-semibold text-gray-700 mb-3">Choose payment method</p>
                  <div className="grid grid-cols-3 gap-2 mb-5">
                         <PayMethodBtn
                        label="Khalti"
                        logo="/Khalti.svg"
                        selected={paymentMethod === 'khalti'}
                        onClick={() => setPaymentMethod('khalti')}
                      />

                      <PayMethodBtn
                        label="eSewa"
                        logo="/esewa.svg"
                        selected={paymentMethod === 'esewa'}
                        onClick={() => setPaymentMethod('esewa')}
                      />

                      <PayMethodBtn
                        label="Bank QR"
                        logo="/bank.svg"
                        selected={paymentMethod === 'bank'}
                        onClick={() => setPaymentMethod('bank')}
                      />
                  </div>

                  {paymentMethod === 'bank' && (
                    <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 mb-4  text-gray-700">
                       Scan the QR on the next step. Access will be granted after manual verification within 24 hours.
                    </div>
                  )}

                  <button
                    onClick={handlePay}
                    disabled={paying}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition"
                  >
                    {paying
                      ? 'Processing...'
                      : paymentMethod === 'khalti'
                      ? '💜 Pay with Khalti'
                      : paymentMethod === 'esewa'
                      ? '💚 Pay with eSewa'
                      : '🏦 View Bank QR'}
                  </button>
                </>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* ── Bank QR Modal ────────────────────────────────────────────────── */}
      {selectedCourse && showQRConfirm && (
        <Modal onClose={() => { setShowQRConfirm(false); setSelectedCourse(null); }}>
          <h2 className="text-lg font-bold text-gray-900 mb-1 text-center">Bank Transfer</h2>
          <p className="text-sm text-gray-800 text-center mb-5 text-bold">
            Scan the QR or use the account details below And Kindly Write Your Email in Remarks  then click "I've Paid".
          </p>

          {/* QR image — place your bank QR at /public/bank-qr.png */}
          <div className="flex justify-center mb-5">
            <div className="border-2 border-gray-200 rounded-2xl p-3 bg-white inline-block">
              <img
                src="/bank-qr.png"
                alt="Bank QR Code"
                className="w-48 h-48 object-contain"
                onError={e => {
                  (e.currentTarget as HTMLImageElement).style.display = 'none';
                  (e.currentTarget.nextSibling as HTMLElement).style.display = 'flex';
                }}
              />
              {/* Fallback if image not found */}
              <div className="hidden w-48 h-48 items-center justify-center text-gray-300 text-sm text-center flex-col gap-2">
                <span className="text-4xl">📷</span>
                <span>Add bank-qr.png to /public/</span>
              </div>
            </div>
          </div>

          {/* Bank details */}
          <div className="bg-gray-50 rounded-xl px-4 py-4 mb-5 text-sm space-y-2">
            <BankRow label="Bank"    value={BANK_NAME}    />
            <BankRow label="Account" value={BANK_ACCOUNT} />
            <BankRow label="Name"    value={BANK_HOLDER}  />
            <BankRow label="Amount"  value={`Rs. ${selectedCourse.price}`} highlight />
            <BankRow label="Remark"  value={selectedCourse.title} />
          </div>

          <p className="text-xs text-gray-400 text-center mb-4">
            After payment, click the button below. Our team will verify and grant access within 24 hours.
            if Any Trouble Contact us at <a href="mob:+977-9817840154" className="text-indigo-600 hover:underline">+977-9817840154</a> or <a href="tel:+977-9844162947" className="text-indigo-600 hover:underline">+977-9844162947</a>
          </p>

          <div className="flex gap-3">
            <button
              onClick={() => { setShowQRConfirm(false); }}
              className="flex-1 bg-gray-100 text-gray-700 font-medium py-3 rounded-xl hover:bg-gray-200 transition text-sm"
            >
              ← Back
            </button>
            <button
              onClick={handleBankConfirm}
              disabled={paying}
              className="flex-1 bg-indigo-600 text-white font-semibold py-3 rounded-xl hover:bg-indigo-700 disabled:opacity-60 transition text-sm"
            >
              {paying ? 'Submitting...' : "✓ I've Paid"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function CourseCard({
  course,
  owned,
  onDetails,
}: {
  course: Course;
  owned: boolean;
  onDetails: () => void;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex flex-col hover:shadow-md transition">
      {course.thumbnail ? (
        <img src={course.thumbnail} alt={course.title} className="w-full h-40 object-cover" />
      ) : (
        <div className="w-full h-40 bg-indigo-50 flex items-center justify-center text-5xl">📚</div>
      )}

      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-semibold text-gray-900 text-sm sm:text-base mb-1 line-clamp-2">
          {course.title}
        </h3>
        <p className="text-xs text-gray-400 mb-1">By {course.teacher?.name ?? '—'}</p>
        <p className="text-xs text-gray-400 mb-3">
          {course.totalVideos} videos · {course.totalNotes} notes
        </p>

        <div className="mt-auto">
          {owned ? (
            <>
              <span className="text-xs font-medium bg-green-100 text-green-700 px-2 py-0.5 rounded-full mb-3 inline-block">
                ✓ Enrolled
              </span>
              <div className="flex gap-2 flex-wrap">
                <a href={`/user/courses/${course._id}/videos`}   className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 transition">▶ Videos</a>
                <a href={`/user/courses/${course._id}/notes`}    className="text-xs border border-amber-200 text-amber-700 px-3 py-1.5 rounded-lg hover:bg-amber-50 transition">📝 Notes</a>
                <a href={`/user/courses/${course._id}/notices`}  className="text-xs border border-gray-200 text-gray-600 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition">📢 Notices</a>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-between">
              <span className="text-base font-bold text-indigo-600">
                {course.price === 0 ? 'Free' : `Rs. ${course.price}`}
              </span>
              <button
                onClick={onDetails}
                className="bg-indigo-600 text-white text-xs font-medium px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
              >
                View & Buy
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white z-10 flex justify-end px-5 pt-4">
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
        </div>
        <div className="px-5 pb-6">{children}</div>
      </div>
    </div>
  );
}

function InfoRow({ icon, label, value, highlight }: { icon: string; label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span>{icon}</span>
      <span className="text-gray-500 w-14 shrink-0">{label}</span>
      <span className={`font-medium ${highlight ? 'text-indigo-600 text-base' : 'text-gray-800'}`}>
        {value}
      </span>
    </div>
  );
}

function PayMethodBtn({
  label,
  logo,
  selected,
  onClick,
}: {
  label: string;
  logo: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-2 px-2 py-3 rounded-xl border-2 text-xs font-medium transition ${
        selected
          ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
          : 'border-gray-200 text-gray-600 hover:border-gray-300'
      }`}
    >
      <img
        src={logo}
        alt={label}
        className="h-8 w-auto object-contain"
      />
      <span>{label}</span>
    </button>
  );
}

function BankRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-gray-500">{label}</span>
      <span className={`font-medium ${highlight ? 'text-indigo-600' : 'text-gray-800'}`}>{value}</span>
    </div>
  );
}