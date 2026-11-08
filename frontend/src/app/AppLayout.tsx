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
  LogOut,
  Film,
} from 'lucide-react';
import '@/src/shared/ui/common';
import { useAuth } from '@/src/features/auth/context/AuthContext';
import { notificationsApi } from '@/src/features/notifications/api/notificationsApi';
import { WorkspaceHeader } from '@/src/features/workspace/components/WorkspaceHeader';
import { WorkspaceSidebar, WORKSPACE_SIDEBAR_ITEMS, WorkspaceTabType } from '@/src/features/workspace/components/WorkspaceSidebar';
import { NotificationDropdown } from '@/src/features/notifications/components/NotificationDropdown';
import { ApexMindLogo } from '@/src/shared/ui';
import { Radio } from 'lucide-react';

interface AppLayoutProps {
  children: React.ReactNode;
  activePage: string;
  onNavigate: (page: string) => void;
  activeWorkspacePane: WorkspaceTabType;
  onWorkspacePaneChange: (pane: WorkspaceTabType) => void;
  unreadCount?: number;
}


export default function AppLayout({
  children,
  activePage,
  onNavigate,
  activeWorkspacePane,
  onWorkspacePaneChange,
  unreadCount: propUnreadCount,
}: AppLayoutProps) {
  const { user, logout, isAuthenticated } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [workspaceMenuOpen, setWorkspaceMenuOpen] = useState(false);
  const [workspaceMobileView, setWorkspaceMobileView] = useState<'tools' | 'preview' | 'inspector' | 'timeline'>('tools');
  const [showLeftPaneMobile, setShowLeftPaneMobile] = useState(false);
  const [dynamicUnread, setDynamicUnread] = useState(0);
  const [workspaceStatus, setWorkspaceStatus] = useState({
    aspectRatio: '9:16',
    currentTime: 0,
    duration: 30,
    playbackRate: 1,
    voice: 'Fenrir',
    music: '',
    visual: '',
    captionCount: 0,
    overlay: '',
    sfx: '',
    isPlaying: false,
    isExporting: false,
  });

  useEffect(() => {
    const handleWorkspaceStatus = (event: Event) => {
      const detail = (event as CustomEvent<Partial<typeof workspaceStatus>>).detail;
      if (detail) setWorkspaceStatus((current) => ({ ...current, ...detail }));
    };
    window.addEventListener('workspace:status', handleWorkspaceStatus);
    return () => window.removeEventListener('workspace:status', handleWorkspaceStatus);
  }, []);

  useEffect(() => {
    const handlePanelState = (e: Event) => {
      const detail = (e as CustomEvent<{ showLeftPane: boolean }>).detail;
      if (detail && typeof detail.showLeftPane === 'boolean') {
        setShowLeftPaneMobile(detail.showLeftPane);
      }
    };
    window.addEventListener('workspace:panel-state', handlePanelState);
    return () => window.removeEventListener('workspace:panel-state', handlePanelState);
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    const fetchUnread = () => {
      if (typeof document !== 'undefined' && document.hidden) return;
      notificationsApi.getUnreadCount()
        .then((count) => {
          setDynamicUnread(count);
        })
        .catch(() => setDynamicUnread(0));
    };

    fetchUnread();
    const interval = setInterval(fetchUnread, 60000);

    const handleVisibility = () => {
      if (!document.hidden) fetchUnread();
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [isAuthenticated]);

  const unreadCount = propUnreadCount !== undefined ? propUnreadCount : dynamicUnread;


  // Prevent background page from moving or scrolling when sidebar is open
  useEffect(() => {
    if (sidebarOpen || workspaceMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [sidebarOpen, workspaceMenuOpen]);

  // Close sidebar on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (sidebarOpen) setSidebarOpen(false);
        if (workspaceMenuOpen) setWorkspaceMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [sidebarOpen, workspaceMenuOpen]);

  useEffect(() => {
    setWorkspaceMenuOpen(false);
  }, [activePage]);

  useEffect(() => {
    const handleMobileViewChange = (event: Event) => {
      const view = (event as CustomEvent<typeof workspaceMobileView>).detail;
      if (view === 'tools' || view === 'preview' || view === 'inspector' || view === 'timeline') {
        setWorkspaceMobileView(view);
      }
    };
    window.addEventListener('workspace:set-mobile-view', handleMobileViewChange);
    return () => window.removeEventListener('workspace:set-mobile-view', handleMobileViewChange);
  }, []);

  useEffect(() => {
    setWorkspaceMobileView('tools');
  }, [activeWorkspacePane]);

  if (
    activePage === 'landing' ||
    activePage === 'login' ||
    activePage === 'loading' ||
    activePage === 'terms' ||
    activePage === 'privacy' ||
    !isAuthenticated
  ) {
    return <>{children}</>;
  }


  const navItems = [
    {
      id: 'dashboard', label: 'Dashboard',
      icon: <LayoutDashboard className="w-4 h-4 shrink-0" />,
      iconBg: 'bg-[#172033] border-[#2A3F5F]', iconColor: 'text-[#60A5FA]',
    },
    {
      id: 'workspace', label: 'AI Video Studio',
      icon: <Wand2 className="w-4 h-4 shrink-0" />,
      iconBg: 'bg-[#1A1730] border-[#352D5A]', iconColor: 'text-[#A78BFA]',
    },
    {
      id: 'videos', label: 'Website Videos',
      icon: <Film className="w-4 h-4 shrink-0" />,
      iconBg: 'bg-[#172033] border-[#2A3F5F]', iconColor: 'text-[#38BDF8]',
    },
    {
      id: 'channels', label: 'Social Accounts',
      icon: <Radio className="w-4 h-4 shrink-0 text-red-400" />,
      iconBg: 'bg-[#1F1515] border-[#3D2020]', iconColor: 'text-red-400',
    },
    {
      id: 'youtube', label: 'YouTube Manager',
      icon: <Youtube className="w-4 h-4 shrink-0" />,
      iconBg: 'bg-[#1F1515] border-[#3D2020]', iconColor: 'text-red-400',
    },
    {
      id: 'notifications', label: 'Notifications',
      icon: <Bell className="w-4 h-4 shrink-0" />,
      iconBg: 'bg-[#1A1A10] border-[#3A3620]', iconColor: 'text-amber-400',
      badge: unreadCount > 0 ? unreadCount : undefined,
    },
    {
      id: 'settings', label: 'Settings',
      icon: <Settings className="w-4 h-4 shrink-0" />,
      iconBg: 'bg-[#181818] border-[#2A2A2A]', iconColor: 'text-[#9CA3AF]',
    },
  ];

  const handleNavClick = (id: string) => {
    onNavigate(id);
    setSidebarOpen(false);
  };

  const isWorkspace = activePage === 'workspace' || activePage.startsWith('workspace-');

  return (
    <div className="h-screen h-[100dvh] w-full bg-[#0A0A0A] text-[#E5E5E5] flex flex-col overflow-hidden font-sans-studio antialiased selection:bg-[#3B82F6]/30 selection:text-[#60A5FA] relative">
      {/* =========================================================================
          Workspace Pages (/workspace, /workspace/canvas, /workspace/script, etc.):
          Dedicated Studio Header & Sidebar (Main page header is hidden)
          Sidebar extends full height on the left; Header sits to the side of the bar.
          Other Pages: Standard Application Header, Main Framing, and Slide Drawer
          ========================================================================= */}
      {isWorkspace ? (
        <div className="flex-1 w-full h-full flex flex-row min-h-0 overflow-hidden">
          {/* Left Vertical Studio Sidebar - Full Screen Height */}
          <WorkspaceSidebar
            mode="desktop-only"
            activeTab={activeWorkspacePane}
            onTabChange={(tab) => onWorkspacePaneChange(tab)}
            onNavigate={onNavigate}
          />

          {/* Right Main Studio Column: Header at top, Panes in center, Status bar at bottom */}
          <div className="workspace-main-column flex-1 min-w-0 h-full flex flex-col min-h-0 overflow-hidden">
            {/* Studio Header sits to the right of the full-height left bar */}
            <WorkspaceHeader
              user={user}
              unreadCount={unreadCount}
              onNavigate={onNavigate}
              activeWorkspacePane={activeWorkspacePane}
              mobileMenuOpen={workspaceMenuOpen}
              onToggleMobileMenu={() => setWorkspaceMenuOpen((open) => !open)}
              onSignOut={async () => {
                await logout();
                handleNavClick('login');
              }}
            />

            {workspaceMenuOpen && (
              <>
                <button
                  type="button"
                  className="workspace-mobile-menu-backdrop fixed inset-0 z-40 bg-black/60 md:hidden"
                  onClick={() => setWorkspaceMenuOpen(false)}
                  aria-label="Close studio menu"
                />
                <nav
                  id="workspace-mobile-menu"
                  className="workspace-mobile-menu fixed inset-y-0 left-0 z-50 flex w-[min(88vw,360px)] flex-col overflow-y-auto rounded-r-2xl border-r border-[#2F2F2F] bg-[#141414] p-4 shadow-2xl shadow-black/70 md:hidden"
                  aria-label="Studio menu"
                  aria-modal="true"
                  role="dialog"
                >
                  <div className="mb-2 flex items-center justify-between border-b border-[#262626] pb-3">
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-bold text-white">Studio Menu</span>
                      <span className="text-[10px] font-medium text-[#737373]">Choose a workspace view or tool</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setWorkspaceMenuOpen(false)}
                      className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#2A2A2A] bg-[#1B1B1B] text-[#B4B4B8] hover:text-white"
                      aria-label="Close studio menu"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="mb-2 mt-3 flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#737373]">Workspace view</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {([
                      ['tools', 'Studio Tools'],
                      ['preview', 'Studio Preview'],
                      ['inspector', 'Properties'],
                    ] as const).map(([view, label]) => (
                      <button
                        key={view}
                        type="button"
                        onClick={() => {
                          window.dispatchEvent(new CustomEvent('workspace:set-mobile-view', { detail: view }));
                          setWorkspaceMenuOpen(false);
                        }}
                        aria-current={workspaceMobileView === view ? 'page' : undefined}
                        className={`min-h-11 rounded-xl border px-3 text-left text-xs font-semibold transition-colors ${
                          workspaceMobileView === view
                            ? 'border-[#60A5FA]/40 bg-[#2563EB]/20 text-white'
                            : 'border-[#2A2A2A] bg-[#1B1B1B] text-[#D4D4D8] hover:border-[#3B82F6]/50 hover:bg-[#202020] hover:text-white'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>

                  <div className="mb-2 mt-4 flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#737373]">Studio tools</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {WORKSPACE_SIDEBAR_ITEMS.map((item) => {
                      const Icon = item.icon;
                      const isActive = item.isScriptGroup
                        ? activeWorkspacePane === 'script' || activeWorkspacePane === 'prompt' || activeWorkspacePane === 'editor'
                        : item.id === 'text'
                        ? activeWorkspacePane === 'text' || activeWorkspacePane === 'captions'
                        : item.id === 'youtube'
                        ? activeWorkspacePane === 'youtube' || activeWorkspacePane === 'publish'
                        : activeWorkspacePane === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            onWorkspacePaneChange(item.id);
                            window.dispatchEvent(new CustomEvent('workspace:set-mobile-view', { detail: 'tools' }));
                            setWorkspaceMenuOpen(false);
                          }}
                          aria-current={isActive ? 'page' : undefined}
                          className={`flex min-h-11 items-center gap-2 rounded-xl border px-3 text-left text-xs font-semibold transition-colors ${
                            isActive
                              ? 'border-[#60A5FA]/40 bg-[#2563EB]/20 text-white'
                              : 'border-[#2A2A2A] bg-[#1B1B1B] text-[#B4B4B8] hover:bg-[#202020] hover:text-white'
                          }`}
                        >
                          <Icon className="h-4 w-4 shrink-0 text-[#60A5FA]" />
                          <span className="truncate">{item.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      onNavigate('dashboard');
                      setWorkspaceMenuOpen(false);
                    }}
                    className="mt-4 flex min-h-11 w-full items-center gap-2 rounded-xl border border-[#2A2A2A] bg-[#1B1B1B] px-3 text-left text-xs font-semibold text-[#B4B4B8] hover:bg-[#202020] hover:text-white"
                  >
                    <LayoutDashboard className="h-4 w-4 text-[#60A5FA]" />
                    Creator dashboard
                  </button>
                </nav>
              </>
            )}

            {/* Main Studio Body: Docked panes in center */}
            <main className="workspace-main-content flex-1 min-w-0 min-h-0 p-0 overflow-hidden flex flex-col bg-[#0A0A0A]">
              <div className="workspace-main-wrapper w-full h-full flex-1 min-h-0">
                {children}
              </div>
            </main>

            {/* Mobile Studio Tools Bottom Bar (< 768px / md:hidden) */}
            <nav
              aria-label="Studio tools bottom bar"
              className="flex md:hidden w-full h-13 bg-[#111114]/98 border-t border-[#222228] overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden items-center gap-1 px-2 shrink-0 z-30 select-none font-sans-studio backdrop-blur-xl touch-pan-x"
            >
              {/* Studio Preview Button */}
              <button
                type="button"
                onClick={() => {
                  setShowLeftPaneMobile(false);
                  window.dispatchEvent(
                    new CustomEvent('workspace:toggle-panel', { detail: { panel: 'preview' } })
                  );
                }}
                aria-label="Studio Preview"
                title="Studio Preview & Timeline"
                aria-current={!showLeftPaneMobile ? 'page' : undefined}
                className={`flex flex-col items-center justify-center min-w-[62px] h-11 px-2 py-1 rounded-xl transition-all cursor-pointer shrink-0 gap-0.5 ${
                  !showLeftPaneMobile
                    ? 'bg-blue-600/15 border border-blue-500/40 text-blue-400 font-semibold shadow-xs'
                    : 'border border-zinc-800/80 bg-zinc-900/60 text-zinc-300 hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                <Film className={`h-4 w-4 shrink-0 ${!showLeftPaneMobile ? 'text-blue-400 scale-105' : 'text-zinc-400'}`} />
                <span className="text-[9.5px] leading-tight tracking-tight whitespace-nowrap font-medium">
                  Preview
                </span>
              </button>

              <div className="h-5 w-px bg-zinc-800/80 mx-0.5 shrink-0" />

              {WORKSPACE_SIDEBAR_ITEMS.map((item) => {
                const IconComp = item.icon;
                const isActive = showLeftPaneMobile && (item.isScriptGroup
                  ? activeWorkspacePane === 'script' || activeWorkspacePane === 'prompt' || activeWorkspacePane === 'editor'
                  : item.id === 'text'
                  ? activeWorkspacePane === 'text' || activeWorkspacePane === 'captions'
                  : item.id === 'youtube'
                  ? activeWorkspacePane === 'youtube' || activeWorkspacePane === 'publish'
                  : activeWorkspacePane === item.id);

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setShowLeftPaneMobile(true);
                      onWorkspacePaneChange(item.id);
                      window.dispatchEvent(
                        new CustomEvent('workspace:switch-pane', { detail: { pane: item.id } })
                      );
                    }}
                    aria-label={item.label}
                    aria-current={isActive ? 'page' : undefined}
                    className={`flex flex-col items-center justify-center min-w-[58px] h-11 px-1.5 py-1 rounded-xl transition-all cursor-pointer shrink-0 gap-0.5 ${
                      isActive
                        ? 'bg-blue-600/15 border border-blue-500/40 text-blue-400 font-semibold shadow-xs'
                        : 'border border-transparent text-zinc-400 hover:text-white hover:bg-white/[0.04]'
                    }`}
                  >
                    <IconComp className={`h-4 w-4 shrink-0 ${isActive ? 'text-blue-400 scale-105' : 'text-zinc-400'}`} />
                    <span className="text-[9.5px] leading-tight tracking-tight whitespace-nowrap">
                      {item.shortLabel}
                    </span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
      ) : (
        <>
          {/* Standard Top Bar Header (Compact Sleek Height) */}
          <header
            className={`h-11 shrink-0 z-30 w-full bg-[#111111]/98 border-b border-[#242424] px-3 sm:px-4 lg:px-6 flex items-center justify-between gap-3 transition-all duration-300 ${
              sidebarOpen ? 'filter blur-[2px] opacity-60 pointer-events-none' : ''
            }`}
          >
            {/* Left: Open/Close Sidebar Toggle + Brand */}
            <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className={`h-7.5 px-2 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 border text-xs font-medium ${
                  sidebarOpen ? 'bg-[#2563EB] text-white border-[#60A5FA]/40 shadow-xs' : 'text-[#9CA3AF] hover:text-white hover:bg-[#26262C] border-[#242424] hover:border-white/10'
                }`}
                aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
                title={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
              >
                {sidebarOpen ? (
                  <X className="w-3.5 h-3.5 text-[#60A5FA]" />
                ) : (
                  <Menu className="w-3.5 h-3.5 text-[#60A5FA]" />
                )}
                <span className="text-[11px] font-semibold hidden sm:inline text-[#E5E5E5]">
                  {sidebarOpen ? 'Close' : 'Menu'}
                </span>
              </button>

              {/* Brand Logo */}
              <button
                onClick={() => onNavigate('dashboard')}
                className="flex shrink-0 items-center gap-2.5 whitespace-nowrap rounded-none border-0 bg-transparent px-0 py-0 text-sm font-extrabold text-white transition-opacity hover:border-transparent hover:bg-transparent hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6]/60 sm:text-base cursor-pointer"
                aria-label="ApexMind Studio home"
              >
                <ApexMindLogo size={32} variant="3d" interactive={false} />
                <span className="text-gradient-brand">ApexMind Studio</span>
              </button>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <NotificationDropdown
                unreadCount={unreadCount}
                onNavigate={onNavigate}
                buttonClassName="h-7.5 w-7.5 !p-1.5 rounded-lg border-[#2A2A2A] hover:border-[#3D3D3D]"
              />

              <button
                onClick={() => onNavigate('profile')}
                className="h-7.5 w-7.5 rounded-lg border border-[#2A2A2A] bg-[#181818] hover:bg-[#26262C] border border-[#242424] hover:border-white/10 transition-all cursor-pointer flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/40"
                title={user ? `${user.name} (${user.email || user.handle || `${user.provider} sign-in`})` : 'Profile & Badges'}
                aria-label="Open profile"
              >
                {user?.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.name}
                    className="w-6 h-6 rounded-md bg-[#1E1E1E] object-cover"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold text-[#60A5FA]">
                    {user?.name ? user.name.slice(0, 2).toUpperCase() : 'AM'}
                  </div>
                )}
              </button>
            </div>
          </header>

          {/* Standard Main Framing */}
          <main className="flex-1 w-full overflow-y-auto overflow-x-hidden bg-[#0A0A0A] p-3 sm:p-5 lg:p-6 custom-scrollbar">
            <div className="w-full max-w-7xl mx-auto space-y-6 transition-all">
              {children}
            </div>
          </main>
        </>
      )}

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
            <ApexMindLogo size={32} variant="3d" interactive={false} />
            <div className="flex flex-col">
              <span className="text-base font-extrabold tracking-tight text-gradient-brand">ApexMind</span>
              <span className="text-[10px] font-semibold text-[#6B7280] uppercase tracking-wider -mt-0.5">Navigation Menu</span>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-1.5 rounded-lg text-[#9CA3AF] hover:text-white hover:bg-[#26262C] border border-[#242424] hover:border-white/10 transition-all cursor-pointer"
            aria-label="Close sidebar"
            title="Close sidebar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Items (Independent vertical scroll if needed) */}
        <div className="flex-1 px-3 py-3 overflow-y-auto">
          <p className="px-2 mb-2 text-[9px] font-bold tracking-[0.12em] uppercase text-[#4A4A4A]">Navigation</p>
          <nav aria-label="Main navigation" className="space-y-1">
            {navItems.map((item) => {
              const isActive =
                activePage === item.id ||
                (item.id === 'channels' && (activePage === 'channels' || activePage === 'profile-channels')) ||
                (item.id === 'profile' && activePage.startsWith('profile-')) ||
                (item.id === 'youtube' && activePage.startsWith('youtube-')) ||
                (item.id === 'workspace' && activePage.startsWith('workspace-'));
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  aria-current={isActive ? 'page' : undefined}
                  aria-label={item.badge ? `${item.label}, ${item.badge} unread` : item.label}
                  className={`group relative w-full flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-150 border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6]/50 ${
                    isActive
                      ? 'bg-[#2563EB] text-white border-[#60A5FA]/30 shadow-[0_2px_12px_rgba(37,99,235,0.35)]'
                      : 'text-[#9CA3AF] hover:text-white hover:bg-[#1E1E1E] border-transparent hover:border-[#2A2A2A]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`flex h-8 w-8 items-center justify-center rounded-lg border transition-all shrink-0 ${
                        isActive
                          ? 'bg-white/20 border-white/25 text-white'
                          : `${item.iconBg} ${item.iconColor} group-hover:brightness-125`
                      }`}
                    >
                      {item.icon}
                    </span>
                    <span className="text-[13px] font-semibold leading-none">{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-[#2563EB] px-1.5 text-[10px] font-bold text-white shadow-[0_0_8px_rgba(37,99,235,0.5)]">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 sm:p-5 pt-3 border-t border-[#2F2F2F] space-y-2.5 shrink-0 bg-gradient-to-t from-[#0D0D0D]/70 to-transparent">
          {/* Creator Profile Card */}
          {user && (
            <button
              onClick={() => handleNavClick('profile')}
              className="w-full p-2.5 rounded-xl bg-[#0A0A0A] border border-[#2F2F2F] hover:border-[#3B82F6]/35 hover:bg-[#26262C] hover:border-white/10 flex items-center gap-2.5 text-left transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6]/50"
              aria-label="Open profile and badges"
            >
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt=""
                  className="w-9 h-9 rounded-lg bg-[#121212] border border-[#2F2F2F] object-cover shrink-0"
                />
              ) : (
                <span className="w-9 h-9 rounded-lg bg-[#172033] border border-[#3B82F6]/25 flex items-center justify-center text-xs font-bold text-[#60A5FA] shrink-0">
                  {user.name ? user.name.slice(0, 2).toUpperCase() : 'AM'}
                </span>
              )}
              <span className="flex-1 min-w-0">
                <span className="flex items-center gap-1.5">
                  <span className="text-[11px] font-bold text-white truncate">{user.name || 'Creator'}</span>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded font-semibold shrink-0 capitalize ${
                    user.provider === 'google'
                      ? 'bg-blue-500/15 text-[#60A5FA] border border-blue-500/30'
                      : user.provider === 'email'
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                      : 'bg-red-500/15 text-red-400 border border-red-500/30'
                  }`}>
                    {user.provider === 'google' ? 'Google' : user.provider === 'facebook' ? 'Facebook' : user.provider === 'instagram' ? 'Instagram' : user.provider === 'email' ? 'Email' : 'YouTube'}
                  </span>
                </span>
                <span className="block text-[10px] text-[#9CA3AF] truncate">{user.email || user.handle || `${user.provider} sign-in`}</span>
              </span>
              <User className="w-3.5 h-3.5 text-[#6B7280] shrink-0" aria-hidden="true" />
            </button>
          )}

          {/* Sign Out Button */}
          <button
            onClick={async () => {
              await logout();
              handleNavClick('login');
            }}
            className="w-full flex items-center justify-center gap-2 p-2.5 text-xs font-semibold text-[#9CA3AF] border border-[#2F2F2F] bg-[#101010]/80 hover:text-red-400 hover:border-red-500/40 hover:bg-red-500/10 transition-all duration-200 cursor-pointer rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/40"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>

        </div>
      </aside>

    </div>
  );
}
