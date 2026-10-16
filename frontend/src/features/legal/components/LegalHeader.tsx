import React from 'react';
import { Sparkles, FileText, ShieldCheck, Printer, ArrowLeft, Zap, Search } from 'lucide-react';
import { Button } from '@/src/shared/ui/common';
import { useAuth } from '@/src/features/auth/context/AuthContext';

interface LegalHeaderProps {
  activeDoc: 'terms' | 'privacy';
  onNavigate: (page: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export const LegalHeader: React.FC<LegalHeaderProps> = ({
  activeDoc,
  onNavigate,
  searchQuery,
  onSearchChange,
}) => {
  const { isAuthenticated } = useAuth();

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-[#0A0A0A]/95 backdrop-blur-md border-b border-[#2F2F2F] transition-colors print:hidden">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 px-4 sm:px-6 h-16">
        {/* Brand Logo & Back */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => {
              if (typeof window !== 'undefined' && window.history.length > 1) {
                window.history.back();
              } else {
                onNavigate(isAuthenticated ? 'dashboard' : 'login');
              }
            }}
            className="p-2 rounded-xl text-[#9CA3AF] hover:text-white hover:bg-[#1E1E1E] transition-colors cursor-pointer"
            title="Go Back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => onNavigate('landing')}
            className="flex items-center gap-2.5 text-left cursor-pointer group"
          >
            <div className="p-1.5 rounded-lg bg-gradient-to-tr from-[#3B82F6] to-[#2563EB] text-white shadow-md shadow-black/40 border border-[#60A5FA]/30">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <span className="font-extrabold tracking-tight text-white group-hover:text-[#60A5FA] transition-colors text-base">
                ApexMind
              </span>
              <span className="hidden sm:inline-block ml-2 text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF] bg-[#1E1E1E] px-2 py-0.5 rounded border border-[#2F2F2F]">
                Legal Center
              </span>
            </div>
          </button>
        </div>

        {/* Center Document Switcher Pills */}
        <div className="flex items-center bg-[#121212] p-1 rounded-xl border border-[#2F2F2F]">
          <button
            type="button"
            onClick={() => onNavigate('terms')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeDoc === 'terms'
                ? 'bg-[#1E1E1E] text-white border border-[#4A4A4A] shadow-xs'
                : 'text-[#9CA3AF] hover:text-white hover:bg-[#181818]'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-[#3B82F6]" />
            <span>Terms of Service</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('privacy')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeDoc === 'privacy'
                ? 'bg-[#1E1E1E] text-white border border-[#4A4A4A] shadow-xs'
                : 'text-[#9CA3AF] hover:text-white hover:bg-[#181818]'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Privacy Policy</span>
          </button>
        </div>

        {/* Search & Actions */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="relative hidden md:block w-48 lg:w-56">
            <Search className="w-3.5 h-3.5 text-[#6B7280] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search clauses..."
              className="w-full bg-[#121212] border border-[#2F2F2F] text-xs text-white rounded-lg pl-8 pr-3 py-1.5 outline-none focus:border-[#3B82F6] transition-colors placeholder:text-[#6B7280]"
            />
          </div>

          <button
            type="button"
            onClick={handlePrint}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-[#9CA3AF] hover:text-white bg-[#121212] border border-[#2F2F2F] hover:border-[#4A4A4A] transition-colors cursor-pointer"
            title="Print or Save PDF"
          >
            <Printer className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">Print</span>
          </button>

          {isAuthenticated ? (
            <Button
              variant="primary"
              size="sm"
              icon={<Zap className="w-3.5 h-3.5" />}
              onClick={() => onNavigate('workspace')}
            >
              Go to Studio
            </Button>
          ) : (
            <Button
              variant="primary"
              size="sm"
              onClick={() => onNavigate('login')}
            >
              Sign In
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};
