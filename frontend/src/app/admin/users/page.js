'use client';
import { useCallback, useEffect, useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import AppShell from '@/components/AppShell';
import Modal from '@/components/Modal';
import { FormErrors } from '@/components/AuthFields';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';

const LIMIT = 10;
const ROLES = [['employee', 'Employee'], ['security_officer', 'Security Officer'], ['admin', 'Administrator']];
const roleLabel = Object.fromEntries(ROLES);
const STATUS = {
  active:   ['● Active',   'bg-green-50 text-green-700 ring-green-600/20'],
  disabled: ['⊘ Disabled', 'bg-slate-100 text-slate-600 ring-slate-500/20'],
  locked:   ['▲ Locked',   'bg-amber-50 text-amber-700 ring-amber-600/20'],
};

/* ---------- shared styles ---------- */
const fieldBase = 'rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100';
const inputCls = `mt-1 w-full ${fieldBase}`;           // inside forms
const filterCls = fieldBase;                           // toolbar (search + dropdowns)

const btn = 'rounded-lg px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60';
const primary = `${btn} bg-blue-700 text-white shadow-sm hover:bg-blue-800`;
const secondary = `${btn} border border-slate-300 bg-white text-slate-700 hover:bg-slate-50`;
const danger = `${btn} bg-red-700 text-white shadow-sm hover:bg-red-800`;

// Small buttons for the Actions column
const sm = 'whitespace-nowrap rounded-md border px-2.5 py-1 text-xs font-medium transition';
const act = {
  edit:    `${sm} border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100`,
  disable: `${sm} border-red-200 bg-red-50 text-red-700 hover:bg-red-100`,
  enable:  `${sm} border-green-200 bg-green-50 text-green-700 hover:bg-green-100`,
  unlock:  `${sm} border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100`,
  reset:   `${sm} border-slate-200 bg-white text-slate-700 hover:bg-slate-50`,
  delete:  `${sm} border-red-600 bg-red-600 text-white hover:bg-red-700`,
};

function DateCell({ d }) {
  if (!d) return <span className="text-slate-400">—</span>;
  const dt = new Date(d);
  return (
    <div className="leading-tight">
      <div className="text-slate-700">{dt.toLocaleDateString(undefined, { dateStyle: 'medium' })}</div>
      <div className="text-xs text-slate-400">{dt.toLocaleTimeString(undefined, { timeStyle: 'short' })}</div>
    </div>
  );
}

const ACTIONS = {
  disable: { title: 'Disable account', label: 'Disable', tone: danger, path: 'disable', msg: 'Account disabled',
    text: (u) => `Disable ${u.email}? They will be signed out immediately and cannot log in until you re-enable the account.` },
  enable: { title: 'Enable account', label: 'Enable', tone: primary, path: 'enable', msg: 'Account enabled',
    text: (u) => `Re-enable ${u.email}? They will be able to log in again with their existing credentials.` },
  unlock: { title: 'Unlock account', label: 'Unlock', tone: primary, path: 'unlock', msg: 'Account unlocked',
    text: (u) => `Clear the login lockout for ${u.email}?` },
  reset: { title: 'Reset password', label: 'Reset password', tone: danger, path: 'reset-password', msg: 'Password reset',
    text: (u) => `Generate a new temporary password for ${u.email}? Their current password stops working, they are signed out, and they must change the new one at next login.` },
};

function useAction() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [errors, setErrors] = useState([]);
  async function exec(fn) {
    setBusy(true); setError(''); setErrors([]);
    try { return await fn(); }
    catch (e) { setError(e.message); setErrors(e.data?.errors || []); }
    finally { setBusy(false); }
  }
  return { busy, error, errors, exec };
}

function Field({ label, children, className = '' }) {
  return <label className={`block text-sm font-medium text-slate-700 ${className}`}>{label}{children}</label>;
}

/* ---------- modals ---------- */
function UserFormModal({ mode, user, isSelf, onClose, onDone }) {
  const [f, setF] = useState({
    name: user?.name ?? '', email: user?.email ?? '', role: user?.role ?? 'employee',
    department: user?.department ?? '', jobRole: user?.job_role ?? '',
  });
  const { busy, error, errors, exec } = useAction();
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    if (mode === 'create') {
      const d = await exec(() => api('/admin/users', { method: 'POST', body: f }));
      if (d) onDone({ msg: 'User created', secret: { title: 'User created', email: d.user.email, password: d.temporaryPassword } });
      return;
    }
    const orig = { name: user.name, email: user.email, role: user.role,
                   department: user.department ?? '', jobRole: user.job_role ?? '' };
    const body = Object.fromEntries(Object.entries(f).filter(([k, v]) => v.trim() !== orig[k]));
    if (!Object.keys(body).length) return onClose();
    const d = await exec(() => api(`/admin/users/${user.id}`, { method: 'PATCH', body }));
    if (d) onDone({ msg: 'User updated' });
  }

  return (
    <Modal title={mode === 'create' ? 'Create user' : 'Edit user'} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        {mode === 'create' && (
          <p className="rounded-lg bg-blue-50 p-3 text-xs text-blue-800">
            A temporary password is generated for the new user and shown once after creation.
          </p>
        )}
        <FormErrors error={error} errors={errors} />
        <Field label="Full name">
          <input className={inputCls} required placeholder="e.g. Nimal Perera" value={f.name} onChange={set('name')} />
        </Field>
        <Field label="Email">
          <input className={inputCls} type="email" required placeholder="name@xenosys.lk" value={f.email} onChange={set('email')} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Role">
            <select className={inputCls} value={f.role} onChange={set('role')} disabled={isSelf}>
              {ROLES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
            {isSelf && <span className="mt-1 block text-xs font-normal text-slate-500">You cannot change your own role.</span>}
          </Field>
          <Field label="Department">
            <input className={inputCls} required placeholder="e.g. Finance" value={f.department} onChange={set('department')} />
          </Field>
        </div>
        <Field label="Job role">
          <input className={inputCls} required placeholder="e.g. Accountant" value={f.jobRole} onChange={set('jobRole')} />
        </Field>
        <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
          <button type="button" className={secondary} onClick={onClose}>Cancel</button>
          <button className={primary} disabled={busy}>{busy ? 'Saving…' : mode === 'create' ? 'Create user' : 'Save changes'}</button>
        </div>
      </form>
    </Modal>
  );
}

function ConfirmModal({ action, user, onClose, onDone }) {
  const cfg = ACTIONS[action];
  const { busy, error, errors, exec } = useAction();
  async function confirm() {
    const d = await exec(() => api(`/admin/users/${user.id}/${cfg.path}`, { method: 'POST' }));
    if (!d) return;
    onDone(d.temporaryPassword
      ? { msg: cfg.msg, secret: { title: 'Temporary password', email: user.email, password: d.temporaryPassword } }
      : { msg: cfg.msg });
  }
  return (
    <Modal title={cfg.title} onClose={onClose}>
      <div className="space-y-4">
        <FormErrors error={error} errors={errors} />
        <p className="text-sm leading-relaxed text-slate-700">{cfg.text(user)}</p>
        <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
          <button className={secondary} onClick={onClose}>Cancel</button>
          <button className={cfg.tone} disabled={busy} onClick={confirm}>{busy ? 'Working…' : cfg.label}</button>
        </div>
      </div>
    </Modal>
  );
}

function DeleteModal({ user, onClose, onDone }) {
  const [typed, setTyped] = useState('');
  const { busy, error, errors, exec } = useAction();
  async function remove() {
    const d = await exec(() => api(`/admin/users/${user.id}`, { method: 'DELETE', body: { confirmEmail: typed } }));
    if (d) onDone({ msg: 'User deleted permanently' });
  }
  return (
    <Modal title="Delete user permanently" onClose={onClose}>
      <div className="space-y-4">
        <FormErrors error={error} errors={errors} />
        <p className="text-sm leading-relaxed text-slate-700">
          This cannot be undone. Type <span className="font-semibold">{user.email}</span> to confirm.
        </p>
        <input className={inputCls} value={typed} onChange={(e) => setTyped(e.target.value)} autoComplete="off" />
        <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
          <button className={secondary} onClick={onClose}>Cancel</button>
          <button className={danger} disabled={busy || typed.trim().toLowerCase() !== user.email} onClick={remove}>
            {busy ? 'Deleting…' : 'Delete permanently'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

function SecretModal({ title, email, password, onClose }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try { await navigator.clipboard.writeText(password); setCopied(true); } catch { /* user can copy by hand */ }
  }
  return (
    <Modal title={title} onClose={onClose}>
      <div className="space-y-4">
        <p className="text-sm leading-relaxed text-slate-700">
          Temporary password for <span className="font-semibold">{email}</span>. It is shown only once.
          Share it securely; the user must change it at first login.
        </p>
        <code className="block select-all break-all rounded-lg border border-dashed border-blue-300 bg-blue-50 p-3 text-center font-mono text-base text-blue-900">{password}</code>
        <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
          <button className={secondary} onClick={copy}>{copied ? 'Copied ✓' : 'Copy'}</button>
          <button className={primary} onClick={onClose}>I have saved it</button>
        </div>
      </div>
    </Modal>
  );
}

/* ---------- page ---------- */
function UsersAdmin() {
  const { user: me } = useAuth();
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const [dq, setDq] = useState('');
  const [role, setRole] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [modal, setModal] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => { setDq(q.trim()); setPage(1); }, 300);
    return () => clearTimeout(t);
  }, [q]);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    const p = new URLSearchParams({ page, limit: LIMIT });
    if (dq) p.set('q', dq);
    if (role) p.set('role', role);
    if (status) p.set('status', status);
    try {
      const d = await api(`/admin/users?${p}`);
      setUsers(d.users); setTotal(d.total);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, [page, dq, role, status]);
  useEffect(() => { load(); }, [load]);

  const close = () => setModal(null);
  const done = ({ msg, secret }) => {
    setNotice(msg || '');
    setModal(secret ? { type: 'secret', ...secret } : null);
    load();
  };
  const ask = (type, user) => setModal({ type, user });
  const pages = Math.max(1, Math.ceil(total / LIMIT));

  return (
    <div className="space-y-5">
      {/* Title + create button */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">User Accounts</h1>
          <p className="mt-0.5 text-sm text-slate-600">Create, edit, disable and manage Xenosys accounts.</p>
        </div>
        <button className={primary} onClick={() => setModal({ type: 'create' })}>+ Create user</button>
      </div>

      {notice && (
        <div role="status" className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">{notice}</div>
      )}
      {error && (
        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}

      {/* Table card */}
      <div className="overflow-hidden rounded-xl bg-white shadow-xl shadow-slate-300/60 ring-1 ring-slate-200/70">
        {/* Toolbar: search + filters on one row */}
        <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 p-4">
          <div className="relative min-w-[14rem] flex-1 sm:max-w-xs">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"
                 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true">
              <circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" />
            </svg>
            <input className={`${filterCls} w-full pl-9`} placeholder="Search name or email" value={q}
                   onChange={(e) => setQ(e.target.value)} aria-label="Search users" />
          </div>
          <select className={`${filterCls} w-auto`} value={role} aria-label="Filter by role"
                  onChange={(e) => { setRole(e.target.value); setPage(1); }}>
            <option value="">All roles</option>
            {ROLES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          <select className={`${filterCls} w-auto`} value={status} aria-label="Filter by status"
                  onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="disabled">Disabled</option>
            <option value="locked">Locked</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[58rem] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                {['User', 'Role', 'Department', 'Status', 'Last login', 'Created', 'Actions']
                  .map(h => <th key={h} className="whitespace-nowrap px-3 py-3 font-semibold">{h}</th>)}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && <tr><td colSpan={7} className="px-4 py-10 text-center text-slate-500">Loading…</td></tr>}
              {!loading && users.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-slate-500">No users match.</td></tr>
              )}
              {!loading && users.map((u) => {
                const self = u.id === me.id;
                const [label, tone] = STATUS[u.status];
                return (
                  <tr key={u.id} className="transition hover:bg-slate-50/70">
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-sm font-semibold uppercase text-blue-700">
                          {u.name?.trim()?.[0] || '?'}
                        </span>
                        <div className="min-w-0 leading-tight">
                          <div className="whitespace-nowrap font-medium text-slate-900">
                            {u.name}{self && <span className="ml-1 text-xs font-normal text-slate-500">(you)</span>}
                          </div>
                          <div className="mt-0.5 whitespace-nowrap text-xs text-slate-500">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-slate-700">{roleLabel[u.role]}</td>
                    <td className="whitespace-nowrap px-3 py-3 text-slate-600">{u.department || '—'}</td>
                    <td className="whitespace-nowrap px-3 py-3">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${tone}`}>{label}</span>
                      {u.is_locked && u.status !== 'locked' && <span className="ml-1 text-xs text-amber-700">(also locked)</span>}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3"><DateCell d={u.last_login_at} /></td>
                    <td className="whitespace-nowrap px-3 py-3"><DateCell d={u.created_at} /></td>
                    <td className="px-3 py-3">
                      <div className="flex flex-nowrap items-center gap-1.5">
                        <button className={act.edit} onClick={() => ask('edit', u)}>Edit</button>
                        {!self && (u.is_active
                          ? <button className={act.disable} onClick={() => ask('disable', u)}>Disable</button>
                          : <button className={act.enable} onClick={() => ask('enable', u)}>Enable</button>)}
                        {u.is_locked && <button className={act.unlock} onClick={() => ask('unlock', u)}>Unlock</button>}
                        {!self && <button className={act.reset} onClick={() => ask('reset', u)}>Reset password</button>}
                        {!self && !u.is_active && (
                          <button className={act.delete} onClick={() => ask('delete', u)}>Delete</button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/60 px-4 py-3 text-sm text-slate-600">
          <span>{total} user{total === 1 ? '' : 's'}</span>
          <div className="flex items-center gap-2">
            <button className={`${secondary} !px-3 !py-1.5`} disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button>
            <span>Page {page} of {pages}</span>
            <button className={`${secondary} !px-3 !py-1.5`} disabled={page >= pages} onClick={() => setPage(page + 1)}>Next</button>
          </div>
        </div>
      </div>

      {modal?.type === 'create' && <UserFormModal mode="create" onClose={close} onDone={done} />}
      {modal?.type === 'edit' && <UserFormModal mode="edit" user={modal.user} isSelf={modal.user.id === me.id} onClose={close} onDone={done} />}
      {ACTIONS[modal?.type] && <ConfirmModal action={modal.type} user={modal.user} onClose={close} onDone={done} />}
      {modal?.type === 'delete' && <DeleteModal user={modal.user} onClose={close} onDone={done} />}
      {modal?.type === 'secret' && <SecretModal title={modal.title} email={modal.email} password={modal.password} onClose={close} />}
    </div>
  );
}

export default function UsersPage() {
  return (
    <ProtectedRoute roles={['admin']}>
      <AppShell>
        <UsersAdmin />
      </AppShell>
    </ProtectedRoute>
  );
}