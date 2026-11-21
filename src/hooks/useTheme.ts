import { useCallback, useEffect, useState } from 'react';
import { STORAGE_KEYS } from '../constants';
import type { ThemeMode } from '../types';

function loadStoredTheme(): ThemeMode {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS.theme);
    if (raw === 'light' || raw === 'dark' || raw === 'high-contrast') {
      return raw;
    }
  } catch {
    // Ignore storage read failure
  }
  return 'light';
}

export interface UseThemeResult {
  theme: ThemeMode;
  setTheme: (mode: ThemeMode) => void;
  resetTheme: () => void;
}

/** Manages Light, Dark, and WCAG AAA High Contrast themes persisted in localStorage. */
export function useTheme(): UseThemeResult {
  const [theme, setThemeState] = useState<ThemeMode>(() => loadStoredTheme());

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      window.localStorage.setItem(STORAGE_KEYS.theme, theme);
    } catch {
      // Ignore storage write failure
    }
  }, [theme]);

  const setTheme = useCallback((mode: ThemeMode) => {
    setThemeState(mode);
  }, []);

  const resetTheme = useCallback(() => {
    try {
      window.localStorage.removeItem(STORAGE_KEYS.theme);
    } catch {
      // Ignore storage removal failure
    }
    setThemeState('light');
  }, []);

  return { theme, setTheme, resetTheme };
}
