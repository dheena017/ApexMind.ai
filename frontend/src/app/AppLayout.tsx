import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  LayoutDashboard,
  Wand2,
  Youtube,
  User,
  Settings,
  Bell,
  Menu,
  X,
  Plus,
  LogOut
} from 'lucide-react';
import { Button, Badge } from '@/src/shared/ui/common';
import { useAuth } from '@/src/features/auth/context/AuthContext';
import { notificationsApi } from '@/src/features/notifications/api/notificationsApi';

interface AppLayoutProps {
  children: React.ReactNode;
  activePage: string;
  onNavigate: (page: string) => void;
  unreadCount?: number;
}

export default function AppLayout({ children, activePage, onNavigate, unreadCount: propUnreadCount }: AppLayoutProps) {
  const { user, logout, isAuthenticated } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dynamicUnread, setDynamicUnread] = useState(0);

  useEffect(() => {
    if (!isAuthenticated) return;
    notificationsApi.getNotifications()
      .then((items) => {
        setDynamicUnread(items.filter((item) => !item.read).length);
      })
      .catch(() => setDynamicUnread(0));
  }, [activePage, isAuthenticated]);

  const unreadCount = propUnreadCount !== undefined ? propUnreadCount : dynamicUnread;


  // Prevent background page from moving or scrolling when sidebar is open
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [sidebarOpen]);

  // Close sidebar on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && sidebarOpen) {
        setSidebarOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [sidebarOpen]);

  if (activePage === 'landing' || activePage === 'login' || activePage === 'loading' || !isAuthenticated) {
    return <>{children}</>;
  }


  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5 shrink-0" /> },
    { id: 'workspace', label: 'AI Video Studio', icon: <Wand2 className="w-5 h-5 shrink-0" /> },
    { id: 'youtube', label: 'YouTube Manager', icon: <Youtube className="w-5 h-5 text-red-400 shrink-0" /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell className="w-5 h-5 shrink-0" />, badge: unreadCount > 0 ? unreadCount : undefined },
    { id: 'profile', label: 'Profile & Badges', icon: <User className="w-5 h-5 shrink-0" /> },
    { id: 'settings', label: 'Settings', icon: <Settings className="w-5 h-5 shrink-0" /> },
  ];

  const handleNavClick = (id: string) => {
    onNavigate(id);
    setSidebarOpen(false);
  };

  return (
    <div className="h-screen w-full bg-[#0A0A0A] text-[#E5E5E5] flex flex-col overflow-hidden font-sans-studio antialiased selection:bg-[#3B82F6]/30 selection:text-[#60A5FA] relative">
      {/* =========================================================================
          Fixed Top Bar Header - Never has a scrollbar beside it
          ========================================================================= */}
      <header
        className={`h-16 shrink-0 z-30 w-full bg-[#121212]/98 border-b border-[#2F2F2F] px-4 lg:px-8 flex items-center justify-between gap-4 transition-all duration-300 ${
          sidebarOpen ? 'filter blur-[2px] opacity-60 pointer-events-none' : ''
        }`}
      >
        {/* Left: Open/Close Sidebar Toggle + Brand */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className={`p-2 rounded-xl transition-all cursor-pointer min-h-[40px] min-w-[40px] flex items-center justify-center gap-2 border ${
              sidebarOpen
                ? 'bg-[#1E1E1E] text-white border-[#3B82F6]/50 shadow-sm shadow-[#3B82F6]/20'
                : 'text-[#9CA3AF] hover:text-[#E5E5E5] hover:bg-[#1E1E1E] border-[#2F2F2F] hover:border-[#4A4A4A]'
            }`}
            aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
            title={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
          >
            {sidebarOpen ? (
              <X className="w-5 h-5 text-[#60A5FA]" />
            ) : (
              <Menu className="w-5 h-5 text-[#60A5FA]" />
            )}
            <span className="text-xs font-semibold hidden sm:inline text-[#E5E5E5]">
              {sidebarOpen ? 'Close' : 'Menu'}
            </span>
          </button>

          {/* Brand Logo */}
          <button
            onClick={() => onNavigate('dashboard')}
            className="text-base lg:text-lg font-extrabold tracking-tight flex items-center gap-2.5 whitespace-nowrap shrink-0 hover:opacity-90 transition-opacity cursor-pointer"
          >
            <div className="p-2 rounded-xl bg-gradient-to-tr from-[#3B82F6] to-[#2563EB] text-white shadow-md shadow-[#3B82F6]/25 border border-[#60A5FA]/30">
              <Sparkles className="w-4 h-4 lg:w-5 lg:h-5" />
            </div>
            <span className="text-gradient-brand">ApexMind Studio</span>
          </button>
        </div>


        {/* Right: Actions */}
        <div className="flex items-center gap-2.5 shrink-0">
          <Button
            variant="primary"
            size="sm"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => onNavigate('workspace')}
          >
            <span className="hidden sm:inline">Create Short</span>
            <span className="sm:hidden">Create</span>
          </Button>

          <button
            onClick={() => onNavigate('notifications')}
            className="relative p-2 rounded-xl text-[#9CA3AF] hover:text-[#E5E5E5] hover:bg-[#1E1E1E] transition-colors cursor-pointer min-h-[38px] min-w-[38px] flex items-center justify-center border border-transparent hover:border-[#2F2F2F]"
            title="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#3B82F6] ring-2 ring-[#121212]" />
            )}
          </button>

          <button
            onClick={() => onNavigate('profile')}
            className="p-1 rounded-xl text-[#9CA3AF] hover:text-white hover:bg-[#1E1E1E] transition-colors cursor-pointer flex items-center justify-center gap-2"
            title={user ? `${user.name} (${user.email})` : 'Profile & Badges'}
          >
            {user?.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.name}
                className="w-8 h-8 rounded-lg bg-[#1E1E1E] border border-[#2F2F2F] object-cover"
              />
            ) : (
              <div className="w-8 h-8 rounded-lg bg-[#1E1E1E] border border-[#2F2F2F] flex items-center justify-center text-xs font-bold text-[#60A5FA]">
                {user?.name ? user.name.slice(0, 2).toUpperCase() : 'AM'}
              </div>
            )}
          </button>
        </div>
      </header>

      {/* =========================================================================
          Main Content Container
          - Uniform, equal spacing around the container on all sides (top, bottom, left, right)
          - No excessive empty side space; responsive balanced framing
          ========================================================================= */}
      <main className="flex-1 w-full overflow-y-auto overflow-x-hidden bg-[#0A0A0A] p-4 sm:p-5 lg:p-6">
        {activePage === 'workspace' ? (
          <div className="w-full">
            {children}
          </div>
        ) : (
          <div className="w-full rounded-2xl sm:rounded-3xl bg-[#101010]/80 border border-[#2F2F2F] shadow-2xl p-5 sm:p-7 lg:p-8 transition-all">
            {children}
          </div>
        )}
      </main>

      {/* =========================================================================
          Backdrop Blur Overlay - Covers the ENTIRE screen (header + page)
          Blurs the header and page content together when sidebar opens!
          ========================================================================= */}
      <div
        className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-md transition-all duration-300 ease-in-out ${
          sidebarOpen
            ? 'opacity-100 pointer-events-auto visible'
            : 'opacity-0 pointer-events-none invisible'
        }`}
        onClick={() => setSidebarOpen(false)}
        aria-hidden="true"
      />

      {/* =========================================================================
          Sidebar Drawer - Extends full-height (inset-y-0) to eliminate any space above
          Anchored fixed on top of the blur, NEVER scrolls with page
          ========================================================================= */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 sm:w-80 max-w-[85vw] bg-[#121212]/98 backdrop-blur-2xl border-r border-[#2F2F2F] shadow-2xl shadow-black/90 flex flex-col transition-transform duration-300 ease-in-out select-none ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label="Navigation Sidebar"
      >
        {/* Top Header of Sidebar - Aligns perfectly with the 64px top bar line */}
        <div className="h-16 shrink-0 flex items-center justify-between px-5 sm:px-6 border-b border-[#2F2F2F]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-[#3B82F6] to-[#2563EB] text-white shadow-md shadow-[#3B82F6]/25 border border-[#60A5FA]/30">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-base font-extrabold tracking-tight text-gradient-brand">ApexMind</span>
              <span className="text-[10px] font-semibold text-[#6B7280] uppercase tracking-wider -mt-0.5">Navigation Menu</span>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-1.5 rounded-lg text-[#9CA3AF] hover:text-white hover:bg-[#1E1E1E] border border-[#2F2F2F] hover:border-[#4A4A4A] transition-all cursor-pointer"
            aria-label="Close sidebar"
            title="Close sidebar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Items (Independent vertical scroll if needed) */}
        <div className="flex-1 p-5 sm:p-6 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-3 text-sm font-semibold rounded-xl min-h-[46px] cursor-pointer transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-[#3B82F6]/20 to-[#2563EB]/20 text-[#60A5FA] border border-[#3B82F6]/30 shadow-sm'
                    : 'text-[#9CA3AF] hover:text-white hover:bg-[#1E1E1E]'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  {item.icon}
                  <span>{item.label}</span>
                </div>
                {item.badge && <Badge variant="blue">{item.badge}</Badge>}
              </button>
            );
          })}
        </div>

        {/* Sidebar Footer */}
        <div className="p-5 sm:p-6 pt-4 border-t border-[#2F2F2F] space-y-3 shrink-0">
          <Button
            variant="primary"
            className="w-full justify-center py-2.5"
            onClick={() => handleNavClick('workspace')}
          >
            Create Short
          </Button>

          {/* Creator Profile Card */}
          {user && (
            <div className="p-3 rounded-xl bg-[#0A0A0A] border border-[#2F2F2F] flex items-center gap-3">
              <img
                src={user.avatarUrl}
                alt={user.name}
                className="w-9 h-9 rounded-xl bg-[#121212] border border-[#2F2F2F] object-cover shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-white truncate">{user.name}</span>
                  <span className="text-[10px] bg-blue-500/20 text-[#60A5FA] px-1 py-0.2 rounded font-bold">
                    ✓ Google
                  </span>
                </div>
                <p className="text-[11px] text-[#9CA3AF] truncate">{user.email}</p>
              </div>
            </div>
          )}

          {/* Gemini Engine Active Card */}
          <div className="p-3 rounded-xl bg-[#0A0A0A] border border-[#2F2F2F] space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-[#6B7280] font-mono-studio uppercase">Engine</span>
              <span className="inline-flex items-center gap-1.5 text-[10px] text-emerald-400 font-mono-studio">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Active
              </span>
            </div>
            <p className="text-xs text-[#60A5FA] font-semibold">gemini-3.8-flash</p>
          </div>

          {/* Sign Out Button */}
          <button
            onClick={async () => {
              await logout();
              handleNavClick('login');
            }}
            className="w-full flex items-center justify-center gap-2 p-2.5 text-xs text-[#9CA3AF] hover:text-red-400 rounded-xl hover:bg-red-500/10 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>

        </div>
      </aside>
    </div>
  );
}
