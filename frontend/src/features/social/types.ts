/**
 * frontend/src/features/social/types.ts
 * Type definitions for Omnichannel Social Fleet & Cross-Platform Syndication.
 */

export type SocialPlatform = 'youtube' | 'instagram' | 'facebook' | 'linkedin' | 'x';

export interface SocialAccount {
  id: string;
  userId: string;
  platform: SocialPlatform;
  platformAccountId: string;
  name: string;
  handle: string;
  avatarUrl?: string;
  bannerUrl?: string;
  followersCount: number;
  postsCount: number;
  isActive: boolean;
  isAutoUploadEnabled: boolean;
  scheduleCron: string;
  niche: string;
  connectedAt: string;
  updatedAt: string;
  hasAccessToken?: boolean;
  hasRefreshToken?: boolean;
  metadata?: Record<string, any>;
}

export interface PlatformPublishResult {
  platform: SocialPlatform;
  accountId: string;
  accountName: string;
  success: boolean;
  postId?: string;
  url?: string;
  status: 'published' | 'queued' | 'failed';
  message: string;
}

export interface SyndicatePublishResponse {
  success: boolean;
  totalTargets: number;
  successfulCount: number;
  failedCount: number;
  results: PlatformPublishResult[];
}

export interface SyndicatePublishPayload {
  targetAccountIds: string[];
  videoUrl: string;
  title: string;
  description?: string;
  tags?: string[];
  privacy?: 'public' | 'private';
}

export interface PublishedPost {
  id: string;
  userId: string;
  socialAccountId: string;
  platform: SocialPlatform;
  videoIdOrUrl?: string;
  title: string;
  caption?: string;
  status: string;
  views: number;
  likes: number;
  commentsCount: number;
  errorMessage?: string;
  publishedAt: string;
}
