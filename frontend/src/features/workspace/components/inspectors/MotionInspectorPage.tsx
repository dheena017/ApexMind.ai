import React from 'react';

export interface MotionPreset {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

interface MotionInspectorPageProps {
  presets: MotionPreset[];
  value: string;
  onChange: (value: string) => void;
}

export const VIDEO_MOTION_PRESETS: MotionPreset[] = [
  {
    id: 'none',
    label: 'None',
    icon: (
      <svg viewBox="0 0 24 24" className="w-8 h-8 text-slate-500 stroke-[1.8]" fill="none" stroke="currentColor">
        <circle cx="12" cy="12" r="8" />
        <line x1="6.3" y1="6.3" x2="17.7" y2="17.7" />
      </svg>
    ),
  },
  { id: 'fade', label: 'Fade', icon: <div className="w-9 h-9 rounded-xl bg-linear-to-r from-zinc-200 via-zinc-400 to-zinc-700/30 border border-[#2A2A2A] shadow-inner" /> },
  { id: 'blur', label: 'Blur', icon: <div className="w-9 h-9 rounded-xl bg-white/70 blur-[2px] shadow-sm" /> },
  { id: 'zoom-in', label: 'Zoom In', icon: <div className="w-10 h-10 rounded-xl bg-[#202026] border border-white/20 flex items-center justify-center"><div className="w-7 h-7 rounded-lg bg-white/40 flex items-center justify-center"><div className="w-4 h-4 rounded-md bg-white shadow-xs" /></div></div> },
  { id: 'zoom-out', label: 'Zoom Out', icon: <div className="w-10 h-10 rounded-xl bg-white/80 flex items-center justify-center shadow-xs"><div className="w-7 h-7 rounded-lg bg-[#1E1E1E] flex items-center justify-center"><div className="w-4 h-4 rounded-md bg-[#121216] border border-white/20" /></div></div> },
  { id: 'slide-fade', label: 'Slide Fade', icon: <div className="w-10 h-10 relative flex items-center justify-center"><div className="w-6 h-6 rounded-lg bg-white/25 absolute left-1" /><div className="w-6 h-6 rounded-lg bg-white/50 absolute left-2.5" /><div className="w-6 h-6 rounded-lg bg-white absolute left-4 shadow-sm" /></div> },
  { id: 'soft-reveal', label: 'Soft Reveal', icon: <div className="w-9 h-9 rounded-xl overflow-hidden relative bg-[#1c1c24] border border-[#2A2A2A]"><div className="absolute inset-0 bg-linear-to-br from-white via-zinc-300 to-transparent" /></div> },
  { id: 'circle', label: 'Circle', icon: <div className="w-10 h-10 rounded-xl flex items-center justify-center"><div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center"><div className="w-6 h-6 rounded-full bg-white/50 flex items-center justify-center"><div className="w-3.5 h-3.5 rounded-full bg-white shadow-xs" /></div></div></div> },
  { id: 'slide-left', label: 'Slide Left', icon: <div className="w-10 h-10 rounded-xl bg-[#1b1b22] border border-[#333333] flex items-center justify-center"><div className="w-7 h-6 rounded-md bg-white/80 flex items-center justify-center shadow-xs -translate-x-1"><svg className="w-3.5 h-3.5 text-zinc-900" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 12H5M12 19l-7-7 7-7" /></svg></div></div> },
  { id: 'slide-right', label: 'Slide Right', icon: <div className="w-10 h-10 rounded-xl bg-[#1b1b22] border border-[#333333] flex items-center justify-center"><div className="w-7 h-6 rounded-md bg-white/80 flex items-center justify-center shadow-xs translate-x-1"><svg className="w-3.5 h-3.5 text-zinc-900" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7" /></svg></div></div> },
  { id: 'slide-up', label: 'Slide Up', icon: <div className="w-10 h-10 rounded-xl bg-[#1b1b22] border border-[#333333] flex items-center justify-center"><div className="w-7 h-6 rounded-md bg-white/80 flex items-center justify-center shadow-xs -translate-y-1"><svg className="w-3.5 h-3.5 text-zinc-900" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 19V5M5 12l7-7 7 7" /></svg></div></div> },
  { id: 'slide-down', label: 'Slide Down', icon: <div className="w-10 h-10 rounded-xl bg-[#1b1b22] border border-[#333333] flex items-center justify-center"><div className="w-7 h-6 rounded-md bg-white/80 flex items-center justify-center shadow-xs translate-y-1"><svg className="w-3.5 h-3.5 text-zinc-900" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M19 12l-7 7-7-7" /></svg></div></div> },
  { id: 'spin', label: 'Spin 360', icon: <div className="w-10 h-10 rounded-xl bg-[#1b1b22] border border-[#333333] flex items-center justify-center"><div className="w-6 h-6 rounded-lg bg-linear-to-tr from-sky-400 to-indigo-300 rotate-45 shadow-sm flex items-center justify-center"><div className="w-2.5 h-2.5 rounded-xs bg-zinc-900" /></div></div> },
  { id: 'bounce', label: 'Bounce', icon: <div className="w-10 h-10 rounded-xl bg-[#1b1b22] border border-[#333333] flex items-center justify-center"><div className="w-7 h-7 rounded-xl bg-white shadow-md flex items-center justify-center scale-105"><div className="w-3 h-3 rounded-md bg-amber-500" /></div></div> },
  { id: 'flip-x', label: 'Flip 3D', icon: <div className="w-10 h-10 rounded-xl bg-[#1b1b22] border border-[#333333] flex items-center justify-center overflow-hidden"><div className="w-4 h-7 rounded-sm bg-linear-to-r from-white to-zinc-400 shadow-sm transform -skew-y-12" /></div> },
  { id: 'flip-y', label: 'Tilt 3D', icon: <div className="w-10 h-10 rounded-xl bg-[#1b1b22] border border-[#333333] flex items-center justify-center overflow-hidden"><div className="w-7 h-4 rounded-sm bg-linear-to-b from-white to-zinc-400 shadow-sm transform -skew-x-12" /></div> },
  { id: 'wipe-right', label: 'Wipe H', icon: <div className="w-9 h-9 rounded-xl border border-white/20 overflow-hidden flex bg-zinc-900"><div className="w-1/2 h-full bg-white" /><div className="w-1/2 h-full bg-zinc-800" /></div> },
  { id: 'wipe-down', label: 'Wipe V', icon: <div className="w-9 h-9 rounded-xl border border-white/20 overflow-hidden flex flex-col bg-zinc-900"><div className="w-full h-1/2 bg-white" /><div className="w-full h-1/2 bg-zinc-800" /></div> },
  { id: 'diamond', label: 'Diamond', icon: <div className="w-10 h-10 rounded-xl bg-[#1b1b22] border border-[#333333] flex items-center justify-center"><div className="w-6 h-6 bg-white rotate-45 rounded-sm shadow-xs" /></div> },
  { id: 'flash', label: 'Flash Glow', icon: <div className="w-10 h-10 rounded-xl bg-[#1b1b22] border border-[#333333] flex items-center justify-center"><div className="w-6 h-6 rounded-full bg-amber-300 blur-[2px] shadow-lg shadow-amber-400/50 flex items-center justify-center"><div className="w-2.5 h-2.5 rounded-full bg-white" /></div></div> },
  { id: 'rotate-in', label: 'Rotate In', icon: <div className="w-7 h-7 rounded-lg bg-white shadow-sm rotate-12" /> },
  { id: 'drift', label: 'Drift', icon: <div className="w-7 h-7 rounded-full bg-sky-400 shadow-sm" /> },
  { id: 'zoom-blur', label: 'Zoom Blur', icon: <div className="w-7 h-7 rounded-lg bg-white/80 blur-[1px] scale-90 shadow-sm" /> },
  { id: 'wipe-left', label: 'Wipe Left', icon: <div className="w-8 h-6 rounded-md bg-white/80 border border-white/20" /> },
  { id: 'wipe-up', label: 'Wipe Up', icon: <div className="w-6 h-8 rounded-md bg-white/80 border border-white/20" /> },
];

export const OVERLAY_MOTION_PRESETS = VIDEO_MOTION_PRESETS.filter(({ id }) =>
  ['none', 'fade', 'slide-up', 'slide-left', 'slide-right', 'bounce', 'spin'].includes(id)
);

export const MotionInspectorPage: React.FC<MotionInspectorPageProps> = ({
  presets,
  value,
  onChange,
}) => (
  <div className="grid grid-cols-4 gap-2.5 pt-0.5">
    {presets.map((preset) => {
      const isSelected = value === preset.id;
      return (
        <button
          key={preset.id}
          type="button"
          onClick={() => onChange(preset.id)}
          className="group flex flex-col items-center cursor-pointer text-left select-none"
          title={preset.label}
        >
          <span className={`w-full aspect-square rounded-2xl overflow-hidden relative border transition-all duration-150 flex items-center justify-center bg-[#15151A] ${
            isSelected
              ? 'border-2 border-[#3B82F6] ring-2 ring-[#3B82F6]/30 shadow-md shadow-blue-500/15'
              : 'border-[#242424] hover:border-[#3B82F6]/70 hover:ring-1 hover:ring-[#3B82F6]/30'
          }`}>
            {preset.icon}
          </span>
          <span className={`text-[11px] font-medium truncate block text-center mt-1.5 w-full leading-tight transition-colors ${
            isSelected ? 'text-white font-bold' : 'text-slate-400 group-hover:text-white'
          }`}>
            {preset.label}
          </span>
        </button>
      );
    })}
  </div>
);
