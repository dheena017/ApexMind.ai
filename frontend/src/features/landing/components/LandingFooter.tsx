import React from 'react';
import { Sparkles, Youtube, ArrowUp, Github, Twitter, Disc as Discord, ShieldCheck, Zap } from 'lucide-react';

interface LandingFooterProps {
  onNavigate: (page: string) => void;
}

export default function LandingFooter({ onNavigate }: LandingFooterProps) {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="border-t border-[#2F2F2F] bg-[#0A0A0A] relative overflow-hidden">
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-6 py-16 lg:py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-12">
          {/* Brand & Mission (2 cols on lg) */}
          <div className="lg:col-span-2 space-y-5">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-gradient-to-tr from-[#3B82F6] to-[#2563EB] text-white shadow-md shadow-black/40 border border-[#60A5FA]/30">
                <Sparkles className="w-5 h-5" />
              </div>
              <span className="text-xl font-extrabold tracking-tight text-gradient-brand">
                ApexMind Studio
              </span>
            </div>

            <p className="text-sm text-[#9CA3AF] max-w-sm leading-relaxed">
              Autonomous AI video creation and YouTube Shorts publishing platform. Turn viral concepts into studio-quality motivational videos in seconds.
            </p>

            {/* Live System Status Pill */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#121212] border border-[#2F2F2F] text-xs font-mono-studio text-[#9CA3AF]">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Gemini 3.8 Flash Operational</span>
            </div>

            {/* Social Links */}
            <div className="flex items-center gap-3 pt-2">
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noreferrer"
                className="p-2 rounded-xl bg-[#121212] border border-[#2F2F2F] hover:border-[#3B82F6] text-[#9CA3AF] hover:text-white transition-colors cursor-pointer"
                title="YouTube"
              >
                <Youtube className="w-4 h-4 text-red-400" />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noreferrer"
                className="p-2 rounded-xl bg-[#121212] border border-[#2F2F2F] hover:border-[#3B82F6] text-[#9CA3AF] hover:text-white transition-colors cursor-pointer"
                title="Twitter / X"
              >
                <Twitter className="w-4 h-4" />
              </a>
              <a
                href="https://github.com"
                target="_blank"
                rel="noreferrer"
                className="p-2 rounded-xl bg-[#121212] border border-[#2F2F2F] hover:border-[#3B82F6] text-[#9CA3AF] hover:text-white transition-colors cursor-pointer"
                title="GitHub"
              >
                <Github className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Column 1: Studio Features */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">
              AI Studio
            </h4>
            <ul className="space-y-2.5 text-sm text-[#9CA3AF]">
              <li>
                <button
                  onClick={() => onNavigate('workspace')}
                  className="hover:text-[#60A5FA] transition-colors cursor-pointer text-left"
                >
                  Script Generator
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('workspace')}
                  className="hover:text-[#60A5FA] transition-colors cursor-pointer text-left"
                >
                  Voiceover TTS
                </button>
              </li>
              <li>
                <a href="#features" className="hover:text-[#60A5FA] transition-colors">
                  Media Library
                </a>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('youtube')}
                  className="hover:text-[#60A5FA] transition-colors cursor-pointer text-left"
                >
                  YouTube Publisher
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('dashboard')}
                  className="hover:text-[#60A5FA] transition-colors cursor-pointer text-left"
                >
                  Analytics Sync
                </button>
              </li>
            </ul>
          </div>

          {/* Column 2: Automation & Categories */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">
              Automation
            </h4>
            <ul className="space-y-2.5 text-sm text-[#9CA3AF]">
              <li>
                <a href="#features" className="hover:text-[#60A5FA] transition-colors">
                  Stoic Motivation
                </a>
              </li>
              <li>
                <a href="#features" className="hover:text-[#60A5FA] transition-colors">
                  Discipline & Focus
                </a>
              </li>
              <li>
                <a href="#workflow" className="hover:text-[#60A5FA] transition-colors">
                  Daily Auto-Publishing
                </a>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('youtube')}
                  className="hover:text-[#60A5FA] transition-colors cursor-pointer text-left"
                >
                  Multi-Channel Manager
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('dashboard')}
                  className="hover:text-[#60A5FA] transition-colors cursor-pointer text-left"
                >
                  Quote Deduplication
                </button>
              </li>
            </ul>
          </div>

          {/* Column 3: Platform & Resources */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">
              Platform
            </h4>
            <ul className="space-y-2.5 text-sm text-[#9CA3AF]">
              <li>
                <a href="#faq" className="hover:text-[#60A5FA] transition-colors">
                  Frequently Asked Questions
                </a>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('login')}
                  className="hover:text-[#60A5FA] transition-colors cursor-pointer text-left"
                >
                  Account Sign In
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('settings')}
                  className="hover:text-[#60A5FA] transition-colors cursor-pointer text-left"
                >
                  API Keys & Settings
                </button>
              </li>
              <li>
                <span className="text-[#6B7280] flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  YouTube Verified
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-14 pt-8 border-t border-[#2F2F2F] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#6B7280]">
          <div className="flex items-center gap-2">
            <span>© {new Date().getFullYear()} ApexMind AI Inc. All rights reserved.</span>
          </div>

          <div className="flex items-center gap-6">
            <span className="text-[#9CA3AF]">Engineered for high-performing creators</span>
            <button
              onClick={scrollToTop}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#121212] border border-[#2F2F2F] hover:border-[#4A4A4A] text-[#9CA3AF] hover:text-white transition-colors cursor-pointer"
              title="Back to Top"
            >
              <span>Back to Top</span>
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
