'use client';
import { useState, useEffect } from 'react';

interface Order {
  _id: string;
  status: 'pending' | 'paid' | 'failed';
  amount: number;
  paymentMethod: string;
  createdAt: string;
  paidAt?: string;
  approvedAt?: string;
  user: { name: string; email: string };
  course: { title: string; price: number; thumbnail?: string };
}

export default function AdminPaymentsPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'pending' | 'paid' | 'failed'>('pending');
  const [acting, setActing] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  async function fetchOrders(status: string) {
    setLoading(true);
    const res = await fetch(`/api/admin/pending-orders?status=${status}`);
    const data = await res.json();
    setOrders(data.orders ?? []);
    setLoading(false);
  }

  useEffect(() => { fetchOrders(tab); }, [tab]);

  async function handleAction(orderId: string, action: 'approve' | 'reject') {
    setActing(orderId);
    const res = await fetch('/api/admin/approve-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId, action }),
    });
    const data = await res.json();
    setActing(null);
    setMsg({ text: data.message, ok: res.ok });
    if (res.ok) fetchOrders(tab);
    setTimeout(() => setMsg(null), 4000);
  }

  const tabs: { key: 'pending' | 'paid' | 'failed'; label: string; emoji: string }[] = [
    { key: 'pending', label: 'Pending',  emoji: '⏳' },
    { key: 'paid',    label: 'Approved', emoji: '✅' },
    { key: 'failed',  label: 'Rejected', emoji: '❌' },
  ];

  return (
    <div>
      <h1 className="text-xl sm:text-2xl font-bold text-gray-800 mb-1">Bank Payments</h1>
      <p className="text-gray-500 text-sm mb-5 sm:mb-6">
        Review and approve users who paid via Bank QR transfer.
      </p>

      {/* Flash message */}
      {msg && (
        <div className={`mb-5 text-sm px-4 py-3 rounded-xl border ${msg.ok ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
          {msg.text}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition ${
              tab === t.key ? 'bg-indigo-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-indigo-300'
            }`}
          >
            {t.emoji} {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-28 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">🏦</p>
          <p className="text-sm">No {tab} bank orders.</p>
        </div>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {orders.map(order => (
            <div key={order._id} className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 sm:p-5">

                {/* Course thumbnail */}
                <div className="shrink-0">
                  {order.course?.thumbnail ? (
                    <img src={order.course.thumbnail} alt={order.course.title} className="w-full sm:w-20 h-24 sm:h-14 object-cover rounded-lg" />
                  ) : (
                    <div className="w-full sm:w-20 h-14 bg-indigo-50 rounded-lg flex items-center justify-center text-2xl">📚</div>
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-start justify-between gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900 text-sm sm:text-base line-clamp-1">
                      {order.course?.title ?? 'Unknown Course'}
                    </h3>
                    <span className="text-base font-bold text-indigo-600 shrink-0">
                      Rs. {order.amount}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-600 mb-0.5">
                    👤 {order.user?.name} — <span className="text-gray-400">{order.user?.email}</span>
                  </p>
                  <p className="text-xs text-gray-400">
                    Submitted: {new Date(order.createdAt).toLocaleString()}
                    {order.paidAt && ` · Approved: ${new Date(order.paidAt).toLocaleString()}`}
                  </p>
                </div>

                {/* Actions */}
                {tab === 'pending' && (
                  <div className="flex gap-2 sm:flex-col shrink-0">
                    <button
                      onClick={() => handleAction(order._id, 'approve')}
                      disabled={acting === order._id}
                      className="flex-1 sm:flex-none bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white text-xs sm:text-sm font-semibold px-4 py-2.5 rounded-lg transition"
                    >
                      {acting === order._id ? '...' : '✓ Approve'}
                    </button>
                    <button
                      onClick={() => handleAction(order._id, 'reject')}
                      disabled={acting === order._id}
                      className="flex-1 sm:flex-none bg-red-50 hover:bg-red-100 disabled:opacity-60 text-red-600 text-xs sm:text-sm font-semibold px-4 py-2.5 rounded-lg border border-red-200 transition"
                    >
                      {acting === order._id ? '...' : '✗ Reject'}
                    </button>
                  </div>
                )}

                {tab === 'paid' && (
                  <span className="shrink-0 text-xs font-medium bg-green-100 text-green-700 px-3 py-1.5 rounded-full">
                    ✅ Approved
                  </span>
                )}

                {tab === 'failed' && (
                  <span className="shrink-0 text-xs font-medium bg-red-100 text-red-700 px-3 py-1.5 rounded-full">
                    ❌ Rejected
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}