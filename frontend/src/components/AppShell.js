'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

export default function AppShell({ children }) {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const isAdmin = user?.role === 'admin';
  const isComplianceUser =
    ['admin', 'security_officer'].includes(user?.role);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">

      {/* Header */}
      <header className="border-b bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">

          {/* Logo / title */}
          <Link
            href="/dashboard"
            className="text-lg font-bold text-slate-900"
          >
            Xenosys Security Portal
          </Link>

          {/* Navigation + user menu */}
          <div className="flex items-center gap-6">

            <nav className="hidden items-center gap-5 md:flex">
              <Link
                href="/dashboard"
                className="text-sm font-medium text-slate-600 hover:text-blue-700"
              >
                Dashboard
              </Link>

              <Link
                href="/training"
                className="text-sm font-medium text-slate-600 hover:text-blue-700"
              >
                Training & Quiz
              </Link>

              {isComplianceUser && (
                <Link
                  href="/admin/compliance"
                  className="text-sm font-medium text-slate-600 hover:text-blue-700"
                >
                  Compliance
                </Link>
              )}

              {isAdmin && (
                <Link
                  href="/admin/policies"
                  className="text-sm font-medium text-slate-600 hover:text-blue-700"
                >
                  Manage Policies
                </Link>
              )}
            </nav>

            {/* User avatar */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen(!menuOpen)}
                aria-label="Open user menu"
                aria-expanded={menuOpen}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-200 text-slate-700 hover:bg-slate-300"
              >
                {/* Default user icon */}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  className="h-6 w-6"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.5 20.25a7.5 7.5 0 0 1 15 0"
                  />
                </svg>
              </button>

              {/* Dropdown */}
              {menuOpen && (
                <div className="absolute right-0 z-50 mt-2 w-64 rounded-lg border bg-white p-3 shadow-lg">

                  <div className="border-b pb-3">
                    <p className="text-sm font-semibold text-slate-900">
                      {user?.email}
                    </p>

                    <p className="mt-1 text-xs capitalize text-slate-500">
                      {user?.role?.replace('_', ' ')}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={logout}
                    className="mt-3 w-full rounded-md px-3 py-2 text-left text-sm font-medium text-red-600 hover:bg-red-50"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>

          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t bg-white">
        <div className="mx-auto max-w-7xl px-4 py-4 text-center text-sm text-slate-500 sm:px-6">
          Xenosys Information Security Awareness & Policy Compliance System
        </div>
      </footer>

    </div>
  );
}