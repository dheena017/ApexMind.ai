import React, { useEffect, useState } from 'react';
import { Sparkles, Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/src/shared/ui/common';

export default function LoadingPage({ onNavigate }: { onNavigate: (page: string) => void }) {
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    'Initializing Gemini AI Script Engine...',
    'Synthesizing 24kHz Audio Voiceover with Gemini TTS...',
    'Mixing Non-Copyright Ambient Background Score...',
    'Aligning Auto-Synced Subtitles & Video Frames...',
    'Finalizing YouTube Shorts Render Pipeline...',
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          return 100;
        }
        const next = prev + 4;
        if (next > 20 && currentStep === 0) setCurrentStep(1);
        if (next > 45 && currentStep === 1) setCurrentStep(2);
        if (next > 70 && currentStep === 2) setCurrentStep(3);
        if (next > 90 && currentStep === 3) setCurrentStep(4);
        return next;
      });
    }, 120);

    return () => clearInterval(timer);
  }, [currentStep]);

  return (
    <div className="flex-1 w-full min-h-screen bg-[#0A0A0A] text-[#E5E5E5] p-6 flex flex-col items-center justify-center">
      <div className="max-w-md w-full bg-[#1E1E1E] border border-[#2F2F2F] rounded-3xl p-8 space-y-6 text-center shadow-2xl relative overflow-hidden">
        {/* Glow */}
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-48 h-48 bg-[#3B82F6]/20 blur-3xl rounded-full pointer-events-none" />

        <div className="relative mx-auto w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#3B82F6] to-[#2563EB] p-3.5 text-white flex items-center justify-center shadow-lg shadow-[#3B82F6]/25 border border-[#60A5FA]/30">
          <Sparkles className="w-8 h-8 animate-pulse" />
          <Loader2 className="w-20 h-20 animate-spin absolute text-[#60A5FA]/30" />
        </div>

        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Rendering YouTube Short</h2>
          <p className="text-xs text-[#9CA3AF] mt-1 font-mono">{steps[currentStep]}</p>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-mono text-[#9CA3AF]">
            <span>Progress</span>
            <span className="text-[#60A5FA] font-bold">{progress}%</span>
          </div>
          <div className="w-full h-2.5 bg-[#121212] border border-[#2F2F2F] rounded-full overflow-hidden p-0.5">
            <div
              className="h-full bg-gradient-to-r from-[#3B82F6] via-[#2563EB] to-cyan-400 rounded-full transition-all duration-200"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Step checklist */}
        <div className="space-y-2 text-left pt-2 border-t border-[#2F2F2F]">
          {steps.map((step, idx) => (
            <div key={idx} className="flex items-center gap-2.5 text-xs">
              {idx < currentStep ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : idx === currentStep ? (
                <Loader2 className="w-4 h-4 text-[#60A5FA] animate-spin shrink-0" />
              ) : (
                <div className="w-4 h-4 rounded-full border border-[#2F2F2F] shrink-0" />
              )}
              <span className={idx <= currentStep ? 'text-[#E5E5E5] font-medium' : 'text-[#6B7280]'}>{step}</span>
            </div>
          ))}
        </div>

        {progress === 100 && (
          <div className="pt-4 space-y-3 animate-fade-in">
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
              ✓ Render Complete! Video is ready for YouTube preview.
            </div>
            <Button className="w-full" onClick={() => onNavigate('workspace')}>
              Open in Studio Workspace
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
