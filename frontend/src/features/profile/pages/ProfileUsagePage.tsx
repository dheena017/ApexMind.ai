import RecentStudioActivityPage from './RecentStudioActivityPage';

export default function ProfileUsagePage({ onNavigate }: { onNavigate?: (page: string) => void }) {
  return <RecentStudioActivityPage onNavigate={onNavigate} />;
}
