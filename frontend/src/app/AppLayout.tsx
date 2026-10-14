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
import { Badge } from '@/src/shared/ui/common';
import { useAuth } from '@/src/features/auth/context/AuthContext';
import { notificationsApi } from '@/src/features/notifications/api/notificationsApi';
import { WorkspaceHeader } from '@/src/features/workspace/components/WorkspaceHeader';
import { WorkspaceSidebar, WorkspaceTabType } from '@/src/features/workspace/components/WorkspaceSidebar';
import { NotificationDropdown } from '@/src/features/notifications/components/NotificationDropdown';

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
  const [dynamicUnread, setDynamicUnread] = useState(0);

  useEffect(() => {
    if (!isAuthenticated) return;
    const fetchUnread = () => {
      notificationsApi.getNotificationsWithMeta({ limit: 1 })
        .then((res) => {
          setDynamicUnread(res.unreadCount);
        })
        .catch(() => setDynamicUnread(0));
    };

    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
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
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5 shrink-0" /> },
    { id: 'workspace', label: 'AI Video Studio', icon: <Wand2 className="w-5 h-5 shrink-0" /> },
    { id: 'videos', label: 'Website Videos', icon: <Film className="w-5 h-5 shrink-0" /> },
    { id: 'youtube', label: 'YouTube Manager', icon: <Youtube className="w-5 h-5 text-red-400 shrink-0" /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell className="w-5 h-5 shrink-0" />, badge: unreadCount > 0 ? unreadCount : undefined },
    { id: 'settings', label: 'Settings', icon: <Settings className="w-5 h-5 shrink-0" /> },
  ];

  const handleNavClick = (id: string) => {
    onNavigate(id);
    setSidebarOpen(false);
  };

  return (
    <div className="h-screen w-full bg-[#0A0A0A] text-[#E5E5E5] flex flex-col overflow-hidden font-sans-studio antialiased selection:bg-[#3B82F6]/30 selection:text-[#60A5FA] relative">
      {/* =========================================================================
          Workspace Page: Dedicated Studio Header & Sidebar
          Other Pages: Standard Application Header, Main Framing, and Slide Drawer
          ========================================================================= */}
      {activePage === 'workspace' ? (
        <>
          <WorkspaceHeader
            user={user}
            unreadCount={unreadCount}
            onNavigate={onNavigate}
          />
          <div className="flex-1 w-full flex min-h-0 overflow-hidden">
            <WorkspaceSidebar
              activeTab={activeWorkspacePane}
              onTabChange={(tab) => onWorkspacePaneChange(tab)}
            />
            <main className="flex-1 min-w-0 h-full p-1 sm:p-1.5 overflow-y-auto lg:overflow-hidden flex flex-col min-h-0 bg-[#0A0A0A]">
              <div className="w-full h-full flex-1 min-h-0">
                {children}
              </div>
            </main>
          </div>
        </>
      ) : (
        <>
          {/* Standard Top Bar Header */}
          <header
            className={`h-16 shrink-0 z-30 w-full bg-[#121212]/98 border-b border-[#2F2F2F] px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-3 sm:gap-5 transition-all duration-300 ${
              sidebarOpen ? 'filter blur-[2px] opacity-60 pointer-events-none' : ''
            }`}
          >
            {/* Left: Open/Close Sidebar Toggle + Brand */}
            <div className="flex items-center gap-3 sm:gap-4 shrink-0">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className={`h-10 px-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 border ${
                  sidebarOpen
                    ? 'bg-[#1E1E1E] text-white border-[#3B82F6]/50'
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
                aria-label="ApexMind Studio home"
              >
                <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-gradient-to-tr from-[#3B82F6] to-[#2563EB] text-white border border-[#60A5FA]/30">
                  <Sparkles className="w-4 h-4 lg:w-5 lg:h-5" />
                </div>
                <span className="text-gradient-brand">ApexMind Studio</span>
              </button>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <NotificationDropdown
                unreadCount={unreadCount}
                onNavigate={onNavigate}
              />

              <button
                onClick={() => onNavigate('profile')}
                className="h-10 w-10 rounded-xl border border-[#2F2F2F] bg-[#171717] hover:bg-[#1E1E1E] hover:border-[#4A4A4A] transition-all cursor-pointer flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/40"
                title={user ? `${user.name} (${user.email})` : 'Profile & Badges'}
                aria-label="Open profile"
              >
                {user?.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.name}
                    className="w-8 h-8 rounded-lg bg-[#1E1E1E] object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-[#60A5FA]">
                    {user?.name ? user.name.slice(0, 2).toUpperCase() : 'AM'}
                  </div>
                )}
              </button>
            </div>
          </header>

          {/* Standard Main Framing */}
          <main className="flex-1 w-full overflow-y-auto overflow-x-hidden bg-[#0A0A0A] p-4 sm:p-5 lg:p-6">
            <div className="w-full rounded-2xl sm:rounded-3xl bg-[#101010]/80 border border-[#2F2F2F] shadow-2xl p-5 sm:p-7 lg:p-8 transition-all">
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
            <div className="p-2 rounded-xl bg-gradient-to-tr from-[#3B82F6] to-[#2563EB] text-white border border-[#60A5FA]/30">
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
        <div className="flex-1 p-4 sm:p-5 overflow-y-auto">
          <nav aria-label="Main navigation" className="space-y-2">
            {navItems.map((item) => {
              const isActive = activePage === item.id || (item.id === 'profile' && activePage.startsWith('profile-'));
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  aria-current={isActive ? 'page' : undefined}
                  aria-label={item.badge ? `${item.label}, ${item.badge} unread` : item.label}
                  className={`group relative w-full flex items-center justify-between px-3 py-2.5 text-sm font-semibold rounded-xl min-h-[48px] cursor-pointer transition-all border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6]/50 motion-reduce:transition-none ${
                    isActive
                      ? 'bg-[#3B82F6]/15 text-[#60A5FA] border-[#3B82F6]/30'
                      : 'text-[#9CA3AF] hover:text-white hover:bg-[#1A1A1A] border-transparent hover:border-[#303030]'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <span
                      className={`flex h-8 w-8 items-center justify-center rounded-lg border transition-all ${
                        isActive
                          ? 'bg-[#1D2E4D] border-[#3B82F6]/35 text-[#60A5FA]'
                          : 'bg-[#171717] border-[#2F2F2F] text-[#9CA3AF] group-hover:text-white group-hover:border-[#3A3A3A]'
                      }`}
                    >
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </div>
                  {item.badge && <Badge variant="blue">{item.badge}</Badge>}
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
              className="w-full p-2.5 rounded-xl bg-[#0A0A0A] border border-[#2F2F2F] hover:border-[#3B82F6]/35 hover:bg-[#111827]/50 flex items-center gap-2.5 text-left transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6]/50"
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
                  <span className="text-[9px] bg-blue-500/15 text-[#60A5FA] px-1 py-0.5 rounded font-bold shrink-0">
                    Google
                  </span>
                </span>
                <span className="block text-[10px] text-[#9CA3AF] truncate">{user.email}</span>
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
