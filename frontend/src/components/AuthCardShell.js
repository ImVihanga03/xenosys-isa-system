import Image from 'next/image';

export default function AuthCardShell({ children, subtitle = 'Authorized Personnel Only' }) {
  return (
    <main className="grid min-h-screen place-items-center bg-gradient-to-br from-slate-50 to-slate-100 px-4 py-8 text-slate-900">
      <div className="w-full max-w-[22rem] overflow-hidden rounded-xl bg-white shadow-xl shadow-slate-300/60">
        <header className="flex flex-col items-center bg-gradient-to-br from-blue-600 to-blue-800 px-6 py-8 text-center text-white">
          <Image
            src="/xenosys-logo.png"
            alt="Xenosys logo"
            width={56}
            height={56}
            priority
            style={{ width: 'auto', height: '56px' }}
          />
          <p className="mt-4 text-sm font-medium">Xenosys Security</p>
          <p className="mt-1 text-sm text-blue-100">{subtitle}</p>
        </header>
        <div className="p-6">{children}</div>
      </div>
    </main>
  );
}