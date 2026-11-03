export interface UserProfile {
  id: string;
  /** Always in the form handle@youtube.com — never a Gmail address */
  email: string;
  name: string;
  avatarUrl: string;
  provider: 'youtube_oauth' | 'youtube';
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
