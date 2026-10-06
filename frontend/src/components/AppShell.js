'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

/* ---------- small inline icons ---------- */
function UserIcon({ className = 'h-4 w-4' }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className={className}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.5 20.25a7.5 7.5 0 0 1 15 0"
      />
    </svg>
  );
}

function LogoutIcon({ className = 'h-4 w-4' }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className={className}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M18 15l3-3m0 0-3-3m3 3H9"
      />
    </svg>
  );
}

/* ---------- nav link with active state ---------- */
function NavLink({ href, children }) {
  const pathname = usePathname();
  const active = pathname === href || pathname?.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className={`rounded-md px-2 py-1.5 text-sm font-medium transition-colors ${
        active
          ? 'bg-white/20 text-white'
          : 'text-blue-100 hover:bg-white/10 hover:text-white'
      }`}
    >
      {children}
    </Link>
  );
}

export default function AppShell({ children }) {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const isAdmin = user?.role === 'admin';
  const isComplianceUser = ['admin', 'security_officer'].includes(user?.role);

  // Close the dropdown on outside click or Escape
  useEffect(() => {
    if (!menuOpen) return;

    function onClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    }
    function onKey(e) {
      if (e.key === 'Escape') setMenuOpen(false);
    }

    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-slate-50 to-slate-100 text-slate-900">
      {/* ================= Header ================= */}
      <header className="sticky top-0 z-40 bg-gradient-to-br from-blue-600 to-blue-800 text-white shadow-md shadow-blue-900/20">
        <div className="mx-auto flex h-12 max-w-7xl items-center justify-between px-4 sm:px-6">
          {/* Brand: logo + name */}
          <Link href="/dashboard" className="flex items-center gap-2">
            <Image
              src="/xenosys-logo.png"
              alt="Xenosys logo"
              width={28}
              height={28}
              priority
              style={{ width: 'auto', height: '26px' }}
            />
            <span className="text-base font-semibold tracking-tight text-white">
              Xenosys
            </span>
          </Link>

          {/* Navigation + user menu */}
          <div className="flex items-center gap-3">
            <nav className="hidden items-center gap-0.5 md:flex">
              <NavLink href="/dashboard">Dashboard</NavLink>

              {!isComplianceUser && <NavLink href="/policies">Policies</NavLink>}

              <NavLink href="/training">Training</NavLink>

              {isComplianceUser && (
                <NavLink href="/admin/compliance">Compliance</NavLink>
              )}

              {isAdmin && (
                <NavLink href="/admin/policies">Manage Policies</NavLink>
              )}

              {isAdmin && <NavLink href="/admin/users">User Accounts</NavLink>}
            </nav>

            {/* User avatar + dropdown */}
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setMenuOpen((open) => !open)}
                aria-label="Open user menu"
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15 text-white ring-1 ring-white/30 transition hover:bg-white/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                <UserIcon className="h-[18px] w-[18px]" />
              </button>

              {menuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 z-50 mt-2 w-64 overflow-hidden rounded-xl bg-white shadow-xl shadow-slate-300/60 ring-1 ring-slate-200/70"
                >
                  {/* Blue header strip, same as the login card */}
                  <div className="flex items-center gap-3 bg-gradient-to-br from-blue-600 to-blue-800 px-4 py-4 text-white">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/15 ring-1 ring-white/30">
                      <UserIcon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p
                        className="truncate text-sm font-medium"
                        title={user?.email}
                      >
                        {user?.email}
                      </p>
                      <span className="mt-1 inline-block rounded-full bg-white/15 px-2 py-0.5 text-xs capitalize text-blue-50">
                        {user?.role?.replaceAll('_', ' ')}
                      </span>
                    </div>
                  </div>

                  <div className="p-2">
                    <button
                      type="button"
                      role="menuitem"
                      onClick={logout}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium text-red-600 transition hover:bg-red-50"
                    >
                      <LogoutIcon />
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ================= Main content ================= */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6">
        {children}
      </main>

      {/* ================= Footer ================= */}
      <footer className="bg-gradient-to-br from-blue-600 to-blue-800 text-white">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-3 text-sm sm:flex-row text-xs">
          <p className="text-blue-100">
            © 2026 Xenosys Platform. All rights reserved.
          </p>
          <Link
            href="/privacy"
            className="font-medium text-blue-100 transition hover:text-white hover:underline"
          >
            Privacy Policy
          </Link>
        </div>
      </footer>
    </div>
  );
}
