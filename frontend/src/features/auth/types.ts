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

export interface RegisterPayload {
  email: string;
  password: string;
  name: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface GoogleAuthPayload {
  credentialToken?: string;
  email?: string;
  name?: string;
  avatarUrl?: string;
  googleId?: string;
}

export type MetaLoginProvider = 'facebook' | 'instagram';

export interface MetaAuthorizationResponse {
  authorizationUrl: string;
  state: string;
}

export interface ChannelAuthPayload {
  handle: string;
  name?: string;
  avatarUrl?: string;
  channelId?: string;
}

export interface AuthResponseData {
  success: boolean;
  user: UserProfile;
  token: string;
  message: string;
}
