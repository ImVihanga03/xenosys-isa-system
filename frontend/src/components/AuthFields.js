'use client';
import { useId, useState } from 'react';

const inputBase =
  'w-full rounded-lg border border-slate-300 bg-white py-2.5 text-sm text-slate-900 ' +
  'placeholder:text-slate-400 outline-none transition ' +
  'focus:border-blue-600 focus:ring-2 focus:ring-blue-100';

const svg = { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor',
              strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true };

export const UserIcon = () => (
  <svg {...svg}><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" /></svg>
);
export const LockIcon = () => (
  <svg {...svg}><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg>
);
export const ShieldIcon = () => (
  <svg {...svg}><path d="M12 3l8 3v6c0 5-3.4 8-8 9-4.6-1-8-4-8-9V6l8-3z" /><path d="M9 12l2 2 4-4" /></svg>
);
const EyeIcon = () => (
  <svg {...svg}><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></svg>
);
const EyeOffIcon = () => (
  <svg {...svg}><path d="M3 3l18 18" /><path d="M10.6 5.1A10 10 0 0 1 12 5c6.4 0 10 7 10 7a17 17 0 0 1-3.2 4M6.6 6.6C3.7 8.4 2 12 2 12s3.6 7 10 7c1.7 0 3.2-.4 4.5-1" /><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" /></svg>
);

export function IconInput({ label, icon, ...inputProps }) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-slate-700">{label}</label>
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">{icon}</span>
        <input id={id} {...inputProps} className={`${inputBase} pl-10 pr-3`} />
      </div>
    </div>
  );
}

export function PasswordInput({ label, labelAction, ...inputProps }) {
  const id = useId();
  const [show, setShow] = useState(false);
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <label htmlFor={id} className="text-sm font-medium text-slate-700">{label}</label>
        {labelAction}
      </div>
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"><LockIcon /></span>
        <input id={id} type={show ? 'text' : 'password'} {...inputProps} className={`${inputBase} pl-10 pr-10`} />
        <button
          type="button"
          onClick={() => setShow(s => !s)}
          aria-label={show ? 'Hide password' : 'Show password'}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
        >
          {show ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      </div>
    </div>
  );
}

export function FormErrors({ error, errors = [] }) {
  return (
    <>
      {error && (
        <div role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}
      {errors.length > 0 && (
        <ul className="list-disc space-y-1 rounded-lg bg-red-50 p-3 pl-8 text-sm text-red-700">
          {errors.map((item, i) => (
            <li key={i}>{item.field ? `${item.field}: ${item.message}` : item}</li>
          ))}
        </ul>
      )}
    </>
  );
}