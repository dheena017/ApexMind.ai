import { DashboardSummaryData } from '../types';
import { apiUrl } from '@/src/shared/utils/api';
import { consoleLogger } from '@/src/shared/utils/logger';

export const dashboardApi = {
  async getSummary(): Promise<DashboardSummaryData> {
    const start = performance.now();
    let userId: string | undefined;
    try {
      const storedUser = localStorage.getItem('apexmind_user');
      if (storedUser) userId = JSON.parse(storedUser)?.id;
    } catch {
      userId = undefined;
    }
    const query = userId ? `?userId=${encodeURIComponent(userId)}` : '';
    const headers: Record<string, string> = {};
    if (userId) headers['X-User-Id'] = userId;
    const url = apiUrl(`/api/dashboard/summary${query}`);
    const res = await fetch(url, Object.keys(headers).length ? { headers } : undefined);
    const duration = performance.now() - start;
    consoleLogger.api('GET', '/api/dashboard/summary', res.status, duration);

    if (!res.ok) {
      throw new Error(`Failed to load dashboard summary: ${res.statusText}`);
    }

    const data: DashboardSummaryData = await res.json();
    consoleLogger.info('Dashboard', `Loaded creator metrics: ${data.metrics.totalVideos} videos, ${data.metrics.totalScripts} scripts`);
    return data;
  },
};
