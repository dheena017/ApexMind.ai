import React, { useState } from 'react';
import {
  Sparkles,
  Youtube,
  Play,
  Zap,
  Shield,
  Wand2,
  Volume2,
  ArrowRight,
  CheckCircle2,
  Captions,
  CalendarClock,
  CircleHelp,
  FileText,
  Menu,
  X,
  Radio,
  Flame,
  Eye,
  TrendingUp,
  Layers,
  Sliders,
} from 'lucide-react';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'motion/react';
import { Button } from '@/src/shared/ui/common';
import LandingFooter from '../components/LandingFooter';
import { isSessionValid } from '@/src/features/auth/context/AuthContext';

// ── Interactive 3D Tilt Card with Smooth Springs ──
function Tilt3DCard({
  children,
  className = '',
  maxTilt = 12,
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
    <div style={{ perspective: `${perspective}px` }} className="w-full">
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

// ── Showcase 9:16 Reels Data with Real Visuals ──
const SHOWCASE_REELS = [
  {
    id: 'stoic-1',
    title: 'The Power of Silence',
    quote: '"You have power over your mind - not outside events. Realize this, and you find strength."',
    author: 'Marcus Aurelius',
    category: 'Stoic Mindset',
    views: '2.4M',
    duration: '00:32',
    voice: 'Fenrir (24kHz)',
    image: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=800&q=80',
    tagColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  },
  {
    id: 'discipline-2',
    title: 'Unbreakable Standards',
    quote: '"Don\'t count the days. Make the days count. Suffering is the only bridge to greatness."',
    author: 'Warrior Protocol',
    category: 'High Intensity',
    views: '1.8M',
    duration: '00:28',
    voice: 'Zephyr (24kHz)',
    image: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=800&q=80',
    tagColor: 'bg-red-500/20 text-red-300 border-red-500/30',
  },
  {
    id: 'solitude-3',
    title: 'Solitude Over Crowds',
    quote: '"He who has a why to live can bear almost any how. Walk alone until you find your equals."',
    author: 'Friedrich Nietzsche',
    category: 'Philosophy & Focus',
    views: '3.1M',
    duration: '00:45',
    voice: 'Puck (Studio TTS)',
    image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80',
    tagColor: 'bg-[#2563EB]/20 text-[#60A5FA] border-[#3B82F6]/30',
  },
  {
    id: 'wealth-4',
    title: 'The Silent Wealth Matrix',
    quote: '"Real wealth is not about flaunting luxury. It is complete sovereignty over your time."',
    author: 'Apex Mindset',
    category: 'Wealth & Freedom',
    views: '980K',
    duration: '00:30',
    voice: 'Aoede (Neural HD)',
    image: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?auto=format&fit=crop&w=800&q=80',
    tagColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  },
];

export default function LandingPage({ onNavigate }: { onNavigate: (page: string) => void }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  React.useEffect(() => {
    if (isSessionValid()) {
      onNavigate('dashboard');
    }
  }, [onNavigate]);

  return (
    <div className="relative w-full h-screen flex flex-col bg-[#0A0A0A] text-[#E5E5E5] overflow-hidden selection:bg-[#2563EB]/40 selection:text-white">
      
      {/* Dynamic Animated Ambient Orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <motion.div
          animate={{
            x: [0, 40, -30, 0],
            y: [0, -40, 20, 0],
            scale: [1, 1.15, 0.95, 1],
            opacity: [0.22, 0.38, 0.22],
          }}
          transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -top-[15%] left-[10%] w-[550px] h-[550px] rounded-full bg-gradient-to-br from-[#2563EB]/25 via-[#3B82F6]/10 to-transparent blur-[130px]"
        />
        <motion.div
          animate={{
            x: [0, -50, 30, 0],
            y: [0, 30, -30, 0],
            scale: [1, 1.2, 1],
            opacity: [0.15, 0.3, 0.15],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
          className="absolute top-[35%] right-[5%] w-[480px] h-[480px] rounded-full bg-gradient-to-bl from-red-600/18 via-[#2563EB]/10 to-transparent blur-[140px]"
        />
      </div>

      {/* Fixed Top Bar */}
      <header className="relative h-16 shrink-0 z-40 w-full bg-[#0A0A0A]/90 backdrop-blur-xl border-b border-[#242424] transition-colors">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 px-4 sm:px-6 h-full">
          <motion.a
            href="#hero"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="text-xl font-bold tracking-tight flex items-center gap-2.5 whitespace-nowrap shrink-0 hover:opacity-90 transition-opacity"
          >
            <div className="relative p-2 rounded-xl bg-gradient-to-tr from-[#2563EB] to-[#3B82F6] text-white shadow-lg shadow-blue-900/30 border border-[#60A5FA]/30">
              <Sparkles className="w-5 h-5 animate-pulse" />
              <div className="absolute inset-0 rounded-xl bg-white/20 animate-ping opacity-25 pointer-events-none" />
            </div>
            <span className="font-extrabold tracking-tight text-white flex items-center gap-1.5">
              ApexMind<span className="text-[#3B82F6] text-xs font-mono font-normal px-1.5 py-0.5 rounded-md bg-[#2563EB]/15 border border-[#3B82F6]/30">AI</span>
            </span>
          </motion.a>

          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-zinc-400">
            <a href="#showcase" className="hover:text-white transition-colors hover:-translate-y-0.5 transform duration-150">Trending Shorts</a>
            <a href="#features" className="hover:text-white transition-colors hover:-translate-y-0.5 transform duration-150">Features</a>
            <a href="#workflow" className="hover:text-white transition-colors hover:-translate-y-0.5 transform duration-150">AI Workflow</a>
            <a href="#creator-use-cases" className="hover:text-white transition-colors hover:-translate-y-0.5 transform duration-150">For Creators</a>
            <a href="#faq" className="hover:text-white transition-colors hover:-translate-y-0.5 transform duration-150">FAQ</a>
            <button
              type="button"
              onClick={() => onNavigate('terms')}
              className="hover:text-white transition-colors cursor-pointer text-left hover:-translate-y-0.5 transform duration-150"
            >
              Legal
            </button>
          </nav>

          <div className="hidden sm:flex items-center gap-3 shrink-0">
            {isSessionValid() ? (
              <Button variant="primary" size="sm" icon={<Zap className="w-4 h-4" />} onClick={() => onNavigate('dashboard')}>
                Continue to Studio →
              </Button>
            ) : (
              <>
                <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                  <Button variant="secondary" size="sm" onClick={() => onNavigate('login')}>
                    Sign In
                  </Button>
                </motion.div>
                <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                  <Button variant="primary" size="sm" icon={<Zap className="w-4 h-4" />} onClick={() => onNavigate('workspace')}>
                    Launch Studio
                  </Button>
                </motion.div>
              </>
            )}
          </div>

          {/* Mobile Menu Hamburger Toggle */}
          <div className="flex sm:hidden items-center gap-2">
            <Button variant="primary" size="sm" onClick={() => onNavigate('workspace')}>
              Studio
            </Button>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl border border-[#27272A] bg-[#141416] text-[#A1A1AA] hover:text-white cursor-pointer active:scale-95 transition-transform"
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            >
              {mobileMenuOpen ? <X className="w-5 h-5 text-[#60A5FA]" /> : <Menu className="w-5 h-5 text-[#60A5FA]" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Dropdown Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="md:hidden border-b border-[#242424] bg-[#0E0E11]/95 backdrop-blur-2xl px-5 py-4 space-y-3 shadow-2xl"
            >
              <div className="flex flex-col space-y-2 text-sm font-semibold">
                <a
                  href="#showcase"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2 rounded-lg text-zinc-400 hover:text-white hover:bg-[#1E1E24] transition-colors"
                >
                  Trending Shorts
                </a>
                <a
                  href="#features"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2 rounded-lg text-zinc-400 hover:text-white hover:bg-[#1E1E24] transition-colors"
                >
                  Features
                </a>
                <a
                  href="#workflow"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2 rounded-lg text-zinc-400 hover:text-white hover:bg-[#1E1E24] transition-colors"
                >
                  AI Workflow
                </a>
                <a
                  href="#creator-use-cases"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2 rounded-lg text-zinc-400 hover:text-white hover:bg-[#1E1E24] transition-colors"
                >
                  For Creators
                </a>
                <a
                  href="#faq"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2 rounded-lg text-zinc-400 hover:text-white hover:bg-[#1E1E24] transition-colors"
                >
                  FAQ
                </a>
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onNavigate('terms');
                  }}
                  className="px-3 py-2 rounded-lg text-left text-zinc-400 hover:text-white hover:bg-[#1E1E24] transition-colors cursor-pointer"
                >
                  Legal Terms
                </button>
              </div>
              <div className="pt-2 border-t border-[#242424] flex gap-2">
                {isSessionValid() ? (
                  <Button variant="primary" className="w-full text-xs" onClick={() => onNavigate('dashboard')}>
                    Continue to Studio →
                  </Button>
                ) : (
                  <>
                    <Button variant="secondary" className="w-full text-xs" onClick={() => onNavigate('login')}>
                      Sign In
                    </Button>
                    <Button variant="primary" className="w-full text-xs" onClick={() => onNavigate('workspace')}>
                      Launch Studio
                    </Button>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Main Scrollable Content */}
      <div className="relative z-10 flex-1 w-full overflow-y-auto overflow-x-hidden scroll-smooth">

        {/* ── Hero Section with 3D Tilt Mockup ── */}
        <section id="hero" className="relative max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-20 lg:py-24 overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            
            {/* Left Column: Hero Text */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="lg:col-span-7 space-y-6"
            >
              {/* Badge */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: 0.1 }}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#2563EB]/15 border border-[#3B82F6]/30 text-[#60A5FA] text-xs font-semibold shadow-sm backdrop-blur-md"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#3B82F6] animate-pulse" />
                <span>Next-Gen YouTube Shorts Automation Engine</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping ml-1" />
              </motion.div>

              {/* Headline */}
              <motion.h1
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.08] text-wrap-balance"
              >
                Create & Publish{' '}
                <span className="bg-gradient-to-r from-[#60A5FA] via-[#3B82F6] to-[#2563EB] bg-clip-text text-transparent underline decoration-[#3B82F6]/30 underline-offset-8">
                  AI Motivational Shorts
                </span>{' '}
                Automatically
              </motion.h1>

              {/* Subtitle */}
              <motion.p
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="text-base sm:text-lg text-zinc-400 max-w-2xl leading-relaxed"
              >
                Turn your ideas into editable motivational scripts, voiceovers, and short-form videos, then review your work before publishing to YouTube with zero guesswork.
              </motion.p>

              {/* CTA Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 pt-2"
              >
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="w-full sm:w-auto">
                  <Button size="lg" className="w-full sm:w-auto shadow-xl shadow-blue-900/30" icon={<Sparkles className="w-5 h-5 text-white" />} onClick={() => onNavigate('workspace')}>
                    Start Video Automation
                  </Button>
                </motion.div>
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="w-full sm:w-auto">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto border-[#2F2F2F] hover:border-red-500/40 hover:bg-red-950/15" icon={<Youtube className="w-5 h-5 text-red-500" />} onClick={() => onNavigate('youtube')}>
                    Connect YouTube Channel
                  </Button>
                </motion.div>
              </motion.div>

              {/* Product benefit strip */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
                className="pt-8 border-t border-[#242424] grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 text-left"
              >
                <div className="p-3 rounded-xl bg-[#141417]/60 border border-[#242424] hover:border-[#3B82F6]/30 transition-colors">
                  <div className="flex items-center gap-2 text-sm font-bold text-white">
                    <Wand2 className="w-4 h-4 text-[#60A5FA]" />
                    <span>Start with an idea</span>
                  </div>
                  <div className="text-xs text-zinc-400 mt-1">Shape a script around your topic</div>
                </div>

                <div className="p-3 rounded-xl bg-[#141417]/60 border border-[#242424] hover:border-[#3B82F6]/30 transition-colors">
                  <div className="flex items-center gap-2 text-sm font-bold text-white">
                    <Volume2 className="w-4 h-4 text-[#60A5FA]" />
                    <span>Make it yours</span>
                  </div>
                  <div className="text-xs text-zinc-400 mt-1">Choose a voice and visual style</div>
                </div>

                <div className="p-3 rounded-xl bg-[#141417]/60 border border-[#242424] hover:border-red-500/30 transition-colors">
                  <div className="flex items-center gap-2 text-sm font-bold text-white">
                    <Youtube className="w-4 h-4 text-red-400" />
                    <span>Publish on your terms</span>
                  </div>
                  <div className="text-xs text-zinc-400 mt-1">Review before sharing to YouTube</div>
                </div>
              </motion.div>
            </motion.div>

            {/* Right Column: Interactive 3D Studio Mockup with Depth Layers */}
            <motion.div
              initial={{ opacity: 0, x: 30, scale: 0.96 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="lg:col-span-5 relative"
            >
              {/* Soft ambient backlight behind card */}
              <div className="absolute -inset-2 rounded-3xl bg-gradient-to-r from-[#2563EB]/35 via-purple-600/25 to-red-600/20 blur-2xl opacity-70" />

              <Tilt3DCard maxTilt={14} perspective={1100}>
                <div
                  style={{ transformStyle: 'preserve-3d' }}
                  className="relative rounded-2xl bg-[#141416]/95 backdrop-blur-xl border border-[#2A2A30] p-6 shadow-2xl space-y-5"
                >
                  {/* Mockup Header */}
                  <div
                    style={{ transform: 'translateZ(25px)' }}
                    className="flex items-center justify-between pb-4 border-b border-[#242424]"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500/80" />
                      <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                      <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                      <span className="ml-2 text-xs font-mono text-zinc-400">ApexMind AI Studio v2.4</span>
                    </div>
                    <span className="inline-flex items-center gap-1.5 text-xs text-[#60A5FA] font-medium bg-[#2563EB]/15 px-2.5 py-0.5 rounded-full border border-[#3B82F6]/30 shadow-xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#3B82F6] animate-pulse" />
                      Gemini 3.8 Flash
                    </span>
                  </div>

                  {/* Studio Canvas Preview with Real 9:16 Visual Backdrop & 3D Popouts */}
                  <div
                    style={{ transform: 'translateZ(35px)' }}
                    className="relative aspect-[9/16] max-h-96 mx-auto rounded-xl overflow-hidden border border-[#2563EB]/40 shadow-2xl group flex flex-col justify-between p-5"
                  >
                    {/* Rich Cinematic Image Background */}
                    <img
                      src="https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=800&q=80"
                      alt="Stoic Statue Reel Preview"
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 brightness-75 contrast-125"
                    />

                    {/* Gradient Overlay for Cinematic Legibility */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-black/30 pointer-events-none" />

                    {/* Top Canvas Bar */}
                    <div
                      style={{ transform: 'translateZ(45px)' }}
                      className="relative z-10 flex items-center justify-between text-xs"
                    >
                      <span className="bg-[#2563EB] text-white font-bold px-2 py-0.5 rounded text-[10px] tracking-wider font-mono shadow-md border border-[#60A5FA]/30">
                        STUDIO CANVAS
                      </span>
                      <span className="font-mono text-xs text-zinc-300 bg-black/60 px-2 py-0.5 rounded backdrop-blur-md border border-white/10">
                        00:28 / 1080p
                      </span>
                    </div>

                    {/* Centered Captions & Audio Engine */}
                    <div
                      style={{ transform: 'translateZ(60px)' }}
                      className="relative z-10 text-center space-y-3 py-4"
                    >
                      <span className="inline-block text-[10px] uppercase font-bold text-[#60A5FA] tracking-widest bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-full border border-[#3B82F6]/40 shadow-sm">
                        Stoic Mindset & Discipline
                      </span>
                      <p className="text-base sm:text-lg font-extrabold text-white leading-snug drop-shadow-2xl tracking-tight">
                        "When motivation fades,{' '}
                        <span className="text-[#60A5FA] underline decoration-blue-500 underline-offset-4">discipline</span> takes the wheel."
                      </p>
                      
                      {/* Audio frequency visualizer bars */}
                      <div className="inline-flex items-center gap-2 text-xs text-blue-200 font-medium bg-black/75 px-3 py-1 rounded-full backdrop-blur-md border border-white/10 shadow-lg">
                        <div className="flex items-center gap-0.5 h-3">
                          <motion.span animate={{ height: [4, 12, 6, 12] }} transition={{ repeat: Infinity, duration: 0.8 }} className="w-1 bg-[#3B82F6] rounded-full" />
                          <motion.span animate={{ height: [8, 4, 12, 8] }} transition={{ repeat: Infinity, duration: 0.7 }} className="w-1 bg-[#60A5FA] rounded-full" />
                          <motion.span animate={{ height: [12, 6, 4, 12] }} transition={{ repeat: Infinity, duration: 0.9 }} className="w-1 bg-[#93C5FD] rounded-full" />
                          <motion.span animate={{ height: [6, 12, 8, 4] }} transition={{ repeat: Infinity, duration: 0.75 }} className="w-1 bg-[#3B82F6] rounded-full" />
                        </div>
                        <span className="text-[11px]">Voiceover: Fenrir (TTS 24kHz)</span>
                      </div>
                    </div>

                    {/* Bottom Video Progress Scrub Bar */}
                    <div
                      style={{ transform: 'translateZ(45px)' }}
                      className="relative z-10 space-y-2 pt-2 border-t border-white/15"
                    >
                      {/* Timeline Scrubber */}
                      <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden">
                        <motion.div
                          animate={{ width: ['0%', '100%'] }}
                          transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
                          className="h-full bg-gradient-to-r from-[#2563EB] to-cyan-400"
                        />
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-zinc-300">
                        <span className="flex items-center gap-1.5 font-medium">
                          <Volume2 className="w-3.5 h-3.5 text-[#3B82F6]" />
                          <span>Cinematic Bass Drone</span>
                        </span>
                        <span className="inline-flex items-center gap-1 text-emerald-400 font-bold bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                          Ready
                        </span>
                      </div>
                    </div>
                  </div>

                  <div style={{ transform: 'translateZ(30px)' }} className="flex gap-2">
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="w-full">
                      <Button variant="primary" className="w-full text-xs font-bold shadow-md shadow-blue-900/30" onClick={() => onNavigate('workspace')}>
                        Open Creation Studio
                      </Button>
                    </motion.div>
                  </div>
                </div>
              </Tilt3DCard>
            </motion.div>
          </div>
        </section>

        {/* ── Trending 3D Shorts Showcase Gallery with Real Media ── */}
        <section id="showcase" className="max-w-7xl mx-auto px-6 py-20 border-t border-[#242424]">
          <div className="text-center max-w-2xl mx-auto space-y-3 mb-14">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.2em] text-[#60A5FA] bg-[#2563EB]/15 px-3 py-1 rounded-full border border-[#3B82F6]/30">
              <TrendingUp className="w-3.5 h-3.5" /> High Retention Formats
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
              Trending AI Shorts Created with ApexMind
            </h2>
            <p className="text-zinc-400 text-sm">
              Discover viral-engineered formats built with Gemini AI scripts, 24kHz studio voiceovers, and licensed visual assets.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {SHOWCASE_REELS.map((reel, idx) => (
              <motion.div
                key={reel.id}
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.15 }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="w-full"
              >
                <Tilt3DCard maxTilt={15} perspective={900}>
                  <div
                    style={{ transformStyle: 'preserve-3d' }}
                    className="relative rounded-2xl bg-[#141416] border border-[#27272A] hover:border-[#3B82F6]/60 p-4 shadow-xl transition-colors group flex flex-col justify-between overflow-hidden"
                  >
                    {/* Visual 9:16 Canvas Box */}
                    <div className="relative aspect-[9/16] w-full rounded-xl overflow-hidden border border-white/10 shadow-lg">
                      <img
                        src={reel.image}
                        alt={reel.title}
                        className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500 contrast-110 brightness-90"
                      />

                      {/* Vignette Gradients */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

                      {/* Top Badges */}
                      <div
                        style={{ transform: 'translateZ(30px)' }}
                        className="absolute top-3 left-3 right-3 flex items-center justify-between z-10"
                      >
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border backdrop-blur-md ${reel.tagColor}`}>
                          {reel.category}
                        </span>
                        <span className="flex items-center gap-1 text-[10px] font-bold text-white bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-full border border-white/10">
                          <Eye className="w-3 h-3 text-red-500" />
                          {reel.views}
                        </span>
                      </div>

                      {/* Play Action Trigger */}
                      <div
                        style={{ transform: 'translateZ(45px)' }}
                        className="absolute inset-0 flex items-center justify-center opacity-85 group-hover:opacity-100 transition-opacity"
                      >
                        <div className="w-12 h-12 rounded-full bg-[#2563EB]/90 text-white flex items-center justify-center shadow-2xl border border-white/30 group-hover:scale-115 transition-transform">
                          <Play className="w-5 h-5 fill-current ml-0.5" />
                        </div>
                      </div>

                      {/* Bottom Quote & Subtitles Preview */}
                      <div
                        style={{ transform: 'translateZ(35px)' }}
                        className="absolute bottom-3 left-3 right-3 z-10 space-y-1.5"
                      >
                        <div className="flex items-center gap-1.5 text-[10px] text-zinc-300 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded w-fit border border-white/10">
                          <Radio className="w-2.5 h-2.5 text-[#60A5FA] animate-pulse" />
                          <span>{reel.voice}</span>
                        </div>
                        <p className="text-xs font-bold text-white leading-tight drop-shadow-md line-clamp-3">
                          {reel.quote}
                        </p>
                      </div>
                    </div>

                    {/* Card Footer Info */}
                    <div
                      style={{ transform: 'translateZ(20px)' }}
                      className="pt-4 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-bold text-white group-hover:text-[#60A5FA] transition-colors line-clamp-1">
                            {reel.title}
                          </h4>
                          <span className="text-xs text-zinc-400">{reel.author}</span>
                        </div>
                        <Youtube className="w-4 h-4 text-red-500 fill-current shrink-0" />
                      </div>

                      <button
                        type="button"
                        onClick={() => onNavigate('workspace')}
                        className="w-full py-2 px-3 rounded-lg bg-[#1E1E24] hover:bg-[#2563EB] hover:text-white text-zinc-300 text-xs font-semibold border border-[#2F2F36] hover:border-[#60A5FA]/40 transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                      >
                        <span>Remix in Studio</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </Tilt3DCard>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ── Feature Section with 3D Tilt Cards ── */}
        <section id="features" className="max-w-7xl mx-auto px-6 py-20 border-t border-[#242424]">
          <div className="text-center max-w-2xl mx-auto space-y-3 mb-16">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#60A5FA] bg-[#2563EB]/10 px-3 py-1 rounded-full border border-[#3B82F6]/20">
              Autonomous Creation Suite
            </span>
            <h2 className="text-3xl font-bold tracking-tight text-white">Full-Stack Automation Features</h2>
            <p className="text-zinc-400 text-sm">
              Go from a topic to a polished Short with practical creative tools in one focused workspace.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: <Wand2 className="w-6 h-6" />,
                iconColor: 'bg-[#2563EB]/15 text-[#60A5FA] border-[#3B82F6]/30',
                title: 'Gemini AI Script & Quote Engine',
                desc: 'Generates high-retention motivational monologues, viral hooks, and auto-synced timed captions for immediate video rendering.',
              },
              {
                icon: <Volume2 className="w-6 h-6" />,
                iconColor: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30',
                title: 'Natural Gemini Voiceovers',
                desc: 'Powered by gemini-3.8-flash-lite-tts for lifelike 24kHz audio synthesis in voices like Fenrir, Kore, and Zephyr.',
              },
              {
                icon: <Shield className="w-6 h-6" />,
                iconColor: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
                title: 'Curated Media Library',
                desc: 'Browse available music tracks and visual backdrops for your project, and confirm usage rights before publishing.',
              },
              {
                icon: <FileText className="w-6 h-6" />,
                iconColor: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
                title: 'Scripts Ready to Shape',
                desc: 'Generate a hook, main message, and closing call to action, then refine the copy for your channel.',
              },
              {
                icon: <Captions className="w-6 h-6" />,
                iconColor: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
                title: 'Voice and Captions Together',
                desc: 'Pair generated narration with timed subtitles to make your short-form story easier to follow.',
              },
              {
                icon: <CalendarClock className="w-6 h-6" />,
                iconColor: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
                title: 'Channel Tools in One Place',
                desc: 'Keep your YouTube channel, uploads, and automation controls close to your creation workflow.',
              },
            ].map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.1 }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                className="w-full"
              >
                <Tilt3DCard maxTilt={10} perspective={800}>
                  <div
                    style={{ transformStyle: 'preserve-3d' }}
                    className="group p-6 rounded-2xl bg-[#141416] border border-[#242424] hover:border-[#3B82F6]/50 hover:bg-[#18181D] transition-all duration-200 space-y-4 shadow-lg hover:shadow-blue-950/20"
                  >
                    <div
                      style={{ transform: 'translateZ(30px)' }}
                      className={`p-3 w-fit rounded-xl border ${feature.iconColor} group-hover:scale-110 transition-transform duration-200 shadow-md`}
                    >
                      {feature.icon}
                    </div>
                    <h3
                      style={{ transform: 'translateZ(20px)' }}
                      className="text-lg font-bold text-white group-hover:text-[#60A5FA] transition-colors"
                    >
                      {feature.title}
                    </h3>
                    <p
                      style={{ transform: 'translateZ(10px)' }}
                      className="text-sm text-zinc-400 leading-relaxed"
                    >
                      {feature.desc}
                    </p>
                  </div>
                </Tilt3DCard>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ── Workflow Showcase ── */}
        <section id="workflow" className="max-w-7xl mx-auto px-6 py-20 border-t border-[#242424]">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.5 }}
              className="lg:col-span-5 space-y-6"
            >
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#60A5FA] bg-[#2563EB]/10 px-3 py-1 rounded-full border border-[#3B82F6]/20">
                End-to-End Execution
              </span>
              <h2 className="text-3xl font-bold tracking-tight text-white leading-tight">
                From Idea to Published YouTube Short in 3 Simple Steps
              </h2>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Experience the power of automated batch creation. Set up your schedule once and let ApexMind handle daily quote generation, audio mixing, and publishing.
              </p>

              <div className="space-y-4">
                {[
                  { step: '1', title: 'Select Topic & Voice Style', desc: 'Choose from Stoicism, Fitness, Wealth, or custom prompts.', color: 'bg-[#2563EB] text-white' },
                  { step: '2', title: 'Synthesize Audio & Video Canvas', desc: 'Gemini generates high-quality TTS voiceover and background track.', color: 'bg-[#2563EB] text-white' },
                  { step: '3', title: 'One-Click YouTube Publishing', desc: 'Upload directly to YouTube Shorts with optimized tags & title.', color: 'bg-red-600 text-white' },
                ].map((item, idx) => (
                  <motion.div
                    key={item.step}
                    initial={{ opacity: 0, x: -15 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.3, delay: idx * 0.1 }}
                    whileHover={{ x: 4 }}
                    className="flex items-start gap-3.5 p-3.5 rounded-xl bg-[#141416] border border-[#242424] hover:border-[#3B82F6]/40 transition-colors"
                  >
                    <div className={`flex items-center justify-center w-7 h-7 rounded-lg ${item.color} font-bold text-xs shrink-0 shadow-sm`}>
                      {item.step}
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-white">{item.title}</h4>
                      <p className="text-xs text-zinc-400 mt-0.5">{item.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>

              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button size="lg" icon={<ArrowRight className="w-4 h-4" />} onClick={() => onNavigate('workspace')}>
                  Open Studio Workspace
                </Button>
              </motion.div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.5 }}
              className="lg:col-span-7 bg-[#141416] border border-[#242424] rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xl relative overflow-hidden"
            >
              <div className="flex items-center justify-between pb-4 border-b border-[#242424]">
                <span className="text-sm font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#3B82F6]" />
                  Automated Content Engine
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Live Production Pipeline
                </span>
              </div>

              <div className="space-y-3.5">
                <motion.div whileHover={{ scale: 1.01 }} className="p-4 rounded-xl bg-[#0F0F12] border border-[#242424] hover:border-[#3B82F6]/40 transition-colors flex items-start gap-4">
                  <div className="p-2.5 rounded-lg bg-[#2563EB]/15 text-[#60A5FA] shrink-0 border border-[#3B82F6]/30">
                    <Wand2 className="w-4 h-4" />
                  </div>
                  <div className="space-y-1 w-full">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-white">AI Script & Retention Hooks</h4>
                      <span className="text-[11px] font-mono text-[#60A5FA]">Gemini 3.8 Flash</span>
                    </div>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      Generates viral-structured motivational hooks, body reasoning, and impactful takeaways customized for YouTube Shorts.
                    </p>
                  </div>
                </motion.div>

                <motion.div whileHover={{ scale: 1.01 }} className="p-4 rounded-xl bg-[#0F0F12] border border-[#242424] hover:border-[#3B82F6]/40 transition-colors flex items-start gap-4">
                  <div className="p-2.5 rounded-lg bg-indigo-500/15 text-indigo-400 shrink-0 border border-indigo-500/30">
                    <Volume2 className="w-4 h-4" />
                  </div>
                  <div className="space-y-1 w-full">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-white">24kHz Neural Studio Speech</h4>
                      <span className="text-[11px] font-mono text-indigo-300">Fenrir / Puck / Aoede</span>
                    </div>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      Ultra-natural human inflections with auto-synced word-level subtitles and copyright-safe royalty-free ambient audio tracks.
                    </p>
                  </div>
                </motion.div>

                <motion.div whileHover={{ scale: 1.01 }} className="p-4 rounded-xl bg-[#0F0F12] border border-[#242424] hover:border-red-500/40 transition-colors flex items-start gap-4">
                  <div className="p-2.5 rounded-lg bg-red-500/15 text-red-400 shrink-0 border border-red-500/30">
                    <Youtube className="w-4 h-4" />
                  </div>
                  <div className="space-y-1 w-full">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-white">Direct YouTube Shorts Publisher</h4>
                      <span className="text-[11px] font-mono text-red-400">OAuth v3 Verified</span>
                    </div>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      Instant or scheduled publishing with algorithm-optimized hashtags, descriptions, and channel performance sync.
                    </p>
                  </div>
                </motion.div>
              </div>

              <div className="pt-2 flex items-center justify-between border-t border-[#242424]">
                <span className="text-xs text-zinc-400">Ready to generate your first motivational Short?</span>
                <Button size="sm" icon={<Zap className="w-3.5 h-3.5" />} onClick={() => onNavigate('workspace')}>
                  Launch Studio
                </Button>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ── Creator Use Cases ── */}
        <section id="creator-use-cases" className="max-w-7xl mx-auto px-6 py-20 border-t border-[#242424]">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="lg:col-span-4 space-y-4"
            >
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#60A5FA]">Made for repeatable ideas</span>
              <h2 className="text-3xl font-bold tracking-tight text-white">A creative starting point for every channel</h2>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Build a consistent format around the subjects your audience cares about. You keep the final say on every script and upload.
              </p>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button size="lg" icon={<ArrowRight className="w-4 h-4" />} onClick={() => onNavigate('workspace')}>
                  Explore the Studio
                </Button>
              </motion.div>
            </motion.div>

            <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { title: 'Mindset & motivation', description: 'Turn a daily reminder or quote into a short, voice-led story.', icon: <Zap className="w-5 h-5 text-amber-400" /> },
                { title: 'Learning & explainers', description: 'Break one useful lesson into a focused hook and takeaway.', icon: <Sparkles className="w-5 h-5 text-[#60A5FA]" /> },
                { title: 'Fitness & wellbeing', description: 'Create encouraging prompts for routines, recovery, and progress.', icon: <CheckCircle2 className="w-5 h-5 text-emerald-400" /> },
                { title: 'Brand storytelling', description: 'Develop a repeatable short-form format for your own ideas.', icon: <Play className="w-5 h-5 text-indigo-400" /> },
              ].map((item, idx) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: idx * 0.08 }}
                  whileHover={{ y: -3, scale: 1.01 }}
                  className="p-5 rounded-2xl bg-[#141416] border border-[#242424] hover:border-[#3B82F6]/40 transition-all flex gap-4 shadow-md"
                >
                  <div className="shrink-0 p-2.5 h-fit rounded-xl bg-[#2563EB]/15 border border-white/5">{item.icon}</div>
                  <div className="space-y-1.5">
                    <h3 className="text-sm font-bold text-white">{item.title}</h3>
                    <p className="text-xs leading-relaxed text-zinc-400">{item.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Review-first publishing ── */}
        <section className="max-w-7xl mx-auto px-6 pb-20">
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="relative overflow-hidden rounded-3xl border border-[#2563EB]/30 bg-gradient-to-br from-[#0D1936] via-[#111625] to-[#121216] p-8 lg:p-12 shadow-2xl"
          >
            <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-7 space-y-4">
                <div className="inline-flex items-center gap-2 text-xs font-bold text-[#93C5FD] uppercase tracking-wider bg-[#2563EB]/20 px-3 py-1 rounded-full border border-[#60A5FA]/30">
                  <Shield className="w-4 h-4 text-[#60A5FA]" /> YOUR CHANNEL, YOUR CONTROL
                </div>
                <h2 className="text-3xl font-bold text-white">Keep the creative decisions in your hands.</h2>
                <p className="text-sm text-[#C0C7D2] leading-relaxed max-w-2xl">
                  Use AI to get a first draft, personalize the voice and visuals, and review the result before publishing. ApexMind supports your process—it doesn’t replace your judgment.
                </p>
              </div>
              <div className="lg:col-span-5 grid grid-cols-1 gap-3">
                {['Choose a topic and tone', 'Edit the generated script', 'Preview and decide when to publish'].map((step, idx) => (
                  <motion.div
                    key={step}
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.1 }}
                    whileHover={{ scale: 1.02 }}
                    className="flex items-center gap-3 rounded-xl bg-black/40 border border-white/10 px-4 py-3 text-sm text-white backdrop-blur-md"
                  >
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" /> {step}
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </section>

        {/* ── Frequently asked questions ── */}
        <section id="faq" className="max-w-4xl mx-auto px-6 py-20 border-t border-[#242424]">
          <div className="text-center space-y-3 mb-10">
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-[#60A5FA] bg-[#2563EB]/10 px-3 py-1 rounded-full border border-[#3B82F6]/20">
              <CircleHelp className="w-4 h-4" /> Good to know
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-white">Frequently asked questions</h2>
            <p className="text-sm text-zinc-400">A few quick answers before you step into the studio.</p>
          </div>
          <div className="space-y-3">
            {[
              { question: 'What can I create with ApexMind?', answer: 'ApexMind helps you draft short-form scripts, create voiceovers, work with visual and music options, and prepare YouTube Shorts.' },
              { question: 'Can I review or edit the content before publishing?', answer: 'Yes. Generated content is a starting point. You can review and adjust your script and creative choices before taking the publishing step.' },
              { question: 'Do I need a YouTube channel?', answer: 'No channel is needed to explore the studio. To manage or publish to a channel, use the YouTube tools and connect the channel you want to work with.' },
              { question: 'Does AI-generated content guarantee views or copyright clearance?', answer: 'No. Results depend on your content and audience, and you should confirm that you have the rights to any material you publish.' },
            ].map((item, idx) => (
              <motion.details
                key={item.question}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.05 }}
                className="group rounded-2xl bg-[#141416] border border-[#242424] open:border-[#3B82F6]/40 transition-colors"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 text-sm font-semibold text-white select-none">
                  {item.question}
                  <span className="text-[#60A5FA] transition-transform duration-200 group-open:rotate-45 text-base">+</span>
                </summary>
                <p className="px-5 pb-5 text-sm leading-relaxed text-zinc-400">{item.answer}</p>
              </motion.details>
            ))}
          </div>
        </section>

        {/* ── Final Call to Action ── */}
        <section className="max-w-7xl mx-auto px-6 pb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            whileHover={{ scale: 1.005 }}
            className="rounded-3xl border border-[#242424] bg-gradient-to-b from-[#141417] to-[#0E0E11] p-8 lg:p-12 text-center space-y-5 shadow-2xl relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-radial from-[#2563EB]/10 via-transparent to-transparent pointer-events-none" />

            <div className="relative mx-auto w-fit p-3.5 rounded-2xl bg-[#2563EB]/15 text-[#60A5FA] border border-[#3B82F6]/30 shadow-md">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            <h2 className="relative text-3xl font-bold text-white tracking-tight">Your next Short starts with one idea.</h2>
            <p className="relative max-w-xl mx-auto text-sm text-zinc-400">Bring a topic, shape it into a story, and build your next video in the ApexMind studio.</p>
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="relative inline-block">
              <Button size="lg" icon={<ArrowRight className="w-4 h-4" />} onClick={() => onNavigate('workspace')}>
                Get Started
              </Button>
            </motion.div>
          </motion.div>
        </section>

        {/* Dedicated Landing Footer Component */}
        <LandingFooter onNavigate={onNavigate} />
      </div>
    </div>
  );
}
