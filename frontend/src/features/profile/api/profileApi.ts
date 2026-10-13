export interface CreatorProfile {
  displayName: string;
  avatarUrl: string;
  bio: string;
  creatorHandle: string;
  websiteUrl: string;
  instagramUrl: string;
  tiktokUrl: string;
  youtubeUrl: string;
  niche: string;
  tone: string;
  audience: string;
  defaultVoice: string;
}

const PROFILE_STORAGE_PREFIX = 'apexmind_creator_profile:';

export const DEFAULT_CREATOR_PROFILE: CreatorProfile = {
  displayName: '',
  avatarUrl: '',
  bio: '',
  creatorHandle: '',
  websiteUrl: '',
  instagramUrl: '',
  tiktokUrl: '',
  youtubeUrl: '',
  niche: 'Stoic Mindset & Discipline',
  tone: 'Authoritative & Inspiring',
  audience: '',
  defaultVoice: 'Fenrir',
};

const PROFILE_FIELDS: (keyof CreatorProfile)[] = Object.keys(DEFAULT_CREATOR_PROFILE) as (keyof CreatorProfile)[];

function storageKey(userId: string): string {
  return `${PROFILE_STORAGE_PREFIX}${encodeURIComponent(userId)}`;
}

export function getCreatorProfile(userId: string): CreatorProfile {
  const stored = localStorage.getItem(storageKey(userId));
  if (!stored) return { ...DEFAULT_CREATOR_PROFILE };

  const parsed: unknown = JSON.parse(stored);
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('Saved creator profile has an invalid format. Edit and save your profile to replace it.');
  }

  const storedValues = parsed as Record<string, unknown>;
  return PROFILE_FIELDS.reduce<CreatorProfile>((profile, field) => {
    const value = storedValues[field];
    profile[field] = typeof value === 'string' ? value : DEFAULT_CREATOR_PROFILE[field];
    return profile;
  }, { ...DEFAULT_CREATOR_PROFILE });
}

export function saveCreatorProfile(userId: string, profile: CreatorProfile): void {
  localStorage.setItem(storageKey(userId), JSON.stringify(profile));
}
