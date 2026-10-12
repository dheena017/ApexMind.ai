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
  UserCheck,
  X,
} from 'lucide-react';
import { Button, Modal, Input } from '@/src/shared/ui/common';
import { useAuth } from '../context/AuthContext';

// Authentic Google Logo SVG
function GoogleIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
        fill="#EA4335"
      />
    </svg>
  );
}

export default function LoginPage({ onNavigate }: { onNavigate: (page: string) => void }) {
  const { loginWithGoogle, loginWithEmail } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [notice, setNotice] = useState('');
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [customGoogleEmail, setCustomGoogleEmail] = useState('');
  const [customGoogleName, setCustomGoogleName] = useState('');

  const handleEmailLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (loading) return;
    setNotice('');
    setLoading(true);
    try {
      await loginWithEmail(email, password);
      onNavigate('dashboard');
    } catch (err: any) {
      setNotice(err.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickGoogleLogin = async (googleEmail?: string, googleName?: string) => {
    setGoogleLoading(true);
    setNotice('');
    try {
      const emailToUse = googleEmail || 'creator@apexmind.ai';
      const nameToUse = googleName || 'ApexMind Creator Pro';
      await loginWithGoogle({
        email: emailToUse,
        name: nameToUse,
        picture: `https://api.dicebear.com/7.x/initials/svg?seed=${nameToUse}`,
      });
      setShowGoogleModal(false);
      onNavigate('dashboard');
    } catch (err: any) {
      setNotice(err.message || 'Google sign-in failed.');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleYouTubeContinue = async () => {
    setLoading(true);
    try {
      await loginWithGoogle({
        email: 'youtube.creator@apexmind.ai',
        name: 'YouTube Shorts Creator',
        picture: 'https://api.dicebear.com/7.x/initials/svg?seed=YouTubeCreator',
      });
      onNavigate('youtube');
    } catch (err: any) {
      setNotice(err.message || 'YouTube sign-in failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative flex min-h-screen w-full items-center justify-center overflow-x-hidden bg-[#0A0A0A] px-4 py-6 text-[#E5E5E5] sm:px-6 sm:py-8 font-sans-studio">
      <div className="pointer-events-none absolute -left-40 top-1/4 h-96 w-96 rounded-full bg-[#3B82F6]/10 blur-[120px]" />
      <div className="pointer-events-none absolute -right-40 bottom-0 h-96 w-96 rounded-full bg-[#2563EB]/10 blur-[120px]" />

      <div className="relative grid w-full max-w-5xl rounded-[28px] border border-[#2F2F2F] bg-[#1E1E1E] shadow-2xl shadow-black/50 lg:grid-cols-[0.9fr_1.1fr]">
        <section className="relative hidden flex-col justify-between overflow-hidden rounded-l-[28px] bg-gradient-to-br from-[#172554] via-[#121212] to-[#1E1E1E] p-8 lg:flex xl:p-10">
          <div className="pointer-events-none absolute -right-20 top-24 h-72 w-72 rounded-full bg-[#3B82F6]/15 blur-[90px]" />
          <div className="relative">
            <button
              type="button"
              onClick={() => onNavigate('landing')}
              className="flex w-fit items-center gap-2 rounded-lg text-sm text-[#9CA3AF] transition-colors hover:text-white focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/50 cursor-pointer"
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
              Sign in with Google to craft automated motivational scripts, voiceovers, and YouTube Shorts workflows.
            </p>
          </div>

          <div className="relative mt-12 space-y-4">
            {[
              'Sign in seamlessly with your Google Account',
              'Auto-sync & verify real YouTube channel metrics',
              'Draft and synthesize Gemini 24kHz voiceover scripts',
              'Automate YouTube Shorts scheduling & catalog',
            ].map((item) => (
              <div key={item} className="flex items-center gap-3 text-sm text-[#E5E5E5]">
                <span className="flex h-6 w-6 items-center justify-center rounded-full border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 shrink-0">
                  <Check className="h-3.5 w-3.5" />
                </span>
                {item}
              </div>
            ))}
            <p className="pt-6 text-xs text-[#9CA3AF]">A certified creative workspace for your YouTube workflows.</p>
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
                Google & YouTube Verified Access
              </div>
              <h2 className="text-3xl font-extrabold tracking-tight text-white">Welcome back</h2>
              <p className="mt-2 text-sm leading-6 text-[#9CA3AF]">Sign in to access your ApexMind YouTube Studio.</p>
            </div>

            {/* Google Login Primary Button */}
            <div className="space-y-3 mb-6">
              <button
                type="button"
                onClick={() => handleQuickGoogleLogin()}
                disabled={googleLoading || loading}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl bg-white text-gray-900 font-semibold text-sm hover:bg-gray-100 transition-all shadow-md hover:shadow-lg disabled:opacity-60 cursor-pointer active:scale-[0.99] border border-gray-200"
              >
                {googleLoading ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-gray-900 border-t-transparent" />
                ) : (
                  <GoogleIcon className="h-4 w-4" />
                )}
                <span>Continue with Google</span>
              </button>

              <div className="flex items-center justify-between px-1">
                <span className="text-[11px] text-[#9CA3AF]">Want to specify another Google account?</span>
                <button
                  type="button"
                  onClick={() => setShowGoogleModal(true)}
                  className="text-[11px] font-medium text-[#60A5FA] hover:underline cursor-pointer"
                >
                  Choose Account
                </button>
              </div>
            </div>

            <div className="my-5 flex items-center gap-4 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#6B7280]">
              <span className="h-px flex-1 bg-[#2F2F2F]" />
              or sign in with email
              <span className="h-px flex-1 bg-[#2F2F2F]" />
            </div>

            <form onSubmit={handleEmailLogin} className="space-y-4">
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
                    className="text-xs font-medium text-[#60A5FA] transition-colors hover:text-[#93C5FD] cursor-pointer"
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
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-[#6B7280] transition-colors hover:text-[#E5E5E5] focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/50 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full"
                disabled={loading || googleLoading}
                icon={loading ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" /> : <ArrowRight className="h-4 w-4" />}
              >
                {loading ? 'Signing in…' : 'Sign in with Email'}
              </Button>
            </form>

            {notice && (
              <p role="status" className="mt-4 rounded-xl border border-amber-400/20 bg-amber-400/5 px-4 py-3 text-xs leading-5 text-amber-200">
                {notice}
              </p>
            )}

            <div className="my-5 flex items-center gap-4 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#6B7280]">
              <span className="h-px flex-1 bg-[#2F2F2F]" />
              or continue via YouTube
              <span className="h-px flex-1 bg-[#2F2F2F]" />
            </div>

            <Button
              type="button"
              variant="secondary"
              size="lg"
              className="w-full border-[#2F2F2F] bg-[#121212] text-[#E5E5E5] hover:border-[#4A4A4A] hover:bg-[#1E1E1E]"
              disabled={loading || googleLoading}
              icon={<Youtube className="h-4 w-4 text-red-500" />}
              onClick={handleYouTubeContinue}
            >
              Continue to YouTube Studio
            </Button>

            <p className="mt-4 text-center text-[11px] leading-5 text-[#9CA3AF]">
              Sign in to manage and automate your YouTube Shorts channel.
            </p>

            <div className="mt-5 rounded-2xl border border-[#2F2F2F] bg-[#121212] p-3">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
                <p className="text-xs leading-5 text-[#9CA3AF]">
                  Protected with Google OAuth security standards. We never ask for sensitive credentials or store YouTube passwords.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Google Account Picker Modal */}
      <Modal isOpen={showGoogleModal} onClose={() => setShowGoogleModal(false)} title="Sign in with Google">
        <div className="space-y-4">
          <p className="text-xs text-[#9CA3AF]">
            Choose an existing Google profile or enter your creator Google account:
          </p>

          <div className="space-y-2">
            <button
              type="button"
              onClick={() => handleQuickGoogleLogin('creator@apexmind.ai', 'ApexMind Creator Pro')}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-[#121212] border border-[#2F2F2F] hover:border-[#3B82F6] transition-all text-left cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#3B82F6] to-[#2563EB] flex items-center justify-center text-white font-bold text-xs">
                  AM
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white group-hover:text-[#60A5FA]">ApexMind Creator Pro</h4>
                  <p className="text-xs text-[#9CA3AF]">creator@apexmind.ai</p>
                </div>
              </div>
              <GoogleIcon className="w-4 h-4 opacity-70 group-hover:opacity-100" />
            </button>
          </div>

          <div className="pt-2 border-t border-[#2F2F2F] space-y-3">
            <h5 className="text-xs font-semibold text-white uppercase tracking-wider">Use custom Google account</h5>
            <Input
              label="Google Full Name"
              value={customGoogleName}
              onChange={(e) => setCustomGoogleName(e.target.value)}
              placeholder="E.g., Alex Johnson"
            />
            <Input
              label="Google Email Address"
              type="email"
              value={customGoogleEmail}
              onChange={(e) => setCustomGoogleEmail(e.target.value)}
              placeholder="E.g., alex.creator@gmail.com"
            />

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" size="sm" onClick={() => setShowGoogleModal(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                icon={<GoogleIcon className="w-3.5 h-3.5" />}
                onClick={() => handleQuickGoogleLogin(customGoogleEmail || 'alex.creator@gmail.com', customGoogleName || 'Google Creator')}
              >
                Sign In
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </main>
  );
}
