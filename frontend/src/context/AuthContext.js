'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

const HOME = { employee: '/dashboard', admin: '/admin/compliance', security_officer: '/admin/compliance' };
const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    api('/auth/me').then(d => setUser(d.user)).catch(() => setUser(null)).finally(() => setLoading(false));
  }, []);

  async function login(email, password) {
    const { user } = await api('/auth/login', { method: 'POST', body: { email, password } });
    setUser(user);
    router.push(user.mustChangePassword ? '/change-password' : HOME[user.role]);
  }
  async function logout() {
    await api('/auth/logout', { method: 'POST' }).catch(() => {});
    setUser(null); router.push('/login');
  }
  return <AuthContext.Provider value={{ user, setUser, loading, login, logout, HOME }}>{children}</AuthContext.Provider>;
}