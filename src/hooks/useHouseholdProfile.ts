import { useCallback, useState } from 'react';
import { DEFAULT_PROFILE, STORAGE_KEYS } from '../constants';
import type { UserProfile } from '../types';

function loadStoredProfile(): UserProfile {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS.profile);
    if (!raw) return DEFAULT_PROFILE;
    const parsed = JSON.parse(raw) as Partial<UserProfile>;
    return {
      ...DEFAULT_PROFILE,
      ...parsed,
      sensitivities: Array.isArray(parsed.sensitivities)
        ? parsed.sensitivities
        : DEFAULT_PROFILE.sensitivities,
    };
  } catch {
    return DEFAULT_PROFILE;
  }
}

export interface UseHouseholdProfileResult {
  profile: UserProfile;
  saveProfile: (next: UserProfile) => void;
  resetProfile: () => void;
}

/** Persists and updates the user's household profile in localStorage. */
export function useHouseholdProfile(): UseHouseholdProfileResult {
  const [profile, setProfile] = useState<UserProfile>(() => loadStoredProfile());

  const saveProfile = useCallback((next: UserProfile) => {
    setProfile(next);
    try {
      window.localStorage.setItem(STORAGE_KEYS.profile, JSON.stringify(next));
    } catch {
      // Ignore storage write failure
    }
  }, []);

  const resetProfile = useCallback(() => {
    try {
      window.localStorage.removeItem(STORAGE_KEYS.profile);
    } catch {
      // Ignore storage removal failure
    }
    setProfile(DEFAULT_PROFILE);
  }, []);

  return { profile, saveProfile, resetProfile };
}
