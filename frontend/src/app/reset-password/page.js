'use client';
import { useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import AuthCardShell from '@/components/AuthCardShell';
import { PasswordInput, FormErrors } from '@/components/AuthFields';

export default function ResetPasswordPage() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [errors, setErrors] = useState([]);
  const [sessionDead, setSessionDead] = useState(false);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError(''); setErrors([]);
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setBusy(true);
    try {
      await api('/auth/reset-password', { method: 'POST', body: { newPassword, confirmPassword } });
      sessionStorage.removeItem('xenosys_reset_email');
      setDone(true);
    } catch (err) {
      setError(err.message);
      setErrors(err.data?.errors || []);
      if (err.data?.code === 'RESET_SESSION_INVALID') setSessionDead(true);
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <AuthCardShell subtitle="Password reset complete">
        <div className="space-y-5 text-center">
          <div role="status" className="rounded-lg bg-green-50 p-4 text-sm text-green-800">
            Your password has been reset successfully. All previous sessions were signed out.
          </div>
          <Link
            href="/login"
            className="block w-full rounded-lg bg-blue-700 py-2.5 text-sm font-medium text-white transition hover:bg-blue-800"
          >
            Back to Login →
          </Link>
        </div>
      </AuthCardShell>
    );
  }

  return (
    <AuthCardShell subtitle="Create a new password">
      <form onSubmit={onSubmit} className="space-y-5">
        <FormErrors error={error} errors={errors} />
        {sessionDead && (
          <Link href="/forgot-password" className="block text-center text-sm font-medium text-blue-700 hover:underline">
            Start password recovery again
          </Link>
        )}

        <PasswordInput
          label="New Password"
          required
          autoComplete="new-password"
          placeholder="At least 12 characters"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />
        <PasswordInput
          label="Confirm New Password"
          required
          autoComplete="new-password"
          placeholder="Re-enter your new password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-lg bg-blue-700 py-2.5 text-sm font-medium text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy ? 'Resetting…' : 'Reset Password →'}
        </button>
      </form>
    </AuthCardShell>
  );
}