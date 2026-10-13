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
    <div className="w-full space-y-5">
      <div className="flex items-center justify-between pb-4 border-b border-[#262626]">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-400">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Account Security &amp; Access</h2>
            <p className="mt-0.5 text-xs text-[#9CA3AF]">Review the sign-in information currently available for this account.</p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
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
        <div className="flex items-start gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
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
      </div>
    </div>
  );
}
