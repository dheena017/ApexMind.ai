import React, { useEffect, useState } from 'react';
import {
  Sparkles,
  Loader2,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Zap,
  Youtube,
  Radio,
} from 'lucide-react';
import { Button } from '@/src/shared/ui/common';
import { parseRoute, type PageRoute } from '@/src/app/routes';

interface LoadingPageProps {
  onNavigate: (page: string) => void;
}

export default function LoadingPage({ onNavigate }: LoadingPageProps) {
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);

  // Parse mode and target destination from query string
  const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const mode = urlParams?.get('mode') || urlParams?.get('type') || 'studio';
  const targetParam = urlParams?.get('target') || urlParams?.get('redirect') || 'workspace';
  const targetRoute: PageRoute = parseRoute(targetParam.startsWith('/') ? targetParam : `/${targetParam}`);
  const finalTarget = targetRoute !== '404' && targetRoute !== 'loading' ? targetRoute : 'workspace';

  const stepConfigs: Record<string, { title: string; subtitle: string; icon: React.ReactNode; steps: string[] }> = {
    auth: {
      title: 'Authenticating Creator Session',
      subtitle: 'Verifying Google credentials and initializing secure workspace tokens',
      icon: <ShieldCheck className="w-8 h-8 text-[#60A5FA]" />,
      steps: [
        'Validating Google Identity Services token...',
        'Loading creator profile & channel permissions...',
        'Checking Gemini API engine quotas & rate limits...',
        'Syncing YouTube Shorts automation catalog...',
        'Session ready. Redirecting to your workspace...',
      ],
    },
    render: {
      title: 'Rendering AI Motivational Short',
      subtitle: 'Synthesizing voiceover, generating transcript, and composing 9:16 layout',
      icon: <Youtube className="w-8 h-8 text-red-500" />,
      steps: [
        'Prompting Gemini 3.8 Flash for high-impact hook & quote...',
        'Synthesizing 24kHz studio audio with Gemini TTS...',
        'Composing 9:16 dynamic motion canvas & backdrops...',
        'Aligning word-by-word animated caption overlays...',
        'Short render complete. Ready for YouTube publishing...',
      ],
    },
    studio: {
      title: 'Initializing ApexMind Studio',
      subtitle: 'Starting autonomous video pipelines, AI models, and YouTube sync',
      icon: <Sparkles className="w-8 h-8 text-[#60A5FA]" />,
      steps: [
        'Connecting to Gemini 3.8 Flash AI Engine...',
        'Loading 24kHz Gemini neural voice synthesizer...',
        'Calibrating copyright-free ambient music score library...',
        'Syncing YouTube channel metrics & Shorts manager...',
        'ApexMind AI Studio initialized and ready.',
      ],
    },
  };

  const config = stepConfigs[mode] || stepConfigs.studio;
  const steps = config.steps;

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          return 100;
        }
        const increment = Math.floor(Math.random() * 5) + 3;
        const next = Math.min(100, prev + increment);

        const stepIndex = Math.min(
          steps.length - 1,
          Math.floor((next / 100) * steps.length)
        );
        setCurrentStep(stepIndex);
        return next;
      });
    }, 90);

    return () => clearInterval(timer);
  }, [steps.length]);

  // Auto-redirect once reaching 100%
  useEffect(() => {
    if (progress >= 100) {
      const redirectTimer = setTimeout(() => {
        onNavigate(finalTarget);
      }, 700);
      return () => clearTimeout(redirectTimer);
    }
  }, [progress, onNavigate, finalTarget]);

  return (
    <main className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-[#0A0A0A] px-4 py-8 text-[#E5E5E5] font-sans-studio selection:bg-[#3B82F6]/30 selection:text-[#60A5FA]">
      {/* Ambient background glows */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-[500px] w-[500px] rounded-full bg-[#3B82F6]/15 blur-[140px]" />
      <div className="pointer-events-none absolute -bottom-32 right-1/4 h-80 w-80 rounded-full bg-[#2563EB]/10 blur-[120px]" />

      <div className="relative w-full max-w-lg rounded-[28px] border border-[#2F2F2F] bg-[#1E1E1E]/95 p-8 sm:p-10 shadow-2xl shadow-black/60 backdrop-blur-xl space-y-7 text-center">
        {/* Animated Brand Badge & Spinning Rings */}
        <div className="relative mx-auto flex h-20 w-20 items-center justify-center">
          {/* Dual spinning outer rings */}
          <div className="absolute inset-0 rounded-2xl border-2 border-dashed border-[#3B82F6]/30 animate-spin" style={{ animationDuration: '8s' }} />
          <div className="absolute -inset-1 rounded-3xl border border-[#60A5FA]/20 animate-pulse" />

          {/* Central Logo Box */}
          <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-[#60A5FA]/40 bg-gradient-to-tr from-[#3B82F6] to-[#2563EB] text-white shadow-xl shadow-[#3B82F6]/30">
            {config.icon}
          </div>
        </div>

        {/* Headings */}
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#3B82F6]/30 bg-[#3B82F6]/10 px-3 py-1 text-[11px] font-semibold text-[#93C5FD]">
            <Radio className="h-3 w-3 animate-pulse text-[#60A5FA]" />
            <span>ApexMind Orchestrator</span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
            {config.title}
          </h1>
          <p className="text-xs text-[#9CA3AF] max-w-sm mx-auto leading-relaxed">
            {config.subtitle}
          </p>
        </div>

        {/* Progress Bar & Counter */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between text-xs font-mono-studio text-[#9CA3AF]">
            <span className="flex items-center gap-1.5">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-[#60A5FA]" />
              <span>Status</span>
            </span>
            <span className="font-bold text-white tabular-nums text-sm">
              <span className="text-[#60A5FA]">{progress}</span>%
            </span>
          </div>

          <div className="relative h-2.5 w-full overflow-hidden rounded-full border border-[#2F2F2F] bg-[#121212] p-0.5">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#3B82F6] via-[#60A5FA] to-cyan-400 transition-all duration-150 ease-out shadow-sm shadow-[#3B82F6]/50"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Checklist Stepper */}
        <div className="space-y-2.5 rounded-2xl border border-[#2F2F2F] bg-[#121212]/90 p-4 text-left">
          {steps.map((stepText, idx) => {
            const isCompleted = idx < currentStep || progress === 100;
            const isCurrent = idx === currentStep && progress < 100;

            return (
              <div key={stepText} className="flex items-center gap-3 text-xs transition-colors">
                {isCompleted ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                ) : isCurrent ? (
                  <Loader2 className="h-4 w-4 shrink-0 animate-spin text-[#60A5FA]" />
                ) : (
                  <div className="h-4 w-4 shrink-0 rounded-full border border-[#2F2F2F] bg-[#1A1A1A]" />
                )}
                <span
                  className={
                    isCompleted
                      ? 'text-[#C5CBD5] font-medium'
                      : isCurrent
                      ? 'text-white font-bold'
                      : 'text-[#6B7280]'
                  }
                >
                  {stepText}
                </span>
              </div>
            );
          })}
        </div>

        {/* Bottom Actions */}
        <div className="pt-1 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => onNavigate('landing')}
            className="text-xs text-[#9CA3AF] hover:text-white transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <Button
            size="sm"
            variant={progress === 100 ? 'primary' : 'secondary'}
            icon={<ArrowRight className="w-3.5 h-3.5" />}
            onClick={() => onNavigate(finalTarget)}
          >
            {progress === 100 ? 'Open Studio' : 'Skip to Studio'}
          </Button>
        </div>
      </div>
    </main>
  );
}
