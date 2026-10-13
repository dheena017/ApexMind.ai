import React, { useState, useMemo } from 'react';
import {
  FileText,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Youtube,
  Cpu,
  Scale,
  Ban,
  Clock,
  ExternalLink,
  ChevronRight,
  BookOpen,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { LegalHeader } from '../components/LegalHeader';
import LandingFooter from '@/src/features/landing/components/LandingFooter';

interface TermsPageProps {
  onNavigate: (page: string) => void;
}

interface Section {
  id: string;
  title: string;
  icon: React.ElementType;
  summary: string;
  content: React.ReactNode;
}

export default function TermsPage({ onNavigate }: TermsPageProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSectionId, setActiveSectionId] = useState('acceptance');

  const sections: Section[] = useMemo(() => [
    {
      id: 'acceptance',
      title: '1. Acceptance of Terms',
      icon: Scale,
      summary: 'By accessing ApexMind, creating an account, or connecting YouTube channels, you agree to these Terms.',
      content: (
        <div className="space-y-3.5 text-sm leading-relaxed text-[#D1D5DB]">
          <p>
            Welcome to <strong className="text-white">ApexMind.ai</strong> (&quot;ApexMind&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;). These Terms of Service (&quot;Terms&quot;) constitute a legally binding agreement between you (&quot;Creator&quot;, &quot;User&quot;, or &quot;you&quot;) and ApexMind AI Inc. regarding your access to and use of the ApexMind platform, web application, AI video generation engine, script synthesizer, audio voiceover services, and YouTube publishing integrations (collectively, the &quot;Services&quot;).
          </p>
          <p>
            By creating an account, signing in via Google OAuth, or using any part of the Services, you acknowledge that you have read, understood, and agree to be bound by these Terms and our Privacy Policy. If you do not agree to these Terms, you must immediately discontinue use of the Services.
          </p>
          <div className="p-4 rounded-xl bg-[#121212] border border-[#2F2F2F] text-xs text-[#9CA3AF] flex items-start gap-3">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
            <div>
              <span className="font-semibold text-white">Age Requirement:</span> You must be at least 13 years old (or 16 years old in jurisdictions governed by the European General Data Protection Regulation) to use ApexMind. If you are under 18, you represent that you have parental or legal guardian consent to use the Services.
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'services',
      title: '2. Description of Services & AI Capabilities',
      icon: Cpu,
      summary: 'ApexMind provides AI-assisted content drafting, multi-track video editing, and YouTube publishing tools.',
      content: (
        <div className="space-y-3.5 text-sm leading-relaxed text-[#D1D5DB]">
          <p>
            ApexMind is an autonomous AI-powered creative studio designed to assist video creators and publishers in producing short-form video content (&quot;Shorts&quot;). Key capabilities of the platform include:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-xs text-[#9CA3AF]">
            <li><strong className="text-white">AI Script Synthesis:</strong> Generative topic ideation, motivational hook generation, and editable script drafts powered by large language models (including Google Gemini 3.8 Flash).</li>
            <li><strong className="text-white">Voice & Audio Production:</strong> Text-to-speech audio rendering, microphone recording, and interactive waveform timeline scrubbing.</li>
            <li><strong className="text-white">Multi-Track Video Canvas:</strong> Canvas safe-zones, aspect ratio formatting (9:16, 16:9, 1:1), transformable compound layers, visual badges, and stock background curation.</li>
            <li><strong className="text-white">Direct YouTube Publishing:</strong> Review-first scheduling, metadata synchronization, and direct upload pipelines using official YouTube API Services.</li>
          </ul>
          <p className="text-xs text-[#9CA3AF]">
            ApexMind acts as an assistive studio tool. You retain full editorial discretion and final creative approval over all content generated, edited, and published through the platform.
          </p>
        </div>
      ),
    },
    {
      id: 'accounts',
      title: '3. User Accounts & Google Authentication',
      icon: ShieldCheck,
      summary: 'Accounts are authenticated via Google OAuth. You are responsible for account security and actions taken under your account.',
      content: (
        <div className="space-y-3.5 text-sm leading-relaxed text-[#D1D5DB]">
          <p>
            To access the ApexMind Studio and YouTube publishing features, you must authenticate using your Google account. By signing in with Google OAuth, you authorize ApexMind to verify your profile credentials and store necessary access and refresh tokens in encrypted form.
          </p>
          <p>
            You are solely responsible for maintaining the confidentiality of your credentials and for all activities that occur under your account. You agree to notify ApexMind immediately of any unauthorized use or security breach. ApexMind will not be liable for any losses caused by unauthorized access to your account.
          </p>
        </div>
      ),
    },
    {
      id: 'ownership',
      title: '4. Content Ownership & Intellectual Property',
      icon: BookOpen,
      summary: 'You own your original inputs and published videos. ApexMind grants you full commercial rights to your generated content.',
      content: (
        <div className="space-y-3.5 text-sm leading-relaxed text-[#D1D5DB]">
          <p>
            <strong className="text-white">Your Content:</strong> As between you and ApexMind, you retain all ownership rights, copyright, and intellectual property in any text prompts, original scripts, audio recordings, uploaded images, and published videos created by you using the Services (&quot;User Content&quot;).
          </p>
          <p>
            <strong className="text-white">Commercial Rights:</strong> Subject to your compliance with these Terms, ApexMind grants you a perpetual, worldwide, non-exclusive license to use, reproduce, modify, distribute, monetize, and publish the AI-generated outputs and rendered videos created in your studio workspace for commercial YouTube, social media, and advertising purposes.
          </p>
          <p>
            <strong className="text-white">ApexMind Platform IP:</strong> The ApexMind interface, visual design, timeline architecture, software code, algorithms, brand logos, trademarks, and documentation are the exclusive intellectual property of ApexMind AI Inc. and its licensors. You may not reverse-engineer, decompile, or copy the platform.
          </p>
        </div>
      ),
    },
    {
      id: 'youtube-compliance',
      title: '5. YouTube API Services & Third-Party Compliance',
      icon: Youtube,
      summary: 'ApexMind uses YouTube API Services. You are bound by YouTube Terms of Service and Google Privacy Policy.',
      content: (
        <div className="space-y-3.5 text-sm leading-relaxed text-[#D1D5DB]">
          <div className="p-4 rounded-xl bg-[#181818] border border-[#2F2F2F] space-y-2">
            <div className="flex items-center gap-2 text-white font-bold text-xs">
              <Youtube className="w-4 h-4 text-red-500" />
              <span>Mandatory YouTube API Services Disclosure</span>
            </div>
            <p className="text-xs text-[#9CA3AF] leading-relaxed">
              ApexMind integrates with and uses <strong className="text-white">YouTube API Services</strong> to allow creators to connect channels, inspect published videos, and publish motivational Shorts directly. By utilizing YouTube features on ApexMind, you agree to be bound by:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-xs text-[#60A5FA]">
              <li>
                <a
                  href="https://www.youtube.com/t/terms"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:underline inline-flex items-center gap-1"
                >
                  YouTube Terms of Service
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                <a
                  href="https://www.google.com/policies/privacy"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:underline inline-flex items-center gap-1"
                >
                  Google Privacy Policy
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                <a
                  href="https://www.youtube.com/howyoutubeworks/policies/community-guidelines/"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:underline inline-flex items-center gap-1"
                >
                  YouTube Community Guidelines
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
            </ul>
          </div>
          <p className="text-xs text-[#9CA3AF]">
            You can revoke ApexMind&apos;s access to your YouTube and Google account data at any time via the{' '}
            <a
              href="https://security.google.com/settings/security/permissions"
              target="_blank"
              rel="noreferrer"
              className="text-[#60A5FA] underline"
            >
              Google Security Settings Permissions Page
            </a>.
          </p>
        </div>
      ),
    },
    {
      id: 'acceptable-use',
      title: '6. Acceptable Use Policy & Prohibited Conduct',
      icon: Ban,
      summary: 'You agree not to use ApexMind for unlawful content, harassment, copyright infringement, or automated spam.',
      content: (
        <div className="space-y-3.5 text-sm leading-relaxed text-[#D1D5DB]">
          <p>
            You agree not to use the Services to produce, edit, or publish any content that:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div className="p-3 rounded-lg bg-[#141414] border border-[#262626] text-[#A1A1AA]">
              <span className="font-bold text-red-400 block mb-0.5">Defamatory or Hateful</span>
              Promotes violence, discrimination, harassment, hate speech, or defamation against individuals or groups.
            </div>
            <div className="p-3 rounded-lg bg-[#141414] border border-[#262626] text-[#A1A1AA]">
              <span className="font-bold text-red-400 block mb-0.5">Infringing Materials</span>
              Violates any third-party copyright, trademark, trade secret, or privacy rights without explicit authorization.
            </div>
            <div className="p-3 rounded-lg bg-[#141414] border border-[#262626] text-[#A1A1AA]">
              <span className="font-bold text-red-400 block mb-0.5">Deceptive / Misleading</span>
              Fabricates emergency warnings, impersonates real persons without disclaimer, or distributes deliberate disinformation.
            </div>
            <div className="p-3 rounded-lg bg-[#141414] border border-[#262626] text-[#A1A1AA]">
              <span className="font-bold text-red-400 block mb-0.5">Platform Exploitation</span>
              Attempts to scrape, bypass rate limits, probe security vulnerabilities, or deploy automated DDoS against the Services.
            </div>
          </div>
          <p className="text-xs text-[#9CA3AF]">
            ApexMind reserves the right, in its sole discretion, to suspend or terminate accounts that violate this Acceptable Use Policy without prior notice.
          </p>
        </div>
      ),
    },
    {
      id: 'ai-disclaimers',
      title: '7. AI Generation Disclaimers & Creator Review',
      icon: AlertTriangle,
      summary: 'AI outputs are generative suggestions. You must review and verify all content before public release.',
      content: (
        <div className="space-y-3.5 text-sm leading-relaxed text-[#D1D5DB]">
          <p>
            Artificial intelligence models and generative neural networks are probabilistic tools. ApexMind does not guarantee that AI-synthesized scripts, generated historical quotes, voiceover pronunciations, or subtitle timings are error-free, historically accurate, or fit for any specific legal or financial purpose.
          </p>
          <div className="p-3.5 rounded-xl bg-amber-400/10 border border-amber-400/20 text-xs text-amber-200">
            <strong className="block text-amber-300 font-bold mb-1">Human Review Obligation:</strong>
            You are solely responsible for reviewing, proofreading, and approving all video drafts and metadata prior to publishing. ApexMind provides an interactive studio preview explicitly to facilitate this creator review process.
          </div>
        </div>
      ),
    },
    {
      id: 'subscriptions',
      title: '8. Usage Quotas, Fair Use & API Credits',
      icon: Clock,
      summary: 'Service access is subject to reasonable quotas, Gemini API availability, and platform uptime.',
      content: (
        <div className="space-y-3.5 text-sm leading-relaxed text-[#D1D5DB]">
          <p>
            To prevent system abuse and ensure consistent studio latency for all creators, ApexMind enforces operational rate limits on video generation, speech synthesis, and YouTube uploads.
          </p>
          <p>
            Certain advanced AI models require active API key configuration (such as Google Gemini API in Google AI Studio). Users providing their own API keys are responsible for compliance with Google Cloud / AI Studio terms and any associated usage billing from the third-party provider.
          </p>
        </div>
      ),
    },
    {
      id: 'liability',
      title: '9. Limitation of Liability & Indemnification',
      icon: Scale,
      summary: 'ApexMind is provided &quot;as-is&quot;. Our liability is strictly limited to the maximum extent permitted by applicable law.',
      content: (
        <div className="space-y-3.5 text-sm leading-relaxed text-[#D1D5DB]">
          <p>
            TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, APEXMIND AI INC., ITS DIRECTORS, EMPLOYEES, AND AFFILIATES SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING WITHOUT LIMITATION LOSS OF PROFITS, DATA, USE, GOODWILL, OR CHANNEL SUSPENSIONS IMPOSED BY THIRD-PARTY PLATFORMS (INCLUDING YOUTUBE).
          </p>
          <p className="text-xs text-[#9CA3AF]">
            You agree to defend, indemnify, and hold harmless ApexMind and its officers from and against any claims, liabilities, damages, losses, and expenses arising out of or in any way connected with your User Content or breach of these Terms.
          </p>
        </div>
      ),
    },
    {
      id: 'contact',
      title: '10. Modifications & Contact Information',
      icon: Sparkles,
      summary: 'We may update these terms periodically. Reach out to our legal team with any inquiries.',
      content: (
        <div className="space-y-3.5 text-sm leading-relaxed text-[#D1D5DB]">
          <p>
            We may revise these Terms from time to time to reflect platform enhancements, legal requirements, or new features. When changes are made, we will update the &quot;Last Modified&quot; date at the top of this document. Continued use of the Services following posted updates signifies your acceptance of the revised Terms.
          </p>
          <div className="p-4 rounded-xl bg-[#141414] border border-[#2F2F2F] text-xs text-[#9CA3AF] space-y-1">
            <p className="font-bold text-white">ApexMind Legal Department</p>
            <p>ApexMind AI Inc. • San Francisco, CA & Global Cloud Operations</p>
            <p>Email: <a href="mailto:legal@apexmind.ai" className="text-[#60A5FA] hover:underline">legal@apexmind.ai</a></p>
            <p>Support: <a href="mailto:support@apexmind.ai" className="text-[#60A5FA] hover:underline">support@apexmind.ai</a></p>
          </div>
        </div>
      ),
    },
  ], []);

  // Filter sections when user searches
  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) return sections;
    const q = searchQuery.toLowerCase();
    return sections.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        s.summary.toLowerCase().includes(q)
    );
  }, [sections, searchQuery]);

  const scrollToSection = (id: string) => {
    setActiveSectionId(id);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#0A0A0A] text-[#E5E5E5] flex flex-col font-sans-studio selection:bg-[#3B82F6]/30 selection:text-[#60A5FA]">
      <LegalHeader
        activeDoc="terms"
        onNavigate={onNavigate}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-10 lg:py-14">
        {/* Hero Section */}
        <div className="max-w-3xl space-y-4 mb-10 pb-8 border-b border-[#2F2F2F]">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#3B82F6]/10 border border-[#3B82F6]/25 text-[#60A5FA] text-xs font-semibold">
            <FileText className="w-3.5 h-3.5" />
            <span>Official Creator Agreement • Version 2.4</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white">
            Terms of Service
          </h1>

          <p className="text-sm sm:text-base text-[#9CA3AF] leading-relaxed">
            Please read these Terms carefully before using ApexMind. They establish the rules governing your video studio workspace, commercial rights to AI outputs, and YouTube channel integration.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2 text-xs text-[#71717A]">
            <span>Last Updated: October 13, 2026</span>
            <span>•</span>
            <span>Effective Date: Immediate upon account creation</span>
            <span>•</span>
            <span className="text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> YouTube API Verified
            </span>
          </div>
        </div>

        {/* Quick Summary Pill Box */}
        <div className="mb-10 p-5 rounded-2xl bg-[#141414] border border-[#2F2F2F] space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#60A5FA]" />
            <span>Summary for Creators (Plain English)</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs text-[#9CA3AF]">
            <div className="p-3 rounded-xl bg-[#1A1A1A] border border-[#2A2A2A]">
              <span className="font-bold text-white block mb-1">1. You Own Your Work</span>
              All scripts, voiceovers, and rendered videos are your commercial intellectual property.
            </div>
            <div className="p-3 rounded-xl bg-[#1A1A1A] border border-[#2A2A2A]">
              <span className="font-bold text-white block mb-1">2. Review Before Publishing</span>
              You have final editorial control and must verify AI-generated content before posting.
            </div>
            <div className="p-3 rounded-xl bg-[#1A1A1A] border border-[#2A2A2A]">
              <span className="font-bold text-white block mb-1">3. YouTube Compliance</span>
              Publishing respects official YouTube Community Guidelines and Google Developer Policies.
            </div>
            <div className="p-3 rounded-xl bg-[#1A1A1A] border border-[#2A2A2A]">
              <span className="font-bold text-white block mb-1">4. No Malicious Abuse</span>
              No automated spam, hateful defamation, or copyright infringement allowed on the platform.
            </div>
          </div>
        </div>

        {/* Two-Column Layout: Sticky Sidebar TOC + Content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Table of Contents - Desktop Sticky */}
          <aside className="lg:col-span-4 sticky top-24 space-y-3 print:hidden">
            <div className="p-4 rounded-2xl bg-[#121212] border border-[#2F2F2F] space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-[#262626]">
                <span className="text-xs font-bold uppercase tracking-wider text-white">
                  Table of Contents
                </span>
                <span className="text-[11px] text-[#71717A] font-mono-studio">
                  {sections.length} Sections
                </span>
              </div>

              <nav className="space-y-1">
                {sections.map((sec) => {
                  const Icon = sec.icon;
                  const isActive = activeSectionId === sec.id;
                  return (
                    <button
                      key={sec.id}
                      type="button"
                      onClick={() => scrollToSection(sec.id)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all text-left cursor-pointer ${
                        isActive
                          ? 'bg-[#3B82F6]/15 text-[#60A5FA] border border-[#3B82F6]/40 font-bold'
                          : 'text-[#9CA3AF] hover:text-white hover:bg-[#1A1A1A]'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-[#60A5FA]' : 'text-[#71717A]'}`} />
                        <span className="truncate">{sec.title}</span>
                      </div>
                      <ChevronRight className="w-3 h-3 shrink-0 opacity-40" />
                    </button>
                  );
                })}
              </nav>

              <div className="pt-3 border-t border-[#262626]">
                <button
                  type="button"
                  onClick={() => onNavigate('privacy')}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl bg-[#181818] hover:bg-[#1E1E1E] border border-[#2F2F2F] text-xs text-white transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span className="font-semibold">Privacy Policy</span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-[#9CA3AF] group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>
            </div>
          </aside>

          {/* Clauses Content */}
          <section className="lg:col-span-8 space-y-6">
            {filteredSections.length === 0 ? (
              <div className="p-10 rounded-2xl bg-[#121212] border border-[#2F2F2F] text-center space-y-2">
                <p className="text-sm font-bold text-white">No clauses match &quot;{searchQuery}&quot;</p>
                <p className="text-xs text-[#9CA3AF]">Try searching for terms like &quot;YouTube&quot;, &quot;commercial&quot;, &quot;AI&quot;, or &quot;ownership&quot;.</p>
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="mt-2 text-xs text-[#3B82F6] hover:underline cursor-pointer"
                >
                  Clear search
                </button>
              </div>
            ) : (
              filteredSections.map((sec) => {
                const Icon = sec.icon;
                return (
                  <article
                    key={sec.id}
                    id={sec.id}
                    className="p-6 sm:p-7 rounded-2xl bg-[#141414] border border-[#2F2F2F] space-y-4 scroll-mt-24 transition-colors hover:border-[#3E3E3E]"
                  >
                    <div className="flex items-start justify-between gap-4 pb-3 border-b border-[#242424]">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-[#1E1E1E] border border-[#2F2F2F] text-[#60A5FA]">
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                            {sec.title}
                          </h2>
                          <p className="text-xs text-[#9CA3AF] mt-0.5">{sec.summary}</p>
                        </div>
                      </div>
                    </div>

                    <div className="pt-1">{sec.content}</div>
                  </article>
                );
              })
            )}

            {/* Bottom Card for Next Policy */}
            <div className="p-6 rounded-2xl bg-gradient-to-br from-[#121212] to-[#1A1A1A] border border-[#2F2F2F] flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-1 text-center sm:text-left">
                <h4 className="text-sm font-bold text-white">Need information on data protection?</h4>
                <p className="text-xs text-[#9CA3AF]">Learn how your Google tokens, prompt history, and profile data are protected.</p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('privacy')}
                className="px-4 py-2.5 rounded-xl bg-[#3B82F6] hover:bg-[#2563EB] text-white text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0"
              >
                <span>Read Privacy Policy</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </section>
        </div>
      </main>

      <LandingFooter onNavigate={onNavigate} />
    </div>
  );
}
