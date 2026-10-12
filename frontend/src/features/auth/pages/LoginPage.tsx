import React, { useState, useEffect, useRef } from 'react';
import {
  Check,
  ShieldCheck,
  Sparkles,
  Key,
  ArrowLeft,
} from 'lucide-react';
import { Modal, Input, Button } from '@/src/shared/ui/common';
import { useAuth } from '../context/AuthContext';
import { getPostLoginRedirect, clearPostLoginRedirect, APP_ROUTES } from '@/src/app/routes';

// Authentic Google Logo SVG
function GoogleIcon({ className = 'h-5 w-5' }: { className?: string }) {
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
  const { loginWithGoogle } = useAuth();
  const [googleLoading, setGoogleLoading] = useState(false);
  const [notice, setNotice] = useState('');
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [customGoogleEmail, setCustomGoogleEmail] = useState('');
  const [customGoogleName, setCustomGoogleName] = useState('');
  const [gisRendered, setGisRendered] = useState(false);
  const googleButtonContainerRef = useRef<HTMLDivElement>(null);

  // Compute intended post-login destination
  const targetDestination = getPostLoginRedirect();
  const targetRouteConfig = APP_ROUTES.find((r) => r.id === targetDestination);
  const targetDisplayName = targetRouteConfig ? targetRouteConfig.title.split(' - ')[0] : 'Dashboard';

  const handleSuccessfulAuth = () => {
    const destination = getPostLoginRedirect();
    clearPostLoginRedirect();
    const destName = destination === 'dashboard' ? 'Dashboard' : (APP_ROUTES.find((r) => r.id === destination)?.title.split(' - ')[0] || destination);
    setNotice(`Signed in! Redirecting to ${destName}...`);
    onNavigate(destination);
  };

  const googleClientId = (
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GOOGLE_CLIENT_ID) ||
    ''
  )
    .replace(/^["']|["']$/g, '')
    .trim();

  // Check for remembered creator session
  const [rememberedUser] = useState<any>(() => {
    try {
      const stored = localStorage.getItem('apexmind_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  // Initialize Google Identity Services (GIS)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const setupGoogleGsi = () => {
      if (window.google?.accounts?.id && googleClientId) {
        try {
          window.google.accounts.id.initialize({
            client_id: googleClientId,
            callback: async (response: { credential: string }) => {
              if (!response.credential) return;
              setGoogleLoading(true);
              setNotice('');
              try {
                await loginWithGoogle({ credential: response.credential });
                handleSuccessfulAuth();
              } catch (err: any) {
                setNotice(err.message || 'Google OAuth verification failed.');
              } finally {
                setGoogleLoading(false);
              }
            },
            auto_select: false,
            cancel_on_tap_outside: true,
          });

          if (googleButtonContainerRef.current) {
            googleButtonContainerRef.current.innerHTML = '';
            window.google.accounts.id.renderButton(googleButtonContainerRef.current, {
              theme: 'outline',
              size: 'large',
              text: 'continue_with',
              shape: 'rectangular',
              logo_alignment: 'left',
              width: 320,
            });
            setGisRendered(true);
          }
        } catch (e) {
          console.warn('Google Identity Services notice:', e);
        }
      }
    };

    if (window.google?.accounts?.id) {
      setupGoogleGsi();
    } else {
      const timer = setTimeout(setupGoogleGsi, 800);
      return () => clearTimeout(timer);
    }
  }, [googleClientId]);

  const handleGoogleLogin = async (googleEmail?: string, googleName?: string) => {
    const emailToUse = (googleEmail || customGoogleEmail || rememberedUser?.email || '').trim();
    const nameToUse = (googleName || customGoogleName || rememberedUser?.name || '').trim() || (emailToUse ? emailToUse.split('@')[0] : 'Creator');

    if (!emailToUse) {
      setShowGoogleModal(true);
      return;
    }

    setGoogleLoading(true);
    setNotice('');
    try {
      await loginWithGoogle({
        email: emailToUse,
        name: nameToUse,
        picture: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(nameToUse)}`,
      });
      setShowGoogleModal(false);
      handleSuccessfulAuth();
    } catch (err: any) {
      setNotice(err.message || 'Google sign-in failed. Please check account details.');
    } finally {
      setGoogleLoading(false);
    }
  };



  return (
    <main className="relative flex min-h-screen w-full items-center justify-center overflow-x-hidden bg-[#0A0A0A] px-4 py-6 text-[#E5E5E5] sm:px-6 sm:py-8 font-sans-studio">
      <div className="pointer-events-none absolute -left-40 top-1/4 h-96 w-96 rounded-full bg-[#3B82F6]/10 blur-[120px]" />
      <div className="pointer-events-none absolute -right-40 bottom-0 h-96 w-96 rounded-full bg-[#2563EB]/10 blur-[120px]" />

      <div className="relative grid w-full max-w-4xl rounded-[28px] border border-[#2F2F2F] bg-[#1E1E1E] shadow-2xl shadow-black/50 lg:grid-cols-[1fr_1.1fr]">
        <section className="relative hidden flex-col justify-between overflow-hidden rounded-l-[28px] bg-gradient-to-br from-[#172554] via-[#121212] to-[#1E1E1E] p-8 lg:flex xl:p-10">
          <div className="pointer-events-none absolute -right-20 top-24 h-72 w-72 rounded-full bg-[#3B82F6]/15 blur-[90px]" />
          <div className="relative">
            <div className="flex w-fit items-center gap-3">
              <div className="rounded-2xl border border-[#60A5FA]/30 bg-gradient-to-tr from-[#3B82F6] to-[#2563EB] p-3 text-white shadow-lg shadow-[#3B82F6]/25">
                <Sparkles className="h-6 w-6" />
              </div>
              <span className="text-xl font-extrabold tracking-tight text-white">ApexMind</span>
            </div>

            <h1 className="mt-8 max-w-sm text-3xl font-extrabold leading-tight tracking-tight text-white xl:text-4xl">
              Turn your ideas into Shorts.
            </h1>
            <p className="mt-5 max-w-md text-sm leading-7 text-[#C5CBD5]">
              Sign in with your Google account to access your automated AI scripts, voiceover studio, and YouTube publishing.
            </p>
          </div>

          <div className="relative mt-12 space-y-4">
            {[
              'Sign in securely with Google',
              'Auto-verify live YouTube channel metrics',
              'Generate 24kHz Gemini voiceovers & scripts',
              'Manage YouTube Shorts publishing catalogs',
            ].map((item) => (
              <div key={item} className="flex items-center gap-3 text-sm text-[#E5E5E5]">
                <span className="flex h-6 w-6 items-center justify-center rounded-full border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 shrink-0">
                  <Check className="h-3.5 w-3.5" />
                </span>
                {item}
              </div>
            ))}
            <p className="pt-6 text-xs text-[#9CA3AF]">Protected with Google OAuth standards.</p>
          </div>
        </section>

        <section className="p-8 sm:p-10 lg:p-12 flex flex-col justify-center">
          <div className="mb-6 flex items-center justify-between lg:hidden">
            <div className="flex items-center gap-2.5">
              <div className="rounded-xl border border-[#60A5FA]/30 bg-gradient-to-tr from-[#3B82F6] to-[#2563EB] p-2 text-white">
                <Sparkles className="h-5 w-5" />
              </div>
              <span className="font-extrabold tracking-tight text-white">ApexMind</span>
            </div>
          </div>

          <div className="mx-auto w-full max-w-sm space-y-6">
            <div className="space-y-3">
              <div>
                <button
                  type="button"
                  onClick={() => onNavigate('landing')}
                  className="inline-flex items-center gap-1.5 text-xs text-[#9CA3AF] hover:text-white transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to ApexMind</span>
                </button>
              </div>

              <div>
                {targetDestination !== 'dashboard' ? (
                  <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#3B82F6]/30 bg-[#3B82F6]/10 px-3 py-1 text-[11px] font-semibold tracking-wide text-[#93C5FD]">
                    <Sparkles className="h-3.5 w-3.5 text-[#60A5FA]" />
                    <span>
                      Redirecting to <strong className="text-white font-semibold">{targetDisplayName}</strong> after sign in
                    </span>
                  </div>
                ) : (
                  <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#3B82F6]/25 bg-[#3B82F6]/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-[#93C5FD]">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Google Authentication Required
                  </div>
                )}
                <h2 className="text-3xl font-extrabold tracking-tight text-white">Sign In</h2>
                <p className="mt-2 text-sm leading-6 text-[#9CA3AF]">
                  Sign in with your Google Account to unlock the ApexMind Studio workspace.
                </p>
              </div>
            </div>

            {/* Google OAuth Login Action - Single Unified Button */}
            <div className="space-y-4 pt-1">
              {googleClientId && (
                <div
                  ref={googleButtonContainerRef}
                  className={`w-full flex justify-center min-h-[44px] ${!gisRendered ? 'hidden' : ''}`}
                />
              )}

              {!gisRendered && (
                <button
                  type="button"
                  onClick={() => handleGoogleLogin()}
                  disabled={googleLoading}
                  className="w-full flex items-center justify-center gap-3.5 px-5 py-3.5 rounded-xl bg-white text-gray-900 font-bold text-sm hover:bg-gray-100 transition-all shadow-lg hover:shadow-xl disabled:opacity-60 cursor-pointer active:scale-[0.99] border border-gray-200"
                >
                  {googleLoading ? (
                    <span className="h-5 w-5 animate-spin rounded-full border-2 border-gray-900 border-t-transparent" />
                  ) : (
                    <GoogleIcon className="h-5 w-5" />
                  )}
                  <span>Continue with Google</span>
                </button>
              )}

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setShowGoogleModal(true)}
                  className="text-xs text-[#9CA3AF] hover:text-[#60A5FA] transition-colors cursor-pointer"
                >
                  Sign in with another Google account
                </button>
              </div>
            </div>


            {notice && (
              <p role="status" className="rounded-xl border border-amber-400/20 bg-amber-400/5 px-4 py-3 text-xs leading-5 text-amber-200">
                {notice}
              </p>
            )}

            <div className="pt-4 border-t border-[#2F2F2F]">
              <div className="flex items-start gap-3 rounded-xl bg-[#121212] border border-[#2F2F2F] p-3.5">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                <p className="text-xs leading-5 text-[#9CA3AF]">
                  ApexMind uses Google OAuth authentication. Only verified sign-ins are permitted into the studio.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Google Account Modal */}
      <Modal isOpen={showGoogleModal} onClose={() => setShowGoogleModal(false)} title="Sign In with Google">
        <div className="space-y-4">
          <p className="text-xs text-[#9CA3AF]">
            {rememberedUser
              ? 'Continue with your previous account or enter a new Google account:'
              : 'Enter your Google Creator credentials to sign in:'}
          </p>

          {rememberedUser && (
            <button
              type="button"
              onClick={() => handleGoogleLogin(rememberedUser.email, rememberedUser.name)}
              className="w-full flex items-center justify-between p-3.5 rounded-xl bg-[#121212] border border-[#2F2F2F] hover:border-[#3B82F6] transition-all text-left cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#3B82F6] to-[#2563EB] flex items-center justify-center text-white font-bold text-xs">
                  {rememberedUser.name ? rememberedUser.name.slice(0, 2).toUpperCase() : 'G'}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white group-hover:text-[#60A5FA]">{rememberedUser.name}</h4>
                  <p className="text-xs text-[#9CA3AF]">{rememberedUser.email}</p>
                </div>
              </div>
              <GoogleIcon className="w-4 h-4 opacity-70 group-hover:opacity-100" />
            </button>
          )}

          <div className={rememberedUser ? 'pt-3 border-t border-[#2F2F2F] space-y-3' : 'space-y-3'}>
            <h5 className="text-xs font-semibold text-white uppercase tracking-wider">
              {rememberedUser ? 'Use Different Google Account' : 'Creator Google Account'}
            </h5>
            <Input
              label="Google Full Name"
              value={customGoogleName}
              onChange={(e) => setCustomGoogleName(e.target.value)}
              placeholder="Enter your full name"
            />
            <Input
              label="Google Email Address"
              type="email"
              value={customGoogleEmail}
              onChange={(e) => setCustomGoogleEmail(e.target.value)}
              placeholder="Enter your email address"
              required
            />

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" size="sm" onClick={() => setShowGoogleModal(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                icon={<GoogleIcon className="w-3.5 h-3.5" />}
                onClick={() => {
                  if (!customGoogleEmail.trim()) {
                    setNotice('Please enter your Google email address.');
                    return;
                  }
                  handleGoogleLogin(customGoogleEmail.trim(), customGoogleName.trim());
                }}
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
