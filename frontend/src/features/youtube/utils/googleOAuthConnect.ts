import { youtubeApi } from '../api/youtubeApi';
import type { YouTubeChannel } from '../types';


export const getGoogleClientId = (): string => {
  return (
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GOOGLE_CLIENT_ID) ||
    ''
  )
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
 * Avoids Error 400: redirect_uri_mismatch by leveraging Authorized JavaScript Origin.
 */
export const connectYouTubeWithGoogle = async (options: ConnectOptions = {}): Promise<void> => {
  const { onSuccess, onError, onLoading } = options;
  const clientId = getGoogleClientId();

  onLoading?.(true);

  // 1. If Google Identity Services (GIS) token client is available, use popup
  if (typeof window !== 'undefined' && window.google?.accounts?.oauth2 && clientId) {
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
      return;
    } catch (gisErr: any) {
      console.warn('Google Identity popup error, trying redirect fallback:', gisErr);
    }
  }

  // 2. Fallback: server-side redirect OAuth
  try {
    const res = await youtubeApi.getAuthConnectUrl();
    if (res?.authUrl) {
      window.location.href = res.authUrl;
      return;
    }
    throw new Error('Could not generate YouTube authorization URL');
  } catch (err: any) {
    onLoading?.(false);
    onError?.(err.message || 'Google YouTube connection failed');
  }
};
