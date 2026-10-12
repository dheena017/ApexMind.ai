import React, { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Sparkles,
  Youtube,
} from 'lucide-react';
import { Button } from '@/src/shared/ui/common';

export default function LoginPage({ onNavigate }: { onNavigate: (page: string) => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState('');

  const finishSignIn = () => {
    if (loading) return;
    setNotice('');
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onNavigate('dashboard');
    }, 600);
  };

  const handleLogin = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    finishSignIn();
  };

  return (
    <main className="relative flex min-h-screen w-full items-center justify-center overflow-x-hidden bg-[#0A0A0A] px-4 py-6 text-[#E5E5E5] sm:px-6 sm:py-8">
      <div className="pointer-events-none absolute -left-40 top-1/4 h-96 w-96 rounded-full bg-[#3B82F6]/10 blur-[120px]" />
      <div className="pointer-events-none absolute -right-40 bottom-0 h-96 w-96 rounded-full bg-[#2563EB]/10 blur-[120px]" />

      <div className="relative grid w-full max-w-5xl rounded-[28px] border border-[#2F2F2F] bg-[#1E1E1E] shadow-2xl shadow-black/50 lg:grid-cols-[0.9fr_1.1fr]">
        <section className="relative hidden flex-col justify-between overflow-hidden rounded-l-[28px] bg-linear-to-br from-[#172554] via-[#121212] to-[#1E1E1E] p-8 lg:flex xl:p-10">
          <div className="pointer-events-none absolute -right-20 top-24 h-72 w-72 rounded-full bg-[#3B82F6]/15 blur-[90px]" />
          <div className="relative">
            <button
              type="button"
              onClick={() => onNavigate('landing')}
              className="flex w-fit items-center gap-2 rounded-lg text-sm text-[#9CA3AF] transition-colors hover:text-white focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/50"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to home
            </button>

            <div className="mt-10 flex w-fit items-center gap-3">
              <div className="rounded-2xl border border-[#60A5FA]/30 bg-gradient-to-tr from-[#3B82F6] to-[#2563EB] p-3 text-white shadow-lg shadow-[#3B82F6]/25">
                <Sparkles className="h-6 w-6" />
              </div>
              <span className="text-xl font-extrabold tracking-tight text-white">ApexMind</span>
            </div>

            <h1 className="mt-8 max-w-sm text-3xl font-extrabold leading-tight tracking-tight text-white xl:text-4xl">
              Turn your ideas into Shorts.
            </h1>
            <p className="mt-5 max-w-md text-sm leading-7 text-[#C5CBD5]">
              Sign in to shape ideas into scripts, voiceovers, and videos—with your creative choices in control.
            </p>
          </div>

          <div className="relative mt-12 space-y-4">
            {[
              'Draft and refine short-form scripts',
              'Choose voices, music, and visuals',
              'Review your work before publishing',
            ].map((item) => (
              <div key={item} className="flex items-center gap-3 text-sm text-[#E5E5E5]">
                <span className="flex h-6 w-6 items-center justify-center rounded-full border border-emerald-500/20 bg-emerald-500/10 text-emerald-400">
                  <Check className="h-3.5 w-3.5" />
                </span>
                {item}
              </div>
            ))}
            <p className="pt-6 text-xs text-[#9CA3AF]">A creative workspace for your YouTube workflow.</p>
          </div>
        </section>

        <section className="p-6 sm:p-8 lg:p-9">
          <div className="mb-6 flex items-center justify-between lg:hidden">
            <div className="flex items-center gap-2.5">
              <div className="rounded-xl border border-[#60A5FA]/30 bg-gradient-to-tr from-[#3B82F6] to-[#2563EB] p-2 text-white">
                <Sparkles className="h-5 w-5" />
              </div>
              <span className="font-extrabold tracking-tight text-white">ApexMind</span>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('landing')}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-[#9CA3AF] transition-colors hover:text-white"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Home
            </button>
          </div>

          <div className="mx-auto w-full max-w-md">
            <div className="mb-6">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#3B82F6]/25 bg-[#3B82F6]/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#93C5FD]">
                <ShieldCheck className="h-3.5 w-3.5" />
                Secure studio access
              </div>
              <h2 className="text-3xl font-extrabold tracking-tight text-white">Welcome back</h2>
              <p className="mt-2 text-sm leading-6 text-[#9CA3AF]">Sign in to continue to your ApexMind dashboard.</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="login-email" className="text-xs font-semibold uppercase tracking-wider text-[#C5CBD5]">
                  Email address
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6B7280]" />
                  <input
                    id="login-email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@example.com"
                    required
                    className="login-field min-h-11 w-full rounded-xl border border-[#2F2F2F] bg-[#121212] py-2.5 pl-11 pr-4 text-sm text-[#E5E5E5] outline-none transition placeholder:text-[#6B7280] hover:border-[#4A4A4A] focus:border-[#3B82F6] focus:ring-4 focus:ring-[#3B82F6]/10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="login-password" className="text-xs font-semibold uppercase tracking-wider text-[#C5CBD5]">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setNotice('Password reset link will be sent to your registered email.')}
                    className="text-xs font-medium text-[#60A5FA] transition-colors hover:text-[#93C5FD]"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6B7280]" />
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Enter your password"
                    required
                    className="login-field min-h-11 w-full rounded-xl border border-[#2F2F2F] bg-[#121212] py-2.5 pl-11 pr-12 text-sm text-[#E5E5E5] outline-none transition placeholder:text-[#6B7280] hover:border-[#4A4A4A] focus:border-[#3B82F6] focus:ring-4 focus:ring-[#3B82F6]/10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((visible) => !visible)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-[#6B7280] transition-colors hover:text-[#E5E5E5] focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/50"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <label className="flex cursor-pointer items-center gap-2.5 text-xs text-[#9CA3AF]">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-[#2F2F2F] bg-[#121212] accent-[#3B82F6] focus:ring-[#3B82F6]"
                />
                Keep me signed in
              </label>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full"
                disabled={loading}
                icon={loading ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" /> : <ArrowRight className="h-4 w-4" />}
              >
                {loading ? 'Signing in…' : 'Sign in to dashboard'}
              </Button>
            </form>

            {notice && (
              <p role="status" className="mt-4 rounded-xl border border-amber-400/20 bg-amber-400/5 px-4 py-3 text-xs leading-5 text-amber-200">
                {notice}
              </p>
            )}

            <div className="my-5 flex items-center gap-4 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-600">
              <span className="h-px flex-1 bg-[#2F2F2F]" />
              or
              <span className="h-px flex-1 bg-[#2F2F2F]" />
            </div>

            <Button
              type="button"
              variant="secondary"
              size="lg"
              className="w-full border-[#2F2F2F] bg-[#121212] text-[#E5E5E5] hover:border-[#4A4A4A] hover:bg-[#1E1E1E]"
              disabled={loading}
              icon={<Youtube className="h-4 w-4 text-red-400" />}
              onClick={finishSignIn}
            >
              Continue with YouTube
            </Button>

            <p className="mt-4 text-center text-[11px] leading-5 text-[#9CA3AF]">
              Sign in to manage and automate your YouTube Shorts channel.
            </p>

            <div className="mt-5 rounded-2xl border border-[#2F2F2F] bg-[#121212] p-3">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
                <p className="text-xs leading-5 text-[#9CA3AF]">
                  Keep your API keys private. ApexMind will never ask you to enter a Gemini API key on this sign-in screen.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
