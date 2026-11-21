import { useRef, type KeyboardEvent } from 'react';
import { PRIMARY_TABS } from '../constants';
import type { CityInfo, TabKey } from '../types';
import { ChecklistIcon, SettingsIcon, ShieldMark } from './Icons';

export interface HeaderProps {
  city: CityInfo;
  activeTab: TabKey;
  completedChecklistCount: number;
  onSelectTab: (tab: TabKey) => void;
  onOpenHousehold: () => void;
  onOpenChecklist: () => void;
  onOpenSettings: () => void;
}

/**
 * Sticky application header aligned to the unified max-w-7xl container.
 * Uses a single row on desktop (lg+) with centered tabs and a two-row layout on mobile/tablet
 * with a horizontally scrollable single-line tab strip.
 */
export function Header({
  city,
  activeTab,
  completedChecklistCount,
  onSelectTab,
  onOpenHousehold,
  onOpenChecklist,
  onOpenSettings,
}: HeaderProps) {
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const handleTabKeyDown = (event: KeyboardEvent<HTMLButtonElement>, currentIndex: number) => {
    let nextIndex: number | null = null;
    if (event.key === 'ArrowRight') {
      nextIndex = (currentIndex + 1) % PRIMARY_TABS.length;
    } else if (event.key === 'ArrowLeft') {
      nextIndex = (currentIndex - 1 + PRIMARY_TABS.length) % PRIMARY_TABS.length;
    } else if (event.key === 'Home') {
      nextIndex = 0;
    } else if (event.key === 'End') {
      nextIndex = PRIMARY_TABS.length - 1;
    }

    if (nextIndex !== null) {
      event.preventDefault();
      const targetTab = PRIMARY_TABS[nextIndex];
      onSelectTab(targetTab.key);
      tabRefs.current[nextIndex]?.focus();
    }
  };

  return (
    <header
      className="sticky top-0 z-20 border-b"
      style={{ backgroundColor: 'var(--bg-canvas)', borderColor: 'var(--border-subtle)' }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="flex flex-wrap lg:flex-nowrap items-center justify-between gap-x-4 gap-y-2 pt-3 pb-0 lg:py-2.5">
          <div className="order-1 flex items-center gap-2.5 min-w-0 shrink-0">
            <span style={{ color: 'var(--accent-primary)' }}>
              <ShieldMark className="w-7 h-7" />
            </span>
            <div className="min-w-0">
              <div className="font-editorial text-lg sm:text-xl font-semibold leading-none whitespace-nowrap">
                Smog Shield
              </div>
              <div className="text-xs mt-0.5 truncate max-w-[140px] sm:max-w-[220px]" style={{ color: 'var(--ink-muted)' }}>
                {city.name} | {city.region}
              </div>
            </div>
          </div>

          <div className="order-2 lg:order-3 flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              type="button"
              onClick={onOpenHousehold}
              className="min-h-[44px] sm:min-h-[48px] min-w-[44px] px-2.5 sm:px-3.5 py-2 rounded-[6px] text-xs sm:text-sm font-bold cursor-pointer whitespace-nowrap"
              style={{
                backgroundColor: 'var(--bg-surface)',
                border: 'var(--border-width-card) solid var(--border-subtle)',
              }}
            >
              Household
            </button>
            <button
              type="button"
              onClick={onOpenChecklist}
              aria-label={
                completedChecklistCount > 0
                  ? `Checklist, ${completedChecklistCount} completed`
                  : 'Checklist'
              }
              className="min-h-[44px] sm:min-h-[48px] min-w-[44px] px-2.5 sm:px-3.5 py-2 rounded-[6px] text-xs sm:text-sm font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
              style={{
                backgroundColor: 'var(--bg-surface)',
                border: 'var(--border-width-card) solid var(--border-subtle)',
              }}
            >
              <ChecklistIcon className="w-4 h-4 shrink-0" />
              <span className="hidden sm:inline">Checklist</span>
              {completedChecklistCount > 0 ? (
                <span
                  className="text-xs font-bold tabular-nums px-1.5 py-0.5 rounded-[4px]"
                  style={{
                    backgroundColor: 'var(--bg-selected)',
                    color: 'var(--accent-primary)',
                  }}
                >
                  {completedChecklistCount}
                </span>
              ) : null}
            </button>
            <button
              type="button"
              aria-label="Open settings"
              onClick={onOpenSettings}
              className="min-h-[44px] sm:min-h-[48px] min-w-[44px] sm:min-w-[48px] px-2.5 sm:px-3 py-2 rounded-[6px] text-xs sm:text-sm font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
              style={{
                backgroundColor: 'var(--bg-surface)',
                border: 'var(--border-width-card) solid var(--border-subtle)',
              }}
            >
              <SettingsIcon className="w-4 h-4 shrink-0" />
              <span className="hidden md:inline">Settings</span>
            </button>
          </div>

          <nav
            aria-label="Primary sections"
            className="order-3 lg:order-2 w-full lg:w-auto lg:flex-1 lg:flex lg:justify-center min-w-0 border-t lg:border-t-0 mt-1 lg:mt-0"
            style={{ borderColor: 'var(--border-subtle)' }}
          >
            <div
              role="tablist"
              aria-label="Smog Shield sections"
              className="flex flex-nowrap overflow-x-auto whitespace-nowrap gap-1 -mb-px lg:mb-0"
            >
              {PRIMARY_TABS.map((tab, index) => {
                const active = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    ref={(el) => {
                      tabRefs.current[index] = el;
                    }}
                    id={`tab-${tab.key}`}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    aria-controls={`panel-${tab.key}`}
                    tabIndex={active ? 0 : -1}
                    onClick={() => onSelectTab(tab.key)}
                    onKeyDown={(e) => handleTabKeyDown(e, index)}
                    className="min-h-[44px] sm:min-h-[48px] min-w-[44px] px-3.5 sm:px-4 text-sm sm:text-[15px] font-bold whitespace-nowrap shrink-0 cursor-pointer border-b-2"
                    style={{
                      borderBottomColor: active ? 'var(--accent-primary)' : 'transparent',
                      color: active ? 'var(--accent-primary)' : 'var(--ink-secondary)',
                    }}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
}
