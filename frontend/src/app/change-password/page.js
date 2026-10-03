'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';

export default function ChangePasswordPage() {
  const { setUser, HOME } = useAuth();
  const router = useRouter();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const [error, setError] = useState('');
  const [errors, setErrors] = useState([]);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();

    setError('');
    setErrors([]);
    setBusy(true);

    try {
      const data = await api('/auth/change-password', {
        method: 'POST',
        body: {
          currentPassword,
          newPassword,
        },
      });

      setUser(data.user);

      router.push(
        HOME[data.user.role] || '/dashboard'
      );
    } catch (err) {
      setError(err.message);
      setErrors(err.data?.errors || []);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen grid place-items-center bg-slate-50 px-4">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-md space-y-5 rounded-xl bg-white p-6 shadow"
      >
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Change Your Password
          </h1>

          <p className="mt-1 text-sm text-slate-600">
            You must change your password before continuing.
          </p>
        </div>

        {error && (
          <div
            role="alert"
            className="rounded-md bg-red-50 p-3 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        {errors.length > 0 && (
          <ul className="list-disc space-y-1 rounded-md bg-red-50 p-3 pl-8 text-sm text-red-700">
            {errors.map((item, index) => (
              <li key={index}>
                {item.field
                  ? `${item.field}: ${item.message}`
                  : item}
              </li>
            ))}
          </ul>
        )}

        <label className="block text-sm font-medium text-slate-700">
          Current password

          <input
            type="password"
            required
            autoComplete="current-password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 p-2.5 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
          />
        </label>

        <label className="block text-sm font-medium text-slate-700">
          New password

          <input
            type="password"
            required
            autoComplete="new-password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 p-2.5 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
          />
        </label>

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-md bg-blue-700 p-2.5 font-medium text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy ? 'Changing password…' : 'Change Password'}
        </button>
      </form>
    </main>
  );
}