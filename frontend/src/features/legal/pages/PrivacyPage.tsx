import React, { useState, useMemo } from 'react';
import {
  ShieldCheck,
  Lock,
  EyeOff,
  Database,
  Key,
  Trash2,
  Cookie,
  UserCheck,
  ExternalLink,
  ChevronRight,
  ArrowRight,
  Sparkles,
  Server,
  Youtube,
  CheckCircle2,
} from 'lucide-react';
import { LegalHeader } from '../components/LegalHeader';
import LandingFooter from '@/src/features/landing/components/LandingFooter';

interface PrivacyPageProps {
  onNavigate: (page: string) => void;
}

interface Section {
  id: string;
  title: string;
  icon: React.ElementType;
  summary: string;
  content: React.ReactNode;
}

export default function PrivacyPage({ onNavigate }: PrivacyPageProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSectionId, setActiveSectionId] = useState('overview');

  const sections: Section[] = useMemo(() => [
    {
      id: 'overview',
      title: '1. Overview & Information We Collect',
      icon: Database,
      summary: 'We collect minimal information necessary to deliver AI video generation and YouTube publishing.',
      content: (
        <div className="space-y-3.5 text-sm leading-relaxed text-[#D1D5DB]">
          <p>
            At <strong className="text-white">ApexMind.ai</strong> (&quot;ApexMind&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;), we take your privacy and creator data security seriously. This Privacy Policy describes how we collect, use, store, process, and protect your information when you use our website, video studio, generative script engine, and YouTube integration services.
          </p>
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">Categories of Data We Collect:</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="p-3 rounded-xl bg-[#121212] border border-[#262626]">
                <span className="font-bold text-white block mb-0.5">Account Credentials</span>
                Google profile name, email address, avatar URL, and authenticated user ID.
              </div>
              <div className="p-3 rounded-xl bg-[#121212] border border-[#262626]">
                <span className="font-bold text-white block mb-0.5">Studio Inputs & Prompts</span>
                Motivational topics, quote text, script revisions, audio recordings, and canvas style selections.
              </div>
              <div className="p-3 rounded-xl bg-[#121212] border border-[#262626]">
                <span className="font-bold text-white block mb-0.5">Rendered Media Assets</span>
                Locally saved drafts, audio waveform tracks, background video preferences, and export states.
              </div>
              <div className="p-3 rounded-xl bg-[#121212] border border-[#262626]">
                <span className="font-bold text-white block mb-0.5">Technical & Device Telemetry</span>
                Browser user agent, IP address, performance diagnostics, and system latency metrics.
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'youtube-data',
      title: '2. Google & YouTube API User Data',
      icon: Youtube,
      summary: 'Detailed disclosures regarding YouTube API Services, OAuth tokens, and Google User Data usage.',
      content: (
        <div className="space-y-3.5 text-sm leading-relaxed text-[#D1D5DB]">
          <div className="p-4 rounded-xl bg-[#181818] border border-[#2F2F2F] space-y-3">
            <div className="flex items-center gap-2 text-white font-bold text-xs">
              <Youtube className="w-4 h-4 text-red-500" />
              <span>Official YouTube API Services Disclosures</span>
            </div>
            <p className="text-xs text-[#9CA3AF] leading-relaxed">
              ApexMind accesses, utilizes, and manages channel data through <strong className="text-white">YouTube API Services</strong>. In accordance with the Google API Services User Data Policy, we explicitly disclose the following:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-xs text-[#9CA3AF]">
              <li>
                <strong className="text-white">Data Accessed:</strong> Channel title, channel ID, custom URL (@handle), subscriber count, video count, view count, avatar icon, and authorization to upload videos to your YouTube channel.
              </li>
              <li>
                <strong className="text-white">Purpose of Access:</strong> We access this information solely to display your connected channels in the YouTube Manager, synchronize audit analytics, and upload videos you explicitly choose to publish.
              </li>
              <li>
                <strong className="text-white">No Selling or Marketing:</strong> We <span className="text-emerald-400 font-semibold">never</span> sell your Google or YouTube user data, transfer it to data brokers, or use it for targeted advertising.
              </li>
              <li>
                <strong className="text-white">Storage & Security:</strong> OAuth access and refresh tokens are encrypted at rest using AES-256 encryption within secure database storage and transmitted exclusively over HTTPS/TLS 1.3.
              </li>
            </ul>

            <div className="pt-2 border-t border-[#262626] flex flex-wrap items-center gap-4 text-xs">
              <a
                href="https://www.google.com/policies/privacy"
                target="_blank"
                rel="noreferrer"
                className="text-[#60A5FA] hover:underline flex items-center gap-1 font-semibold"
              >
                Google Privacy Policy <ExternalLink className="w-3 h-3" />
              </a>
              <a
                href="https://www.youtube.com/t/terms"
                target="_blank"
                rel="noreferrer"
                className="text-[#60A5FA] hover:underline flex items-center gap-1 font-semibold"
              >
                YouTube Terms of Service <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-[#121212] border border-[#262626] text-xs text-[#9CA3AF]">
            <strong className="text-white block mb-1">How to Revoke ApexMind Access:</strong>
            You can revoke ApexMind&apos;s access to your Google account and YouTube data at any time through the{' '}
            <a
              href="https://security.google.com/settings/security/permissions"
              target="_blank"
              rel="noreferrer"
              className="text-[#60A5FA] underline font-medium"
            >
              Google Security Settings Permissions page
            </a>. Upon revocation, all stored channel access tokens are rendered invalid immediately.
          </div>
        </div>
      ),
    },
    {
      id: 'how-we-use',
      title: '3. How We Use Your Information',
      icon: Server,
      summary: 'Data is used solely to provide, operate, maintain, and enhance the video studio platform.',
      content: (
        <div className="space-y-3.5 text-sm leading-relaxed text-[#D1D5DB]">
          <p>We process collected creator data for the following operational purposes:</p>
          <ul className="list-disc pl-5 space-y-1.5 text-xs text-[#9CA3AF]">
            <li>Authenticating your creator profile across studio sessions.</li>
            <li>Generating AI-assisted video scripts and motivational quotes tailored to your selected theme.</li>
            <li>Processing text-to-speech voiceovers and rendering multi-track timelines.</li>
            <li>Publishing approved short-form videos directly to your designated YouTube channel.</li>
            <li>Detecting, preventing, and addressing technical errors, system anomalies, or security vulnerabilities.</li>
            <li>Fulfilling legal and regulatory requirements.</li>
          </ul>
        </div>
      ),
    },
    {
      id: 'ai-processing',
      title: '4. AI Prompt Data & Model Training Policies',
      icon: Lock,
      summary: 'Your private prompts and scripts are NOT used to train public foundation models.',
      content: (
        <div className="space-y-3.5 text-sm leading-relaxed text-[#D1D5DB]">
          <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-200 space-y-1.5">
            <div className="font-bold text-white flex items-center gap-2">
              <EyeOff className="w-4 h-4 text-[#60A5FA]" />
              <span>Strict AI Data Isolation Guarantee</span>
            </div>
            <p className="leading-relaxed">
              ApexMind integrates with enterprise API endpoints (including Google Gemini API in Google AI Studio). We do not sell your scripts, voice samples, or video projects to third-party data aggregators. Prompts sent via enterprise API tiers are not used to train or refine public foundation models without your express consent.
            </p>
          </div>
          <p className="text-xs text-[#9CA3AF]">
            When you enter custom API keys (such as your personal Google AI Studio key), queries are routed under your Google Cloud organization credentials and governed by Google&apos;s commercial enterprise API terms.
          </p>
        </div>
      ),
    },
    {
      id: 'security',
      title: '5. Security Standards & Encryption',
      icon: Key,
      summary: 'Industry-standard encryption in transit (TLS 1.3) and at rest (AES-256) protects all user data.',
      content: (
        <div className="space-y-3.5 text-sm leading-relaxed text-[#D1D5DB]">
          <p>
            We implement comprehensive organizational and technical measures designed to protect your personal information against accidental loss, unauthorized access, disclosure, alteration, or destruction:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
            <div className="p-3 rounded-xl bg-[#121212] border border-[#262626]">
              <span className="font-bold text-white block mb-0.5">TLS 1.3 Transport</span>
              All communications between your browser and our servers are encrypted via HTTPS with modern cipher suites.
            </div>
            <div className="p-3 rounded-xl bg-[#121212] border border-[#262626]">
              <span className="font-bold text-white block mb-0.5">AES-256 Storage</span>
              OAuth tokens, database backups, and credentials are encrypted at rest with hardware security modules.
            </div>
            <div className="p-3 rounded-xl bg-[#121212] border border-[#262626]">
              <span className="font-bold text-white block mb-0.5">Isolated Execution</span>
              Video rendering and timeline synthesis run within sandboxed cloud containers with zero cross-tenant access.
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'retention-deletion',
      title: '6. Data Retention & Account Deletion',
      icon: Trash2,
      summary: 'You can export or delete your creator account, drafts, and YouTube connection at any time.',
      content: (
        <div className="space-y-3.5 text-sm leading-relaxed text-[#D1D5DB]">
          <p>
            We retain personal data only for as long as necessary to provide the Services and fulfill the transactions you have requested, or for other legitimate purposes such as complying with legal obligations, resolving disputes, and enforcing our agreements.
          </p>
          <p>
            <strong className="text-white">Deletion Requests:</strong> You have the absolute right to request the permanent deletion of your account, draft scripts, and stored tokens at any time. You can disconnect your YouTube channel directly from the YouTube Manager tab or contact us at <a href="mailto:privacy@apexmind.ai" className="text-[#60A5FA] underline">privacy@apexmind.ai</a>. Upon processing, all associated database records and tokens are purged within 30 days.
          </p>
        </div>
      ),
    },
    {
      id: 'cookies',
      title: '7. Cookies, Local Storage & Session State',
      icon: Cookie,
      summary: 'We use local storage strictly for essential studio preferences and authentication tokens.',
      content: (
        <div className="space-y-3.5 text-sm leading-relaxed text-[#D1D5DB]">
          <p>
            ApexMind uses browser local storage and essential cookies to maintain your login session, active studio tab (Script, Media, Canvas, Audio), aspect ratio selections, and UI theme preferences.
          </p>
          <p className="text-xs text-[#9CA3AF]">
            We do not use invasive third-party ad-tracking cookies or sell behavioral tracking profiles across external websites.
          </p>
        </div>
      ),
    },
    {
      id: 'rights',
      title: '8. Your Rights (GDPR, CCPA & Global Creators)',
      icon: UserCheck,
      summary: 'Creators worldwide have rights of access, correction, portability, and erasure under GDPR and CCPA.',
      content: (
        <div className="space-y-3.5 text-sm leading-relaxed text-[#D1D5DB]">
          <p>
            Depending on your location, you may have statutory rights regarding your personal information under applicable privacy laws (such as GDPR in Europe or CCPA/CPRA in California), including:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-xs text-[#9CA3AF]">
            <li><strong className="text-white">Right of Access:</strong> Request a copy of the personal information we hold about you.</li>
            <li><strong className="text-white">Right to Rectification:</strong> Request correction of inaccurate or incomplete records.</li>
            <li><strong className="text-white">Right to Erasure (&quot;Right to be Forgotten&quot;):</strong> Request deletion of your data.</li>
            <li><strong className="text-white">Right to Restrict Processing:</strong> Request restrictions on how your data is processed.</li>
            <li><strong className="text-white">Right to Data Portability:</strong> Receive your script history and metadata in structured JSON format.</li>
            <li><strong className="text-white">Non-Discrimination:</strong> We will never discriminate against you for exercising any of your privacy rights.</li>
          </ul>
        </div>
      ),
    },
    {
      id: 'contact-privacy',
      title: '9. Privacy Team Contact & Inquiries',
      icon: Sparkles,
      summary: 'Contact our Data Protection Officer and Privacy Team for inquiries or deletion requests.',
      content: (
        <div className="space-y-3.5 text-sm leading-relaxed text-[#D1D5DB]">
          <p>
            If you have questions, comments, or requests regarding this Privacy Policy or our data practices, please reach out directly:
          </p>
          <div className="p-4 rounded-xl bg-[#141414] border border-[#2F2F2F] text-xs text-[#9CA3AF] space-y-1">
            <p className="font-bold text-white">ApexMind Data Protection & Privacy Office</p>
            <p>ApexMind AI Inc. • San Francisco, CA</p>
            <p>Email: <a href="mailto:privacy@apexmind.ai" className="text-[#60A5FA] hover:underline">privacy@apexmind.ai</a></p>
            <p>Security Team: <a href="mailto:security@apexmind.ai" className="text-[#60A5FA] hover:underline">security@apexmind.ai</a></p>
          </div>
        </div>
      ),
    },
  ], []);

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
        activeDoc="privacy"
        onNavigate={onNavigate}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-10 lg:py-14">
        {/* Hero Section */}
        <div className="max-w-3xl space-y-4 mb-10 pb-8 border-b border-[#2F2F2F]">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-semibold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>GDPR & CCPA Compliant • Privacy Policy • Version 2.4</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white">
            Privacy Policy
          </h1>

          <p className="text-sm sm:text-base text-[#9CA3AF] leading-relaxed">
            Your trust is our highest priority. This policy outlines how ApexMind protects your personal information, AI generation prompts, and YouTube account credentials.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2 text-xs text-[#71717A]">
            <span>Last Updated: October 13, 2026</span>
            <span>•</span>
            <span>Google API Services User Data Policy Compliant</span>
            <span>•</span>
            <span className="text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Zero Data Selling Guarantee
            </span>
          </div>
        </div>

        {/* Quick Highlights Banner */}
        <div className="mb-10 p-5 rounded-2xl bg-[#141414] border border-[#2F2F2F] space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>Key Privacy Guarantees at a Glance</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs text-[#9CA3AF]">
            <div className="p-3 rounded-xl bg-[#1A1A1A] border border-[#2A2A2A]">
              <span className="font-bold text-white block mb-1">1. No Third-Party Selling</span>
              We never sell your personal information or YouTube metrics to data brokers.
            </div>
            <div className="p-3 rounded-xl bg-[#1A1A1A] border border-[#2A2A2A]">
              <span className="font-bold text-white block mb-1">2. AES-256 Token Encryption</span>
              Google OAuth tokens are encrypted at rest using industry-standard cryptography.
            </div>
            <div className="p-3 rounded-xl bg-[#1A1A1A] border border-[#2A2A2A]">
              <span className="font-bold text-white block mb-1">3. Instant Revocation</span>
              You can revoke ApexMind&apos;s YouTube permissions anytime via your Google Account.
            </div>
            <div className="p-3 rounded-xl bg-[#1A1A1A] border border-[#2A2A2A]">
              <span className="font-bold text-white block mb-1">4. Permanent Deletion</span>
              You can delete your channel connection, draft scripts, and account on demand.
            </div>
          </div>
        </div>

        {/* Two-Column Layout: Sidebar TOC + Content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Sidebar TOC */}
          <aside className="lg:col-span-4 sticky top-24 space-y-3 print:hidden">
            <div className="p-4 rounded-2xl bg-[#121212] border border-[#2F2F2F] space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-[#262626]">
                <span className="text-xs font-bold uppercase tracking-wider text-white">
                  Privacy Sections
                </span>
                <span className="text-[11px] text-[#71717A] font-mono-studio">
                  {sections.length} Topics
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
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/40 font-bold'
                          : 'text-[#9CA3AF] hover:text-white hover:bg-[#1A1A1A]'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-emerald-400' : 'text-[#71717A]'}`} />
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
                  onClick={() => onNavigate('terms')}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl bg-[#181818] hover:bg-[#1E1E1E] border border-[#2F2F2F] text-xs text-white transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">Terms of Service</span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-[#9CA3AF] group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>
            </div>
          </aside>

          {/* Privacy Articles */}
          <section className="lg:col-span-8 space-y-6">
            {filteredSections.length === 0 ? (
              <div className="p-10 rounded-2xl bg-[#121212] border border-[#2F2F2F] text-center space-y-2">
                <p className="text-sm font-bold text-white">No sections match &quot;{searchQuery}&quot;</p>
                <p className="text-xs text-[#9CA3AF]">Try searching for &quot;YouTube&quot;, &quot;tokens&quot;, &quot;delete&quot;, or &quot;encryption&quot;.</p>
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
                        <div className="p-2 rounded-xl bg-[#1E1E1E] border border-[#2F2F2F] text-emerald-400">
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

            {/* Bottom Card for Terms */}
            <div className="p-6 rounded-2xl bg-gradient-to-br from-[#121212] to-[#1A1A1A] border border-[#2F2F2F] flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-1 text-center sm:text-left">
                <h4 className="text-sm font-bold text-white">Looking for Creator Rights & Guidelines?</h4>
                <p className="text-xs text-[#9CA3AF]">Review our commercial ownership rules, monetization terms, and acceptable use policy.</p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('terms')}
                className="px-4 py-2.5 rounded-xl bg-[#3B82F6] hover:bg-[#2563EB] text-white text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0"
              >
                <span>Read Terms of Service</span>
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
