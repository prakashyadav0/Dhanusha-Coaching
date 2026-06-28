'use client';
import { useState, useEffect } from 'react';

interface User {
  _id: string;
  name: string;
  email: string;
  number: string;
  role: 'admin' | 'team member' | 'user';
  isActive: boolean;
  createdAt: string;
  purchasedCourses: string[];
}

interface Course {
  _id: string;
  title: string;
  price: number;
}

interface ManualEnrollment {
  _id: string;
  course: { title: string };
  amount: number;
  status: 'pending' | 'paid' | 'failed' | 'refunded';
  grantNote: string;
  grantedBy: { name: string };
  refundedBy?: { name: string };
  refundedAt?: string;
  createdAt: string;
}

const roleBadge: Record<string, string> = {
  admin:         'bg-red-100 text-red-700',
  'team member': 'bg-amber-100 text-amber-700',
  user:          'bg-indigo-100 text-indigo-700',
};

// ── CSV download ──────────────────────────────────────────────────────────────
function downloadCSV(users: User[], filename: string) {
  const headers = ['Name', 'Email', 'Mobile', 'Role', 'Status', 'Joined'];
  const rows = users.map(u => [
    `"${u.name.replace(/"/g, '""')}"`,
    `"${u.email}"`,
    `"${u.number ?? ''}"`,
    u.role,
    u.isActive ? 'Active' : 'Inactive',
    new Date(u.createdAt).toLocaleDateString(),
  ]);
  const csv  = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

// ── PDF download ──────────────────────────────────────────────────────────────
function downloadPDF(users: User[], title: string) {
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>${title}</title>
  <style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:Arial,sans-serif;font-size:12px;color:#111;padding:32px}
  h1{font-size:18px;margin-bottom:4px}p{color:#666;margin-bottom:20px;font-size:11px}
  table{width:100%;border-collapse:collapse}th{background:#4F46E5;color:#fff;text-align:left;padding:8px 10px;font-size:11px;text-transform:uppercase;letter-spacing:.05em}
  td{padding:7px 10px;border-bottom:1px solid #e5e7eb;font-size:12px}tr:nth-child(even) td{background:#f9fafb}
  .badge{display:inline-block;padding:2px 8px;border-radius:99px;font-size:10px;font-weight:600}
  .active{background:#dcfce7;color:#15803d}.inactive{background:#fee2e2;color:#b91c1c}
  .admin{background:#fee2e2;color:#b91c1c}.team-member{background:#fef3c7;color:#92400e}.user{background:#e0e7ff;color:#3730a3}
  footer{margin-top:24px;font-size:10px;color:#9ca3af;text-align:center}</style></head>
  <body><h1>EduNepal — ${title}</h1>
  <p>Generated ${new Date().toLocaleString()} &nbsp;·&nbsp; ${users.length} user${users.length !== 1 ? 's' : ''}</p>
  <table><thead><tr><th>Name</th><th>Email</th><th>Mobile</th><th>Role</th><th>Status</th><th>Joined</th></tr></thead>
  <tbody>${users.map(u => `<tr><td>${u.name}</td><td>${u.email}</td><td>${u.number ?? '—'}</td>
  <td><span class="badge ${u.role.replace(/ /g,'-')}">${u.role}</span></td>
  <td><span class="badge ${u.isActive ? 'active' : 'inactive'}">${u.isActive ? 'Active' : 'Inactive'}</span></td>
  <td>${new Date(u.createdAt).toLocaleDateString()}</td></tr>`).join('')}</tbody></table>
  <footer>EduNepal User Report &nbsp;·&nbsp; Confidential</footer>
  <script>window.onload=()=>{window.print();window.onafterprint=()=>window.close()}</script>
  </body></html>`;
  const win = window.open('', '_blank', 'width=900,height=700');
  if (!win) { alert('Allow pop-ups to download PDF.'); return; }
  win.document.write(html); win.document.close();
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function AdminUsersPage() {
  const [users,   setUsers]   = useState<User[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter]  = useState('all');
  const [search,  setSearch]  = useState('');
  const [msg,     setMsg]     = useState<{ text: string; ok: boolean } | null>(null);

  // Enroll modal state
  const [enrollUser,   setEnrollUser]   = useState<User | null>(null);
  const [enrollCourse, setEnrollCourse] = useState('');
  const [enrollNote,   setEnrollNote]   = useState('');
  const [enrollPrice,  setEnrollPrice]  = useState('0');
  const [enrollSaving, setEnrollSaving] = useState(false);

  // Disenroll (revoke) state — tracks which courseId is currently being revoked
  const [disenrolling, setDisenrolling] = useState<string | null>(null);

  // Manual enrollment history modal
  const [historyUser,   setHistoryUser]   = useState<User | null>(null);
  const [enrollHistory, setEnrollHistory] = useState<ManualEnrollment[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  async function fetchUsers() {
    setLoading(true);
    const q   = filter === 'all' ? '' : `?role=${encodeURIComponent(filter)}`;
    const res = await fetch(`/api/users${q}`);
    const d   = await res.json();
    setUsers(d.users ?? []);
    setLoading(false);
  }

  useEffect(() => { fetchUsers(); }, [filter]);

  useEffect(() => {
    fetch('/api/courses?all=true')
      .then(r => r.json())
      .then(d => setCourses(d.courses ?? []));
  }, []);

  function flash(text: string, ok: boolean) {
    setMsg({ text, ok });
    setTimeout(() => setMsg(null), 4000);
  }

  async function updateUser(userId: string, patch: { role?: string; isActive?: boolean }) {
    const res = await fetch('/api/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, ...patch }),
    });
    if (res.ok) { flash('User updated!', true); fetchUsers(); }
    else { const d = await res.json(); flash(d.message, false); }
  }

  async function handleEnroll(e: React.FormEvent) {
    e.preventDefault();
    if (!enrollUser || !enrollCourse) return;
    setEnrollSaving(true);
    const priceNum = Number(enrollPrice);
    const safePrice = Number.isFinite(priceNum) && priceNum > 0 ? priceNum : 0;
    const res = await fetch('/api/admin/enroll-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: enrollUser._id,
        courseId: enrollCourse,
        note: enrollNote,
        price: safePrice,
      }),
    });
    const d = await res.json();
    setEnrollSaving(false);
    if (res.ok) {
      flash(d.message, true);
      setEnrollUser(null);
      setEnrollCourse('');
      setEnrollNote('');
      setEnrollPrice('0');
      fetchUsers();
    } else {
      flash(d.message, false);
    }
  }

  async function handleDisenroll(user: User, course: Course) {
    if (!window.confirm(`Remove ${user.name}'s access to "${course.title}"? This revokes access immediately.`)) {
      return;
    }
    setDisenrolling(course._id);
    const res = await fetch('/api/admin/disenroll-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user._id, courseId: course._id }),
    });
    const d = await res.json();
    setDisenrolling(null);
    if (res.ok) {
      flash(d.message, true);
      // Keep the modal open but reflect the updated enrollment state locally
      // so the button flips back to "enroll" without needing a full refetch.
      setEnrollUser(prev =>
        prev && prev._id === user._id
          ? { ...prev, purchasedCourses: prev.purchasedCourses.filter(id => id !== course._id) }
          : prev
      );
      fetchUsers();
    } else {
      flash(d.message, false);
    }
  }

  async function openHistory(user: User) {
    setHistoryUser(user);
    setHistoryLoading(true);
    setEnrollHistory([]);
    const res = await fetch('/api/admin/enroll-user');
    const d   = await res.json();
    // Filter to only this user's manual enrollments.
    // o.user is populated (lean object) when the order has a valid user ref,
    // or could in theory be a bare ObjectId if population failed — handle both,
    // and always compare as strings since Mongoose ObjectIds aren't === comparable.
    const mine = (d.orders ?? []).filter((o: any) => {
      const orderUserId = o.user?._id ?? o.user;
      return String(orderUserId) === String(user._id);
    });
    setEnrollHistory(mine);
    setHistoryLoading(false);
  }

  // ── FIX: safe search — guard against undefined fields ────────────────────
  const visible = users.filter(u => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (u.name   ?? '').toLowerCase().includes(q) ||
      (u.email  ?? '').toLowerCase().includes(q) ||
      (u.number ?? '').toLowerCase().includes(q)   // ← was crashing when number is undefined
    );
  });

  const filterLabel =
    filter === 'all'         ? 'All Users'    :
    filter === 'user'        ? 'Students'     :
    filter === 'team member' ? 'Team Members' : 'Admins';

  const inputCls = 'w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white';

  function isEnrolled(user: User, courseId: string): boolean {
    return (user.purchasedCourses ?? []).map(String).includes(courseId);
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Users</h1>
        <div className="flex gap-2 shrink-0">
          <button onClick={() => downloadCSV(visible, `EduNepal_${filterLabel.replace(' ','_')}_${new Date().toISOString().slice(0,10)}.csv`)} disabled={visible.length === 0} className="flex items-center gap-1.5 text-sm px-3 py-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition">
            <span>📊</span><span className="hidden sm:inline">Download</span> CSV
          </button>
          <button onClick={() => downloadPDF(visible, `${filterLabel} Report`)} disabled={visible.length === 0} className="flex items-center gap-1.5 text-sm px-3 py-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition">
            <span>📄</span><span className="hidden sm:inline">Download</span> PDF
          </button>
        </div>
      </div>

      {/* Flash */}
      {msg && (
        <div className={`mb-4 text-sm px-4 py-3 rounded-xl border ${msg.ok ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
          {msg.text}
        </div>
      )}

      {/* Filter + Search */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4 sm:mb-5">
        <div className="flex flex-wrap gap-2">
          {[
            { key: 'all',         label: 'All'          },
            { key: 'user',        label: 'Students'     },
            { key: 'team member', label: 'Team Members' },
            { key: 'admin',       label: 'Admins'       },
          ].map(r => (
            <button key={r.key} onClick={() => setFilter(r.key)} className={`px-3 sm:px-4 py-1.5 rounded-full text-sm font-medium transition ${filter === r.key ? 'bg-indigo-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-indigo-300'}`}>
              {r.label}
            </button>
          ))}
        </div>
        <div className="relative sm:ml-auto">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
          <input
            type="text"
            placeholder="Search name, email or mobile…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full sm:w-64 pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
          />
        </div>
      </div>

      {!loading && (
        <p className="text-xs text-gray-400 mb-3">
          Showing <span className="font-semibold text-gray-600">{visible.length}</span> of{' '}
          <span className="font-semibold text-gray-600">{users.length}</span> users
        </p>
      )}

      {/* Content */}
      {loading ? (
        <div className="space-y-3">{[1,2,3,4,5].map(i => <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />)}</div>
      ) : visible.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-2">👥</p>
          <p className="text-sm">{search ? 'No users match your search.' : 'No users found.'}</p>
        </div>
      ) : (
        <>
          {/* Mobile cards */}
          <div className="sm:hidden space-y-3">
            {visible.map(u => (
              <div key={u._id} className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
                <div className="flex items-start justify-between mb-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 text-sm">{u.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5 break-all">{u.email}</p>
                    {u.number && <p className="text-xs text-gray-400 mt-0.5">📱 {u.number}</p>}
                    <p className="text-xs text-gray-300 mt-0.5">Joined {new Date(u.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="flex flex-col gap-1 items-end shrink-0 ml-2">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${roleBadge[u.role]}`}>{u.role}</span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${u.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{u.isActive ? 'Active' : 'Inactive'}</span>
                  </div>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <select value={u.role} onChange={e => updateUser(u._id, { role: e.target.value })} className="flex-1 text-xs border border-gray-200 rounded-lg px-2 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-400 bg-white">
                    <option value="user">Student</option>
                    <option value="team member">Team Member</option>
                    <option value="admin">Admin</option>
                  </select>
                  <button onClick={() => updateUser(u._id, { isActive: !u.isActive })} className={`text-xs px-3 py-2 rounded-lg border transition ${u.isActive ? 'border-red-200 text-red-600 hover:bg-red-50' : 'border-green-200 text-green-600 hover:bg-green-50'}`}>
                    {u.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                  <button onClick={() => { setEnrollUser(u); setEnrollCourse(''); setEnrollNote(''); setEnrollPrice('0'); }} className="text-xs px-3 py-2 rounded-lg border border-indigo-200 text-indigo-600 hover:bg-indigo-50 transition font-medium">
                    🎓 Enroll
                  </button>
                  <button onClick={() => openHistory(u)} className="text-xs px-3 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition">
                    📋 History
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop table */}
          <div className="hidden sm:block bg-white rounded-xl border border-gray-100 shadow-sm overflow-x-auto">
            <table className="w-full text-sm min-w-[860px]">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
                <tr>
                  <th className="px-5 py-3 text-left">Name</th>
                  <th className="px-5 py-3 text-left">Email</th>
                  <th className="px-5 py-3 text-left">Mobile</th>
                  <th className="px-5 py-3 text-left">Role</th>
                  <th className="px-5 py-3 text-left">Status</th>
                  <th className="px-5 py-3 text-left">Joined</th>
                  <th className="px-5 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {visible.map(u => (
                  <tr key={u._id} className="hover:bg-gray-50">
                    <td className="px-5 py-3 font-medium text-gray-900">{u.name}</td>
                    <td className="px-5 py-3 text-gray-500">{u.email}</td>
                    <td className="px-5 py-3 text-gray-500">{u.number ?? '—'}</td>
                    <td className="px-5 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${roleBadge[u.role]}`}>{u.role}</span></td>
                    <td className="px-5 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${u.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{u.isActive ? 'Active' : 'Inactive'}</span></td>
                    <td className="px-5 py-3 text-gray-400">{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td className="px-5 py-3">
                      <div className="flex gap-2">
                        <select value={u.role} onChange={e => updateUser(u._id, { role: e.target.value })} className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-400">
                          <option value="user">Student</option>
                          <option value="team member">Team Member</option>
                          <option value="admin">Admin</option>
                        </select>
                        <button onClick={() => updateUser(u._id, { isActive: !u.isActive })} className={`text-xs px-3 py-1.5 rounded-lg border transition ${u.isActive ? 'border-red-200 text-red-600 hover:bg-red-50' : 'border-green-200 text-green-600 hover:bg-green-50'}`}>
                          {u.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                        <button onClick={() => { setEnrollUser(u); setEnrollCourse(''); setEnrollNote(''); setEnrollPrice('0'); }} className="text-xs px-3 py-1.5 rounded-lg border border-indigo-200 text-indigo-600 hover:bg-indigo-50 transition font-medium">
                          🎓 Enroll
                        </button>
                        <button onClick={() => openHistory(u)} className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition">
                          📋 History
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ── Enroll Modal ──────────────────────────────────────────────────── */}
      {enrollUser && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 px-0 sm:px-4">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-100">
              <div>
                <h2 className="text-base font-bold text-gray-900">Enroll in Course</h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Manage access for{' '}
                  <span className="font-semibold text-indigo-600">{enrollUser.name}</span>
                </p>
              </div>
              <button onClick={() => setEnrollUser(null)} className="w-9 h-9 flex items-center justify-center rounded-xl text-gray-400 hover:bg-gray-100 transition text-xl">×</button>
            </div>

            <form onSubmit={handleEnroll} className="p-5 space-y-4">
              {/* User info banner */}
              <div className="bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-3 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-indigo-200 text-indigo-700 flex items-center justify-center font-bold text-sm shrink-0">
                  {enrollUser.name[0].toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{enrollUser.name}</p>
                  <p className="text-xs text-gray-500 truncate">{enrollUser.email}</p>
                </div>
              </div>

              {/* Course list with enrolled status + disenroll */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Course</label>
                <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                  {courses.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-4">No courses available.</p>
                  ) : courses.map(c => {
                    const enrolled = isEnrolled(enrollUser, c._id);
                    const selected = enrollCourse === c._id;
                    const isRevoking = disenrolling === c._id;
                    return (
                      <div
                        key={c._id}
                        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 text-sm transition text-left
                          ${enrolled
                            ? 'border-green-200 bg-green-50'
                            : selected
                            ? 'border-indigo-500 bg-indigo-50'
                            : 'border-gray-200 hover:border-indigo-300 bg-white'
                          }`}
                      >
                        <button
                          type="button"
                          disabled={enrolled}
                          onClick={() => !enrolled && setEnrollCourse(c._id)}
                          className="flex-1 min-w-0 text-left disabled:cursor-not-allowed"
                        >
                          <p className={`font-medium truncate ${enrolled ? 'text-green-700' : selected ? 'text-indigo-700' : 'text-gray-800'}`}>
                            {c.title}
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {c.price === 0 ? 'Free' : `Rs. ${c.price}`}
                          </p>
                        </button>

                        {enrolled ? (
                          <div className="flex items-center gap-2 shrink-0 ml-3">
                            <span className="flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-100 px-2.5 py-1 rounded-full">
                              ✓ Enrolled
                            </span>
                            <button
                              type="button"
                              disabled={isRevoking}
                              onClick={() => handleDisenroll(enrollUser, c)}
                              className="text-xs font-semibold text-red-600 bg-red-50 border border-red-200 px-2.5 py-1 rounded-full hover:bg-red-100 transition disabled:opacity-50"
                            >
                              {isRevoking ? '…' : 'Disenroll'}
                            </button>
                          </div>
                        ) : selected ? (
                          <span className="shrink-0 ml-3 w-5 h-5 rounded-full border-2 border-indigo-500 bg-indigo-500 flex items-center justify-center">
                            <span className="text-white text-xs">✓</span>
                          </span>
                        ) : (
                          <span className="shrink-0 ml-3 w-5 h-5 rounded-full border-2 border-gray-300" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Price */}
              <input
  type="number"
  className={`${inputCls} [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none`}
  min={0}
  step="any"
  value={enrollPrice}
  onChange={(e) => setEnrollPrice(e.target.value)}
  placeholder="0"
/>

              {/* Grant note */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reason <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  value={enrollNote}
                  onChange={e => setEnrollNote(e.target.value)}
                  className={inputCls}
                  placeholder="e.g. Scholarship, Offline cash, Staff access…"
                />
              </div>

              {/* Info note */}
              <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 text-xs text-amber-700">
                {Number(enrollPrice) > 0 ? (
                  <>💰 This grants <strong>{enrollUser.name}</strong> access and records an order for <strong>Rs. {enrollPrice}</strong>, which is included in revenue. The reason will be saved in enrollment history.</>
                ) : (
                  <>💡 This grants <strong>{enrollUser.name}</strong> immediate access at <strong>no charge</strong>. The reason will be saved in enrollment history.</>
                )}
              </div>

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setEnrollUser(null)} className="flex-1 px-4 py-3 text-sm text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition">
                  Cancel
                </button>
                <button type="submit" disabled={enrollSaving || !enrollCourse} className="flex-1 px-4 py-3 text-sm text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 disabled:opacity-60 transition font-semibold">
                  {enrollSaving ? 'Enrolling…' : '🎓 Grant Access'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Enrollment History Modal ──────────────────────────────────────── */}
      {historyUser && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 px-0 sm:px-4">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-100">
              <div>
                <h2 className="text-base font-bold text-gray-900">Manual Enrollment History</h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Free access granted to <span className="font-semibold text-indigo-600">{historyUser.name}</span>
                </p>
              </div>
              <button onClick={() => setHistoryUser(null)} className="w-9 h-9 flex items-center justify-center rounded-xl text-gray-400 hover:bg-gray-100 transition text-xl">×</button>
            </div>

            <div className="p-5">
              {historyLoading ? (
                <div className="space-y-3">
                  {[1,2,3].map(i => <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />)}
                </div>
              ) : enrollHistory.length === 0 ? (
                <div className="text-center py-10 text-gray-400">
                  <p className="text-3xl mb-2">📋</p>
                  <p className="text-sm">No manual enrollments for this user.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {enrollHistory.map((e) => {
                    const isRefunded = e.status === 'refunded';
                    return (
                      <div key={e._id} className={`border rounded-xl p-4 ${isRefunded ? 'bg-red-50 border-red-100' : 'bg-gray-50 border-gray-100'}`}>
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="font-semibold text-gray-900 text-sm truncate">
                              📚 {e.course?.title ?? 'Unknown Course'}
                            </p>
                            {/* ── Reason displayed here ── */}
                            {e.grantNote ? (
                              <div className="mt-1.5 flex items-start gap-1.5">
                                <span className="text-xs text-gray-400 shrink-0">Reason:</span>
                                <span className="text-xs text-indigo-700 font-medium bg-indigo-50 px-2 py-0.5 rounded-full">
                                  {e.grantNote}
                                </span>
                              </div>
                            ) : (
                              <p className="text-xs text-gray-400 mt-1">No reason provided</p>
                            )}
                            <p className="text-xs text-gray-400 mt-1.5">
                              Granted by <span className="font-medium text-gray-600">{e.grantedBy?.name ?? 'Admin'}</span>
                              {' · '}
                              {new Date(e.createdAt).toLocaleString()}
                            </p>
                            {isRefunded && (
                              <p className="text-xs text-red-500 mt-1">
                                Disenrolled by <span className="font-medium text-red-600">{e.refundedBy?.name ?? 'Admin'}</span>
                                {e.refundedAt && <> · {new Date(e.refundedAt).toLocaleString()}</>}
                              </p>
                            )}
                          </div>
                          <div className="flex flex-col items-end gap-1.5 shrink-0">
                            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${e.amount > 0 ? 'text-indigo-700 bg-indigo-100' : 'text-green-700 bg-green-100'}`}>
                              {e.amount > 0 ? `Rs. ${e.amount}` : '✓ Free'}
                            </span>
                            {isRefunded && (
                              <span className="text-xs font-semibold text-red-700 bg-red-100 px-2.5 py-1 rounded-full">
                                Revoked
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}