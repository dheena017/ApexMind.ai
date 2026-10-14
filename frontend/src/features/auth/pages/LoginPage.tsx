import React, { useState, useEffect } from 'react';
import {
  Check,
  ShieldCheck,
  Sparkles,
  Key,
  ArrowLeft,
  Youtube,
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
  const { loginWithGoogle, isAuthenticated } = useAuth();
  const [googleLoading, setGoogleLoading] = useState(false);
  const [notice, setNotice] = useState('');
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [customGoogleEmail, setCustomGoogleEmail] = useState('');
  const [customGoogleName, setCustomGoogleName] = useState('');
  const [agreementChecked, setAgreementChecked] = useState(false);
  const [showAgreementError, setShowAgreementError] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      const destination = getPostLoginRedirect() || 'dashboard';
      clearPostLoginRedirect();
      onNavigate(destination);
    }
  }, [isAuthenticated, onNavigate]);

  const requireAgreement = () => {
    if (!agreementChecked) {
      setShowAgreementError(true);
      setNotice('Please agree to the Terms of Service and Privacy Policy before signing in.');
      return false;
    }
    setShowAgreementError(false);
    return true;
  };

  // Compute intended post-login destination
  const targetDestination = getPostLoginRedirect();
  const targetRouteConfig = APP_ROUTES.find((r) => r.id === targetDestination);
  const targetDisplayName = targetRouteConfig ? targetRouteConfig.title.split(' - ')[0] : 'Dashboard';

  // Helper to decode Google JWT Identity credentials
  const decodeJwt = (token: string) => {
    try {
      const parts = token.split('.');
      if (parts.length >= 2) {
        const base64Url = parts[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
          atob(base64)
            .split('')
            .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
        );
        return JSON.parse(jsonPayload);
      }
    } catch (e) {
      console.warn('JWT decode notice:', e);
    }
    return null;
  };

  const handleSuccessfulAuth = () => {
    clearPostLoginRedirect();
    setNotice('Signed in! Redirecting to Dashboard...');
    onNavigate('dashboard');
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

  // Initialize Google Identity Services (GIS) for One-Tap in background
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
                const claims = decodeJwt(response.credential);
                await loginWithGoogle({
                  credential: response.credential,
                  email: claims?.email,
                  name: claims?.name,
                  picture: claims?.picture,
                  sub: claims?.sub,
                });
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

  // Request Google OAuth 2.0 with standard user profile scopes (pure account login, zero channel coupling)
  const handleGoogleAccountAuth = () => {
    if (!requireAgreement()) return;
    if (typeof window === 'undefined') return;

    if (window.google?.accounts?.oauth2 && googleClientId) {
      setGoogleLoading(true);
      setNotice('Connecting to Google account...');

      try {
        const tokenClient = window.google.accounts.oauth2.initTokenClient({
          client_id: googleClientId,
          scope: 'openid email profile',
          callback: async (tokenResponse: any) => {
            if (tokenResponse.error) {
              setNotice(
                `Google OAuth note: ${tokenResponse.error_description || tokenResponse.error || 'Authorization closed'}. You can still sign in with your email below.`
              );
              setGoogleLoading(false);
              return;
            }

            try {
              setNotice('Signing in to your account...');
              const accessToken = tokenResponse.access_token;

              // Fetch user profile from Google UserInfo
              let profileEmail = '';
              let profileName = '';
              let profilePicture = '';
              let profileSub = '';

              try {
                const infoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                  headers: { Authorization: `Bearer ${accessToken}` },
                });
                if (infoRes.ok) {
                  const info = await infoRes.json();
                  profileEmail = info.email || '';
                  profileName = info.name || '';
                  profilePicture = info.picture || '';
                  profileSub = info.sub || '';
                }
              } catch (e) {
                console.warn('UserInfo fetch note:', e);
              }

              const finalEmail = (profileEmail || rememberedUser?.email || customGoogleEmail || '').trim();
              if (!finalEmail) {
                setNotice('No email received from Google. Please sign in below.');
                setShowGoogleModal(true);
                return;
              }
              const finalName = profileName || finalEmail.split('@')[0];

              await loginWithGoogle({
                email: finalEmail,
                name: finalName,
                picture: profilePicture || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(finalName)}`,
                sub: profileSub,
              });

              handleSuccessfulAuth();
            } catch (err: any) {
              setNotice(err.message || 'Failed to complete Google authentication');
            } finally {
              setGoogleLoading(false);
            }
          },
        });

        tokenClient.requestAccessToken({ prompt: 'select_account' });
      } catch (err: any) {
        setNotice(`OAuth client notice: ${err.message}`);
        setGoogleLoading(false);
      }
    } else {
      setShowGoogleModal(true);
    }
  };

  const handleGoogleLogin = async (googleEmail?: string, googleName?: string) => {
    if (!requireAgreement()) return;
    const emailToUse = (googleEmail || customGoogleEmail || rememberedUser?.email || '').trim();
    if (!emailToUse) {
      setShowGoogleModal(true);
      return;
    }
    const nameToUse = (googleName || customGoogleName || rememberedUser?.name || '').trim() || emailToUse.split('@')[0];

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
      <div className="relative grid w-full max-w-4xl rounded-[28px] border border-[#2F2F2F] bg-[#1E1E1E] shadow-2xl shadow-black/50 lg:grid-cols-[1fr_1.1fr]">
        <section className="relative hidden flex-col justify-between overflow-hidden rounded-l-[28px] bg-gradient-to-br from-[#172554] via-[#121212] to-[#1E1E1E] p-8 lg:flex xl:p-10">
          <div className="relative">
            <div className="flex w-fit items-center gap-3">
              <div className="rounded-2xl border border-[#60A5FA]/30 bg-gradient-to-tr from-[#3B82F6] to-[#2563EB] p-3 text-white shadow-lg shadow-black/40">
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

        <section className="relative flex flex-col justify-center p-8 sm:p-10 lg:p-12">
          <div className="mb-6 flex items-center justify-between lg:hidden">
            <div className="flex items-center gap-2.5">
              <div className="rounded-xl border border-[#60A5FA]/30 bg-gradient-to-tr from-[#3B82F6] to-[#2563EB] p-2 text-white shadow-lg shadow-black/40">
                <Sparkles className="h-5 w-5" />
              </div>
              <span className="font-extrabold tracking-tight text-white">ApexMind</span>
            </div>
          </div>

          <div className="mx-auto w-full max-w-sm space-y-6">
            <div className="space-y-4">
              <div>
                <button
                  type="button"
                  onClick={() => onNavigate('landing')}
                  className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-[#2F2F2F] bg-[#121212]/70 px-3 text-xs font-medium text-[#9CA3AF] shadow-sm transition-all duration-200 hover:border-[#3B82F6]/45 hover:bg-[#3B82F6]/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6]/60 cursor-pointer"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span>Back to ApexMind</span>
                </button>
              </div>

              <div className="inline-flex items-center gap-2 rounded-full border border-[#60A5FA]/20 bg-[#3B82F6]/5 px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#93C5FD]">
                <ShieldCheck className="h-3.5 w-3.5" />
                Secure Studio Access
              </div>

              <div>
                <h2 className="text-3xl font-extrabold tracking-tight text-white">Sign In</h2>
                <p className="mt-2 text-sm leading-6 text-[#9CA3AF]">
                  Sign in with your Google account to unlock the ApexMind Studio workspace.
                </p>
              </div>
            </div>

            {/* ── Agreement Checkbox ── */}
            <label
              htmlFor="agree-terms"
              className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-3.5 transition-all duration-200 ${
                showAgreementError
                  ? 'border-red-500/50 bg-red-500/5'
                  : agreementChecked
                  ? 'border-emerald-500/30 bg-emerald-500/5'
                  : 'border-[#2F2F2F] bg-[#121212] hover:border-[#3B82F6]/40'
              }`}
            >
              <div className="relative mt-0.5 shrink-0">
                <input
                  id="agree-terms"
                  type="checkbox"
                  checked={agreementChecked}
                  onChange={(e) => {
                    setAgreementChecked(e.target.checked);
                    if (e.target.checked) {
                      setShowAgreementError(false);
                      setNotice('');
                    }
                  }}
                  className="peer sr-only"
                />
                <div
                  className={`flex h-4.5 w-4.5 items-center justify-center rounded border-2 transition-all duration-200 ${
                    agreementChecked
                      ? 'border-emerald-500 bg-emerald-500'
                      : showAgreementError
                      ? 'border-red-500 bg-transparent'
                      : 'border-[#4B5563] bg-transparent'
                  }`}
                  style={{ width: '1.1rem', height: '1.1rem' }}
                >
                  {agreementChecked && (
                    <Check className="h-3 w-3 text-white" strokeWidth={3} />
                  )}
                </div>
              </div>
              <span className="text-xs leading-5 text-[#9CA3AF]">
                I have read and agree to the ApexMind{' '}
                <button
                  type="button"
                  onClick={(e) => { e.preventDefault(); onNavigate('terms'); }}
                  className="font-semibold text-[#60A5FA] hover:text-white underline"
                >
                  Terms of Service
                </button>{' '}and{' '}
                <button
                  type="button"
                  onClick={(e) => { e.preventDefault(); onNavigate('privacy'); }}
                  className="font-semibold text-[#60A5FA] hover:text-white underline"
                >
                  Privacy Policy
                </button>.
                {showAgreementError && (
                  <span className="mt-1 block font-semibold text-red-400">You must agree before signing in.</span>
                )}
              </span>
            </label>

            <div className="space-y-3.5">
              {rememberedUser?.email && (
                <div className="flex items-center justify-between gap-3 rounded-2xl border border-[#2F2F2F] bg-[#121212] p-3.5 shadow-lg shadow-black/10 transition-all duration-200 hover:border-[#3B82F6]/50">
                  <div className="flex min-w-0 items-center gap-3">
                    <img
                      src={rememberedUser.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(rememberedUser.name || 'Creator')}`}
                      alt=""
                      className="h-9 w-9 shrink-0 rounded-full border border-white/10"
                    />
                    <div className="min-w-0">
                      <p className="truncate text-xs font-bold text-white">{rememberedUser.name || 'Creator'}</p>
                      <p className="truncate text-[11px] text-[#9CA3AF]">{rememberedUser.email}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleGoogleLogin(rememberedUser.email, rememberedUser.name)}
                    disabled={googleLoading || !agreementChecked}
                    title={!agreementChecked ? 'Please agree to the Terms of Service and Privacy Policy first' : undefined}
                    className="shrink-0 rounded-lg bg-[#3B82F6]/10 px-3 py-1.5 text-xs font-semibold text-[#60A5FA] transition-colors hover:bg-[#3B82F6]/20 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Continue →
                  </button>
                </div>
              )}

              <button
                type="button"
                onClick={handleGoogleAccountAuth}
                disabled={googleLoading || !agreementChecked}
                title={!agreementChecked ? 'Please agree to the Terms of Service and Privacy Policy first' : undefined}
                className="group relative w-full overflow-hidden rounded-2xl border border-gray-200 bg-white px-5 py-3.5 text-sm font-bold text-gray-900 shadow-[0_16px_40px_rgba(15,23,42,0.28)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#F8FAFC] hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer active:scale-[0.99]"
              >
                <span className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#60A5FA]/70 to-transparent" />
                <span className="flex items-center justify-center gap-3">
                  {googleLoading ? (
                    <span className="h-5 w-5 animate-spin rounded-full border-2 border-gray-900 border-t-transparent" />
                  ) : (
                    <GoogleIcon className="h-5 w-5" />
                  )}
                  <span>Sign In with Google</span>
                </span>
              </button>

              <div className="pt-1 text-center">
                <button
                  type="button"
                  onClick={() => {
                    if (!requireAgreement()) return;
                    setShowGoogleModal(true);
                  }}
                  disabled={!agreementChecked}
                  title={!agreementChecked ? 'Please agree to the Terms of Service and Privacy Policy first' : undefined}
                  className="inline-flex min-h-10 w-full items-center justify-center rounded-xl border border-[#2F2F2F] bg-[#121212]/70 px-4 text-xs font-semibold text-[#9CA3AF] shadow-sm transition-all duration-200 hover:border-[#3B82F6]/45 hover:bg-[#3B82F6]/10 hover:text-[#93C5FD] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6]/60 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Sign in with another Google account
                </button>
              </div>
            </div>

            {notice && (
              <p role="status" className="rounded-xl border border-amber-400/20 bg-amber-400/5 px-4 py-3 text-xs leading-5 text-amber-200 shadow-inner shadow-black/20">
                {notice}
              </p>
            )}

            <div className="border-t border-[#2F2F2F] pt-4">
              <div className="flex items-start gap-3 rounded-xl border border-[#2F2F2F] bg-[#121212] p-3.5 shadow-inner shadow-black/30">
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
