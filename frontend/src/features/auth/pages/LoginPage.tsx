import React, { useState, useEffect } from 'react';
import {
  Check,
  Sparkles,
  ArrowLeft,
  Youtube,
  AtSign,
  ShieldCheck,
  Radio,
  Eye,
  TrendingUp,
} from 'lucide-react';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'motion/react';
import { Modal, Input, Button } from '@/src/shared/ui/common';
import { useAuth, isSessionValid } from '../context/AuthContext';
import { getPostLoginRedirect, clearPostLoginRedirect } from '@/src/app/routes';
import { connectYouTubeWithGoogle, getGoogleClientId } from '@/src/features/youtube/utils/googleOAuthConnect';

// ── 3D Tilt Card for Login ──
function Tilt3DCard({
  children,
  className = '',
  maxTilt = 8,
  perspective = 1000,
}: {
  children: React.ReactNode;
  className?: string;
  maxTilt?: number;
  perspective?: number;
}) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x, { stiffness: 180, damping: 18 });
  const mouseYSpring = useSpring(y, { stiffness: 180, damping: 18 });

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], [`${maxTilt}deg`, `-${maxTilt}deg`]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], [`-${maxTilt}deg`, `${maxTilt}deg`]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <div style={{ perspective: `${perspective}px` }} className="w-full flex justify-center">
      <motion.div
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          rotateX,
          rotateY,
          transformStyle: 'preserve-3d',
        }}
        className={className}
      >
        {children}
      </motion.div>
    </div>
  );
}

export default function LoginPage({ onNavigate }: { onNavigate: (page: string) => void }) {
  const { loginWithChannel, isAuthenticated } = useAuth();
  const [channelLoading, setChannelLoading] = useState(false);
  const [notice, setNotice] = useState('');
  const [showChannelModal, setShowChannelModal] = useState(false);
  const [channelHandleInput, setChannelHandleInput] = useState('');
  const [channelNameInput, setChannelNameInput] = useState('');
  const [agreementChecked, setAgreementChecked] = useState(false);
  const [showAgreementError, setShowAgreementError] = useState(false);

  useEffect(() => {
    if (isAuthenticated || isSessionValid()) {
      const destination = getPostLoginRedirect() || 'dashboard';
      clearPostLoginRedirect();
      // Small tick delay ensures React has committed the auth state before routing
      window.setTimeout(() => onNavigate(destination), 50);
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

  const handleSuccessfulAuth = () => {
    const destination = getPostLoginRedirect() || 'dashboard';
    clearPostLoginRedirect();
    setNotice('Signed in! Redirecting to Studio...');
    onNavigate(destination);
  };

  // Check for remembered creator session
  const [rememberedUser] = useState<any>(() => {
    try {
      const stored = localStorage.getItem('apexmind_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  // Primary Action: Authenticate YouTube Channel via OAuth
  const handleYouTubeChannelAuth = () => {
    if (!requireAgreement()) return;

    const clientId = getGoogleClientId();
    if (!clientId) {
      setShowChannelModal(true);
      return;
    }

    setChannelLoading(true);
    setNotice('Connecting to your YouTube channel...');

    connectYouTubeWithGoogle({
      onLoading: setChannelLoading,
      onSuccess: async (connectedChannel) => {
        try {
          await loginWithChannel({
            handle: connectedChannel.handle || connectedChannel.name,
            name: connectedChannel.name,
            avatarUrl: connectedChannel.avatarUrl,
            channelId: connectedChannel.id,
          });
          setNotice('Signed in! Redirecting to Studio...');
          // Navigation handled reactively by the isAuthenticated useEffect
        } catch (err: any) {
          setNotice(err.message || 'Failed to authenticate channel session');
        }
      },
      onError: (errMsg) => {
        setNotice(`YouTube notice: ${errMsg}. You can enter your channel handle directly below.`);
        setShowChannelModal(true);
      },
    });
  };

  // Direct Channel Handle Login (Modal Submission)
  const handleDirectChannelLogin = async (handle?: string, name?: string) => {
    if (!requireAgreement()) return;
    const targetHandle = (handle || channelHandleInput || '').trim();
    if (!targetHandle) {
      setNotice('Please enter your YouTube Channel handle or identifier.');
      return;
    }

    const cleanHandle = targetHandle.startsWith('@') ? targetHandle : `@${targetHandle}`;
    const cleanName = (name || channelNameInput || '').trim() || cleanHandle.replace('@', '');

    setChannelLoading(true);
    setNotice('Authenticating channel...');

    try {
      await loginWithChannel({
        handle: cleanHandle,
        name: cleanName,
        avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(cleanName)}`,
      });
      setShowChannelModal(false);
      setNotice('Signed in! Redirecting to Studio...');
      // Navigation is handled reactively by the isAuthenticated useEffect below
    } catch (err: any) {
      setNotice(err.message || 'YouTube channel sign-in failed. Please check handle details.');
      setChannelLoading(false);
    }
  };

  // Fast-Continue for Remembered Channel
  const handleContinueRemembered = () => {
    if (!rememberedUser) return;
    setChannelLoading(true);
    setNotice('Continuing to Studio...');
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
      setChannelLoading(false);
    }
  };

  return (
    <main className="relative min-h-screen w-full flex flex-col justify-between overflow-hidden bg-[#09090B] text-[#E5E5E5] font-sans-studio select-none selection:bg-[#2563EB]/40 selection:text-white">
      
      {/* ── Background: Dynamic glowing ambient lights ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <motion.div
          animate={{
            x: [0, 30, -20, 0],
            y: [0, -30, 15, 0],
            scale: [1, 1.1, 0.95, 1],
            opacity: [0.2, 0.35, 0.2],
          }}
          transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -top-[10%] left-[20%] w-[480px] h-[480px] rounded-full bg-gradient-to-br from-red-600/22 via-red-900/10 to-transparent blur-[130px]"
        />
        <motion.div
          animate={{
            x: [0, -30, 20, 0],
            y: [0, 25, -20, 0],
            scale: [1, 1.15, 1],
            opacity: [0.15, 0.28, 0.15],
          }}
          transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
          className="absolute bottom-[5%] right-[15%] w-[420px] h-[420px] rounded-full bg-gradient-to-tl from-[#2563EB]/22 via-blue-900/10 to-transparent blur-[140px]"
        />
      </div>

      {/* ── Crisp dark dot pattern overlay ── */}
      <div
        className="absolute inset-0 z-0 pointer-events-none opacity-35"
        style={{
          backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.12) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      {/* ── Top Header ── */}
      <motion.header
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-4xl mx-auto px-4 pt-5 sm:pt-6 flex items-center justify-between"
      >
        <motion.button
          type="button"
          onClick={() => onNavigate('landing')}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex items-center gap-2.5 hover:opacity-90 transition-opacity cursor-pointer text-left"
          aria-label="ApexMind Studio Home"
        >
          <div className="relative w-8 h-8 rounded-lg bg-red-600 text-white flex items-center justify-center shadow-lg shadow-red-900/40 border border-red-500/30">
            <Youtube className="w-4 h-4 fill-current" />
            <div className="absolute inset-0 rounded-lg bg-white/20 animate-ping opacity-20 pointer-events-none" />
          </div>
          <div className="flex flex-col">
            <span className="text-base font-bold tracking-tight text-white leading-none">ApexMind</span>
            <span className="text-[10px] font-semibold text-red-400 uppercase tracking-wider mt-0.5">YouTube Studio</span>
          </div>
        </motion.button>

        <motion.button
          type="button"
          onClick={() => onNavigate('landing')}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#27272A] bg-[#141416]/80 backdrop-blur-md hover:bg-[#1C1C20] hover:border-[#3F3F46] text-xs font-medium text-[#A1A1AA] hover:text-white transition-all cursor-pointer shadow-sm"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Explore Platform</span>
        </motion.button>
      </motion.header>

      {/* ── Center: YouTube Channel Sign-In Card with 3D Tilt ── */}
      <div className="relative z-10 w-full flex-1 flex items-center justify-center px-4 py-8">
        <Tilt3DCard maxTilt={10} perspective={1000} className="w-full max-w-[420px]">
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            style={{ transformStyle: 'preserve-3d' }}
            className="relative w-full rounded-2xl border border-[#27272A] bg-[#121215]/95 backdrop-blur-xl shadow-2xl p-7 sm:p-8 space-y-6"
          >
            {/* Card subtle top glow */}
            <div className="absolute -top-px left-10 right-10 h-px bg-gradient-to-r from-transparent via-red-500/50 to-transparent" />

            {/* Card Header with 3D Popout */}
            <div style={{ transform: 'translateZ(25px)' }} className="text-center space-y-2">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.15 }}
                className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-red-500/30 bg-red-950/30 text-[10px] font-semibold uppercase tracking-wider text-red-400 mx-auto shadow-xs"
              >
                <Youtube className="h-3 w-3 fill-current animate-pulse" />
                <span>YouTube Creator Studio</span>
              </motion.div>
              <h1 className="text-2xl font-bold tracking-tight text-white">
                Sign In to ApexMind
              </h1>
              <p className="text-xs text-[#A1A1AA] max-w-xs mx-auto leading-relaxed">
                Connect your YouTube channel to synthesize, render, and publish autonomous AI Shorts.
              </p>
            </div>

            {/* ── Agreement Checkbox ── */}
            <motion.div
              style={{ transform: 'translateZ(20px)' }}
              animate={showAgreementError ? { x: [-4, 4, -4, 4, 0] } : {}}
              transition={{ duration: 0.3 }}
              onClick={() => {
                setAgreementChecked((prev) => !prev);
                setShowAgreementError(false);
                setNotice('');
              }}
              className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition-all select-none ${
                showAgreementError
                  ? 'border-red-500/60 bg-red-500/10 shadow-sm shadow-red-900/20'
                  : agreementChecked
                  ? 'border-red-500/40 bg-red-950/20 shadow-xs'
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
                    if (e.target.checked) {
                      setShowAgreementError(false);
                      setNotice('');
                    }
                  }}
                  className="peer sr-only"
                />
                <motion.div
                  whileTap={{ scale: 0.85 }}
                  className={`flex h-4 w-4 items-center justify-center rounded border transition-colors ${
                    agreementChecked
                      ? 'border-red-500 bg-red-600'
                      : showAgreementError
                      ? 'border-red-500 bg-transparent'
                      : 'border-[#52525B] bg-transparent'
                  }`}
                >
                  {agreementChecked && (
                    <Check className="h-3 w-3 text-white" strokeWidth={3} />
                  )}
                </motion.div>
              </div>
              <span className="text-xs leading-5 text-[#8E8E93]">
                I agree to the ApexMind{' '}
                <a
                  href="/terms"
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    onNavigate('terms');
                  }}
                  className="font-medium text-red-400 hover:text-white underline cursor-pointer transition-colors"
                >
                  Terms of Service
                </a>{' '}and{' '}
                <a
                  href="/privacy"
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    onNavigate('privacy');
                  }}
                  className="font-medium text-red-400 hover:text-white underline cursor-pointer transition-colors"
                >
                  Privacy Policy
                </a>.
                {showAgreementError && (
                  <span className="mt-1 block font-medium text-red-400">Please check this box before signing in.</span>
                )}
              </span>
            </motion.div>

            {/* ── Sign In Actions ── */}
            <div style={{ transform: 'translateZ(30px)' }} className="space-y-3">
              {/* Remembered Channel Fast-Continue Card */}
              {rememberedUser && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center justify-between gap-3 rounded-xl border border-red-500/30 bg-red-950/20 p-3.5 transition-all shadow-sm hover:border-red-500/50"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <img
                      src={rememberedUser.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(rememberedUser.name || 'Channel')}`}
                      alt=""
                      className="h-9 w-9 shrink-0 rounded-full border border-red-400/40 object-cover"
                    />
                    <div className="min-w-0">
                      <p className="truncate text-xs font-bold text-white flex items-center gap-1.5">
                        <span>{rememberedUser.name || 'YouTube Creator'}</span>
                        <span className="text-[9px] bg-red-500/20 text-red-400 px-1 py-0.2 rounded font-mono">Channel</span>
                      </p>
                      <p className="truncate text-[11px] text-zinc-400">
                        {rememberedUser.handle || (rememberedUser.email ? `@${rememberedUser.email.split('@')[0]}` : '@creator')}
                      </p>
                    </div>
                  </div>
                  <motion.button
                    type="button"
                    onClick={handleContinueRemembered}
                    disabled={channelLoading}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className="shrink-0 rounded-lg bg-red-600 hover:bg-red-500 active:bg-red-700 px-3.5 py-2 text-xs font-bold text-white transition-all cursor-pointer shadow-md shadow-red-900/40 flex items-center gap-1.5"
                  >
                    <span>Continue</span>
                    <span>→</span>
                  </motion.button>
                </motion.div>
              )}

              {/* Primary YouTube Channel Sign In Button */}
              <motion.button
                type="button"
                onClick={handleYouTubeChannelAuth}
                disabled={channelLoading || !agreementChecked}
                title={!agreementChecked ? 'Please agree to the Terms of Service and Privacy Policy first' : undefined}
                whileHover={{ scale: !agreementChecked || channelLoading ? 1 : 1.015 }}
                whileTap={{ scale: !agreementChecked || channelLoading ? 1 : 0.985 }}
                className="w-full rounded-xl bg-red-600 hover:bg-red-500 active:bg-red-700 px-5 py-3.5 text-sm font-bold text-white transition-all shadow-lg shadow-red-950/40 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-3 relative overflow-hidden group"
              >
                {channelLoading ? (
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <Youtube className="h-5 w-5 fill-current group-hover:scale-110 transition-transform" />
                )}
                <span>Sign In with YouTube Channel</span>
              </motion.button>

              {/* Direct Channel Handle Login Option */}
              <motion.button
                type="button"
                onClick={() => {
                  if (!requireAgreement()) return;
                  setShowChannelModal(true);
                }}
                disabled={channelLoading || !agreementChecked}
                whileHover={{ scale: !agreementChecked || channelLoading ? 1 : 1.01 }}
                whileTap={{ scale: !agreementChecked || channelLoading ? 1 : 0.99 }}
                className="w-full rounded-xl border border-[#27272A] bg-[#18181B] hover:bg-[#222226] hover:border-[#3F3F46] px-4 py-2.5 text-xs font-semibold text-[#D4D4D8] hover:text-white transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <AtSign className="h-3.5 w-3.5 text-red-400" />
                <span>Enter Channel Handle / Name Directly</span>
              </motion.button>
            </div>

            {/* Notice banner */}
            <AnimatePresence>
              {notice && (
                <motion.p
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  role="status"
                  className="rounded-xl border border-amber-400/25 bg-amber-400/10 px-3.5 py-2.5 text-xs leading-5 text-amber-200"
                >
                  {notice}
                </motion.p>
              )}
            </AnimatePresence>

            {/* Security Trust Note */}
            <div style={{ transform: 'translateZ(15px)' }} className="pt-3 border-t border-[#27272A] flex items-center justify-center gap-2 text-[11px] text-[#71717A]">
              <Youtube className="h-3.5 w-3.5 text-red-500 fill-current animate-pulse" />
              <span>Official YouTube Partner API • Direct Channel OAuth 2.0</span>
            </div>

          </motion.div>
        </Tilt3DCard>
      </div>

      {/* ── Page Footer ── */}
      <footer className="relative z-10 w-full max-w-4xl mx-auto px-4 py-4 text-center text-[11px] text-[#52525B] flex flex-wrap items-center justify-between gap-3">
        <span>© 2026 ApexMind.ai • Automated AI Shorts Studio</span>
        <div className="flex items-center gap-4">
          <button type="button" onClick={() => onNavigate('terms')} className="hover:text-[#A1A1AA] transition-colors cursor-pointer">
            Terms of Service
          </button>
          <span>•</span>
          <button type="button" onClick={() => onNavigate('privacy')} className="hover:text-[#A1A1AA] transition-colors cursor-pointer">
            Privacy Policy
          </button>
          <span>•</span>
          <a href="https://developers.google.com/youtube/terms/api-services-terms-of-service" target="_blank" rel="noopener noreferrer" className="hover:text-[#A1A1AA] transition-colors">
            YouTube API Terms
          </a>
        </div>
      </footer>

      {/* YouTube Channel Login Modal */}
      <Modal isOpen={showChannelModal} onClose={() => { setShowChannelModal(false); setChannelHandleInput(''); setChannelNameInput(''); }} title="Sign In with YouTube Channel">
        <div className="space-y-4">
          <p className="text-xs text-[#9CA3AF]">
            Enter your YouTube Channel handle or title to authenticate your creator workspace:
          </p>

          {rememberedUser && (
            <motion.button
              type="button"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => handleDirectChannelLogin(rememberedUser.handle || rememberedUser.name, rememberedUser.name)}
              className="w-full flex items-center justify-between p-3.5 rounded-xl bg-[#121212] border border-[#2F2F2F] hover:border-red-500/50 transition-all text-left cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-red-600 flex items-center justify-center text-white font-bold text-xs shadow-sm">
                  {rememberedUser.name ? rememberedUser.name.slice(0, 2).toUpperCase() : 'YT'}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white group-hover:text-red-400">{rememberedUser.name || 'YouTube Creator'}</h4>
                  <p className="text-xs text-[#9CA3AF]">{rememberedUser.handle || rememberedUser.email || '@creator'}</p>
                </div>
              </div>
              <Youtube className="w-4 h-4 text-red-500 fill-current opacity-70 group-hover:opacity-100" />
            </motion.button>
          )}

          <div className={rememberedUser ? 'pt-3 border-t border-[#2F2F2F] space-y-3' : 'space-y-3'}>
            <h5 className="text-xs font-semibold text-white uppercase tracking-wider">
              {rememberedUser ? 'Or Enter Another Channel' : 'YouTube Channel Details'}
            </h5>
            <Input
              label="YouTube Channel Handle"
              value={channelHandleInput}
              onChange={(e) => setChannelHandleInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && channelHandleInput.trim()) {
                  handleDirectChannelLogin(channelHandleInput.trim(), channelNameInput.trim());
                }
              }}
              placeholder="e.g. @DailyStoicShorts or ApexCreator"
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
                    setNotice('Please enter your YouTube Channel handle.');
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
