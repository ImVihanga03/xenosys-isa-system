'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import AuthCardShell from '@/components/AuthCardShell';
import { IconInput, UserIcon, FormErrors } from '@/components/AuthFields';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [errors, setErrors] = useState([]);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError(''); setErrors([]); setBusy(true);
    try {
      await api('/auth/forgot-password', { method: 'POST', body: { email } });
      sessionStorage.setItem('xenosys_reset_email', email.trim().toLowerCase());
      router.push('/verify-code');
    } catch (err) {
      setError(err.message);
      setErrors(err.data?.errors || []);
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthCardShell subtitle="Password recovery">
      <form onSubmit={onSubmit} className="space-y-5">
        <p className="text-sm text-slate-600">
          Enter your registered email address. If it matches an account, we will send a 6-digit verification code.
        </p>
        <FormErrors error={error} errors={errors} />
        <IconInput
          label="Email"
          icon={<UserIcon />}
          type="email"
          required
          autoComplete="username"
          placeholder="Enter your registered email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-lg bg-blue-700 py-2.5 text-sm font-medium text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy ? 'Sending…' : 'Send Verification Code →'}
        </button>
        <p className="text-center text-sm">
          <Link href="/login" className="font-medium text-blue-700 hover:underline">← Back to login</Link>
        </p>
      </form>
    </AuthCardShell>
  );
}