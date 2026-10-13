import { useCallback, useEffect, useState } from 'react';
import { Activity, ExternalLink, Key, RefreshCw } from 'lucide-react';
import { Badge, Button, Card } from '@/src/shared/ui/common';
import { settingsApi, type GeminiApiStatus } from '../api/settingsApi';

export default function SettingsPage() {
  const [status, setStatus] = useState<GeminiApiStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStatus = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      setStatus(await settingsApi.getGeminiApiStatus());
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to check Gemini API configuration.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8">
      <div className="pb-6 border-b border-[#2F2F2F]">
        <h1 className="text-2xl font-extrabold tracking-tight text-white">Gemini API Credits</h1>
        <p className="text-xs text-[#9CA3AF] mt-0.5">
          Check API key configuration and review usage in Google AI Studio.
        </p>
      </div>

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#2F2F2F] mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#3B82F6]/10 text-[#60A5FA] border border-[#3B82F6]/20">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-white text-base">Gemini API key</h2>
              <p className="text-xs text-[#9CA3AF]">Configuration is checked by the server; the key is never sent to this page.</p>
            </div>
          </div>

          {loading ? (
            <Badge variant="gray">Checking…</Badge>
          ) : error ? (
            <Badge variant="crimson">Status unavailable</Badge>
          ) : (
            <Badge variant={status?.configured ? 'green' : 'amber'}>
              {status?.configured ? 'Configured' : 'Not configured'}
            </Badge>
          )}
        </div>

        {error ? (
          <div className="space-y-3">
            <p role="alert" className="text-sm text-red-300">{error}</p>
            <Button type="button" variant="secondary" size="sm" onClick={() => void loadStatus()} icon={<RefreshCw className="w-4 h-4" />}>
              Retry check
            </Button>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="flex items-start gap-3 rounded-xl border border-[#2F2F2F] bg-[#121212] p-4">
              <Activity className="w-4 h-4 mt-0.5 shrink-0 text-[#60A5FA]" />
              <div>
                <h3 className="text-sm font-semibold text-white">Balance and quota</h3>
                <p className="text-xs text-[#9CA3AF] mt-1 leading-relaxed">
                  Google does not expose remaining credits or account quota through the Gemini API key. View current usage and billing in Google AI Studio; no credit balance is estimated here.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <a
                href={status?.usageUrl ?? 'https://aistudio.google.com/usage'}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-[42px] items-center gap-2 rounded-xl border border-[#3B82F6]/30 bg-[#3B82F6]/10 px-4 py-2.5 text-sm font-semibold text-[#60A5FA] transition-colors hover:bg-[#3B82F6]/20"
              >
                Open Google AI Studio usage
                <ExternalLink className="w-4 h-4" />
              </a>
              <Button type="button" variant="secondary" onClick={() => void loadStatus()} disabled={loading} icon={<RefreshCw className="w-4 h-4" />}>
                Refresh status
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
