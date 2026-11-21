import { useCallback, useState } from 'react';
import { STORAGE_KEYS } from '../constants';

function loadStringArray(storageKey: string): string[] {
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === 'string')
      : [];
  } catch {
    return [];
  }
}

export interface UseChecklistResult {
  checkedIds: string[];
  adoptedSwapIds: string[];
  toggleChecklistItem: (id: string) => void;
  toggleAdoptedSwap: (id: string) => void;
  resetActions: () => void;
}

/** Persists completed Community Checklist items and adopted Sustainable Swaps in localStorage. */
export function useChecklist(): UseChecklistResult {
  const [checkedIds, setCheckedIds] = useState<string[]>(() =>
    loadStringArray(STORAGE_KEYS.checklist)
  );
  const [adoptedSwapIds, setAdoptedSwapIds] = useState<string[]>(() =>
    loadStringArray(STORAGE_KEYS.adoptedSwaps)
  );

  const toggleChecklistItem = useCallback((id: string) => {
    setCheckedIds((prev) => {
      const next = prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id];
      try {
        window.localStorage.setItem(STORAGE_KEYS.checklist, JSON.stringify(next));
      } catch {
        // Ignore storage write failure
      }
      return next;
    });
  }, []);

  const toggleAdoptedSwap = useCallback((id: string) => {
    setAdoptedSwapIds((prev) => {
      const next = prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id];
      try {
        window.localStorage.setItem(STORAGE_KEYS.adoptedSwaps, JSON.stringify(next));
      } catch {
        // Ignore storage write failure
      }
      return next;
    });
  }, []);

  const resetActions = useCallback(() => {
    try {
      window.localStorage.removeItem(STORAGE_KEYS.checklist);
      window.localStorage.removeItem(STORAGE_KEYS.adoptedSwaps);
    } catch {
      // Ignore storage removal failure
    }
    setCheckedIds([]);
    setAdoptedSwapIds([]);
  }, []);

  return {
    checkedIds,
    adoptedSwapIds,
    toggleChecklistItem,
    toggleAdoptedSwap,
    resetActions,
  };
}
