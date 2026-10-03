'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import AuthCardShell from '@/components/AuthCardShell';
import { PasswordInput } from '@/components/AuthFields';

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
        body: { currentPassword, newPassword },
      });
      setUser(data.user);
      router.push(HOME[data.user.role] || '/dashboard');
    } catch (err) {
      setError(err.message);
      setErrors(err.data?.errors || []);
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthCardShell subtitle="Password change required">
      <form onSubmit={onSubmit} className="space-y-5">
        <p className="text-sm text-slate-600">
          For your security, you must set a new password before continuing.
        </p>

        {error && (
          <div role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {errors.length > 0 && (
          <ul className="list-disc space-y-1 rounded-lg bg-red-50 p-3 pl-8 text-sm text-red-700">
            {errors.map((item, i) => (
              <li key={i}>{item.field ? `${item.field}: ${item.message}` : item}</li>
            ))}
          </ul>
        )}

        <PasswordInput
          label="Current password"
          required
          autoComplete="current-password"
          placeholder="Enter your current password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
        />

        <PasswordInput
          label="New password"
          required
          autoComplete="new-password"
          placeholder="At least 12 characters"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-lg bg-blue-700 py-2.5 text-sm font-medium text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy ? 'Changing password…' : 'Change Password →'}
        </button>
      </form>
    </AuthCardShell>
  );
}