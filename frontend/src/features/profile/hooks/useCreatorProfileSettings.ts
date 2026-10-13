import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/src/features/auth/context/AuthContext';
import {
  DEFAULT_CREATOR_PROFILE,
  getCreatorProfile,
  saveCreatorProfile,
  type CreatorProfile,
} from '../api/profileApi';

export function useCreatorProfileSettings() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<CreatorProfile>({ ...DEFAULT_CREATOR_PROFILE });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) return;
    try {
      setProfile(getCreatorProfile(user.id));
      setError(null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Could not load your saved profile.');
    }
  }, [user?.id]);

  const save = useCallback((nextProfile: CreatorProfile): boolean => {
    if (!user?.id) {
      setError('Sign in again before saving your profile.');
      return false;
    }
    try {
      saveCreatorProfile(user.id, nextProfile);
      setProfile(nextProfile);
      setError(null);
      return true;
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Could not save your profile.');
      return false;
    }
  }, [user?.id]);

  return { profile, setProfile, save, error, user };
}
