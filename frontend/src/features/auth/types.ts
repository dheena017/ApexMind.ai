export interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatarUrl: string;
  provider: 'email' | 'google' | 'facebook' | 'instagram' | 'youtube_oauth' | 'youtube';
  verified: boolean;
  activeChannelId?: string;
  channelsCount?: number;
  lastLoginAt?: string;
  channelId?: string;
  handle?: string;
}

export interface GoogleAuthPayload {
  accessToken: string;
}

export interface OAuthAuthorizationResponse {
  authorizationUrl: string;
  state: string;
}

export interface AuthResponseData {
  success: boolean;
  user: UserProfile;
  token: string;
  message: string;
}
