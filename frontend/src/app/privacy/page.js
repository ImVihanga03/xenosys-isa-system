import ProtectedRoute from '@/components/ProtectedRoute';
import AppShell from '@/components/AppShell';

const SECTIONS = [
  ['What we collect', [
    'Account details: full name, email, department, job role added by an administrator.',
    'Sign-in information: last login time and failed sign-in counts.',
    'Awareness records: policy acknowledgements, training progress and quiz results.',
    'Audit records: the action taken, who did it, when, and the IP address and browser used.',
  ]],
  ['Why we collect it', [
    'To let you sign in securely, to deliver and track security awareness, and to show Xenosys whether security policies are being followed.',
    'We do not collect device activity, keystrokes or location.',
  ]],
  ['Who can see it', [
    'Employees see only their own records.',
    'Security Officers see compliance summaries.',
    'Administrators manage accounts and can view account details and audit records.',
  ]],
  ['How it is protected', [
    'Passwords are stored only as salted hashes. Connections use HTTPS in production.',
    'Audit records cannot be edited or deleted through the application.',
  ]],
  ['Retention and your questions', [
    'Retention periods are set by Xenosys management.',
    'Contact your Security Officer about access, correction or any concern with how your data is used.',
  ]],
];

export const metadata = { title: 'Privacy Policy | Xenosys' };

export default function PrivacyPage() {
  return (
    <ProtectedRoute>
      <AppShell>
        <div className="mx-auto w-full max-w-2xl overflow-hidden rounded-xl bg-white shadow-xl shadow-slate-300/60">
          {/* Blue banner, same style as the login card header */}
          <div className="bg-gradient-to-br from-blue-600 to-blue-800 px-6 py-7 text-center text-white sm:px-8">
            <h1 className="text-xl font-semibold">Privacy Policy</h1>
            <p className="mt-1 text-sm text-blue-100">
              How the Xenosys Security Portal handles your information.
            </p>
          </div>

          {/* Content */}
          <div className="divide-y divide-slate-100 px-6 py-2 sm:px-8">
            {SECTIONS.map(([title, points], i) => (
              <section key={title} className="py-5">
                <h2 className="flex items-center gap-3 text-base font-semibold text-slate-900">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-semibold text-blue-700">
                    {i + 1}
                  </span>
                  {title}
                </h2>
                <ul className="mt-3 space-y-2 pl-9 text-sm leading-relaxed text-slate-600">
                  {points.map((p) => (
                    <li key={p} className="relative">
                      <span className="absolute -left-4 top-2 h-1.5 w-1.5 rounded-full bg-blue-600" />
                      {p}
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
