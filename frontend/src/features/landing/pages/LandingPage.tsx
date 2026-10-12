import React from 'react';
import { Sparkles, Youtube, Play, Zap, Shield, Wand2, Volume2, ArrowRight, CheckCircle2, Captions, CalendarClock, CircleHelp, FileText } from 'lucide-react';
import { Button } from '@/src/shared/ui/common';
import LandingFooter from '../components/LandingFooter';

export default function LandingPage({ onNavigate }: { onNavigate: (page: string) => void }) {
  return (
    <div className="w-full h-screen flex flex-col bg-[#0A0A0A] text-[#E5E5E5] overflow-hidden">
      {/* Fixed Top Bar - Sits above the scrollable area */}
      <header className="h-16 shrink-0 z-40 w-full bg-[#0A0A0A]/95 backdrop-blur-md border-b border-[#2F2F2F]/80 transition-colors">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-8 px-6 h-full">
          <a href="#hero" className="text-xl font-bold tracking-tight flex items-center gap-2.5 whitespace-nowrap shrink-0 hover:opacity-90 transition-opacity">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-[#3B82F6] to-[#2563EB] text-white shadow-md shadow-[#3B82F6]/25 border border-[#60A5FA]/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <span className="font-extrabold tracking-tight text-gradient-brand">ApexMind</span>
          </a>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-[#9CA3AF]">
            <a href="#features" className="hover:text-white transition-colors whitespace-nowrap shrink-0">Features</a>
            <a href="#workflow" className="hover:text-white transition-colors whitespace-nowrap shrink-0">AI Workflow</a>
            <a href="#creator-use-cases" className="hover:text-white transition-colors whitespace-nowrap shrink-0">For Creators</a>
            <a href="#faq" className="hover:text-white transition-colors whitespace-nowrap shrink-0">FAQ</a>
          </nav>

          <div className="flex items-center gap-3 shrink-0">
            <Button variant="secondary" size="sm" onClick={() => onNavigate('login')}>
              Sign In
            </Button>
            <Button variant="primary" size="sm" icon={<Zap className="w-4 h-4" />} onClick={() => onNavigate('workspace')}>
              Launch Studio
            </Button>
          </div>
        </div>
      </header>

      {/* Main Scrollable Content - Scrollbar is confined strictly below the header */}
      <div className="flex-1 w-full overflow-y-auto overflow-x-hidden scroll-smooth">

      {/* Hero Section */}
      <section id="hero" className="relative max-w-7xl mx-auto px-6 py-20 lg:py-28 overflow-hidden">
        {/* Electric Blue Background Glow */}
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-[#3B82F6]/15 blur-[120px] rounded-full pointer-events-none" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#3B82F6]/10 border border-[#3B82F6]/20 text-[#60A5FA] text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-[#3B82F6]" />
              <span>Next-Gen YouTube Shorts Automation Engine</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.1] text-wrap-balance">
              Create & Publish <span className="text-gradient-brand">AI Motivational Shorts</span> Automatically
            </h1>

            <p className="text-lg text-[#9CA3AF] max-w-2xl leading-relaxed">
              Turn your ideas into editable motivational scripts, voiceovers, and short-form videos, then review your work before publishing to YouTube.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Button size="lg" icon={<Sparkles className="w-5 h-5" />} onClick={() => onNavigate('workspace')}>
                Start Video Automation
              </Button>
              <Button variant="outline" size="lg" icon={<Youtube className="w-5 h-5 text-red-500" />} onClick={() => onNavigate('youtube')}>
                Connect YouTube Channel
              </Button>
            </div>

            {/* Product benefit strip */}
            <div className="pt-8 border-t border-[#2F2F2F] grid grid-cols-3 gap-6 text-left">
              <div>
                <div className="flex items-center gap-2 text-sm font-bold text-white"><Wand2 className="w-4 h-4 text-[#60A5FA]" />Start with an idea</div>
                <div className="text-xs text-[#9CA3AF] mt-1">Shape a script around your topic</div>
              </div>
              <div>
                <div className="flex items-center gap-2 text-sm font-bold text-white"><Volume2 className="w-4 h-4 text-[#60A5FA]" />Make it yours</div>
                <div className="text-xs text-[#9CA3AF] mt-1">Choose a voice and visual style</div>
              </div>
              <div>
                <div className="flex items-center gap-2 text-sm font-bold text-white"><Youtube className="w-4 h-4 text-red-400" />Publish on your terms</div>
                <div className="text-xs text-[#9CA3AF] mt-1">Review before sharing to YouTube</div>
              </div>
            </div>
          </div>

          {/* Hero Interactive Studio Mockup */}
          <div className="lg:col-span-5">
            <div className="relative rounded-2xl bg-[#1E1E1E] border border-[#2F2F2F] p-6 shadow-2xl space-y-5">
              <div className="flex items-center justify-between pb-4 border-b border-[#2F2F2F]">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500/80" />
                  <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                  <span className="ml-2 text-xs font-mono-studio text-[#9CA3AF]">ApexMind AI Studio v2.4</span>
                </div>
                <span className="text-xs text-[#60A5FA] font-medium">Gemini 3.8 Flash Powered</span>
              </div>

              {/* Studio Canvas Preview */}
              <div className="relative aspect-[9/16] max-h-95 mx-auto rounded-xl bg-gradient-to-br from-[#0A0A0A] via-[#121212] to-[#1E1E1E] p-6 flex flex-col justify-between border border-[#3B82F6]/30 overflow-hidden shadow-inner">
                <div className="flex items-center justify-between text-xs text-gray-300">
                  <span className="bg-[#3B82F6]/20 px-2 py-0.5 rounded text-[#60A5FA] font-mono-studio">STUDIO CANVAS</span>
                  <span className="font-mono-studio text-[#9CA3AF]">00:28 / 1080p</span>
                </div>

                <div className="text-center space-y-3 py-6">
                  <span className="text-xs uppercase font-semibold text-[#60A5FA] tracking-wider">
                    Stoic Mindset & Discipline
                  </span>
                  <p className="text-lg font-extrabold text-white leading-snug drop-shadow-md">
                    "When motivation fades, discipline takes the wheel. Do what needs to be done."
                  </p>
                  <p className="text-xs text-[#93C5FD] font-medium">Voiceover: Fenrir (Studio TTS 24kHz)</p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-white/10 text-xs text-gray-300">
                  <span className="flex items-center gap-1">
                    <Volume2 className="w-3.5 h-3.5 text-[#3B82F6] animate-pulse" />
                    <span>Free Ambient Music Track</span>
                  </span>
                  <span className="text-emerald-400 font-semibold">Auto-Publish Ready</span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="primary" className="w-full text-xs" onClick={() => onNavigate('workspace')}>
                  Open Creation Studio
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Section */}
      <section id="features" className="max-w-7xl mx-auto px-6 py-20 border-t border-[#2F2F2F]">
        <div className="text-center max-w-2xl mx-auto space-y-3 mb-16">
          <h2 className="text-3xl font-bold tracking-tight text-white">Full-Stack Automation Features</h2>
          <p className="text-[#9CA3AF] text-sm">
            Go from a topic to a polished Short with practical creative tools in one focused workspace.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-[#1E1E1E] border border-[#2F2F2F] hover:border-[#3B82F6]/40 transition-all space-y-4">
            <div className="p-3 w-fit rounded-xl bg-[#3B82F6]/10 text-[#60A5FA] border border-[#3B82F6]/20">
              <Wand2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Gemini AI Script & Quote Engine</h3>
            <p className="text-sm text-[#9CA3AF] leading-relaxed">
              Generates high-retention motivational monologues, viral hooks, and auto-synced timed captions for immediate video rendering.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[#1E1E1E] border border-[#2F2F2F] hover:border-[#3B82F6]/40 transition-all space-y-4">
            <div className="p-3 w-fit rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Volume2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Natural Gemini Voiceovers</h3>
            <p className="text-sm text-[#9CA3AF] leading-relaxed">
              Powered by `gemini-3.8-flash-lite-tts` for lifelike 24kHz audio synthesis in voices like Fenrir, Kore, and Zephyr.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[#1E1E1E] border border-[#2F2F2F] hover:border-[#3B82F6]/40 transition-all space-y-4">
            <div className="p-3 w-fit rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Shield className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Curated Media Library</h3>
            <p className="text-sm text-[#9CA3AF] leading-relaxed">
              Browse available music tracks and visual backdrops for your project, and confirm usage rights before publishing.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[#1E1E1E] border border-[#2F2F2F] hover:border-[#3B82F6]/40 transition-all space-y-4">
            <div className="p-3 w-fit rounded-xl bg-amber-500/10 text-amber-300 border border-amber-500/20">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Scripts Ready to Shape</h3>
            <p className="text-sm text-[#9CA3AF] leading-relaxed">
              Generate a hook, main message, and closing call to action, then refine the copy for your channel.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[#1E1E1E] border border-[#2F2F2F] hover:border-[#3B82F6]/40 transition-all space-y-4">
            <div className="p-3 w-fit rounded-xl bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
              <Captions className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Voice and Captions Together</h3>
            <p className="text-sm text-[#9CA3AF] leading-relaxed">
              Pair generated narration with timed subtitles to make your short-form story easier to follow.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[#1E1E1E] border border-[#2F2F2F] hover:border-[#3B82F6]/40 transition-all space-y-4">
            <div className="p-3 w-fit rounded-xl bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
              <CalendarClock className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Channel Tools in One Place</h3>
            <p className="text-sm text-[#9CA3AF] leading-relaxed">
              Keep your YouTube channel, uploads, and automation controls close to your creation workflow.
            </p>
          </div>
        </div>
      </section>

      {/* Workflow Showcase */}
      <section id="workflow" className="max-w-7xl mx-auto px-6 py-20 border-t border-[#2F2F2F]">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-5 space-y-6">
            <h2 className="text-3xl font-bold tracking-tight text-white leading-tight">
              From Idea to Published YouTube Short in 3 Simple Steps
            </h2>
            <p className="text-sm text-[#9CA3AF] leading-relaxed">
              Experience the power of automated batch creation. Set up your schedule once and let ApexMind handle daily quote generation, audio mixing, and publishing.
            </p>

            <div className="space-y-4">
              <div className="flex items-start gap-3.5 p-3.5 rounded-xl bg-[#1E1E1E] border border-[#2F2F2F]">
                <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-[#3B82F6]/20 text-[#60A5FA] font-bold text-xs shrink-0">
                  1
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white">Select Topic & Voice Style</h4>
                  <p className="text-xs text-[#9CA3AF] mt-0.5">Choose from Stoicism, Fitness, Wealth, or custom prompts.</p>
                </div>
              </div>

              <div className="flex items-start gap-3.5 p-3.5 rounded-xl bg-[#1E1E1E] border border-[#2F2F2F]">
                <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-[#3B82F6]/20 text-[#60A5FA] font-bold text-xs shrink-0">
                  2
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white">Synthesize Audio & Video Canvas</h4>
                  <p className="text-xs text-[#9CA3AF] mt-0.5">Gemini generates high-quality TTS voiceover and background track.</p>
                </div>
              </div>

              <div className="flex items-start gap-3.5 p-3.5 rounded-xl bg-[#1E1E1E] border border-[#2F2F2F]">
                <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-300 font-bold text-xs shrink-0">
                  3
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white">One-Click YouTube Publishing</h4>
                  <p className="text-xs text-[#9CA3AF] mt-0.5">Upload directly to YouTube Shorts with optimized tags & title.</p>
                </div>
              </div>
            </div>

            <Button size="lg" icon={<ArrowRight className="w-4 h-4" />} onClick={() => onNavigate('workspace')}>
              Open Studio Workspace
            </Button>
          </div>

          <div className="lg:col-span-7 bg-[#1E1E1E] border border-[#2F2F2F] rounded-2xl p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-[#2F2F2F]">
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
              <div className="p-4 rounded-xl bg-[#121212] border border-[#2F2F2F] flex items-start gap-4">
                <div className="p-2.5 rounded-lg bg-[#3B82F6]/10 text-[#60A5FA] shrink-0">
                  <Wand2 className="w-4 h-4" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-white">AI Script & Retention Hooks</h4>
                    <span className="text-[11px] font-mono-studio text-[#60A5FA]">Gemini 2.5 Flash</span>
                  </div>
                  <p className="text-xs text-[#9CA3AF] leading-relaxed">
                    Generates viral-structured motivational hooks, body reasoning, and impactful takeaways customized for YouTube Shorts.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#121212] border border-[#2F2F2F] flex items-start gap-4">
                <div className="p-2.5 rounded-lg bg-[#3B82F6]/10 text-[#60A5FA] shrink-0">
                  <Volume2 className="w-4 h-4" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-white">24kHz Neural Studio Speech</h4>
                    <span className="text-[11px] font-mono-studio text-[#93C5FD]">Fenrir / Puck / Aoede</span>
                  </div>
                  <p className="text-xs text-[#9CA3AF] leading-relaxed">
                    Ultra-natural human inflections with auto-synced word-level subtitles and copyright-safe royalty-free ambient audio tracks.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#121212] border border-[#2F2F2F] flex items-start gap-4">
                <div className="p-2.5 rounded-lg bg-red-500/10 text-red-400 shrink-0">
                  <Youtube className="w-4 h-4" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-white">Direct YouTube Shorts Publisher</h4>
                    <span className="text-[11px] font-mono-studio text-red-400">OAuth v3 Verified</span>
                  </div>
                  <p className="text-xs text-[#9CA3AF] leading-relaxed">
                    Instant or scheduled publishing with algorithm-optimized hashtags, descriptions, and channel performance sync.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between border-t border-[#2F2F2F]">
              <span className="text-xs text-[#9CA3AF]">Ready to generate your first motivational Short?</span>
              <Button size="sm" icon={<Zap className="w-3.5 h-3.5" />} onClick={() => onNavigate('workspace')}>
                Launch Studio
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Creator Use Cases */}
      <section id="creator-use-cases" className="max-w-7xl mx-auto px-6 py-20 border-t border-[#2F2F2F]">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          <div className="lg:col-span-4 space-y-4">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[#60A5FA]">Made for repeatable ideas</span>
            <h2 className="text-3xl font-bold tracking-tight text-white">A creative starting point for every channel</h2>
            <p className="text-sm text-[#9CA3AF] leading-relaxed">
              Build a consistent format around the subjects your audience cares about. You keep the final say on every script and upload.
            </p>
            <Button size="lg" icon={<ArrowRight className="w-4 h-4" />} onClick={() => onNavigate('workspace')}>
              Explore the Studio
            </Button>
          </div>

          <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { title: 'Mindset & motivation', description: 'Turn a daily reminder or quote into a short, voice-led story.', icon: <Zap className="w-5 h-5" /> },
              { title: 'Learning & explainers', description: 'Break one useful lesson into a focused hook and takeaway.', icon: <Sparkles className="w-5 h-5" /> },
              { title: 'Fitness & wellbeing', description: 'Create encouraging prompts for routines, recovery, and progress.', icon: <CheckCircle2 className="w-5 h-5" /> },
              { title: 'Brand storytelling', description: 'Develop a repeatable short-form format for your own ideas.', icon: <Play className="w-5 h-5" /> },
            ].map((item) => (
              <div key={item.title} className="p-5 rounded-2xl bg-[#121212] border border-[#2F2F2F] flex gap-4">
                <div className="shrink-0 p-2.5 h-fit rounded-xl bg-[#3B82F6]/10 text-[#60A5FA]">{item.icon}</div>
                <div className="space-y-1.5">
                  <h3 className="text-sm font-bold text-white">{item.title}</h3>
                  <p className="text-xs leading-relaxed text-[#9CA3AF]">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Review-first publishing */}
      <section className="max-w-7xl mx-auto px-6 pb-20">
        <div className="relative overflow-hidden rounded-3xl border border-[#3B82F6]/25 bg-linear-to-br from-[#102044] via-[#111827] to-[#121212] p-8 lg:p-12">
          <div className="absolute -right-16 -top-24 w-72 h-72 rounded-full bg-[#3B82F6]/15 blur-[90px] pointer-events-none" />
          <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-4">
              <div className="inline-flex items-center gap-2 text-xs font-semibold text-[#93C5FD]">
                <Shield className="w-4 h-4" /> YOUR CHANNEL, YOUR CONTROL
              </div>
              <h2 className="text-3xl font-bold text-white">Keep the creative decisions in your hands.</h2>
              <p className="text-sm text-[#C0C7D2] leading-relaxed max-w-2xl">
                Use AI to get a first draft, personalize the voice and visuals, and review the result before publishing. ApexMind supports your process—it doesn’t replace your judgment.
              </p>
            </div>
            <div className="lg:col-span-5 grid grid-cols-1 gap-3">
              {['Choose a topic and tone', 'Edit the generated script', 'Preview and decide when to publish'].map((step) => (
                <div key={step} className="flex items-center gap-3 rounded-xl bg-black/20 border border-white/10 px-4 py-3 text-sm text-white">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-300" /> {step}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Frequently asked questions */}
      <section id="faq" className="max-w-4xl mx-auto px-6 py-20 border-t border-[#2F2F2F]">
        <div className="text-center space-y-3 mb-10">
          <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#60A5FA]">
            <CircleHelp className="w-4 h-4" /> Good to know
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-white">Frequently asked questions</h2>
          <p className="text-sm text-[#9CA3AF]">A few quick answers before you step into the studio.</p>
        </div>
        <div className="space-y-3">
          {[
            { question: 'What can I create with ApexMind?', answer: 'ApexMind helps you draft short-form scripts, create voiceovers, work with visual and music options, and prepare YouTube Shorts.' },
            { question: 'Can I review or edit the content before publishing?', answer: 'Yes. Generated content is a starting point. You can review and adjust your script and creative choices before taking the publishing step.' },
            { question: 'Do I need a YouTube channel?', answer: 'No channel is needed to explore the studio. To manage or publish to a channel, use the YouTube tools and connect the channel you want to work with.' },
            { question: 'Does AI-generated content guarantee views or copyright clearance?', answer: 'No. Results depend on your content and audience, and you should confirm that you have the rights to any material you publish.' },
          ].map((item) => (
            <details key={item.question} className="group rounded-2xl bg-[#121212] border border-[#2F2F2F] open:border-[#3B82F6]/40">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 text-sm font-semibold text-white">
                {item.question}
                <span className="text-[#60A5FA] transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className="px-5 pb-5 text-sm leading-relaxed text-[#9CA3AF]">{item.answer}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Final call to action */}
      <section className="max-w-7xl mx-auto px-6 pb-20">
        <div className="rounded-3xl border border-[#2F2F2F] bg-[#121212] p-8 lg:p-12 text-center space-y-5">
          <div className="mx-auto w-fit p-3 rounded-2xl bg-[#3B82F6]/10 text-[#60A5FA] border border-[#3B82F6]/20">
            <Sparkles className="w-6 h-6" />
          </div>
          <h2 className="text-3xl font-bold text-white">Your next Short starts with one idea.</h2>
          <p className="max-w-xl mx-auto text-sm text-[#9CA3AF]">Bring a topic, shape it into a story, and build your next video in the ApexMind studio.</p>
          <Button size="lg" icon={<ArrowRight className="w-4 h-4" />} onClick={() => onNavigate('workspace')}>
            Get Started
          </Button>
        </div>
      </section>

      {/* Dedicated Landing Footer Component */}
      <LandingFooter onNavigate={onNavigate} />
      </div>
    </div>
  );
}
