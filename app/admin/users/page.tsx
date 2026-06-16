'use client';
import { useState, useEffect } from 'react';

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

const roleBadge: Record<string, string> = {
  admin: 'bg-red-100 text-red-700',
  teacher: 'bg-amber-100 text-amber-700',
  user: 'bg-indigo-100 text-indigo-700',
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [msg, setMsg] = useState('');

  async function fetchUsers() {
    const q = filter === 'all' ? '' : `?role=${filter}`;
    const res = await fetch(`/api/users${q}`);
    const data = await res.json();
    setUsers(data.users);
    setLoading(false);
  }

  useEffect(() => { fetchUsers(); }, [filter]);

  async function updateUser(userId: string, patch: { role?: string; isActive?: boolean }) {
    const res = await fetch('/api/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, ...patch }),
    });
    if (res.ok) { setMsg('User updated!'); fetchUsers(); }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Users</h1>
      {msg && <div className="mb-4 bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-lg">{msg}</div>}

      {/* Filter */}
      <div className="flex gap-2 mb-6">
        {['all', 'user', 'teacher', 'admin'].map((r) => (
          <button key={r} onClick={() => setFilter(r)} className={`px-4 py-1.5 rounded-full text-sm font-medium transition capitalize ${filter === r ? 'bg-indigo-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-indigo-300'}`}>
            {r}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-gray-400 text-sm">Loading...</p>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
              <tr>
                <th className="px-5 py-3 text-left">Name</th>
                <th className="px-5 py-3 text-left">Email</th>
                <th className="px-5 py-3 text-left">Role</th>
                <th className="px-5 py-3 text-left">Status</th>
                <th className="px-5 py-3 text-left">Joined</th>
                <th className="px-5 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {users.map((u) => (
                <tr key={u._id} className="hover:bg-gray-50">
                  <td className="px-5 py-3 font-medium text-gray-900">{u.name}</td>
                  <td className="px-5 py-3 text-gray-500">{u.email}</td>
                  <td className="px-5 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${roleBadge[u.role]}`}>{u.role}</span>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${u.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {u.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-gray-400">{new Date(u.createdAt).toLocaleDateString()}</td>
                  <td className="px-5 py-3">
                    <div className="flex gap-2">
                      <select
                        value={u.role}
                        onChange={e => updateUser(u._id, { role: e.target.value })}
                        className="text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                      >
                        <option value="user">User</option>
                        <option value="teacher">Teacher</option>
                        <option value="admin">Admin</option>
                      </select>
                      <button
                        onClick={() => updateUser(u._id, { isActive: !u.isActive })}
                        className={`text-xs px-2 py-1 rounded border transition ${u.isActive ? 'border-red-200 text-red-600 hover:bg-red-50' : 'border-green-200 text-green-600 hover:bg-green-50'}`}
                      >
                        {u.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {users.length === 0 && <p className="text-center text-gray-400 text-sm py-10">No users found.</p>}
        </div>
      )}
    </div>
  );
}