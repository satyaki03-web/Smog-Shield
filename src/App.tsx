import React, { useCallback, useEffect, useState } from 'react';
import { DashboardView } from './components/DashboardView';
import { ProfileView } from './components/ProfileView';
import {
  buildFallbackHourly,
  clearAirCache,
  DEFAULT_PROFILE,
  fetchAirQuality,
  getCityById,
  type AirReading,
  type ThemeMode,
  type UserProfile,
} from './smogEngine';

const PROFILE_KEY = 'smog_shield_profile_v1';
const CHECKLIST_KEY = 'smog_shield_checklist_v1';
const THEME_KEY = 'smog_shield_theme_v1';

function loadProfile(): UserProfile {
  try {
    const raw = window.localStorage.getItem(PROFILE_KEY);
    if (!raw) return DEFAULT_PROFILE;
    const parsed = JSON.parse(raw) as Partial<UserProfile>;
    return {
      ...DEFAULT_PROFILE,
      ...parsed,
      sensitivities: Array.isArray(parsed.sensitivities) ? parsed.sensitivities : DEFAULT_PROFILE.sensitivities,
    };
  } catch {
    return DEFAULT_PROFILE;
  }
}

function loadChecklist(): string[] {
  try {
    const raw = window.localStorage.getItem(CHECKLIST_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

function loadTheme(): ThemeMode {
  try {
    const raw = window.localStorage.getItem(THEME_KEY);
    if (raw === 'light' || raw === 'dark' || raw === 'high-contrast') return raw;
  } catch {
    // Ignore storage read failure
  }
  return 'light';
}

function buildInitialReading(profile: UserProfile): AirReading {
  const city = getCityById(profile.cityId);
  const aqi = profile.manualAqi ?? city.fallbackAqi;
  const pm25 = profile.manualAqi !== null ? Math.round(aqi * 0.52) : city.fallbackPm25;
  const pm10 = profile.manualAqi !== null ? Math.round(aqi * 0.85) : city.fallbackPm10;
  return {
    city,
    aqi,
    pm25,
    pm10,
    fetchedAtIso: new Date().toISOString(),
    source: profile.manualAqi !== null ? 'manual' : 'offline',
    hourly: buildFallbackHourly(aqi, pm25, pm10),
  };
}

export default function App() {
  const [profile, setProfile] = useState<UserProfile>(() => loadProfile());
  const [checkedIds, setCheckedIds] = useState<string[]>(() => loadChecklist());
  const [theme, setTheme] = useState<ThemeMode>(() => loadTheme());
  const [editingProfile, setEditingProfile] = useState(false);
  const [reading, setReading] = useState<AirReading>(() => buildInitialReading(loadProfile()));
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      window.localStorage.setItem(THEME_KEY, theme);
    } catch {
      // Ignore storage write failure
    }
  }, [theme]);

  const refreshAir = useCallback(async (activeProfile: UserProfile, force = false) => {
    setLoading(true);
    const city = getCityById(activeProfile.cityId);
    const next = await fetchAirQuality(city, activeProfile.manualAqi, force);
    setReading(next);
    setLoading(false);
  }, []);

  useEffect(() => {
    void refreshAir(profile, false);
  }, [profile, refreshAir]);

  const handleSaveProfile = (next: UserProfile) => {
    setProfile(next);
    setEditingProfile(false);
    try {
      window.localStorage.setItem(PROFILE_KEY, JSON.stringify(next));
    } catch {
      // Ignore storage write failure
    }
  };

  const handleToggleChecklist = (id: string) => {
    setCheckedIds((prev) => {
      const next = prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id];
      try {
        window.localStorage.setItem(CHECKLIST_KEY, JSON.stringify(next));
      } catch {
        // Ignore storage write failure
      }
      return next;
    });
  };

  const handleClearAllData = () => {
    try {
      window.localStorage.removeItem(PROFILE_KEY);
      window.localStorage.removeItem(CHECKLIST_KEY);
      window.localStorage.removeItem(THEME_KEY);
      window.sessionStorage.removeItem('smog_shield_ask_messages_v1');
    } catch {
      // Ignore storage clear failure
    }
    clearAirCache();
    setProfile(DEFAULT_PROFILE);
    setCheckedIds([]);
    setTheme('light');
  };

  if (editingProfile) {
    return (
      <ProfileView
        initialProfile={profile}
        onSave={handleSaveProfile}
        onCancel={() => setEditingProfile(false)}
      />
    );
  }

  return (
    <DashboardView
      profile={profile}
      reading={reading}
      loading={loading}
      theme={theme}
      checkedIds={checkedIds}
      onRefresh={() => void refreshAir(profile, true)}
      onEditProfile={() => setEditingProfile(true)}
      onThemeChange={setTheme}
      onToggleChecklist={handleToggleChecklist}
      onClearAllData={handleClearAllData}
    />
  );
}
