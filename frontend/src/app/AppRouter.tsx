import { Suspense } from 'react';
import { RouteLoadingFallback } from '@/src/shared/ui/feedback';

import LandingPage from '@/src/features/landing/pages/LandingPage';
import LoadingPage from '@/src/shared/ui/LoadingPage';
import LoginPage from '@/src/features/auth/pages/LoginPage';
import DashboardPage from '@/src/features/dashboard/pages/DashboardPage';
import WorkspacePage from '@/src/features/workspace/pages/WorkspacePage';
import VideosPage from '@/src/features/videos/pages/VideosPage';
import YouTubePage from '@/src/features/youtube/pages/YouTubePage';
import ProfileDetailsPage from '@/src/features/profile/pages/ProfileDetailsPage';
import ProfilePreferencesPage from '@/src/features/profile/pages/ProfilePreferencesPage';
import SocialLinkingPage from '@/src/features/social/pages/SocialLinkingPage';
import ProfileActivityPage from '@/src/features/profile/pages/ProfileActivityPage';
import ProfileUsagePage from '@/src/features/profile/pages/ProfileUsagePage';
import RecentStudioActivityPage from '@/src/features/profile/pages/RecentStudioActivityPage';
import ProfileSecurityPage from '@/src/features/profile/pages/ProfileSecurityPage';
import ProfileSectionLayout from '@/src/features/profile/components/ProfileSectionLayout';
import SettingsPage from '@/src/features/settings/pages/SettingsPage';
import NotificationsPage from '@/src/features/notifications/pages/NotificationsPage';
import TermsPage from '@/src/features/legal/pages/TermsPage';
import PrivacyPage from '@/src/features/legal/pages/PrivacyPage';
import NotFoundPage from '@/src/shared/ui/NotFoundPage';
import { useAuth } from '@/src/features/auth/context/AuthContext';
import { WorkspaceTabType } from '@/src/features/workspace/components/WorkspaceSidebar';

interface AppRouterProps {
  activePage: string;
  onNavigate: (page: string) => void;
  activeWorkspacePane: WorkspaceTabType;
  onWorkspacePaneChange: (pane: WorkspaceTabType) => void;
}

export default function AppRouter({
  activePage,
  onNavigate,
  activeWorkspacePane,
  onWorkspacePaneChange,
}: AppRouterProps) {
  const { isAuthenticated } = useAuth();

  const isPublicPage =
    activePage === 'landing' ||
    activePage === 'login' ||
    activePage === 'loading' ||
    activePage === '404' ||
    activePage === 'terms' ||
    activePage === 'privacy';

  // Unauthenticated users are redirected to login for protected studio pages
  if (!isAuthenticated && !isPublicPage) {
    return <LoginPage onNavigate={onNavigate} />;
  }

  // Authenticated users on login or landing are sent directly to Dashboard
  if (isAuthenticated && (activePage === 'login' || activePage === 'landing')) {
    return (
      <Suspense fallback={<RouteLoadingFallback />}>
        <DashboardPage onNavigate={onNavigate} />
      </Suspense>
    );
  }

  const page = (
    <Suspense fallback={<RouteLoadingFallback />}>
      {(() => {
        switch (activePage) {
          case 'landing':
            return <LandingPage onNavigate={onNavigate} />;
          case 'loading':
            return <LoadingPage onNavigate={onNavigate} />;
          case 'login':
            return <LoginPage onNavigate={onNavigate} />;
          case 'dashboard':
            return <DashboardPage onNavigate={onNavigate} />;
          case 'workspace':
          case 'studio':
          case 'workspace-youtube':
          case 'workspace-publish':
          case 'workspace-automations':
          case 'workspace-script':
          case 'workspace-prompt':
          case 'workspace-editor':
          case 'workspace-media':
          case 'workspace-audio':
          case 'workspace-elements':
          case 'workspace-text':
          case 'workspace-captions':
          case 'workspace-canvas':
          case 'workspace-image':
          case 'workspace-video':
          case 'workspace-3d-visuals':
            return (
              <WorkspacePage
                onNavigate={onNavigate}
                activePane={activeWorkspacePane}
                onPaneChange={onWorkspacePaneChange}
              />
            );

          case 'youtube':
          case 'youtube-overview':
            return <YouTubePage onNavigate={onNavigate} initialTab="overview" />;
          case 'youtube-videos':
            return <YouTubePage onNavigate={onNavigate} initialTab="videos" />;
          case 'youtube-shorts':
            return <YouTubePage onNavigate={onNavigate} initialTab="shorts" />;
          case 'youtube-playlists':
            return <YouTubePage onNavigate={onNavigate} initialTab="playlists" />;
          case 'youtube-posts':
            return <YouTubePage onNavigate={onNavigate} initialTab="posts" />;
          case 'youtube-schedules':
            return <YouTubePage onNavigate={onNavigate} initialTab="schedules" />;
          case 'youtube-settings':
          case 'youtube-seo':
          case 'youtube-trending':
          case 'youtube-analytics':
            return <YouTubePage onNavigate={onNavigate} />;
          case 'videos':
            return <VideosPage onNavigate={onNavigate} />;
          case 'profile':
          case 'profile-details':
            return <ProfileDetailsPage />;
          case 'profile-preferences':
            return <ProfilePreferencesPage />;
          case 'channels':
          case 'linking':
          case 'social-linking':
          case 'profile-channels':
            return <SocialLinkingPage onNavigate={onNavigate} />;
          case 'profile-activity':
            return <ProfileActivityPage />;
          case 'profile-usage':
            return <ProfileUsagePage onNavigate={onNavigate} />;
          case 'profile-studio-activity':
            return <RecentStudioActivityPage onNavigate={onNavigate} />;
          case 'profile-security':
            return <ProfileSecurityPage />;
          case 'settings':
            return <SettingsPage />;
          case 'notifications':
            return <NotificationsPage onNavigate={onNavigate} />;
          case 'terms':
            return <TermsPage onNavigate={onNavigate} />;
          case 'privacy':
            return <PrivacyPage onNavigate={onNavigate} />;
          case '404':
            return <NotFoundPage onNavigate={onNavigate} />;
          default:
            return <NotFoundPage onNavigate={onNavigate} />;
        }
      })()}
    </Suspense>
  );
  return activePage.startsWith('profile') ? (
    <ProfileSectionLayout activePage={activePage} onNavigate={onNavigate}>{page}</ProfileSectionLayout>
  ) : page;
}
