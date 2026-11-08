import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Youtube,
  Play,
  Pause,
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
  Eye,
  TrendingUp,
  Flame,
  Globe,
  Sliders,
  Share2,
  Heart,
  MessageCircle,
  Search,
  Layers,
  Mic,
  RotateCcw,
} from 'lucide-react';
import { Button } from '@/src/shared/ui/common';
import { ApexMindLogo } from '@/src/shared/ui';
import LandingFooter from '../components/LandingFooter';
import { isSessionValid } from '@/src/features/auth/context/AuthContext';
import {
  DEFAULT_SCRIPT_MODEL_LABEL,
  DEFAULT_TTS_MODEL_LABEL,
} from '@/src/shared/aiModels';

// ── Static Card Container ──
function Tilt3DCard({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
  maxTilt?: number;
  perspective?: number;
}) {
  return (
    <div className="w-full">
      <div className={className}>{children}</div>
    </div>
  );
}

// ── Showcase Categories ──
interface ShowcaseCategory {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const SHOWCASE_CATEGORIES: ShowcaseCategory[] = [
  { id: 'all', label: 'All Formats', icon: Flame },
  { id: 'stoic', label: 'Stoic Mindset', icon: Shield },
  { id: 'fitness', label: 'High Intensity', icon: Zap },
  { id: 'philosophy', label: 'Philosophy & Focus', icon: Sparkles },
  { id: 'wealth', label: 'Wealth & Freedom', icon: TrendingUp },
  { id: 'psychology', label: 'Dark Psychology', icon: Eye },
  { id: 'facts', label: 'Cosmic Facts', icon: Globe },
];

// ── Showcase 9:16 Reels Data ──
export interface ShowcaseReel {
  id: string;
  title: string;
  quote: string;
  author: string;
  category: string;
  niche: string;
  views: string;
  duration: string;
  voice: string;
  voiceId: string;
  retention: string;
  image: string;
  tagColor: string;
}

const SHOWCASE_REELS: ShowcaseReel[] = [
  {
    id: 'stoic-1',
    title: 'The Power of Silence',
    quote: '"You have power over your mind - not outside events. Realize this, and you will find unbreakable strength."',
    author: 'Marcus Aurelius',
    category: 'Stoic Mindset',
    niche: 'stoic',
    views: '2.4M',
    duration: '00:32',
    voice: 'Fenrir (24kHz Studio TTS)',
    voiceId: 'fenrir',
    retention: '94% Completion',
    image: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=800&q=80',
    tagColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  },
  {
    id: 'discipline-2',
    title: 'Unbreakable Standards',
    quote: '"Don\'t count the days. Make the days count. Suffering is the only bridge to greatness. When motivation fades, discipline takes the wheel."',
    author: 'Warrior Protocol',
    category: 'High Intensity',
    niche: 'fitness',
    views: '1.8M',
    duration: '00:28',
    voice: 'Zephyr (24kHz Studio TTS)',
    voiceId: 'zephyr',
    retention: '91% Completion',
    image: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=800&q=80',
    tagColor: 'bg-red-500/20 text-red-300 border-red-500/30',
  },
  {
    id: 'solitude-3',
    title: 'Solitude Over Crowds',
    quote: '"He who has a why to live can bear almost any how. Walk alone until you find those who share your fire."',
    author: 'Friedrich Nietzsche',
    category: 'Philosophy & Focus',
    niche: 'philosophy',
    views: '3.1M',
    duration: '00:45',
    voice: 'Puck (Neural HD)',
    voiceId: 'puck',
    retention: '96% Completion',
    image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80',
    tagColor: 'bg-[#2563EB]/20 text-[#60A5FA] border-[#3B82F6]/30',
  },
  {
    id: 'wealth-4',
    title: 'The Silent Wealth Matrix',
    quote: '"Real wealth is not about flaunting luxury. It is complete sovereignty over every minute of your existence."',
    author: 'Apex Mindset',
    category: 'Wealth & Freedom',
    niche: 'wealth',
    views: '980K',
    duration: '00:30',
    voice: 'Aoede (Neural HD)',
    voiceId: 'aoede',
    retention: '89% Completion',
    image: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?auto=format&fit=crop&w=800&q=80',
    tagColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  },
  {
    id: 'psychology-5',
    title: 'The Law of Detachment',
    quote: '"The moment you stop chasing what doesn\'t belong to you, what truly aligns will naturally seek you. Quiet your need for validation."',
    author: 'Dark Psychology Truths',
    category: 'Dark Psychology',
    niche: 'psychology',
    views: '1.5M',
    duration: '00:35',
    voice: 'Fenrir (24kHz Studio TTS)',
    voiceId: 'fenrir',
    retention: '93% Completion',
    image: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=800&q=80',
    tagColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  },
  {
    id: 'facts-6',
    title: 'The 400-Billion Star Anomaly',
    quote: '"Every second, three stars in our observable universe collapse into supernovas. Every atom in your blood was once forged in that cosmic blast."',
    author: 'Cosmic Curiosity',
    category: 'Cosmic Facts',
    niche: 'facts',
    views: '4.2M',
    duration: '00:40',
    voice: 'Kore (Expressive TTS)',
    voiceId: 'kore',
    retention: '97% Completion',
    image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80',
    tagColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
  },
  {
    id: 'stoic-7',
    title: 'The Inner Citadel',
    quote: '"No man can hurt you unless you allow it. You are wounded only when you believe you are wounded."',
    author: 'Epictetus',
    category: 'Stoic Mindset',
    niche: 'stoic',
    views: '1.9M',
    duration: '00:34',
    voice: 'Fenrir (24kHz Studio TTS)',
    voiceId: 'fenrir',
    retention: '92% Completion',
    image: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=800&q=80',
    tagColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  },
];

// ── Hero Prompt Presets ──
interface PromptPreset {
  label: string;
  prompt: string;
  niche: string;
  voice: string;
  durationEst: string;
  viralityEst: string;
}

const PROMPT_PRESETS: PromptPreset[] = [
  {
    label: 'Stoic Self-Discipline',
    prompt: 'Create a 30-second stoic monologue on why conquering your emotions is harder and more noble than conquering an empire.',
    niche: 'stoic',
    voice: 'Fenrir (24kHz)',
    durationEst: '32s',
    viralityEst: '95/100',
  },
  {
    label: 'Iron Gym Protocol',
    prompt: 'Write an intense 28-second motivational speech about showing up when every muscle aches. Focus on standards over fleeting motivation.',
    niche: 'fitness',
    voice: 'Zephyr (24kHz)',
    durationEst: '28s',
    viralityEst: '92/100',
  },
  {
    label: 'The Silent Wealth Matrix',
    prompt: 'Explain the difference between looking rich and being sovereign: true wealth is having 100% control over your daily calendar.',
    niche: 'wealth',
    voice: 'Aoede (Neural)',
    durationEst: '30s',
    viralityEst: '90/100',
  },
  {
    label: 'Dark Psychology Truth',
    prompt: 'Reveal why the quietest person in any boardroom often holds the most influence. Break down strategic observation.',
    niche: 'psychology',
    voice: 'Puck (Studio)',
    durationEst: '35s',
    viralityEst: '94/100',
  },
  {
    label: 'Deep Cosmic Mystery',
    prompt: 'Explore the astonishing reality that every iron atom in your blood was forged inside the heart of an ancient dying supernova.',
    niche: 'facts',
    voice: 'Kore (Expressive)',
    durationEst: '38s',
    viralityEst: '97/100',
  },
];

// ── 24kHz Studio Voices ──
interface VoicePreview {
  id: string;
  name: string;
  title: string;
  sampleLine: string;
  niche: string;
  badge: string;
  badgeColor: string;
  pitch: number;
  rate: number;
}

const VOICE_PREVIEWS: VoicePreview[] = [
  {
    id: 'fenrir',
    name: 'Fenrir',
    title: 'Commanding & Stoic',
    sampleLine: 'You have power over your mind, not outside events. Realize this, and you will find unbreakable strength.',
    niche: 'Stoic & Authority',
    badge: '24kHz Studio TTS',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    pitch: 0.8,
    rate: 0.95,
  },
  {
    id: 'zephyr',
    name: 'Zephyr',
    title: 'High-Octane & Relentless',
    sampleLine: 'Suffering is the only bridge to greatness. When motivation fades, absolute discipline takes the wheel.',
    niche: 'Fitness & Push',
    badge: '24kHz Studio TTS',
    badgeColor: 'bg-red-500/20 text-red-300 border-red-500/30',
    pitch: 1.05,
    rate: 1.1,
  },
  {
    id: 'puck',
    name: 'Puck',
    title: 'Contemplative & Dark',
    sampleLine: 'He who has a why to live can bear almost any how. Walk alone until you find those who share your fire.',
    niche: 'Philosophy & Solitude',
    badge: 'Neural HD',
    badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    pitch: 0.9,
    rate: 0.92,
  },
  {
    id: 'aoede',
    name: 'Aoede',
    title: 'Crisp & Sophisticated',
    sampleLine: 'Real wealth is not luxury or status. It is complete sovereignty over every minute of your existence.',
    niche: 'Wealth & Solopreneur',
    badge: 'Neural HD',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    pitch: 1.15,
    rate: 1.0,
  },
  {
    id: 'kore',
    name: 'Kore',
    title: 'Curious & Expressive',
    sampleLine: 'Every single second, three stars in our observable universe collapse into supernovas—silent cosmic explosions.',
    niche: 'Science & Explainers',
    badge: 'Expressive TTS',
    badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
    pitch: 1.2,
    rate: 1.05,
  },
];

// ── Creator Blueprints ──
interface CreatorBlueprint {
  id: string;
  title: string;
  tagline: string;
  cadence: string;
  avgRetention: string;
  revenueEstimate: string;
  stack: string;
  niche: string;
  highlights: string[];
}

const CREATOR_BLUEPRINTS: CreatorBlueprint[] = [
  {
    id: 'faceless',
    title: 'Faceless Shorts Empire',
    tagline: 'Fully automated batch creation with 100% voice & B-roll synthesis',
    cadence: '2 to 3 Shorts daily (14:00 & 20:00 UTC)',
    avgRetention: '92% completion',
    revenueEstimate: '$1,800 - $4,200/mo',
    stack: 'Gemini 2.5 Flash + Fenrir 24kHz + Kinetic Bold Subtitles + Lofi Drone',
    niche: 'stoic',
    highlights: [
      'Zero on-camera appearance required',
      'Batch 10 shorts in under 15 minutes',
      'High YouTube Shorts algorithm retention',
      'Autonomous scheduling with auto-tags',
    ],
  },
  {
    id: 'fitness',
    title: 'High-Intensity Fitness & Gym',
    tagline: 'Relentless motivational audio paired with dark aesthetic gym reels',
    cadence: '1 Short daily (06:00 UTC morning push)',
    avgRetention: '89% completion',
    revenueEstimate: '$2,400 - $6,500/mo',
    stack: 'Gemini 2.5 Flash + Zephyr 24kHz + Phonk Soundtrack + Red Neon Subtitles',
    niche: 'fitness',
    highlights: [
      'High-tempo adrenaline hooks in the first 2s',
      'High virality on gym & bodybuilding audiences',
      'Syndicates directly to TikTok and Reels',
      'Built-in audio ducking for explosive drops',
    ],
  },
  {
    id: 'philosophy',
    title: 'Deep Philosophy & Stoicism',
    tagline: 'Timeless meditations from Marcus Aurelius, Seneca & Nietzsche',
    cadence: '1 Short daily (22:00 UTC evening contemplation)',
    avgRetention: '95% completion',
    revenueEstimate: '$1,500 - $3,800/mo',
    stack: 'Gemini 3.0 Pro + Puck Neural + Cinematic Drone B-Roll + Minimalist Subtitles',
    niche: 'philosophy',
    highlights: [
      'Deep intellectual audience engagement',
      'High bookmark and share ratios',
      'High CPM advertiser category',
      'Evergreen content that gets views for years',
    ],
  },
  {
    id: 'wealth',
    title: 'Wealth & Solopreneurship',
    tagline: 'Actionable mental models, time leverage, and sovereign lifestyle',
    cadence: '5 Shorts weekly (12:30 UTC lunch hour)',
    avgRetention: '91% completion',
    revenueEstimate: '$3,200 - $8,000/mo',
    stack: 'Gemini 2.5 Flash + Aoede Neural + Modern Architecture + Cyber Cyan Highlight',
    niche: 'wealth',
    highlights: [
      'Highest RPM rates in YouTube Shorts',
      'Strong conversion for digital products and newsletters',
      'Clean professional visual aesthetic',
      'Direct YouTube link sticker integrations',
    ],
  },
  {
    id: 'facts',
    title: 'Cosmic Curiosity & Deep Facts',
    tagline: 'Astonishing universe mysteries and neuroscience curiosities',
    cadence: '2 Shorts daily (18:00 UTC & 21:00 UTC)',
    avgRetention: '96% completion',
    revenueEstimate: '$2,000 - $5,500/mo',
    stack: 'Gemini 2.5 Flash + Kore Expressive + Deep Space 4K + Neon Yellow Subtitles',
    niche: 'facts',
    highlights: [
      'Instant curiosity gap hooks that halt scrolling',
      'Massive global watch time across all demographics',
      'Fast automated script generation',
      'Huge viral algorithmic breakout potential',
    ],
  },
];

// ── FAQ Items ──
const FAQ_CATEGORIES = ['All', 'Monetization', 'Copyright & Media', 'Voices & AI', 'Publishing'];

interface FaqItem {
  category: string;
  question: string;
  answer: string;
}

const FAQ_ITEMS: FaqItem[] = [
  {
    category: 'Monetization',
    question: 'Can I monetize YouTube Shorts created with ApexMind AI?',
    answer: 'Yes! YouTube allows monetization for AI-assisted short-form content as long as it provides value, avoids repetitive spam, and complies with YouTube Channel Monetization Policies. ApexMind generates unique, original scripts with custom kinetic typography, curated B-roll, and licensed voiceovers.',
  },
  {
    category: 'Monetization',
    question: 'What RPM can I expect on motivational and stoic Shorts?',
    answer: 'YouTube Shorts RPM typically ranges between $0.08 and $0.25 per 1,000 views, while business and wealth niches often reach $0.20 to $0.40+. With viral reach frequently hitting 1M to 5M views per Short, creator payouts can grow significantly alongside sponsorships.',
  },
  {
    category: 'Copyright & Media',
    question: 'Are the background soundtracks and B-roll safe from Content ID claims?',
    answer: 'Yes. ApexMind integrates with Creative Commons (CC-BY, CC0), Free Music Archive, Netlabels, Incompetech, and Wikimedia Commons audio and visual archives. All audio tracks include explicit attribution and licensing metadata so your videos remain claim-free.',
  },
  {
    category: 'Voices & AI',
    question: 'Are the 24kHz neural voices commercially licensed?',
    answer: 'Yes. The TTS voices (Fenrir, Zephyr, Puck, Aoede, Kore) generated via Google Gemini Studio API are licensed for commercial use and public broadcast across YouTube, TikTok, Instagram Reels, and social channels.',
  },
  {
    category: 'Publishing',
    question: 'Do I need to download videos manually or does ApexMind publish automatically?',
    answer: 'Both! You can download high-definition 1080x1920 MP4 files for manual posting, or link your YouTube Channel via verified OAuth to publish instantly or set up recurring daily schedules that publish automatically.',
  },
  {
    category: 'Publishing',
    question: 'Can I edit the generated script and captions before rendering?',
    answer: 'Absolutely. ApexMind is a creator-first studio. You can edit every word, adjust subtitle timings, change color presets, swap background tracks, and preview the final video on the studio canvas before publishing.',
  },
];

export default function LandingPage({
  onNavigate,
}: {
  onNavigate: (page: string, queryParams?: Record<string, any>) => void;
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // URL State
  const [selectedNiche, setSelectedNiche] = useState<string>('all');
  const [activeWorkflowStep, setActiveWorkflowStep] = useState<number>(1);
  const [selectedBlueprintId, setSelectedBlueprintId] = useState<string>('faceless');

  // Hero Prompt Sandbox State
  const [customPrompt, setCustomPrompt] = useState<string>(PROMPT_PRESETS[0].prompt);
  const [activePromptPreset, setActivePromptPreset] = useState<number>(0);

  // Reel Preview Modal State
  const [selectedPreviewReel, setSelectedPreviewReel] = useState<ShowcaseReel | null>(null);
  const [modalIsPlaying, setModalIsPlaying] = useState<boolean>(true);

  // Voice Sampler State
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);

  // FAQ State
  const [selectedFaqCategory, setSelectedFaqCategory] = useState<string>('All');
  const [faqSearchQuery, setFaqSearchQuery] = useState<string>('');

  // Audio synthesis reference
  const synthRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Synchronize URL query params (?niche=...)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const nicheParam = params.get('niche');
    if (nicheParam && SHOWCASE_CATEGORIES.some((c) => c.id === nicheParam)) {
      setSelectedNiche(nicheParam);
    }
  }, []);

  const handleSelectNiche = (nicheId: string) => {
    setSelectedNiche(nicheId);
    const url = new URL(window.location.href);
    if (nicheId === 'all') {
      url.searchParams.delete('niche');
    } else {
      url.searchParams.set('niche', nicheId);
    }
    window.history.replaceState({}, '', url.toString());
  };

  // Check valid session
  useEffect(() => {
    if (isSessionValid()) {
      onNavigate('dashboard');
    }
  }, [onNavigate]);

  // Voice playback preview
  const handleTogglePlayVoice = (voice: VoicePreview) => {
    if (playingVoiceId === voice.id) {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      setPlayingVoiceId(null);
      return;
    }

    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(voice.sampleLine);
      utterance.pitch = voice.pitch;
      utterance.rate = voice.rate;
      utterance.onend = () => {
        setPlayingVoiceId(null);
      };
      utterance.onerror = () => {
        setPlayingVoiceId(null);
      };
      synthRef.current = utterance;
      setPlayingVoiceId(voice.id);
      window.speechSynthesis.speak(utterance);
    } else {
      // Fallback timer simulation
      setPlayingVoiceId(voice.id);
      setTimeout(() => {
        setPlayingVoiceId(null);
      }, 4000);
    }
  };

  // Filtered Reels
  const filteredReels =
    selectedNiche === 'all'
      ? SHOWCASE_REELS
      : SHOWCASE_REELS.filter((reel) => reel.niche === selectedNiche);

  // Filtered FAQs
  const filteredFaqs = FAQ_ITEMS.filter((item) => {
    const matchesCategory =
      selectedFaqCategory === 'All' || item.category === selectedFaqCategory;
    const matchesSearch =
      faqSearchQuery.trim() === '' ||
      item.question.toLowerCase().includes(faqSearchQuery.toLowerCase()) ||
      item.answer.toLowerCase().includes(faqSearchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Active Blueprint
  const activeBlueprint =
    CREATOR_BLUEPRINTS.find((b) => b.id === selectedBlueprintId) ||
    CREATOR_BLUEPRINTS[0];

  return (
    <div className="relative w-full h-screen flex flex-col bg-[#0A0A0A] text-[#E5E5E5] overflow-hidden selection:bg-[#2563EB]/40 selection:text-white">
      {/* Ambient Lighting Orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-[15%] left-[10%] w-[550px] h-[550px] rounded-full bg-gradient-to-br from-[#2563EB]/25 via-[#3B82F6]/10 to-transparent blur-[130px] opacity-30" />
        <div className="absolute top-[35%] right-[5%] w-[480px] h-[480px] rounded-full bg-gradient-to-bl from-red-600/18 via-[#2563EB]/10 to-transparent blur-[140px] opacity-20" />
        <div className="absolute bottom-[10%] left-[20%] w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-purple-600/15 via-[#2563EB]/10 to-transparent blur-[150px] opacity-25" />
      </div>

      {/* Fixed Top Bar */}
      <header className="relative h-16 shrink-0 z-40 w-full bg-[#0A0A0A]/90 backdrop-blur-xl border-b border-[#242424]">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 px-4 sm:px-6 h-full">
          <a
            href="#hero"
            className="text-xl font-bold tracking-tight flex items-center gap-3 whitespace-nowrap shrink-0 hover:opacity-95 transition-opacity"
          >
            <ApexMindLogo size={36} variant="3d" interactive={false} />
            <span className="font-extrabold tracking-tight text-white flex items-center gap-1.5">
              ApexMind
              <span className="text-[#3B82F6] text-xs font-mono font-normal px-1.5 py-0.5 rounded-md bg-[#2563EB]/15 border border-[#3B82F6]/30">
                AI
              </span>
            </span>
          </a>

          <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-zinc-400">
            <a href="#hero" className="hover:text-white transition-colors">
              Studio
            </a>
            <a href="#showcase" className="hover:text-white transition-colors">
              Trending Shorts
            </a>
            <a href="#voices" className="hover:text-white transition-colors">
              24kHz Voices
            </a>
            <a href="#features" className="hover:text-white transition-colors">
              Features
            </a>
            <a href="#workflow" className="hover:text-white transition-colors">
              AI Workflow
            </a>
            <a
              href="#creator-use-cases"
              className="hover:text-white transition-colors"
            >
              Playbooks
            </a>
            <a href="#faq" className="hover:text-white transition-colors">
              FAQ
            </a>
          </nav>

          <div className="hidden sm:flex items-center gap-3 shrink-0">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onNavigate('login')}
            >
              Sign In
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={<Zap className="w-4 h-4" />}
              onClick={() =>
                onNavigate('workspace', {
                  tab: 'prompt',
                  idea: customPrompt,
                  niche: selectedNiche,
                })
              }
            >
              Launch Studio
            </Button>
          </div>

          {/* Mobile Menu Hamburger Toggle */}
          <div className="flex sm:hidden items-center gap-2">
            <Button
              variant="primary"
              size="sm"
              onClick={() => onNavigate('workspace')}
            >
              Studio
            </Button>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl border border-[#27272A] bg-[#141416] text-[#A1A1AA] hover:text-white cursor-pointer"
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5 text-[#60A5FA]" />
              ) : (
                <Menu className="w-5 h-5 text-[#60A5FA]" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-b border-[#242424] bg-[#0E0E11]/95 backdrop-blur-2xl px-5 py-4 space-y-3 shadow-2xl">
            <div className="flex items-center gap-2.5 pb-2 border-b border-[#242424]">
              <ApexMindLogo size={28} variant="3d" interactive={false} />
              <span className="text-sm font-bold text-white tracking-tight">ApexMind Studio</span>
            </div>
            <div className="flex flex-col space-y-2 text-sm font-semibold">
              <a
                href="#hero"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg text-zinc-400 hover:text-white hover:bg-[#1E1E24]"
              >
                Studio Hero
              </a>
              <a
                href="#showcase"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg text-zinc-400 hover:text-white hover:bg-[#1E1E24]"
              >
                Trending Shorts
              </a>
              <a
                href="#voices"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg text-zinc-400 hover:text-white hover:bg-[#1E1E24]"
              >
                24kHz Neural Voices
              </a>
              <a
                href="#features"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg text-zinc-400 hover:text-white hover:bg-[#1E1E24]"
              >
                Features
              </a>
              <a
                href="#workflow"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg text-zinc-400 hover:text-white hover:bg-[#1E1E24]"
              >
                AI Workflow
              </a>
              <a
                href="#creator-use-cases"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg text-zinc-400 hover:text-white hover:bg-[#1E1E24]"
              >
                Creator Playbooks
              </a>
              <a
                href="#faq"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg text-zinc-400 hover:text-white hover:bg-[#1E1E24]"
              >
                FAQ
              </a>
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onNavigate('terms');
                }}
                className="px-3 py-2 rounded-lg text-left text-zinc-400 hover:text-white hover:bg-[#1E1E24] cursor-pointer"
              >
                Legal Terms
              </button>
            </div>
            <div className="pt-2 border-t border-[#242424] flex gap-2">
              <Button
                variant="secondary"
                className="w-full text-xs"
                onClick={() => onNavigate('login')}
              >
                Sign In
              </Button>
              <Button
                variant="primary"
                className="w-full text-xs"
                onClick={() => onNavigate('workspace')}
              >
                Launch Studio
              </Button>
            </div>
          </div>
        )}
      </header>

      {/* Main Scrollable Content */}
      <div className="relative z-10 flex-1 w-full overflow-y-auto overflow-x-hidden">
        {/* ── 1. Hero Section & Interactive Prompt Sandbox ── */}
        <section
          id="hero"
          className="relative max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-16 lg:py-20 overflow-hidden"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Left Column: Hero Copy & Sandbox */}
            <div className="lg:col-span-7 space-y-6">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#2563EB]/15 border border-[#3B82F6]/30 text-[#60A5FA] text-xs font-semibold shadow-sm backdrop-blur-md">
                <Sparkles className="w-3.5 h-3.5 text-[#3B82F6]" />
                <span>Next-Gen YouTube Shorts Automation Engine</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 ml-1" />
              </div>

              {/* Headline */}
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.08] text-wrap-balance">
                Create & Publish{' '}
                <span className="bg-gradient-to-r from-[#60A5FA] via-[#3B82F6] to-[#2563EB] bg-clip-text text-transparent underline decoration-[#3B82F6]/30 underline-offset-8">
                  Viral AI Shorts
                </span>{' '}
                with Neural Voices
              </h1>

              {/* Subtitle */}
              <p className="text-base sm:text-lg text-zinc-400 max-w-2xl leading-relaxed">
                Transform any thought into studio-quality motivational scripts,
                24kHz human inflected narration, kinetic word captions, and 9:16
                video renders. Review and auto-upload directly to YouTube Shorts.
              </p>

              {/* Interactive Prompt Sandbox Box */}
              <div className="p-4 sm:p-5 rounded-2xl bg-[#141417]/95 border border-[#27272A] shadow-2xl space-y-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                    <Wand2 className="w-3.5 h-3.5 text-[#60A5FA]" />
                    Interactive Prompt Playground:
                  </span>
                  <span className="text-[11px] font-mono text-[#60A5FA] bg-[#2563EB]/15 px-2 py-0.5 rounded border border-[#3B82F6]/30">
                    {DEFAULT_SCRIPT_MODEL_LABEL}
                  </span>
                </div>

                {/* Preset Chips */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                  {PROMPT_PRESETS.map((preset, idx) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => {
                        setActivePromptPreset(idx);
                        setCustomPrompt(preset.prompt);
                        setSelectedNiche(preset.niche);
                      }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap cursor-pointer transition-all ${
                        activePromptPreset === idx
                          ? 'bg-[#2563EB] text-white shadow-md shadow-blue-900/40 border border-[#60A5FA]/40'
                          : 'bg-[#1C1C21] text-zinc-400 hover:text-white border border-[#292930]'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>

                {/* Textarea */}
                <textarea
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  rows={2}
                  className="w-full bg-[#0D0D10] border border-[#26262B] focus:border-[#3B82F6] rounded-xl px-3 py-2 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none resize-none"
                  placeholder="Type an idea, quote, or topic to generate a viral Short..."
                />

                {/* Metrics & Launch Button */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
                  <div className="flex items-center gap-3 text-[11px] text-zinc-400">
                    <span className="flex items-center gap-1">
                      <Volume2 className="w-3 h-3 text-[#60A5FA]" />
                      Voice: {PROMPT_PRESETS[activePromptPreset]?.voice || 'Fenrir'}
                    </span>
                    <span className="flex items-center gap-1 text-emerald-400">
                      <Flame className="w-3 h-3" />
                      Virality: {PROMPT_PRESETS[activePromptPreset]?.viralityEst || '93/100'}
                    </span>
                  </div>

                  <Button
                    size="sm"
                    className="shadow-lg shadow-blue-900/30 whitespace-nowrap"
                    icon={<Sparkles className="w-4 h-4 text-white" />}
                    onClick={() =>
                      onNavigate('workspace', {
                        tab: 'prompt',
                        idea: customPrompt,
                        niche: selectedNiche,
                      })
                    }
                  >
                    Generate This Short in Studio →
                  </Button>
                </div>
              </div>

              {/* Direct Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 pt-1">
                <Button
                  size="lg"
                  className="w-full sm:w-auto shadow-xl shadow-blue-900/30"
                  icon={<Zap className="w-5 h-5 text-white" />}
                  onClick={() => onNavigate('workspace')}
                >
                  Start Video Automation
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto border-[#2F2F2F] hover:border-red-500/40 hover:bg-red-950/15"
                  icon={<Youtube className="w-5 h-5 text-red-500" />}
                  onClick={() => onNavigate('youtube')}
                >
                  Connect YouTube Channel
                </Button>
              </div>

              {/* Product benefit strip */}
              <div className="pt-6 border-t border-[#242424] grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 text-left">
                <div className="p-3 rounded-xl bg-[#141417]/60 border border-[#242424] hover:border-[#3B82F6]/30">
                  <div className="flex items-center gap-2 text-sm font-bold text-white">
                    <Wand2 className="w-4 h-4 text-[#60A5FA]" />
                    <span>Gemini AI Scripts</span>
                  </div>
                  <div className="text-xs text-zinc-400 mt-0.5">
                    Viral motivational hooks in seconds
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[#141417]/60 border border-[#242424] hover:border-[#3B82F6]/30">
                  <div className="flex items-center gap-2 text-sm font-bold text-white">
                    <Volume2 className="w-4 h-4 text-[#60A5FA]" />
                    <span>24kHz Studio Speech</span>
                  </div>
                  <div className="text-xs text-zinc-400 mt-0.5">
                    Fenrir, Zephyr & Puck narration
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[#141417]/60 border border-[#242424] hover:border-red-500/30">
                  <div className="flex items-center gap-2 text-sm font-bold text-white">
                    <Youtube className="w-4 h-4 text-red-400" />
                    <span>Direct YouTube Upload</span>
                  </div>
                  <div className="text-xs text-zinc-400 mt-0.5">
                    Auto-schedules with SEO hashtags
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Studio Mockup */}
            <div className="lg:col-span-5 relative">
              <div className="absolute -inset-2 rounded-3xl bg-gradient-to-r from-[#2563EB]/35 via-purple-600/25 to-red-600/20 blur-2xl opacity-70" />

              <Tilt3DCard maxTilt={0} perspective={0}>
                <div className="relative rounded-2xl bg-[#141416]/95 backdrop-blur-xl border border-[#2A2A30] p-5 sm:p-6 shadow-2xl space-y-4">
                  {/* Mockup Header */}
                  <div className="flex items-center justify-between pb-3 border-b border-[#242424]">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500/80" />
                      <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                      <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                      <span className="ml-2 text-xs font-mono text-zinc-400">
                        ApexMind AI Studio v2.4
                      </span>
                    </div>
                    <span className="inline-flex items-center gap-1.5 text-xs text-[#60A5FA] font-medium bg-[#2563EB]/15 px-2.5 py-0.5 rounded-full border border-[#3B82F6]/30 shadow-xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#3B82F6]" />
                      {DEFAULT_TTS_MODEL_LABEL}
                    </span>
                  </div>

                  {/* Studio Canvas Preview */}
                  <div className="relative aspect-[9/16] max-h-96 mx-auto rounded-xl overflow-hidden border border-[#2563EB]/40 shadow-2xl flex flex-col justify-between p-4">
                    <img
                      src="https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=800&q=80"
                      alt="Stoic Statue Reel Preview"
                      className="absolute inset-0 w-full h-full object-cover brightness-75 contrast-125"
                    />

                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-black/30 pointer-events-none" />

                    {/* Top Canvas Bar */}
                    <div className="relative z-10 flex items-center justify-between text-xs">
                      <span className="bg-[#2563EB] text-white font-bold px-2 py-0.5 rounded text-[10px] tracking-wider font-mono shadow-md border border-[#60A5FA]/30">
                        STUDIO CANVAS
                      </span>
                      <span className="font-mono text-xs text-zinc-300 bg-black/60 px-2 py-0.5 rounded backdrop-blur-md border border-white/10">
                        00:28 / 1080p
                      </span>
                    </div>

                    {/* Centered Captions & Audio Engine */}
                    <div className="relative z-10 text-center space-y-2.5 py-4">
                      <span className="inline-block text-[10px] uppercase font-bold text-[#60A5FA] tracking-widest bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-full border border-[#3B82F6]/40 shadow-sm">
                        Stoic Mindset & Discipline
                      </span>
                      <p className="text-sm sm:text-base font-extrabold text-white leading-snug drop-shadow-2xl tracking-tight">
                        "When motivation fades,{' '}
                        <span className="text-[#60A5FA] underline decoration-blue-500 underline-offset-4">
                          discipline
                        </span>{' '}
                        takes the wheel."
                      </p>

                      {/* Audio frequency visualizer bars */}
                      <div className="inline-flex items-center gap-2 text-xs text-blue-200 font-medium bg-black/75 px-3 py-1 rounded-full backdrop-blur-md border border-white/10 shadow-lg">
                        <div className="flex items-center gap-0.5 h-3">
                          <span className="w-1 h-2 bg-[#3B82F6] rounded-full" />
                          <span className="w-1 h-3 bg-[#60A5FA] rounded-full animate-pulse" />
                          <span className="w-1 h-1.5 bg-[#93C5FD] rounded-full" />
                          <span className="w-1 h-2.5 bg-[#3B82F6] rounded-full" />
                        </div>
                        <span className="text-[11px]">
                          Voiceover: Fenrir (24kHz TTS)
                        </span>
                      </div>
                    </div>

                    {/* Bottom Video Progress Scrub Bar */}
                    <div className="relative z-10 space-y-1.5 pt-2 border-t border-white/15">
                      <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden">
                        <div className="h-full w-2/3 bg-gradient-to-r from-[#2563EB] to-cyan-400" />
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-zinc-300">
                        <span className="flex items-center gap-1.5 font-medium">
                          <Volume2 className="w-3.5 h-3.5 text-[#3B82F6]" />
                          <span>Cinematic Bass Drone</span>
                        </span>
                        <span className="inline-flex items-center gap-1 text-emerald-400 font-bold bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          Ready
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="primary"
                      className="w-full text-xs font-bold shadow-md shadow-blue-900/30"
                      onClick={() => onNavigate('workspace')}
                    >
                      Open Full Studio Workspace
                    </Button>
                  </div>
                </div>
              </Tilt3DCard>
            </div>
          </div>
        </section>

        {/* ── 2. Trending Shorts Showcase Gallery with Niche Tabs ── */}
        <section
          id="showcase"
          className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-20 border-t border-[#242424]"
        >
          <div className="text-center max-w-2xl mx-auto space-y-3 mb-10">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.2em] text-[#60A5FA] bg-[#2563EB]/15 px-3 py-1 rounded-full border border-[#3B82F6]/30">
              <TrendingUp className="w-3.5 h-3.5" /> High Retention Formats
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
              Trending AI Shorts Created with ApexMind
            </h2>
            <p className="text-zinc-400 text-sm">
              Discover viral-engineered formats built with Gemini AI scripts,
              24kHz studio voiceovers, and licensed visual assets.
            </p>
          </div>

          {/* Niche Filter Tabs */}
          <div className="flex items-center justify-center gap-2 flex-wrap mb-10">
            {SHOWCASE_CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const isActive = selectedNiche === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => handleSelectNiche(cat.id)}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold cursor-pointer transition-all ${
                    isActive
                      ? 'bg-[#2563EB] text-white shadow-lg shadow-blue-900/30 border border-[#60A5FA]/40'
                      : 'bg-[#141416] text-zinc-400 hover:text-white border border-[#27272A]'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>

          {/* Showcase Reels Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredReels.map((reel) => (
              <div key={reel.id} className="w-full">
                <Tilt3DCard maxTilt={0} perspective={0}>
                  <div className="relative rounded-2xl bg-[#141416] border border-[#27272A] hover:border-[#3B82F6]/60 p-4 shadow-xl flex flex-col justify-between overflow-hidden">
                    {/* Visual 9:16 Canvas Box */}
                    <div className="relative aspect-[9/16] w-full rounded-xl overflow-hidden border border-white/10 shadow-lg group">
                      <img
                        src={reel.image}
                        alt={reel.title}
                        className="w-full h-full object-cover contrast-110 brightness-90 transition-transform duration-500 group-hover:scale-105"
                      />

                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

                      {/* Top Badges */}
                      <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-10">
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border backdrop-blur-md ${reel.tagColor}`}
                        >
                          {reel.category}
                        </span>
                        <span className="flex items-center gap-1 text-[10px] font-bold text-white bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-full border border-white/10">
                          <Eye className="w-3 h-3 text-red-500" />
                          {reel.views}
                        </span>
                      </div>

                      {/* Play Action Trigger (Opens Modal) */}
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedPreviewReel(reel);
                          setModalIsPlaying(true);
                        }}
                        className="absolute inset-0 flex items-center justify-center opacity-85 hover:opacity-100 cursor-pointer bg-black/20 hover:bg-black/30 transition-all"
                        aria-label={`Play ${reel.title} preview`}
                      >
                        <div className="w-12 h-12 rounded-full bg-[#2563EB]/90 text-white flex items-center justify-center shadow-2xl border border-white/30 transform group-hover:scale-110 transition-transform">
                          <Play className="w-5 h-5 fill-current ml-0.5" />
                        </div>
                      </button>

                      {/* Bottom Quote & Subtitles Preview */}
                      <div className="absolute bottom-3 left-3 right-3 z-10 space-y-1.5 pointer-events-none">
                        <div className="flex items-center gap-1.5 text-[10px] text-zinc-300 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded w-fit border border-white/10">
                          <Radio className="w-2.5 h-2.5 text-[#60A5FA]" />
                          <span>{reel.voice}</span>
                        </div>
                        <p className="text-xs font-bold text-white leading-tight drop-shadow-md line-clamp-3">
                          {reel.quote}
                        </p>
                      </div>
                    </div>

                    {/* Card Footer Info */}
                    <div className="pt-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-bold text-white hover:text-[#60A5FA] line-clamp-1">
                            {reel.title}
                          </h4>
                          <span className="text-xs text-zinc-400">
                            {reel.author} • {reel.retention}
                          </span>
                        </div>
                        <Youtube className="w-4 h-4 text-red-500 fill-current shrink-0" />
                      </div>

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedPreviewReel(reel);
                            setModalIsPlaying(true);
                          }}
                          className="flex-1 py-1.5 px-2 rounded-lg bg-[#1E1E24] hover:bg-[#2A2A35] text-zinc-300 text-xs font-semibold border border-[#2F2F36] cursor-pointer flex items-center justify-center gap-1"
                        >
                          <Play className="w-3 h-3 fill-current" />
                          <span>Watch</span>
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            onNavigate('workspace', {
                              tab: 'script',
                              templateId: reel.id,
                              niche: reel.niche,
                            })
                          }
                          className="flex-1 py-1.5 px-2 rounded-lg bg-[#2563EB] hover:bg-blue-600 text-white text-xs font-semibold cursor-pointer flex items-center justify-center gap-1 shadow-sm"
                        >
                          <span>Remix</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </Tilt3DCard>
              </div>
            ))}
          </div>
        </section>

        {/* ── 3. 24kHz Studio Neural Voices Sampler Rack ── */}
        <section
          id="voices"
          className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-20 border-t border-[#242424]"
        >
          <div className="text-center max-w-2xl mx-auto space-y-3 mb-12">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.2em] text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
              <Mic className="w-3.5 h-3.5" /> 24kHz Studio Neural Speech
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
              Lifelike Voice Actors for Every Niche
            </h2>
            <p className="text-zinc-400 text-sm">
              Listen to authentic 24kHz inflections generated directly via
              Gemini Studio TTS. Zero robotic monotony.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {VOICE_PREVIEWS.map((voice) => {
              const isPlaying = playingVoiceId === voice.id;
              return (
                <div
                  key={voice.id}
                  className="p-5 rounded-2xl bg-[#141416] border border-[#242424] hover:border-indigo-500/50 flex flex-col justify-between space-y-4 shadow-lg transition-all"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${voice.badgeColor}`}
                      >
                        {voice.badge}
                      </span>
                      <span className="text-[11px] text-zinc-400 font-mono">
                        {voice.niche}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <span>{voice.name}</span>
                      <span className="text-xs text-zinc-400 font-normal">
                        ({voice.title})
                      </span>
                    </h3>

                    <p className="text-xs text-zinc-400 italic line-clamp-3 bg-[#0E0E11] p-2.5 rounded-xl border border-[#202025]">
                      "{voice.sampleLine}"
                    </p>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-[#202025]">
                    {/* Frequency bars when playing */}
                    {isPlaying && (
                      <div className="flex items-center justify-center gap-1 h-4">
                        <span className="w-1 h-3 bg-indigo-500 rounded-full animate-bounce" />
                        <span className="w-1 h-4 bg-[#60A5FA] rounded-full animate-pulse" />
                        <span className="w-1 h-2 bg-indigo-400 rounded-full animate-bounce" />
                        <span className="w-1 h-4 bg-[#3B82F6] rounded-full animate-pulse" />
                      </div>
                    )}

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleTogglePlayVoice(voice)}
                        className={`flex-1 py-1.5 px-2.5 rounded-lg text-xs font-semibold cursor-pointer flex items-center justify-center gap-1.5 transition-all ${
                          isPlaying
                            ? 'bg-indigo-600 text-white shadow-md'
                            : 'bg-[#1C1C21] hover:bg-[#25252D] text-white border border-[#2C2C35]'
                        }`}
                      >
                        {isPlaying ? (
                          <>
                            <Pause className="w-3.5 h-3.5 fill-current" />
                            <span>Stop</span>
                          </>
                        ) : (
                          <>
                            <Play className="w-3.5 h-3.5 fill-current" />
                            <span>Preview</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          onNavigate('workspace', {
                            tab: 'audio',
                            subtab: 'voiceover',
                            voice: voice.name,
                          })
                        }
                        className="py-1.5 px-2 rounded-lg bg-[#2563EB]/20 hover:bg-[#2563EB] text-[#60A5FA] hover:text-white text-xs font-semibold border border-[#3B82F6]/30 cursor-pointer flex items-center justify-center"
                        title="Use this voice in studio"
                      >
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── 4. Feature Section ── */}
        <section
          id="features"
          className="max-w-7xl mx-auto px-6 py-20 border-t border-[#242424]"
        >
          <div className="text-center max-w-2xl mx-auto space-y-3 mb-16">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#60A5FA] bg-[#2563EB]/10 px-3 py-1 rounded-full border border-[#3B82F6]/20">
              Autonomous Creation Suite
            </span>
            <h2 className="text-3xl font-bold tracking-tight text-white">
              Full-Stack Automation Features
            </h2>
            <p className="text-zinc-400 text-sm">
              Go from a topic to a polished Short with practical creative tools
              in one focused workspace.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: <Wand2 className="w-6 h-6" />,
                iconColor:
                  'bg-[#2563EB]/15 text-[#60A5FA] border-[#3B82F6]/30',
                title: 'Gemini AI Script & Quote Engine',
                desc: 'Generates high-retention motivational monologues, viral hooks, and auto-synced timed captions for immediate video rendering.',
              },
              {
                icon: <Volume2 className="w-6 h-6" />,
                iconColor:
                  'bg-indigo-500/15 text-indigo-400 border-indigo-500/30',
                title: 'Natural Gemini Voiceovers',
                desc: `Powered by ${DEFAULT_TTS_MODEL_LABEL} for lifelike 24kHz audio synthesis in voices like Fenrir, Kore, and Zephyr.`,
              },
              {
                icon: <Shield className="w-6 h-6" />,
                iconColor:
                  'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
                title: 'Curated 500K+ Media Library',
                desc: 'Access royalty-free Creative Commons, Incompetech, and Netlabels audio streams with real MP3 resolving and zero broken sources.',
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
                title: 'Kinetic Dynamic Subtitles',
                desc: 'Pair generated narration with word-level glowing subtitles to skyrocket viewer completion rates.',
              },
              {
                icon: <CalendarClock className="w-6 h-6" />,
                iconColor:
                  'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
                title: 'Autonomous Upload Schedules',
                desc: 'Set recurring publishing cadences to auto-upload rendered Shorts to your YouTube Channel on autopilot.',
              },
            ].map((feature) => (
              <div key={feature.title} className="w-full">
                <Tilt3DCard maxTilt={0} perspective={0}>
                  <div className="p-6 rounded-2xl bg-[#141416] border border-[#242424] hover:border-[#3B82F6]/50 hover:bg-[#18181D] space-y-4 shadow-lg">
                    <div
                      className={`p-3 w-fit rounded-xl border ${feature.iconColor} shadow-md`}
                    >
                      {feature.icon}
                    </div>
                    <h3 className="text-lg font-bold text-white hover:text-[#60A5FA]">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-zinc-400 leading-relaxed">
                      {feature.desc}
                    </p>
                  </div>
                </Tilt3DCard>
              </div>
            ))}
          </div>
        </section>

        {/* ── 5. Interactive 3-Step Workflow Pipeline ── */}
        <section
          id="workflow"
          className="max-w-7xl mx-auto px-6 py-20 border-t border-[#242424]"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-5 space-y-6">
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#60A5FA] bg-[#2563EB]/10 px-3 py-1 rounded-full border border-[#3B82F6]/20">
                End-to-End Execution
              </span>
              <h2 className="text-3xl font-bold tracking-tight text-white leading-tight">
                From Idea to Published YouTube Short in 3 Simple Steps
              </h2>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Experience the power of automated batch creation. Set up your
                schedule once and let ApexMind handle daily quote generation,
                audio mixing, and publishing.
              </p>

              {/* Step Switcher Buttons */}
              <div className="space-y-3">
                {[
                  {
                    step: 1,
                    title: '1. Select Topic & Voice Style',
                    desc: 'Choose from Stoicism, Fitness, Wealth, or custom prompts with Gemini AI.',
                  },
                  {
                    step: 2,
                    title: '2. Synthesize Audio & Video Canvas',
                    desc: 'Generate 24kHz neural speech, dynamic subtitles, and royalty-free music.',
                  },
                  {
                    step: 3,
                    title: '3. One-Click YouTube Publishing',
                    desc: 'Upload directly to YouTube Shorts with optimized SEO tags, title, and scheduling.',
                  },
                ].map((item) => (
                  <button
                    key={item.step}
                    type="button"
                    onClick={() => setActiveWorkflowStep(item.step)}
                    className={`w-full text-left flex items-start gap-3.5 p-3.5 rounded-xl border cursor-pointer transition-all ${
                      activeWorkflowStep === item.step
                        ? 'bg-[#1C1C23] border-[#3B82F6] shadow-lg shadow-blue-900/20'
                        : 'bg-[#141416] border-[#242424] hover:border-[#3B82F6]/40 text-zinc-400'
                    }`}
                  >
                    <div
                      className={`flex items-center justify-center w-7 h-7 rounded-lg font-bold text-xs shrink-0 shadow-sm ${
                        activeWorkflowStep === item.step
                          ? 'bg-[#2563EB] text-white'
                          : 'bg-[#25252D] text-zinc-400'
                      }`}
                    >
                      {item.step}
                    </div>
                    <div>
                      <h4
                        className={`text-sm font-semibold ${
                          activeWorkflowStep === item.step
                            ? 'text-white'
                            : 'text-zinc-300'
                        }`}
                      >
                        {item.title}
                      </h4>
                      <p className="text-xs text-zinc-400 mt-0.5">{item.desc}</p>
                    </div>
                  </button>
                ))}
              </div>

              <div>
                <Button
                  size="lg"
                  icon={<ArrowRight className="w-4 h-4" />}
                  onClick={() => onNavigate('workspace')}
                >
                  Open Studio Workspace
                </Button>
              </div>
            </div>

            {/* Step Visualizer */}
            <div className="lg:col-span-7 bg-[#141416] border border-[#242424] rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xl relative overflow-hidden">
              <div className="flex items-center justify-between pb-4 border-b border-[#242424]">
                <span className="text-sm font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#3B82F6]" />
                  Step {activeWorkflowStep} Execution Engine
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  Live Production Pipeline
                </span>
              </div>

              {activeWorkflowStep === 1 && (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-[#0F0F12] border border-[#242424] flex items-start gap-4">
                    <div className="p-2.5 rounded-lg bg-[#2563EB]/15 text-[#60A5FA] shrink-0 border border-[#3B82F6]/30">
                      <Wand2 className="w-5 h-5" />
                    </div>
                    <div className="space-y-1 w-full">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-semibold text-white">
                          AI Script & Retention Hooks
                        </h4>
                        <span className="text-[11px] font-mono text-[#60A5FA]">
                          {DEFAULT_SCRIPT_MODEL_LABEL}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400 leading-relaxed">
                        Generates viral-structured motivational hooks, body
                        reasoning, and impactful takeaways customized for YouTube
                        Shorts retention curves.
                      </p>
                    </div>
                  </div>
                  <div className="p-3 bg-[#0A0A0C] rounded-xl border border-white/5 font-mono text-xs text-zinc-300">
                    <span className="text-[#60A5FA]">&gt; Hook:</span> "You have
                    power over your mind - not outside events."
                    <br />
                    <span className="text-amber-400">&gt; Body:</span> "When you
                    realize this, you find unbreakable sovereignty."
                  </div>
                </div>
              )}

              {activeWorkflowStep === 2 && (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-[#0F0F12] border border-[#242424] flex items-start gap-4">
                    <div className="p-2.5 rounded-lg bg-indigo-500/15 text-indigo-400 shrink-0 border border-indigo-500/30">
                      <Volume2 className="w-5 h-5" />
                    </div>
                    <div className="space-y-1 w-full">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-semibold text-white">
                          24kHz Neural Studio Speech & Captions
                        </h4>
                        <span className="text-[11px] font-mono text-indigo-300">
                          Fenrir / Puck / Aoede
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400 leading-relaxed">
                        Ultra-natural human inflections with auto-synced word-level
                        subtitles and copyright-safe royalty-free ambient audio
                        tracks.
                      </p>
                    </div>
                  </div>
                  <div className="p-3 bg-[#0A0A0C] rounded-xl border border-white/5 flex items-center justify-between text-xs">
                    <span className="text-indigo-400 font-mono">
                      Output: 1080x1920 60FPS MP4
                    </span>
                    <span className="text-emerald-400 font-bold">
                      Audio: Incompetech Drone + Fenrir 24kHz
                    </span>
                  </div>
                </div>
              )}

              {activeWorkflowStep === 3 && (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-[#0F0F12] border border-red-500/40 flex items-start gap-4">
                    <div className="p-2.5 rounded-lg bg-red-500/15 text-red-400 shrink-0 border border-red-500/30">
                      <Youtube className="w-5 h-5" />
                    </div>
                    <div className="space-y-1 w-full">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-semibold text-white">
                          Direct YouTube Shorts Publisher
                        </h4>
                        <span className="text-[11px] font-mono text-red-400">
                          OAuth v3 Verified
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400 leading-relaxed">
                        Instant or scheduled publishing with algorithm-optimized
                        hashtags, descriptions, and channel performance sync.
                      </p>
                    </div>
                  </div>
                  <div className="p-3 bg-[#0A0A0C] rounded-xl border border-white/5 flex items-center justify-between text-xs font-mono">
                    <span className="text-red-400">
                      Tags: #stoic #mindset #shorts #motivation
                    </span>
                    <span className="text-zinc-400">Status: Scheduled 18:00 UTC</span>
                  </div>
                </div>
              )}

              <div className="pt-2 flex items-center justify-between border-t border-[#242424]">
                <span className="text-xs text-zinc-400">
                  Ready to test this pipeline with your own prompt?
                </span>
                <Button
                  size="sm"
                  icon={<Zap className="w-3.5 h-3.5" />}
                  onClick={() => onNavigate('workspace')}
                >
                  Launch Studio
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* ── 6. Creator Blueprints & Niche Playbooks ── */}
        <section
          id="creator-use-cases"
          className="max-w-7xl mx-auto px-6 py-20 border-t border-[#242424]"
        >
          <div className="text-center max-w-2xl mx-auto space-y-3 mb-10">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#60A5FA] bg-[#2563EB]/10 px-3 py-1 rounded-full border border-[#3B82F6]/20">
              Battle-Tested Playbooks
            </span>
            <h2 className="text-3xl font-bold tracking-tight text-white">
              Creator Blueprints by Niche
            </h2>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Tailored workflows for faceless channel operators, gym influencers,
              and thought leaders.
            </p>
          </div>

          {/* Blueprint Selector Tabs */}
          <div className="flex items-center justify-center gap-2 flex-wrap mb-8">
            {CREATOR_BLUEPRINTS.map((bp) => (
              <button
                key={bp.id}
                type="button"
                onClick={() => setSelectedBlueprintId(bp.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                  selectedBlueprintId === bp.id
                    ? 'bg-[#2563EB] text-white shadow-lg shadow-blue-900/30 border border-[#60A5FA]/40'
                    : 'bg-[#141416] text-zinc-400 hover:text-white border border-[#27272A]'
                }`}
              >
                {bp.title}
              </button>
            ))}
          </div>

          {/* Active Blueprint Card Display */}
          <div className="max-w-4xl mx-auto rounded-3xl bg-[#141417] border border-[#2A2A30] p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-[#242424]">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#60A5FA]">
                  {activeBlueprint.tagline}
                </span>
                <h3 className="text-2xl font-extrabold text-white mt-1">
                  {activeBlueprint.title}
                </h3>
              </div>
              <Button
                variant="primary"
                size="sm"
                icon={<Sparkles className="w-4 h-4" />}
                onClick={() =>
                  onNavigate('workspace', {
                    tab: 'prompt',
                    niche: activeBlueprint.niche,
                  })
                }
              >
                Deploy This Blueprint →
              </Button>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-3.5 rounded-xl bg-[#0F0F12] border border-[#222226]">
                <span className="text-[11px] text-zinc-400 uppercase font-mono">
                  Posting Cadence
                </span>
                <p className="text-sm font-bold text-white mt-1">
                  {activeBlueprint.cadence}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-[#0F0F12] border border-[#222226]">
                <span className="text-[11px] text-zinc-400 uppercase font-mono">
                  Target Retention
                </span>
                <p className="text-sm font-bold text-emerald-400 mt-1">
                  {activeBlueprint.avgRetention}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-[#0F0F12] border border-[#222226]">
                <span className="text-[11px] text-zinc-400 uppercase font-mono">
                  Revenue Potential
                </span>
                <p className="text-sm font-bold text-[#60A5FA] mt-1">
                  {activeBlueprint.revenueEstimate}
                </p>
              </div>
            </div>

            {/* Stack Info */}
            <div className="p-3.5 rounded-xl bg-[#0B0B0E] border border-[#222228] text-xs flex items-center justify-between">
              <span className="text-zinc-400 font-mono">Recommended Stack:</span>
              <span className="text-white font-bold">{activeBlueprint.stack}</span>
            </div>

            {/* Highlights List */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {activeBlueprint.highlights.map((highlight) => (
                <div
                  key={highlight}
                  className="flex items-center gap-2.5 text-xs text-zinc-300"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{highlight}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 7. Review-First Publishing Safety ── */}
        <section className="max-w-7xl mx-auto px-6 pb-20">
          <div className="relative overflow-hidden rounded-3xl border border-[#2563EB]/30 bg-gradient-to-br from-[#0D1936] via-[#111625] to-[#121216] p-8 lg:p-12 shadow-2xl">
            <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-7 space-y-4">
                <div className="inline-flex items-center gap-2 text-xs font-bold text-[#93C5FD] uppercase tracking-wider bg-[#2563EB]/20 px-3 py-1 rounded-full border border-[#60A5FA]/30">
                  <Shield className="w-4 h-4 text-[#60A5FA]" /> YOUR CHANNEL,
                  YOUR CONTROL
                </div>
                <h2 className="text-3xl font-bold text-white">
                  Keep the creative decisions in your hands.
                </h2>
                <p className="text-sm text-[#C0C7D2] leading-relaxed max-w-2xl">
                  Use AI to get a first draft, personalize the voice and visuals,
                  and review the result before publishing. ApexMind supports
                  your process—it doesn’t replace your judgment.
                </p>
              </div>
              <div className="lg:col-span-5 grid grid-cols-1 gap-3">
                {[
                  'Choose a topic and tone',
                  'Edit the generated script & captions',
                  'Preview canvas and decide when to publish',
                ].map((step) => (
                  <div
                    key={step}
                    className="flex items-center gap-3 rounded-xl bg-black/40 border border-white/10 px-4 py-3 text-sm text-white backdrop-blur-md"
                  >
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />{' '}
                    {step}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── 8. Searchable & Categorized FAQ ── */}
        <section
          id="faq"
          className="max-w-4xl mx-auto px-6 py-20 border-t border-[#242424]"
        >
          <div className="text-center space-y-3 mb-8">
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-[#60A5FA] bg-[#2563EB]/10 px-3 py-1 rounded-full border border-[#3B82F6]/20">
              <CircleHelp className="w-4 h-4" /> Good to know
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-white">
              Frequently Asked Questions
            </h2>
            <p className="text-sm text-zinc-400">
              Everything you need to know about monetization, copyright, voices,
              and YouTube publishing.
            </p>
          </div>

          {/* Search Bar */}
          <div className="relative mb-6">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={faqSearchQuery}
              onChange={(e) => setFaqSearchQuery(e.target.value)}
              placeholder="Search questions (e.g. monetization, copyright, voices)..."
              className="w-full bg-[#141417] border border-[#27272A] focus:border-[#3B82F6] rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none"
            />
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-4 scrollbar-none mb-4">
            {FAQ_CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedFaqCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer transition-all ${
                  selectedFaqCategory === cat
                    ? 'bg-[#2563EB] text-white border border-[#60A5FA]/40'
                    : 'bg-[#141416] text-zinc-400 hover:text-white border border-[#27272A]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* FAQ Accordion List */}
          <div className="space-y-3">
            {filteredFaqs.length > 0 ? (
              filteredFaqs.map((item) => (
                <details
                  key={item.question}
                  className="group rounded-2xl bg-[#141416] border border-[#242424] open:border-[#3B82F6]/40 transition-colors"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 text-sm font-semibold text-white select-none">
                    <span className="flex items-center gap-2">
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-[#1F1F26] text-[#60A5FA] border border-white/5">
                        {item.category}
                      </span>
                      <span>{item.question}</span>
                    </span>
                    <span className="text-[#60A5FA] group-open:rotate-45 text-base transition-transform">
                      +
                    </span>
                  </summary>
                  <p className="px-5 pb-5 text-sm leading-relaxed text-zinc-400">
                    {item.answer}
                  </p>
                </details>
              ))
            ) : (
              <div className="text-center py-8 text-zinc-400 text-sm">
                No questions found matching your search. Try searching for "voices"
                or "copyright".
              </div>
            )}
          </div>
        </section>

        {/* ── 9. Final Call to Action ── */}
        <section className="max-w-7xl mx-auto px-6 pb-20">
          <div className="rounded-3xl border border-[#242424] bg-gradient-to-b from-[#141417] to-[#0E0E11] p-8 lg:p-12 text-center space-y-5 shadow-2xl relative overflow-hidden">
            <div className="absolute inset-0 bg-radial from-[#2563EB]/10 via-transparent to-transparent pointer-events-none" />

            <div className="relative mx-auto w-fit mb-2">
              <ApexMindLogo size={52} variant="3d" interactive={false} />
            </div>
            <h2 className="relative text-3xl font-bold text-white tracking-tight">
              Your next viral Short starts with one idea.
            </h2>
            <p className="relative max-w-xl mx-auto text-sm text-zinc-400">
              Bring a topic, shape it into a high-retention story, and build your
              next video in the ApexMind studio.
            </p>
            <div className="relative inline-block">
              <Button
                size="lg"
                icon={<ArrowRight className="w-4 h-4" />}
                onClick={() => onNavigate('workspace')}
              >
                Launch Studio Workspace
              </Button>
            </div>
          </div>
        </section>

        {/* Dedicated Landing Footer Component */}
        <LandingFooter onNavigate={onNavigate} />
      </div>

      {/* ── 9:16 Vertical Reel Theatre Preview Modal ── */}
      {selectedPreviewReel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-sm rounded-3xl overflow-hidden border border-[#2C2C36] bg-[#0A0A0C] shadow-2xl flex flex-col">
            {/* Top Bar with Close */}
            <div className="p-3.5 bg-[#141417]/90 backdrop-blur-md border-b border-white/10 flex items-center justify-between z-20">
              <div className="flex items-center gap-2">
                <span
                  className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${selectedPreviewReel.tagColor}`}
                >
                  {selectedPreviewReel.category}
                </span>
                <span className="text-xs font-bold text-white line-clamp-1">
                  {selectedPreviewReel.title}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedPreviewReel(null);
                  if (window.speechSynthesis) window.speechSynthesis.cancel();
                }}
                className="p-1 rounded-full bg-white/10 hover:bg-white/20 text-white cursor-pointer"
                aria-label="Close Preview"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 9:16 Visual Canvas */}
            <div className="relative aspect-[9/16] w-full overflow-hidden bg-black flex flex-col justify-between p-4">
              <img
                src={selectedPreviewReel.image}
                alt={selectedPreviewReel.title}
                className="absolute inset-0 w-full h-full object-cover contrast-115 brightness-90"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent pointer-events-none" />

              {/* Safezone & Stats */}
              <div className="relative z-10 flex items-center justify-between text-[11px] text-white">
                <span className="font-mono bg-black/60 px-2 py-0.5 rounded-full border border-white/10">
                  {selectedPreviewReel.duration}
                </span>
                <span className="flex items-center gap-1 font-bold text-emerald-400 bg-emerald-950/70 px-2 py-0.5 rounded-full border border-emerald-500/30">
                  <Flame className="w-3 h-3" />
                  {selectedPreviewReel.retention}
                </span>
              </div>

              {/* YouTube Shorts Side Actions Simulation */}
              <div className="absolute right-3 bottom-24 z-20 flex flex-col items-center gap-3 text-white">
                <div className="flex flex-col items-center gap-0.5">
                  <div className="w-9 h-9 rounded-full bg-black/60 backdrop-blur-md border border-white/10 flex items-center justify-center">
                    <Heart className="w-4 h-4 fill-red-500 text-red-500" />
                  </div>
                  <span className="text-[10px] font-bold">142K</span>
                </div>
                <div className="flex flex-col items-center gap-0.5">
                  <div className="w-9 h-9 rounded-full bg-black/60 backdrop-blur-md border border-white/10 flex items-center justify-center">
                    <MessageCircle className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-bold">1.2K</span>
                </div>
                <div className="flex flex-col items-center gap-0.5">
                  <div className="w-9 h-9 rounded-full bg-black/60 backdrop-blur-md border border-white/10 flex items-center justify-center">
                    <Share2 className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-bold">Share</span>
                </div>
              </div>

              {/* Center Play / Pause Indicator */}
              <button
                type="button"
                onClick={() => setModalIsPlaying(!modalIsPlaying)}
                className="absolute inset-0 flex items-center justify-center cursor-pointer z-10"
              >
                {!modalIsPlaying && (
                  <div className="w-14 h-14 rounded-full bg-black/70 text-white flex items-center justify-center shadow-2xl border border-white/20">
                    <Play className="w-6 h-6 fill-current ml-1" />
                  </div>
                )}
              </button>

              {/* Bottom Quote & Captions Preview */}
              <div className="relative z-10 space-y-2 pr-12">
                <div className="flex items-center gap-1.5 text-[10px] text-zinc-300 bg-black/70 backdrop-blur-md px-2 py-0.5 rounded w-fit border border-white/10">
                  <Radio className="w-2.5 h-2.5 text-[#60A5FA]" />
                  <span>{selectedPreviewReel.voice}</span>
                </div>

                <p className="text-sm font-extrabold text-white leading-tight drop-shadow-md">
                  {selectedPreviewReel.quote}
                </p>

                {/* Simulated Audio Frequency Visualizer */}
                {modalIsPlaying && (
                  <div className="flex items-center gap-1 pt-1">
                    <span className="w-1 h-3 bg-[#3B82F6] rounded-full animate-pulse" />
                    <span className="w-1 h-4 bg-[#60A5FA] rounded-full animate-bounce" />
                    <span className="w-1 h-2 bg-[#93C5FD] rounded-full animate-pulse" />
                    <span className="w-1 h-3.5 bg-indigo-400 rounded-full animate-bounce" />
                    <span className="text-[10px] text-zinc-400 font-mono ml-1">
                      Incompetech Soundtrack Active
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Bottom Actions */}
            <div className="p-4 bg-[#141417] border-t border-white/10 flex gap-2">
              <Button
                variant="primary"
                className="w-full text-xs font-bold"
                icon={<Sparkles className="w-4 h-4" />}
                onClick={() => {
                  setSelectedPreviewReel(null);
                  onNavigate('workspace', {
                    tab: 'script',
                    templateId: selectedPreviewReel.id,
                    niche: selectedPreviewReel.niche,
                  });
                }}
              >
                Remix this Short in Studio →
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
