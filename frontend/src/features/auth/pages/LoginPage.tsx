import React, { useState, useEffect, useRef } from 'react';
import {
  Check,
  ArrowLeft,
  Youtube,
  Facebook,
  Instagram,
  AtSign,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  Sparkles,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import { Modal, Input, Button } from '@/src/shared/ui/common';
import { useAuth, isSessionValid } from '../context/AuthContext';
import { getPostLoginRedirect, clearPostLoginRedirect } from '@/src/app/routes';
import { connectYouTubeWithGoogle, getGoogleClientId } from '@/src/features/youtube/utils/googleOAuthConnect';
import { authApi } from '../api/authApi';
import { MetaLoginProvider } from '../types';
import { navigateOAuthPopup, openOAuthPopup } from '@/src/shared/utils/oauthPopup';

// ── Google SVG Icon ──
function GoogleIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </svg>
  );
}

export default function LoginPage({ onNavigate }: { onNavigate: (page: string) => void }) {
  const { loginWithEmail, registerWithEmail, loginWithGoogle, loginWithMeta, loginWithChannel, isAuthenticated } = useAuth();

  // Auth Modes: 'signin' | 'register'
  const [authMode, setAuthMode] = useState<'signin' | 'register'>('signin');
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<{ text: string; type: 'error' | 'success' | 'info' } | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Agreements & Modal
  const [agreementChecked, setAgreementChecked] = useState(false);
  const [showAgreementError, setShowAgreementError] = useState(false);
  const [showChannelModal, setShowChannelModal] = useState(false);
  const [channelHandleInput, setChannelHandleInput] = useState('');
  const [channelNameInput, setChannelNameInput] = useState('');
  const handlingMetaCallback = useRef(false);

  // Auto-redirect if session is active
  useEffect(() => {
    if (isAuthenticated || isSessionValid()) {
      const destination = getPostLoginRedirect() || 'dashboard';
      clearPostLoginRedirect();
      window.setTimeout(() => onNavigate(destination), 50);
    }
  }, [isAuthenticated, onNavigate]);

  useEffect(() => {
    if (handlingMetaCallback.current) return;
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const callbackState = params.get('state');
    const providerError = params.get('error_description') || params.get('error');
    if (!code && !callbackState && !providerError) return;

    handlingMetaCallback.current = true;
    const savedFlow = sessionStorage.getItem('apexmind_meta_login');
    sessionStorage.removeItem('apexmind_meta_login');
    window.history.replaceState(window.history.state, '', window.location.pathname);

    let flow: { provider: MetaLoginProvider; state: string } | null = null;
    try {
      flow = savedFlow ? JSON.parse(savedFlow) as { provider: MetaLoginProvider; state: string } : null;
    } catch {
      flow = null;
    }

    if (providerError) {
      setNotice({ text: `Sign-in was cancelled or denied: ${providerError}`, type: 'error' });
      return;
    }
    if (!flow || !code || !callbackState || flow.state !== callbackState) {
      setNotice({ text: 'Social sign-in could not be verified. Please try again.', type: 'error' });
      return;
    }

    setLoading(true);
    setNotice({ text: `Signing in with ${flow.provider === 'facebook' ? 'Facebook' : 'Instagram'}...`, type: 'info' });
    void loginWithMeta(flow.provider, code, callbackState)
      .then(() => handleSuccessfulAuth())
      .catch((err: unknown) => {
        setNotice({
          text: err instanceof Error ? err.message : 'Social sign-in failed. Please try again.',
          type: 'error',
        });
        setLoading(false);
      });
  }, [loginWithMeta]);

  const requireAgreement = () => {
    if (!agreementChecked) {
      setShowAgreementError(true);
      setNotice({ text: 'Please agree to the Terms of Service and Privacy Policy to proceed.', type: 'error' });
      return false;
    }
    setShowAgreementError(false);
    return true;
  };

  const handleSuccessfulAuth = () => {
    const destination = getPostLoginRedirect() || 'dashboard';
    clearPostLoginRedirect();
    setNotice({ text: 'Authentication successful! Loading Studio...', type: 'success' });
    onNavigate(destination);
  };

  // Check for remembered user in storage
  const [rememberedUser] = useState<any>(() => {
    try {
      const stored = localStorage.getItem('apexmind_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  // ── Handle Email/Password Sign-In or Register ──
  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requireAgreement()) return;

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (!cleanEmail || !cleanEmail.includes('@')) {
      setNotice({ text: 'Please enter a valid email address.', type: 'error' });
      return;
    }
    if (cleanPassword.length < 6) {
      setNotice({ text: 'Password must be at least 6 characters long.', type: 'error' });
      return;
    }

    setLoading(true);
    setNotice(null);

    try {
      if (authMode === 'register') {
        const cleanName = name.trim();
        if (cleanName.length < 2) {
          setNotice({ text: 'Please enter your full or display name (min 2 characters).', type: 'error' });
          setLoading(false);
          return;
        }
        await registerWithEmail({
          email: cleanEmail,
          password: cleanPassword,
          name: cleanName,
        });
        setNotice({ text: 'Account created! Redirecting to Studio...', type: 'success' });
      } else {
        await loginWithEmail({
          email: cleanEmail,
          password: cleanPassword,
        });
        setNotice({ text: 'Signed in successfully! Redirecting...', type: 'success' });
      }
      handleSuccessfulAuth();
    } catch (err: any) {
      setNotice({ text: err.message || 'Authentication failed. Please verify credentials.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // ── Handle Google Sign-In ──
  const handleGoogleAuth = () => {
    if (!requireAgreement()) return;

    setLoading(true);
    setNotice({ text: 'Connecting with Google...', type: 'info' });

    const clientId = getGoogleClientId();

    if (!clientId) {
      setLoading(false);
      setNotice({ text: 'Google Sign-In is not configured. Add VITE_GOOGLE_CLIENT_ID to the environment.', type: 'error' });
      return;
    }

    fallbackGoogleOAuth(clientId);
  };

  const handleMetaAuth = async (provider: MetaLoginProvider) => {
    if (!requireAgreement()) return;

    const authWindow = openOAuthPopup();
    if (!authWindow) {
      setNotice({ text: 'Allow pop-ups to continue with secure social sign-in.', type: 'error' });
      return;
    }

    setLoading(true);
    setNotice({ text: `Connecting with ${provider === 'facebook' ? 'Facebook' : 'Instagram'}...`, type: 'info' });
    try {
      const { authorizationUrl, state } = await authApi.getMetaAuthorizationUrl(provider);
      const savedFlow = JSON.stringify({ provider, state });
      sessionStorage.setItem('apexmind_meta_login', savedFlow);
      authWindow.sessionStorage.setItem('apexmind_meta_login', savedFlow);
      navigateOAuthPopup(authWindow, authorizationUrl);
    } catch (err: unknown) {
      authWindow.close();
      setLoading(false);
      setNotice({
        text: err instanceof Error ? err.message : 'Social sign-in could not be started.',
        type: 'error',
      });
    }
  };

  const fallbackGoogleOAuth = (clientId: string) => {
    if (clientId && typeof window !== 'undefined' && (window as any).google?.accounts?.oauth2) {
      try {
        const tokenClient = (window as any).google.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope: 'openid email profile',
          callback: async (tokenResp: any) => {
            if (tokenResp.error || !tokenResp.access_token) {
              setLoading(false);
              setNotice({
                text: tokenResp.error_description || 'Google sign-in did not return an access token.',
                type: 'error',
              });
              return;
            }
            if (tokenResp.access_token) {
              try {
                // Fetch profile info from Google userinfo endpoint
                const userinfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                  headers: { Authorization: `Bearer ${tokenResp.access_token}` },
                });
                if (userinfoRes.ok) {
                  const info = await userinfoRes.json();
                  if (!info.email || info.email_verified !== true) {
                    throw new Error('Google did not provide a verified email address for this account.');
                  }
                  await loginWithGoogle({
                    email: info.email,
                    name: info.name,
                    avatarUrl: info.picture,
                    googleId: info.sub,
                  });
                  handleSuccessfulAuth();
                  return;
                } else {
                  throw new Error('Could not retrieve your Google account details. Please try again.');
                }
              } catch (fetchErr) {
                setNotice({
                  text: fetchErr instanceof Error ? fetchErr.message : 'Google authentication failed.',
                  type: 'error',
                });
              }
            }
            setLoading(false);
          },
        });
        tokenClient.requestAccessToken({ prompt: 'select_account' });
        return;
      } catch (oauthErr) {
        setLoading(false);
        setNotice({
          text: oauthErr instanceof Error ? oauthErr.message : 'Google sign-in could not be started.',
          type: 'error',
        });
        return;
      }
    }

    setLoading(false);
    setNotice({ text: 'Google Sign-In is unavailable. Please refresh and try again.', type: 'error' });
  };

  // ── Legacy Channel Direct Sign-In ──
  const handleDirectChannelLogin = async (handle?: string, channelName?: string) => {
    if (!requireAgreement()) return;
    const targetHandle = (handle || channelHandleInput || '').trim();
    if (!targetHandle) {
      setNotice({ text: 'Please enter a YouTube Channel handle or title.', type: 'error' });
      return;
    }

    const cleanHandle = targetHandle.startsWith('@') ? targetHandle : `@${targetHandle}`;
    const cleanName = (channelName || channelNameInput || '').trim() || cleanHandle.replace('@', '');

    setLoading(true);
    setNotice({ text: 'Authenticating channel session...', type: 'info' });

    try {
      await loginWithChannel({
        handle: cleanHandle,
        name: cleanName,
        avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(cleanName)}`,
      });
      setShowChannelModal(false);
      handleSuccessfulAuth();
    } catch (err: any) {
      setNotice({ text: err.message || 'Channel sign-in failed.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Fast-Continue for Remembered User
  const handleContinueRemembered = () => {
    if (!rememberedUser) return;
    setLoading(true);
    setNotice({ text: 'Continuing session...', type: 'info' });
    try {
      let token = localStorage.getItem('apexmind_token');
      if (!token) {
        token = `tok_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
        localStorage.setItem('apexmind_token', token);
      }
      localStorage.setItem('apexmind_user', JSON.stringify(rememberedUser));
      localStorage.setItem('apexmind_auth_timestamp', Date.now().toString());

      if (rememberedUser.handle) {
        localStorage.setItem('apexmind_yt_active_channel', rememberedUser.handle);
      }
      handleSuccessfulAuth();
    } catch {
      onNavigate('dashboard');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative min-h-screen w-full flex flex-col justify-between overflow-hidden bg-[#09090B] text-[#E5E5E5] font-sans-studio select-none selection:bg-[#2563EB]/40 selection:text-white">
      {/* ── Background: Ambient lights ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-[10%] left-[20%] w-[480px] h-[480px] rounded-full bg-gradient-to-br from-red-600/20 via-red-900/10 to-transparent blur-[130px] opacity-30" />
        <div className="absolute bottom-[5%] right-[15%] w-[420px] h-[420px] rounded-full bg-gradient-to-tl from-[#2563EB]/20 via-blue-900/10 to-transparent blur-[140px] opacity-25" />
      </div>

      {/* ── Crisp dark dot pattern overlay ── */}
      <div
        className="absolute inset-0 z-0 pointer-events-none opacity-30"
        style={{
          backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.12) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      {/* ── Top Header ── */}
      <header className="relative z-10 w-full max-w-4xl mx-auto px-4 pt-5 sm:pt-6 flex items-center justify-between">
        <button
          type="button"
          onClick={() => onNavigate('landing')}
          className="flex items-center gap-2.5 hover:opacity-90 cursor-pointer text-left"
          aria-label="ApexMind Studio Home"
        >
          <div className="relative w-8 h-8 rounded-lg bg-gradient-to-br from-red-600 to-rose-700 text-white flex items-center justify-center shadow-lg shadow-red-900/40 border border-red-500/30">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-base font-bold tracking-tight text-white leading-none">ApexMind.ai</span>
            <span className="text-[10px] font-semibold text-rose-400 uppercase tracking-wider mt-0.5">
              Omnichannel Studio
            </span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('landing')}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#27272A] bg-[#141416]/80 backdrop-blur-md hover:bg-[#1C1C20] hover:border-[#3F3F46] text-xs font-medium text-[#A1A1AA] hover:text-white cursor-pointer shadow-sm transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Explore Platform</span>
        </button>
      </header>

      {/* ── Center: Master SaaS Account Sign-In / Register Card ── */}
      <div className="relative z-10 w-full flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-[440px]">
          <div className="relative w-full rounded-2xl border border-[#27272A] bg-[#121215]/95 backdrop-blur-xl shadow-2xl p-7 sm:p-8 space-y-5">
            {/* Card subtle top glow */}
            <div className="absolute -top-px left-10 right-10 h-px bg-gradient-to-r from-transparent via-red-500/50 to-transparent" />

            {/* Card Header & Badge */}
            <div className="text-center space-y-2">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-red-500/30 bg-red-950/30 text-[10px] font-semibold uppercase tracking-wider text-red-400 mx-auto shadow-xs">
                <ShieldCheck className="h-3 w-3" />
                <span>Unified Creator Identity</span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-white">
                {authMode === 'signin' ? 'Sign In to ApexMind' : 'Create Creator Account'}
              </h1>
              <p className="text-xs text-[#A1A1AA] max-w-xs mx-auto leading-relaxed">
                {authMode === 'signin'
                  ? 'Access your studio and manage your connected social accounts.'
                  : 'Start creating, rendering, and publishing autonomous AI Shorts across all platforms.'}
              </p>
            </div>

            {/* ── Mode Switcher Tabs (Sign In / Register) ── */}
            <div className="flex rounded-xl bg-[#18181B] p-1 border border-[#27272A]">
              <button
                type="button"
                onClick={() => {
                  setAuthMode('signin');
                  setNotice(null);
                }}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  authMode === 'signin'
                    ? 'bg-red-600 text-white shadow-sm'
                    : 'text-[#A1A1AA] hover:text-white hover:bg-[#202025]'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMode('register');
                  setNotice(null);
                }}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  authMode === 'register'
                    ? 'bg-red-600 text-white shadow-sm'
                    : 'text-[#A1A1AA] hover:text-white hover:bg-[#202025]'
                }`}
              >
                Create Account
              </button>
            </div>

            {/* ── Remembered User Quick-Continue Card ── */}
            {rememberedUser && authMode === 'signin' && (
              <div className="flex items-center justify-between gap-3 rounded-xl border border-red-500/30 bg-red-950/20 p-3 shadow-sm hover:border-red-500/50 transition-colors">
                <div className="flex min-w-0 items-center gap-3">
                  <img
                    src={
                      rememberedUser.avatarUrl ||
                      `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(rememberedUser.name || 'User')}`
                    }
                    alt=""
                    className="h-8 w-8 shrink-0 rounded-full border border-red-400/40 object-cover"
                  />
                  <div className="min-w-0">
                    <p className="truncate text-xs font-bold text-white flex items-center gap-1.5">
                      <span>{rememberedUser.name || 'Creator'}</span>
                      <span className="text-[9px] bg-red-500/20 text-red-400 px-1 py-0.2 rounded font-mono">
                        Saved
                      </span>
                    </p>
                    <p className="truncate text-[11px] text-zinc-400">{rememberedUser.email}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleContinueRemembered}
                  disabled={loading}
                  className="shrink-0 rounded-lg bg-red-600 hover:bg-red-500 px-3 py-1.5 text-xs font-bold text-white cursor-pointer shadow-sm flex items-center gap-1 transition-colors"
                >
                  <span>Continue</span>
                  <span>→</span>
                </button>
              </div>
            )}

            {/* ── Social Sign-In ── */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={handleGoogleAuth}
                disabled={loading}
                className="rounded-xl border border-[#27272A] bg-[#18181B] hover:bg-[#202025] hover:border-[#3F3F46] px-3 py-2.5 text-xs font-semibold text-white shadow-xs cursor-pointer flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <GoogleIcon className="w-4 h-4" />
                <span>Google</span>
              </button>
              <button
                type="button"
                onClick={() => void handleMetaAuth('facebook')}
                disabled={loading}
                className="rounded-xl border border-[#27272A] bg-[#18181B] hover:bg-[#202025] hover:border-[#3F3F46] px-3 py-2.5 text-xs font-semibold text-white shadow-xs cursor-pointer flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Facebook className="w-4 h-4 text-[#1877F2]" />
                <span>Facebook</span>
              </button>
              <button
                type="button"
                onClick={() => void handleMetaAuth('instagram')}
                disabled={loading}
                aria-label="Continue with Instagram using a professional account"
                title="Instagram professional accounts"
                className="rounded-xl border border-[#27272A] bg-[#18181B] hover:bg-[#202025] hover:border-[#3F3F46] px-3 py-2.5 text-xs font-semibold text-white shadow-xs cursor-pointer flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Instagram className="w-4 h-4 text-[#E1306C]" />
                <span>Instagram</span>
              </button>
            </div>
            <p className="text-center text-[10px] text-[#71717A]">
              Instagram sign-in requires a professional account.
            </p>

            {/* ── Divider ── */}
            <div className="relative flex items-center justify-center">
              <div className="w-full border-t border-[#27272A]" />
              <span className="absolute bg-[#121215] px-2 text-[10px] font-medium uppercase tracking-wider text-[#71717A]">
                or continue with email
              </span>
            </div>

            {/* ── Email & Password Form ── */}
            <form onSubmit={handleEmailAuth} className="space-y-3.5">
              {authMode === 'register' && (
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-[#A1A1AA] flex items-center gap-1">
                    <User className="w-3 h-3 text-red-400" />
                    <span>Display / Full Name</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Alex Rivera"
                    required
                    className="w-full rounded-xl border border-[#27272A] bg-[#18181B] px-3.5 py-2.5 text-xs text-white placeholder-[#52525B] focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 transition-colors"
                  />
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[11px] font-medium text-[#A1A1AA] flex items-center gap-1">
                  <Mail className="w-3 h-3 text-red-400" />
                  <span>Email Address</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  required
                  className="w-full rounded-xl border border-[#27272A] bg-[#18181B] px-3.5 py-2.5 text-xs text-white placeholder-[#52525B] focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 transition-colors"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-medium text-[#A1A1AA] flex items-center gap-1">
                  <Lock className="w-3 h-3 text-red-400" />
                  <span>Password {authMode === 'register' && '(min 6 chars)'}</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full rounded-xl border border-[#27272A] bg-[#18181B] pl-3.5 pr-10 py-2.5 text-xs text-white placeholder-[#52525B] focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((p) => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#71717A] hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* ── Agreement Checkbox ── */}
              <div
                onClick={() => {
                  setAgreementChecked((prev) => !prev);
                  setShowAgreementError(false);
                }}
                className={`flex cursor-pointer items-start gap-2.5 rounded-xl border p-3 select-none transition-colors ${
                  showAgreementError
                    ? 'border-red-500/60 bg-red-500/10'
                    : agreementChecked
                    ? 'border-red-500/40 bg-red-950/20'
                    : 'border-[#27272A] bg-[#18181B]/50 hover:border-[#3F3F46]'
                }`}
              >
                <div className="relative mt-0.5 shrink-0">
                  <input
                    id="agree-terms"
                    type="checkbox"
                    checked={agreementChecked}
                    onChange={(e) => {
                      setAgreementChecked(e.target.checked);
                      if (e.target.checked) setShowAgreementError(false);
                    }}
                    className="peer sr-only"
                  />
                  <div
                    className={`flex h-4 w-4 items-center justify-center rounded border transition-colors ${
                      agreementChecked
                        ? 'border-red-500 bg-red-600'
                        : showAgreementError
                        ? 'border-red-500 bg-transparent'
                        : 'border-[#52525B] bg-transparent'
                    }`}
                  >
                    {agreementChecked && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
                  </div>
                </div>
                <span className="text-[11px] leading-4 text-[#8E8E93]">
                  I agree to the ApexMind{' '}
                  <a
                    href="/terms"
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      onNavigate('terms');
                    }}
                    className="font-medium text-red-400 hover:text-white underline cursor-pointer"
                  >
                    Terms of Service
                  </a>{' '}
                  and{' '}
                  <a
                    href="/privacy"
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      onNavigate('privacy');
                    }}
                    className="font-medium text-red-400 hover:text-white underline cursor-pointer"
                  >
                    Privacy Policy
                  </a>
                  .
                </span>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || !agreementChecked}
                className="w-full rounded-xl bg-red-600 hover:bg-red-500 active:bg-red-700 px-4 py-3 text-xs font-bold text-white shadow-lg shadow-red-950/40 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2 transition-all"
              >
                {loading ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : authMode === 'signin' ? (
                  <span>Sign In to Studio</span>
                ) : (
                  <span>Create Free Account</span>
                )}
              </button>
            </form>

            {/* ── Notice Alert Banner ── */}
            {notice && (
              <div
                role="status"
                className={`flex items-start gap-2 rounded-xl border px-3.5 py-2.5 text-xs leading-5 ${
                  notice.type === 'error'
                    ? 'border-red-500/30 bg-red-950/30 text-red-300'
                    : notice.type === 'success'
                    ? 'border-green-500/30 bg-green-950/30 text-green-300'
                    : 'border-amber-400/25 bg-amber-400/10 text-amber-200'
                }`}
              >
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{notice.text}</span>
              </div>
            )}

            {/* ── Legacy Direct YouTube Channel Sign-In Option ── */}
            <div className="pt-2 border-t border-[#27272A] text-center space-y-2">
              <button
                type="button"
                onClick={() => {
                  if (!requireAgreement()) return;
                  setShowChannelModal(true);
                }}
                disabled={loading || !agreementChecked}
                className="inline-flex items-center gap-1.5 text-[11px] text-[#A1A1AA] hover:text-white cursor-pointer transition-colors"
              >
                <Youtube className="w-3.5 h-3.5 text-red-500 fill-current" />
                <span>Or sign in with YouTube Channel handle directly</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Page Footer ── */}
      <footer className="relative z-10 w-full max-w-4xl mx-auto px-4 py-4 text-center text-[11px] text-[#52525B] flex flex-wrap items-center justify-between gap-3">
        <span>© 2026 ApexMind.ai • Universal Omnichannel Video Studio</span>
        <div className="flex items-center gap-4">
          <button type="button" onClick={() => onNavigate('terms')} className="hover:text-[#A1A1AA] cursor-pointer">
            Terms of Service
          </button>
          <span>•</span>
          <button type="button" onClick={() => onNavigate('privacy')} className="hover:text-[#A1A1AA] cursor-pointer">
            Privacy Policy
          </button>
          <span>•</span>
          <a
            href="https://developers.google.com/youtube/terms/api-services-terms-of-service"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[#A1A1AA]"
          >
            YouTube API Terms
          </a>
        </div>
      </footer>

      {/* ── YouTube Channel Direct Login Modal ── */}
      <Modal
        isOpen={showChannelModal}
        onClose={() => {
          setShowChannelModal(false);
          setChannelHandleInput('');
          setChannelNameInput('');
        }}
        title="Sign In with YouTube Channel"
      >
        <div className="space-y-4">
          <p className="text-xs text-[#9CA3AF]">
            Enter your YouTube Channel handle or title to authenticate your workspace:
          </p>

          <div className="space-y-3">
            <Input
              label="YouTube Channel Handle"
              value={channelHandleInput}
              onChange={(e) => setChannelHandleInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && channelHandleInput.trim()) {
                  handleDirectChannelLogin(channelHandleInput.trim(), channelNameInput.trim());
                }
              }}
              placeholder="e.g. @DailyStoicShorts or MindsetForge"
              autoFocus
              required
            />
            <Input
              label="Channel Display Name (Optional)"
              value={channelNameInput}
              onChange={(e) => setChannelNameInput(e.target.value)}
              placeholder="e.g. Daily Stoic Shorts"
            />

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" size="sm" onClick={() => setShowChannelModal(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                icon={<Youtube className="w-3.5 h-3.5 fill-current" />}
                onClick={() => {
                  if (!channelHandleInput.trim()) {
                    setNotice({ text: 'Please enter your YouTube Channel handle.', type: 'error' });
                    return;
                  }
                  handleDirectChannelLogin(channelHandleInput.trim(), channelNameInput.trim());
                }}
              >
                Sign In as Channel
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </main>
  );
}
