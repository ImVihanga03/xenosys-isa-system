'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import AuthCardShell from '@/components/AuthCardShell';
import { IconInput, ShieldIcon, FormErrors } from '@/components/AuthFields';

const COOLDOWN = 60;   // keep equal to RESET_RESEND_COOLDOWN_SECONDS on the server

export default function VerifyCodePage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [errors, setErrors] = useState([]);
  const [info, setInfo] = useState('');
  const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useState(COOLDOWN);

  useEffect(() => {
    const saved = sessionStorage.getItem('xenosys_reset_email');
    if (!saved) router.replace('/forgot-password');
    else setEmail(saved);
  }, [router]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  async function onSubmit(e) {
    e.preventDefault();
    setError(''); setErrors([]); setInfo(''); setBusy(true);
    try {
      await api('/auth/verify-reset-code', { method: 'POST', body: { email, code } });
      router.push('/reset-password');
    } catch (err) {
      setError(err.message);
      setErrors(err.data?.errors || []);
    } finally {
      setBusy(false);
    }
  }

  async function resend() {
    setError(''); setErrors([]); setInfo('');
    try {
      await api('/auth/forgot-password', { method: 'POST', body: { email } });
      setCode('');
      setCooldown(COOLDOWN);
      setInfo('If the account exists, a new code has been sent. Earlier codes no longer work.');
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <AuthCardShell subtitle="Verify your identity">
      <form onSubmit={onSubmit} className="space-y-5">
        <p className="text-sm text-slate-600">
          If <span className="font-medium text-slate-800">{email}</span> is registered, we sent a
          6-digit code. It expires in 10 minutes.
        </p>
        <FormErrors error={error} errors={errors} />
        {info && <div role="status" className="rounded-lg bg-green-50 p-3 text-sm text-green-800">{info}</div>}

        <IconInput
          label="Verification code"
          icon={<ShieldIcon />}
          type="text"
          inputMode="numeric"
          pattern="\d{6}"
          maxLength={6}
          required
          autoComplete="one-time-code"
          placeholder="Enter 6-digit code"
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
        />

        <button
          type="submit"
          disabled={busy || code.length !== 6}
          className="w-full rounded-lg bg-blue-700 py-2.5 text-sm font-medium text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy ? 'Verifying…' : 'Verify Code →'}
        </button>

        <div className="flex items-center justify-between text-sm">
          <button
            type="button"
            onClick={resend}
            disabled={cooldown > 0}
            className="font-medium text-blue-700 hover:underline disabled:cursor-not-allowed disabled:text-slate-400 disabled:no-underline"
          >
            {cooldown > 0 ? `Resend Code (${cooldown}s)` : 'Resend Code'}
          </button>
          <Link href="/login" className="font-medium text-blue-700 hover:underline">Back to login</Link>
        </div>
      </form>
    </AuthCardShell>
  );
}