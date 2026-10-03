'use client';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function onSubmit(e) {
    e.preventDefault(); setError(''); setBusy(true);
    try { await login(email, password); }
    catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }
  return (
    <main className="min-h-screen grid place-items-center bg-slate-50">
      <form onSubmit={onSubmit} className="w-full max-w-sm bg-white p-6 rounded-xl shadow space-y-4">
        <h1 className="text-xl font-semibold">Xenosys Security Portal</h1>
        {error && <p role="alert" className="text-red-700 text-sm">{error}</p>}
        <label className="block text-sm">Email
          <input type="email" required autoComplete="username" value={email}
                 onChange={e => setEmail(e.target.value)} className="mt-1 w-full border rounded p-2" />
        </label>
        <label className="block text-sm">Password
          <input type="password" required autoComplete="current-password" value={password}
                 onChange={e => setPassword(e.target.value)} className="mt-1 w-full border rounded p-2" />
        </label>
        <button disabled={busy} className="w-full bg-blue-700 text-white rounded p-2">
          {busy ? 'Signing in…' : 'Secure Login'}
        </button>
      </form>
    </main>
  );
}