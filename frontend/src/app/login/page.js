'use client';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import AuthCardShell from '@/components/AuthCardShell';
import { IconInput, PasswordInput, UserIcon } from '@/components/AuthFields';

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthCardShell>
      <form onSubmit={onSubmit} className="space-y-5">
        {error && (
          <div role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <IconInput
          label="Email"
          icon={<UserIcon />}
          type="email"
          required
          autoComplete="username"
          placeholder="Enter your credentials"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <PasswordInput
          label="Password"
          required
          autoComplete="current-password"
          placeholder="Enter your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-lg bg-blue-700 py-2.5 text-sm font-medium text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy ? 'Signing in…' : 'Secure Login →'}
        </button>
      </form>
    </AuthCardShell>
  );
}