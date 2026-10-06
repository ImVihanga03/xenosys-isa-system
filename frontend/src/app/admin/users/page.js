'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import AppShell from '@/components/AppShell';

export default function UserAccountsPage() {
  return (
    <ProtectedRoute roles={['admin']}>
      <AppShell>
        <section className="relative flex min-h-[60vh] items-center justify-center overflow-hidden">
          <h1
            aria-hidden="true"
            className="select-none text-center text-4xl font-bold tracking-tight text-slate-900/[0.06] sm:text-6xl md:text-7xl"
          >
            User Account Management
          </h1>
        </section>
      </AppShell>
    </ProtectedRoute>
  );
}