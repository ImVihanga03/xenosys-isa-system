'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function ProtectedRoute({ roles, children }) {
  const { user, loading, HOME } = useAuth();
  const router = useRouter();
  const allowed = user && (!roles || roles.includes(user.role));

  useEffect(() => {
    if (loading) return;
    if (!user) router.replace('/login');
    else if (user.mustChangePassword) router.replace('/change-password');
    else if (!allowed) router.replace(HOME[user.role]);
  }, [user, loading, allowed]);

  return loading || !allowed ? null : children;
}