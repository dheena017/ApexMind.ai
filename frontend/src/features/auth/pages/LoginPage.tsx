import { useState, useEffect, useRef } from 'react';
import {
  Check,
  ArrowLeft,
  Facebook,
  Instagram,
  Sparkles,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import { useAuth, isSessionValid } from '../context/AuthContext';
import { getPostLoginRedirect, clearPostLoginRedirect } from '@/src/app/routes';
import { getGoogleClientId } from '@/src/features/youtube/utils/googleOAuthConnect';
import { authApi } from '../api/authApi';
import { ApexMindLogo } from '@/src/shared/ui';
import { navigateOAuthPopup, openOAuthPopup } from '@/src/shared/utils/oauthPopup';

//  Google SVG Icon
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
  const { loginWithGoogle, loginWithFacebook, loginWithInstagram, isAuthenticated } = useAuth();

  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<{ text: string; type: 'error' | 'success' | 'info' } | null>(null);

  // Sign-in agreement
  const [agreementChecked, setAgreementChecked] = useState(false);
  const [showAgreementError, setShowAgreementError] = useState(false);
  const handlingSocialCallback = useRef(false);

  useEffect(() => {
    if (window.location.protocol !== 'http:' || window.location.hostname !== '127.0.0.1') {
      return;
    }

    const localUrl = new URL(window.location.href);
    localUrl.hostname = 'localhost';
    window.location.replace(localUrl.toString());
  }, []);

  // Auto-redirect if session is active
  useEffect(() => {
    if (isAuthenticated || isSessionValid()) {
      const destination = getPostLoginRedirect() || 'dashboard';
      clearPostLoginRedirect();
      window.setTimeout(() => onNavigate(destination), 50);
    }
  }, [isAuthenticated, onNavigate]);

  useEffect(() => {
    if (handlingSocialCallback.current) return;
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const callbackState = params.get('state');
    const providerError = params.get('error_description') || params.get('error');
    if (!code && !callbackState && !providerError) return;

    handlingSocialCallback.current = true;
    const savedFlow = sessionStorage.getItem('apexmind_meta_login');
    sessionStorage.removeItem('apexmind_meta_login');
    window.history.replaceState(window.history.state, '', window.location.pathname);

    let flow: { provider: 'facebook' | 'instagram'; state: string } | null = null;
    try {
      flow = savedFlow
        ? JSON.parse(savedFlow) as { provider: 'facebook' | 'instagram'; state: string }
        : null;
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
    const finishLogin = flow.provider === 'facebook'
      ? loginWithFacebook(code, callbackState)
      : loginWithInstagram(code, callbackState);
    void finishLogin
      .then(() => handleSuccessfulAuth())
      .catch((err: unknown) => {
        setNotice({
          text: err instanceof Error ? err.message : 'Social sign-in failed. Please try again.',
          type: 'error',
        });
        setLoading(false);
      });
  }, [loginWithFacebook, loginWithInstagram]);

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

  //  Handle Google Sign-In
  const handleGoogleAuth = () => {
    if (!requireAgreement()) return;

    setLoading(true);
    setNotice({ text: 'Connecting with Google...', type: 'info' });

    const clientId = getGoogleClientId();

    if (!clientId) {
      setLoading(false);
      setNotice({ text: 'Google Sign-In is not configured. Add GOOGLE_CLIENT_ID to the environment and restart the app.', type: 'error' });
      return;
    }

    fallbackGoogleOAuth(clientId);
  };

  const handleFacebookAuth = async () => {
    if (!requireAgreement()) return;

    if (!import.meta.env.VITE_FACEBOOK_APP_ID?.trim()) {
      setNotice({ text: 'Facebook Sign-In is not configured. Add FACEBOOK_APP_ID to the environment and restart the app.', type: 'error' });
      return;
    }
    setLoading(true);
    setNotice({ text: 'Connecting with Facebook...', type: 'info' });
    try {
      const { authorizationUrl, state } = await authApi.startFacebookLogin();
      sessionStorage.setItem('apexmind_meta_login', JSON.stringify({ provider: 'facebook', state }));
      window.location.assign(authorizationUrl);
    } catch (err: unknown) {
      setLoading(false);
      setNotice({
        text: err instanceof Error ? err.message : 'Facebook sign-in could not be started.',
        type: 'error',
      });
    }
  };

  const handleInstagramAuth = async () => {
    if (!requireAgreement()) return;

    const authWindow = openOAuthPopup();
    if (!authWindow) {
      setNotice({ text: 'Allow pop-ups to continue with secure Instagram sign-in.', type: 'error' });
      return;
    }

    setLoading(true);
    setNotice({ text: 'Connecting with Instagram...', type: 'info' });
    try {
      const { authorizationUrl, state } = await authApi.startInstagramLogin();
      const savedFlow = JSON.stringify({ provider: 'instagram', state });
      sessionStorage.setItem('apexmind_meta_login', savedFlow);
      authWindow.sessionStorage.setItem('apexmind_meta_login', savedFlow);
      navigateOAuthPopup(authWindow, authorizationUrl);
    } catch (err: unknown) {
      authWindow.close();
      setLoading(false);
      setNotice({
        text: err instanceof Error ? err.message : 'Instagram sign-in could not be started.',
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
            try {
              await loginWithGoogle({ accessToken: tokenResp.access_token });
              handleSuccessfulAuth();
            } catch (authErr) {
              setNotice({
                text: authErr instanceof Error ? authErr.message : 'Google authentication failed.',
                type: 'error',
              });
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

  // Fast-Continue for Remembered User
  const handleContinueRemembered = async () => {
    if (!rememberedUser) return;
    setLoading(true);
    setNotice({ text: 'Continuing session...', type: 'info' });
    try {
      const currentUser = await authApi.getMe();
      if (currentUser.id !== rememberedUser.id) {
        throw new Error('The saved session belongs to a different account. Please sign in again.');
      }
      localStorage.setItem('apexmind_user', JSON.stringify(currentUser));
      localStorage.setItem('apexmind_auth_timestamp', Date.now().toString());

      if (currentUser.activeChannelId) {
        localStorage.setItem('apexmind_yt_active_channel', currentUser.activeChannelId);
      }
      handleSuccessfulAuth();
    } catch (err) {
      localStorage.removeItem('apexmind_user');
      localStorage.removeItem('apexmind_token');
      localStorage.removeItem('apexmind_auth_timestamp');
      setNotice({
        text: err instanceof Error ? err.message : 'The saved session is no longer valid. Please sign in again.',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative min-h-screen w-full flex flex-col justify-between overflow-hidden bg-[#09090B] text-[#E5E5E5] font-sans-studio select-none selection:bg-[#2563EB]/40 selection:text-white">
      {/*  Background: Ambient lights  */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-[10%] left-[20%] w-[480px] h-[480px] rounded-full bg-gradient-to-br from-red-600/20 via-red-900/10 to-transparent blur-[130px] opacity-30" />
        <div className="absolute bottom-[5%] right-[15%] w-[420px] h-[420px] rounded-full bg-gradient-to-tl from-[#2563EB]/20 via-blue-900/10 to-transparent blur-[140px] opacity-25" />
      </div>

      {/*  Crisp dark dot pattern overlay  */}
      <div
        className="absolute inset-0 z-0 pointer-events-none opacity-30"
        style={{
          backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.12) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      {/*  Top Header  */}
      <header className="relative z-10 w-full max-w-4xl mx-auto px-4 pt-5 sm:pt-6 flex items-center justify-between">
        <button
          type="button"
          onClick={() => onNavigate('landing')}
          className="flex items-center gap-3 hover:opacity-90 cursor-pointer text-left"
          aria-label="ApexMind Studio Home"
        >
          <ApexMindLogo size={36} variant="3d" interactive={false} />
          <div className="flex flex-col">
            <span className="text-base font-bold tracking-tight text-white leading-none">ApexMind.ai</span>
            <span className="text-[10px] font-semibold text-blue-400 uppercase tracking-wider mt-0.5">
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

      {/*  Center: Master SaaS Account Sign-In / Register Card  */}
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
                Sign In to ApexMind
              </h1>
              <p className="text-xs text-[#A1A1AA] max-w-xs mx-auto leading-relaxed">
                Access your studio and manage your connected social accounts.
              </p>
            </div>

            {/*  Remembered User Quick-Continue Card  */}
            {rememberedUser && (
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

            {/*  Social Sign-In  */}
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
                onClick={handleFacebookAuth}
                disabled={loading}
                className="rounded-xl border border-[#27272A] bg-[#18181B] hover:bg-[#202025] hover:border-[#3F3F46] px-3 py-2.5 text-xs font-semibold text-white shadow-xs cursor-pointer flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Facebook className="w-4 h-4 text-[#1877F2]" />
                <span>Facebook</span>
              </button>
              <button
                type="button"
                onClick={() => void handleInstagramAuth()}
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

            <label
              htmlFor="agree-terms"
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
                  onChange={(event) => {
                    setAgreementChecked(event.target.checked);
                    if (event.target.checked) setShowAgreementError(false);
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
                  onClick={(event) => {
                    event.stopPropagation();
                    event.preventDefault();
                    onNavigate('terms');
                  }}
                  className="font-medium text-red-400 hover:text-white underline cursor-pointer"
                >
                  Terms of Service
                </a>{' '}
                and{' '}
                <a
                  href="/privacy"
                  onClick={(event) => {
                    event.stopPropagation();
                    event.preventDefault();
                    onNavigate('privacy');
                  }}
                  className="font-medium text-red-400 hover:text-white underline cursor-pointer"
                >
                  Privacy Policy
                </a>
                .
              </span>
            </label>

            {/*  Notice Alert Banner  */}
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

          </div>
        </div>
      </div>

      {/*  Page Footer  */}
      <footer className="relative z-10 w-full max-w-4xl mx-auto px-4 py-4 text-center text-[11px] text-[#52525B] flex flex-wrap items-center justify-between gap-3">
        <span>© 2026 ApexMind.ai • Universal Omnichannel Video Studio</span>
        <div className="flex items-center gap-4">
          <button type="button" onClick={() => onNavigate('terms')} className="bg-transparent border-0 p-0 hover:text-[#A1A1AA] cursor-pointer">
            Terms of Service
          </button>
          <span>•</span>
          <button type="button" onClick={() => onNavigate('privacy')} className="bg-transparent border-0 p-0 hover:text-[#A1A1AA] cursor-pointer">
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

    </main>
  );
}
