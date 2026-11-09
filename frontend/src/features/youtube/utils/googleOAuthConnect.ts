import { youtubeApi } from '../api/youtubeApi';
import type { YouTubeChannel } from '../types';

export const getGoogleClientId = (): string => {
  const clientId =
    typeof import.meta !== 'undefined' ? import.meta.env?.VITE_GOOGLE_CLIENT_ID : '';
  return (clientId || '')
    .replace(/^["']|["']$/g, '')
    .trim();
};

export interface ConnectOptions {
  onSuccess?: (channel: YouTubeChannel) => void;
  onError?: (error: string) => void;
  onLoading?: (loading: boolean) => void;
}

/**
 * Connect YouTube Channel via Google Identity Services Popup (same as Login flow)
 * Prioritizes offline Authorization Code flow (initCodeClient) to acquire a persistent refresh_token.
 * Falls back to Token Client (initTokenClient) when code flow is not supported.
 */
export const connectYouTubeWithGoogle = async (options: ConnectOptions = {}): Promise<void> => {
  const { onSuccess, onError, onLoading } = options;
  const clientId = getGoogleClientId();

  onLoading?.(true);

  if (typeof window !== 'undefined' && window.google?.accounts?.oauth2 && clientId) {
    const runTokenClientFlow = () => {
      try {
        const tokenClient = window.google.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope:
            'https://www.googleapis.com/auth/youtube.readonly https://www.googleapis.com/auth/youtube.upload openid email profile',
          prompt: 'consent',
          callback: async (tokenResponse: any) => {
            if (tokenResponse.error) {
              onLoading?.(false);
              const msg =
                tokenResponse.error_description ||
                tokenResponse.error ||
                'Google authorization was closed';
              onError?.(msg);
              return;
            }

            try {
              const accessToken = tokenResponse.access_token;
              if (!accessToken) {
                throw new Error('Google did not return an access token.');
              }
              const result = await youtubeApi.connectWithToken(accessToken);
              if (result.channel) {
                localStorage.setItem('apexmind_yt_active_channel', result.channel.handle);
                onSuccess?.(result.channel);
              } else {
                onError?.('Channel connected, but no channel profile returned.');
              }
            } catch (apiErr: any) {
              onError?.(apiErr.message || 'Failed to connect YouTube channel');
            } finally {
              onLoading?.(false);
            }
          },
        });

        tokenClient.requestAccessToken({ prompt: 'consent' });
      } catch (err: any) {
        onLoading?.(false);
        onError?.(err.message || 'Google authorization failed');
      }
    };

    try {
      // 1. Prioritize initCodeClient for offline refresh_token access
      if (typeof (window.google.accounts.oauth2 as any).initCodeClient === 'function') {
        const codeClient = (window.google.accounts.oauth2 as any).initCodeClient({
          client_id: clientId,
          scope:
            'https://www.googleapis.com/auth/youtube.readonly https://www.googleapis.com/auth/youtube.upload openid email profile',
          access_type: 'offline',
          prompt: 'consent',
          ux_mode: 'popup',
          callback: async (codeResponse: any) => {
            if (codeResponse.error) {
              onLoading?.(false);
              const msg =
                codeResponse.error_description ||
                codeResponse.error ||
                'Google authorization was closed';
              onError?.(msg);
              return;
            }

            try {
              const code = codeResponse.code;
              if (!code) {
                throw new Error('Google did not return an authorization code.');
              }
              const result = await youtubeApi.connectWithCode(code, 'postmessage');
              if (result.channel) {
                localStorage.setItem('apexmind_yt_active_channel', result.channel.handle);
                onSuccess?.(result.channel);
                onLoading?.(false);
                return;
              }
              onError?.('Channel connected, but no channel profile returned.');
              onLoading?.(false);
            } catch (apiErr: any) {
              console.warn('[YouTube] Offline code exchange failed, falling back to direct token authentication:', apiErr);
              // Automatic resilient fallback: if backend cannot exchange offline code (e.g. Render missing GOOGLE_CLIENT_SECRET or redirect_uri mismatch),
              // seamlessly switch to direct token flow so the user is never blocked.
              runTokenClientFlow();
            }
          },
        });

        codeClient.requestCode();
        return;
      }

      // 2. Fallback to initTokenClient if initCodeClient is unavailable
      runTokenClientFlow();
      return;
    } catch (gisErr: any) {
      console.error('Google Identity popup error:', gisErr);
      onLoading?.(false);
      onError?.(gisErr.message || 'Google authorization popup failed to open');
      return;
    }
  }

  onLoading?.(false);
  onError?.('Google Identity Services client is not initialized or GOOGLE_CLIENT_ID is missing.');
};
