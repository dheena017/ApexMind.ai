import { CheckCircle2, LockKeyhole, ShieldCheck } from 'lucide-react';
import { Card } from '@/src/shared/ui/common';
import { useAuth } from '@/src/features/auth/context/AuthContext';

export default function ProfileSecurityPage() {
  const { user } = useAuth();
  const statuses = [
    { label: 'Sign-in provider', value: user?.provider || 'Unknown' },
    { label: 'Email verification', value: user?.verified ? 'Verified' : 'Not verified', icon: user?.verified ? <CheckCircle2 className="h-4 w-4 text-emerald-400" /> : undefined },
    { label: 'Two-factor authentication', value: 'Unavailable' },
    { label: 'Active-session management', value: 'Unavailable' },
  ];

  return (
    <div className="mx-auto w-full max-w-4xl space-y-5">
      <header>
        <h1 className="text-2xl font-extrabold tracking-tight text-white">Account security</h1>
        <p className="mt-1 text-xs text-[#9CA3AF]">Review the sign-in information currently available for this account.</p>
      </header>
      <Card>
        <div className="mb-4 flex items-center gap-3 border-b border-[#2F2F2F] pb-4">
          <LockKeyhole className="h-5 w-5 text-emerald-400" />
          <div>
            <h2 className="text-base font-bold text-white">Security status</h2>
            <p className="mt-1 text-xs text-[#9CA3AF]">{user?.email || 'No email on file'}</p>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {statuses.map((status) => (
            <div key={status.label} className="rounded-xl border border-[#2F2F2F] bg-[#121212] p-4">
              <p className="text-xs text-[#9CA3AF]">{status.label}</p>
              <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold capitalize text-white">
                {status.icon}{status.value}
              </p>
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-start gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
          <p className="text-xs leading-relaxed text-[#B8B8B8]">
            Two-factor authentication and active-session management are not supported by the app backend, so this page does not claim either feature is enabled.
          </p>
        </div>
        {user?.lastLoginAt && (
          <p className="mt-4 text-xs text-[#6B7280]">
            Last sign-in recorded: {new Date(user.lastLoginAt).toLocaleString()}
          </p>
        )}
      </Card>
    </div>
  );
}
