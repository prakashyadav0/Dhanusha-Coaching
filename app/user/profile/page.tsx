'use client';
import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';

interface Profile {
  name:   string;
  email:  string;
  number: string;
}

export default function UserProfilePage() {
  const { data: session, update: updateSession } = useSession();

  const [profile,  setProfile]  = useState<Profile | null>(null);
  const [loading,  setLoading]  = useState(true);

  // Profile form
  const [name,     setName]     = useState('');
  const [number,   setNumber]   = useState('');
  const [savingP,  setSavingP]  = useState(false);
  const [msgP,     setMsgP]     = useState<{ text: string; ok: boolean } | null>(null);

  // Password form
  const [oldPwd,   setOldPwd]   = useState('');
  const [newPwd,   setNewPwd]   = useState('');
  const [confPwd,  setConfPwd]  = useState('');
  const [savingW,  setSavingW]  = useState(false);
  const [msgW,     setMsgW]     = useState<{ text: string; ok: boolean } | null>(null);
  const [showOld,  setShowOld]  = useState(false);
  const [showNew,  setShowNew]  = useState(false);
  const [showConf, setShowConf] = useState(false);

  // Load profile
  useEffect(() => {
    fetch('/api/users/profile')
      .then(r => r.json())
      .then(d => {
        setProfile(d.user);
        setName(d.user?.name   ?? '');
        setNumber(d.user?.number ?? '');
        setLoading(false);
      });
  }, []);

  function flashP(text: string, ok: boolean) {
    setMsgP({ text, ok });
    setTimeout(() => setMsgP(null), 4000);
  }

  function flashW(text: string, ok: boolean) {
    setMsgW({ text, ok });
    setTimeout(() => setMsgW(null), 4000);
  }

  // Update name + number
  async function handleProfileSave(e: React.FormEvent) {
    e.preventDefault();
    setSavingP(true);
    const res = await fetch('/api/users/profile', {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ name, number }),
    });
    const d = await res.json();
    setSavingP(false);
    if (res.ok) {
      flashP(d.message, true);
      setProfile(d.user);
      // Update the name shown in the NextAuth session / sidebar
      await updateSession({ name });
    } else {
      flashP(d.message, false);
    }
  }

  // Change password
  async function handlePasswordSave(e: React.FormEvent) {
    e.preventDefault();
    if (newPwd !== confPwd) {
      flashW('New passwords do not match', false);
      return;
    }
    if (newPwd.length < 6) {
      flashW('New password must be at least 6 characters', false);
      return;
    }
    setSavingW(true);
    const res = await fetch('/api/users/profile', {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ oldPassword: oldPwd, newPassword: newPwd }),
    });
    const d = await res.json();
    setSavingW(false);
    if (res.ok) {
      flashW(d.message, true);
      setOldPwd(''); setNewPwd(''); setConfPwd('');
    } else {
      flashW(d.message, false);
    }
  }

  const inputCls =
    'w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white';

  const initials = (profile?.name ?? session?.user.name ?? '?')
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="max-w-xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-6 text-sm">
        <Link href="/user/dashboard" className="text-gray-400 hover:text-indigo-600 transition">
          ← Dashboard
        </Link>
        <span className="text-gray-300">/</span>
        <span className="text-gray-600">Profile</span>
      </div>

      {loading ? (
        <div className="space-y-4">
          <div className="h-32 bg-gray-100 rounded-2xl animate-pulse" />
          <div className="h-64 bg-gray-100 rounded-2xl animate-pulse" />
          <div className="h-64 bg-gray-100 rounded-2xl animate-pulse" />
        </div>
      ) : (
        <div className="space-y-5">

          {/* Avatar + identity card */}
          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-2xl font-bold shrink-0">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="font-bold text-gray-900 text-lg truncate">{profile?.name}</p>
              <p className="text-sm text-gray-500 truncate">{profile?.email}</p>
              {profile?.number && (
                <p className="text-sm text-gray-400 mt-0.5">📱 {profile.number}</p>
              )}
              <span className="inline-block mt-1.5 text-xs font-medium bg-indigo-100 text-indigo-700 px-2.5 py-0.5 rounded-full capitalize">
                {session?.user.role}
              </span>
            </div>
          </div>

          {/* Profile info form */}
          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
            <h2 className="text-base font-bold text-gray-800 mb-4">Personal Information</h2>

            {msgP && (
              <div className={`mb-4 text-sm px-4 py-3 rounded-xl border ${
                msgP.ok
                  ? 'bg-green-50 border-green-200 text-green-700'
                  : 'bg-red-50 border-red-200 text-red-700'
              }`}>
                {msgP.text}
              </div>
            )}

            <form onSubmit={handleProfileSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Full Name
                </label>
                <input
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className={inputCls}
                  placeholder="Your full name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Email Address
                </label>
                <input
                  value={profile?.email ?? ''}
                  disabled
                  className={inputCls + ' bg-gray-50 text-gray-400 cursor-not-allowed'}
                />
                <p className="text-xs text-gray-400 mt-1">Email cannot be changed.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Mobile Number
                </label>
                <input
                  type="tel"
                  value={number}
                  onChange={e => setNumber(e.target.value)}
                  className={inputCls}
                  placeholder="e.g. 9800000000"
                />
              </div>

              <button
                type="submit"
                disabled={savingP}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition text-sm"
              >
                {savingP ? 'Saving…' : 'Save Changes'}
              </button>
            </form>
          </div>

          {/* Change password form */}
          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
            <h2 className="text-base font-bold text-gray-800 mb-1">Change Password</h2>
            <p className="text-xs text-gray-400 mb-4">Leave blank if you don't want to change it.</p>

            {msgW && (
              <div className={`mb-4 text-sm px-4 py-3 rounded-xl border ${
                msgW.ok
                  ? 'bg-green-50 border-green-200 text-green-700'
                  : 'bg-red-50 border-red-200 text-red-700'
              }`}>
                {msgW.text}
              </div>
            )}

            <form onSubmit={handlePasswordSave} className="space-y-4">
              {/* Old password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Current Password
                </label>
                <div className="relative">
                  <input
                    type={showOld ? 'text' : 'password'}
                    required
                    value={oldPwd}
                    onChange={e => setOldPwd(e.target.value)}
                    className={inputCls + ' pr-12'}
                    placeholder="Your current password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowOld(o => !o)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs px-1"
                  >
                    {showOld ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              {/* New password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showNew ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={newPwd}
                    onChange={e => setNewPwd(e.target.value)}
                    className={inputCls + ' pr-12'}
                    placeholder="Min. 6 characters"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(o => !o)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs px-1"
                  >
                    {showNew ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              {/* Confirm new password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    type={showConf ? 'text' : 'password'}
                    required
                    value={confPwd}
                    onChange={e => setConfPwd(e.target.value)}
                    className={`${inputCls} pr-12 ${
                      confPwd && newPwd !== confPwd
                        ? 'border-red-300 focus:ring-red-400'
                        : confPwd && newPwd === confPwd
                        ? 'border-green-300 focus:ring-green-400'
                        : ''
                    }`}
                    placeholder="Repeat new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConf(o => !o)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs px-1"
                  >
                    {showConf ? 'Hide' : 'Show'}
                  </button>
                </div>
                {confPwd && newPwd !== confPwd && (
                  <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
                )}
                {confPwd && newPwd === confPwd && newPwd.length >= 6 && (
                  <p className="text-xs text-green-600 mt-1">✓ Passwords match</p>
                )}
              </div>

              {/* Password strength indicator */}
              {newPwd && (
                <div>
                  <div className="flex gap-1 mb-1">
                    {[1,2,3,4].map(i => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded-full transition-colors ${
                          newPwd.length >= i * 3
                            ? newPwd.length < 6
                              ? 'bg-red-400'
                              : newPwd.length < 10
                              ? 'bg-amber-400'
                              : 'bg-green-500'
                            : 'bg-gray-200'
                        }`}
                      />
                    ))}
                  </div>
                  <p className={`text-xs ${
                    newPwd.length < 6
                      ? 'text-red-500'
                      : newPwd.length < 10
                      ? 'text-amber-600'
                      : 'text-green-600'
                  }`}>
                    {newPwd.length < 6
                      ? 'Too short'
                      : newPwd.length < 10
                      ? 'Fair — consider a longer password'
                      : 'Strong password'}
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={savingW || (!!confPwd && newPwd !== confPwd)}
                className="w-full bg-gray-800 hover:bg-gray-900 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition text-sm"
              >
                {savingW ? 'Changing…' : 'Change Password'}
              </button>
            </form>
          </div>

          {/* Sign out */}
          <div className="bg-white border border-red-100 rounded-2xl p-5 shadow-sm">
            <h2 className="text-base font-bold text-gray-800 mb-1">Sign Out</h2>
            <p className="text-xs text-gray-400 mb-4">You will be signed out of all devices.</p>
            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              className="w-full border border-red-200 text-red-600 hover:bg-red-50 font-medium py-3 rounded-xl transition text-sm"
            >
              Sign Out
            </button>
          </div>

        </div>
      )}
    </div>
  );
}