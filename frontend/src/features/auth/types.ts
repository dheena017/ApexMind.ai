export interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatarUrl: string;
  provider: 'youtube_oauth' | 'youtube' | 'google' | 'email' | 'local';
  verified: boolean;
  lastLoginAt?: string;
  channelId?: string;
  handle?: string;
}

export interface ChannelAuthPayload {
  handle: string;
  name?: string;
  avatarUrl?: string;
  channelId?: string;
}

export interface GoogleAuthPayload {
  credential?: string;
  email?: string;
  name?: string;
  picture?: string;
  sub?: string;
  accessToken?: string;
  channel?: any;
}
