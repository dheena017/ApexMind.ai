import { useState, useEffect, useCallback } from 'react';
import { DashboardSummaryData } from '../types';
import { dashboardApi } from '../api/dashboardApi';

export function useDashboardData() {
  const [data, setData] = useState<DashboardSummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await dashboardApi.getSummary();
      setData(result);
    } catch (err: any) {
      console.error('Failed to load dashboard data:', err);
      setError(err?.message || 'Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;

    fetchSummary();

    // Auto-refresh every 45 seconds for live activity
    const interval = setInterval(() => {
      if (active) {
        dashboardApi.getSummary()
          .then((res) => {
            if (active) setData(res);
          })
          .catch(() => {});
      }
    }, 45000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [fetchSummary]);

  return {
    data,
    loading,
    error,
    refresh: fetchSummary,
  };
}
