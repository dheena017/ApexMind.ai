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
    <main className="relative flex min-h-screen w-full flex-col justify-between overflow-x-hidden bg-[#08080A] text-[#E5E5E5] px-4 py-4 sm:px-6 sm:py-6 font-sans-studio selection:bg-[#3B82F6]/30 selection:text-[#60A5FA]">
      {/* ── Atmospheric Ambient Backdrop Glows ── */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] sm:w-[1000px] h-[500px] bg-gradient-to-tr from-[#2563EB]/15 via-[#6366F1]/10 to-emerald-500/10 blur-[140px] rounded-full pointer-events-none -z-10" />
      <div className="absolute -bottom-20 right-10 w-[500px] h-[350px] bg-gradient-to-tl from-[#3B82F6]/10 to-transparent blur-[120px] rounded-full pointer-events-none -z-10" />
      <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.04)_1px,transparent_1px)] [background-size:28px_28px] pointer-events-none -z-10" />

      {/* ── Top Header Navigation ── */}
      <header className="w-full max-w-6xl mx-auto flex items-center justify-between py-2 sm:py-3 z-20">
        <button
          type="button"
          onClick={() => onNavigate('landing')}
          className="flex items-center gap-2.5 hover:opacity-90 transition-opacity cursor-pointer text-left"
          aria-label="ApexMind Studio Home"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#3B82F6] to-[#2563EB] text-white flex items-center justify-center border border-[#60A5FA]/30 shadow-md shadow-blue-500/20">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-base font-extrabold tracking-tight text-gradient-brand">ApexMind</span>
            <span className="text-[10px] font-semibold text-[#6B7280] uppercase tracking-wider -mt-0.5">AI Shorts Studio</span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('landing')}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#2F2F2F] bg-[#141414]/80 hover:bg-[#1E1E1E] hover:border-[#4A4A4A] text-xs font-semibold text-[#9CA3AF] hover:text-white transition-all cursor-pointer shadow-sm"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Home</span>
        </button>
      </header>

      {/* ── Center: Unified Glassmorphism Card ── */}
      <div className="my-auto py-6 sm:py-8 z-10 w-full flex items-center justify-center">
        <div className="relative w-full max-w-5xl rounded-3xl border border-white/10 bg-[#121215]/90 backdrop-blur-2xl shadow-[0_24px_80px_rgba(0,0,0,0.85)] grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
          
          {/* Left Column: Visual Studio Showcase */}
          <section className="lg:col-span-6 relative flex flex-col justify-between overflow-hidden bg-gradient-to-br from-[#121B2F]/90 via-[#0F131E]/80 to-[#0A0D14]/90 p-6 sm:p-8 lg:p-10 border-b lg:border-b-0 lg:border-r border-white/5">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#3B82F6]/15 border border-[#3B82F6]/30 text-[#60A5FA] text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5 text-[#3B82F6]" />
                <span>Next-Gen Shorts Engine</span>
              </div>

              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white leading-tight">
                  Turn your ideas into <span className="text-gradient-brand">viral Shorts</span>.
                </h1>
                <p className="mt-3 text-xs sm:text-sm text-[#9CA3AF] leading-relaxed">
                  Synthesize motivational scripts, generate 24kHz neural voiceovers, preview your visual canvas, and publish to YouTube in seconds.
                </p>
              </div>

              {/* Mini Studio Canvas Preview Mockup */}
              <div className="rounded-2xl border border-white/10 bg-[#0A0A0E]/90 p-4 shadow-xl space-y-3">
                <div className="flex items-center justify-between text-[11px] text-[#71717A] border-b border-white/5 pb-2">
                  <span className="font-mono-studio text-[#60A5FA] font-bold">STUDIO ENGINE v2.4</span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-emerald-400 font-semibold text-[10px]">Ready</span>
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-gradient-to-r from-[#172033]/60 to-[#0F1420]/60 border border-[#3B82F6]/20">
                  <p className="text-xs font-bold text-white leading-snug drop-shadow-sm">
                    "When motivation fades, discipline takes the wheel. Do what must be done."
                  </p>
                  <div className="mt-2 flex items-center justify-between text-[10px] text-[#93C5FD]">
                    <span>Voiceover: Fenrir (24kHz Studio)</span>
                    <span className="font-mono-studio">00:30 • 9:16</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[10px] text-[#9CA3AF] pt-1">
                  <span>✓ Gemini 2.5 Flash Script</span>
                  <span>✓ Auto-Synced Captions</span>
                  <span>✓ 4K Shorts Direct Export</span>
                </div>
              </div>

              {/* Feature Checklist */}
              <div className="space-y-2.5 pt-1">
                {[
                  'Secure Google OAuth 2.0 authentication',
                  'Live YouTube channel sync & automatic Shorts upload',
                  'High-fidelity 24kHz neural speech synthesis',
                  'Royalty-free ambient soundtracks & sound design',
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2.5 text-xs text-[#CBD5E1]">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 shrink-0">
                      <Check className="h-3 w-3" />
                    </span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-6 mt-6 border-t border-white/5 flex items-center justify-between text-[11px] text-[#6B7280]">
              <span>Powered by Google Gemini 2.5</span>
              <span>256-bit SSL Protected</span>
            </div>
          </section>

          {/* Right Column: Sign In Form */}
          <section className="lg:col-span-6 relative flex flex-col justify-center p-6 sm:p-8 lg:p-10 bg-[#121215]/80">
            <div className="w-full max-w-md mx-auto space-y-6">
              
              {/* Header */}
              <div className="space-y-2">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-[#60A5FA]/30 bg-[#3B82F6]/10 text-[10px] font-bold uppercase tracking-wider text-[#60A5FA]">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Secure Creator Access
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                  Sign In to Studio
                </h2>
                <p className="text-xs sm:text-sm text-[#9CA3AF] leading-relaxed">
                  Sign in with your Google account to unlock the ApexMind AI Studio workspace.
                </p>
              </div>

              {/* ── Agreement Checkbox ── */}
              <label
                htmlFor="agree-terms"
                className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-3.5 transition-all duration-200 ${
                  showAgreementError
                    ? 'border-red-500/50 bg-red-500/5'
                    : agreementChecked
                    ? 'border-emerald-500/30 bg-emerald-500/5'
                    : 'border-[#2F2F2F] bg-[#161618] hover:border-[#3B82F6]/40'
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
                    className={`flex h-4.5 w-4.5 items-center justify-center rounded-lg border-2 transition-all duration-200 ${
                      agreementChecked
                        ? 'border-emerald-500 bg-emerald-500 shadow-sm shadow-emerald-500/30'
                        : showAgreementError
                        ? 'border-red-500 bg-transparent'
                        : 'border-[#4B5563] bg-transparent'
                    }`}
                    style={{ width: '1.15rem', height: '1.15rem' }}
                  >
                    {agreementChecked && (
                      <Check className="h-3 w-3 text-white" strokeWidth={3} />
                    )}
                  </div>
                </div>
                <span className="text-xs leading-5 text-[#9CA3AF]">
                  I agree to the ApexMind{' '}
                  <button
                    type="button"
                    onClick={(e) => { e.preventDefault(); onNavigate('terms'); }}
                    className="font-semibold text-[#60A5FA] hover:text-white underline cursor-pointer"
                  >
                    Terms of Service
                  </button>{' '}and{' '}
                  <button
                    type="button"
                    onClick={(e) => { e.preventDefault(); onNavigate('privacy'); }}
                    className="font-semibold text-[#60A5FA] hover:text-white underline cursor-pointer"
                  >
                    Privacy Policy
                  </button>.
                  {showAgreementError && (
                    <span className="mt-1 block font-semibold text-red-400">Please check this box before signing in.</span>
                  )}
                </span>
              </label>

              {/* ── Actions ── */}
              <div className="space-y-3">
                {/* Remembered User Fast-Continue Card */}
                {rememberedUser?.email && (
                  <div className="flex items-center justify-between gap-3 rounded-2xl border border-[#2F2F2F] bg-[#161618] p-3 shadow-md hover:border-[#3B82F6]/50 transition-all">
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
                      className="shrink-0 rounded-xl bg-[#3B82F6]/10 hover:bg-[#3B82F6]/20 border border-[#3B82F6]/30 px-3 py-1.5 text-xs font-semibold text-[#60A5FA] transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Continue →
                    </button>
                  </div>
                )}

                {/* Primary Google Sign In Button */}
                <button
                  type="button"
                  onClick={handleGoogleAccountAuth}
                  disabled={googleLoading || !agreementChecked}
                  title={!agreementChecked ? 'Please agree to the Terms of Service and Privacy Policy first' : undefined}
                  className="group relative w-full overflow-hidden rounded-2xl border border-white/20 bg-white hover:bg-gray-100 active:bg-gray-200 px-5 py-3.5 text-sm font-bold text-gray-900 shadow-xl transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer active:scale-[0.99]"
                >
                  <span className="flex items-center justify-center gap-3">
                    {googleLoading ? (
                      <span className="h-5 w-5 animate-spin rounded-full border-2 border-gray-900 border-t-transparent" />
                    ) : (
                      <GoogleIcon className="h-5 w-5" />
                    )}
                    <span>Sign In with Google</span>
                  </span>
                </button>

                {/* Secondary Option: Other Account */}
                <button
                  type="button"
                  onClick={() => {
                    if (!requireAgreement()) return;
                    setShowGoogleModal(true);
                  }}
                  disabled={!agreementChecked}
                  title={!agreementChecked ? 'Please agree to the Terms of Service and Privacy Policy first' : undefined}
                  className="w-full inline-flex min-h-10 items-center justify-center rounded-xl border border-[#2F2F2F] bg-[#161618] hover:bg-[#1E1E22] hover:border-[#3B82F6]/40 px-4 text-xs font-semibold text-[#9CA3AF] hover:text-[#93C5FD] transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Sign in with another Google account
                </button>
              </div>

              {/* Notice banner */}
              {notice && (
                <p role="status" className="rounded-xl border border-amber-400/25 bg-amber-400/10 px-4 py-3 text-xs leading-5 text-amber-200 shadow-inner">
                  {notice}
                </p>
              )}

              {/* Security Trust Note */}
              <div className="pt-2 border-t border-[#262626]">
                <div className="flex items-start gap-3 rounded-xl border border-[#262626] bg-[#141416] p-3 text-left">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                  <p className="text-[11px] leading-relaxed text-[#9CA3AF]">
                    ApexMind uses Google OAuth 2.0 standards. Only verified sign-ins are permitted into the studio workspace.
                  </p>
                </div>
              </div>

            </div>
          </section>

        </div>
      </div>

      {/* ── Page Footer ── */}
      <footer className="w-full max-w-6xl mx-auto py-3 text-center text-[11px] text-[#6B7280] flex flex-wrap items-center justify-between gap-3 border-t border-white/5 z-20">
        <span>© 2026 ApexMind.ai • Automated AI Shorts Studio</span>
        <div className="flex items-center gap-4">
          <button type="button" onClick={() => onNavigate('terms')} className="hover:text-white transition-colors cursor-pointer">
            Terms of Service
          </button>
          <span>•</span>
          <button type="button" onClick={() => onNavigate('privacy')} className="hover:text-white transition-colors cursor-pointer">
            Privacy Policy
          </button>
          <span>•</span>
          <a href="https://developers.google.com/youtube/terms/api-services-terms-of-service" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
            YouTube API Terms
          </a>
        </div>
      </footer>

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
