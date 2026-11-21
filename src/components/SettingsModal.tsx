import { useRef, useState } from 'react';
import { useFocusTrap } from '../hooks/useFocusTrap';
import type { ThemeMode } from '../types';
import { CloseIcon } from './Icons';
import { SelectableCard } from './SelectableCard';

export interface SettingsModalProps {
  isOpen: boolean;
  theme: ThemeMode;
  onThemeChange: (mode: ThemeMode) => void;
  onEditHousehold: () => void;
  onClearAllData: () => void;
  onClose: () => void;
}

function SettingsModalContent({
  theme,
  onThemeChange,
  onEditHousehold,
  onClearAllData,
  onClose,
}: Omit<SettingsModalProps, 'isOpen'>) {
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  useFocusTrap(dialogRef, true, onClose);

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(15, 22, 19, 0.65)' }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-modal-title"
        tabIndex={-1}
        className="surface-card w-[calc(100%-2rem)] max-w-lg max-h-[90dvh] flex flex-col overflow-hidden min-w-0"
      >
        <div
          className="flex items-start justify-between gap-3 px-4 sm:px-6 pt-4 sm:pt-5 pb-4 border-b shrink-0"
          style={{ borderColor: 'var(--border-subtle)' }}
        >
          <div className="min-w-0">
            <p
              className="text-xs font-bold uppercase tracking-widest"
              style={{ color: 'var(--ink-muted)' }}
            >
              Preferences
            </p>
            <h2
              id="settings-modal-title"
              className="text-xl sm:text-2xl font-editorial font-medium mt-1 leading-snug"
            >
              Smog Shield Settings
            </h2>
          </div>
          <button
            type="button"
            aria-label="Close settings"
            onClick={onClose}
            className="min-w-[44px] min-h-[44px] sm:min-w-[48px] sm:min-h-[48px] flex items-center justify-center rounded-[6px] cursor-pointer shrink-0"
            style={{ border: 'var(--border-width-card) solid var(--border-subtle)' }}
          >
            <CloseIcon />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-4 sm:px-6 py-4 space-y-6 min-w-0">
          <div>
            <h3 className="text-lg font-editorial font-medium mb-3">Display theme</h3>
            <div className="flex flex-col gap-2.5">
              <SelectableCard
                label="Warm Paper (Light)"
                description="Calm daylight palette designed for extended reading"
                selected={theme === 'light'}
                onSelect={() => onThemeChange('light')}
              />
              <SelectableCard
                label="Night Slate (Dark)"
                description="Low-glare dark surfaces for evening air checks"
                selected={theme === 'dark'}
                onSelect={() => onThemeChange('dark')}
              />
              <SelectableCard
                label="High Contrast"
                description="WCAG AAA contrast (>= 7:1) and crisp 2px borders for low-vision clarity"
                selected={theme === 'high-contrast'}
                onSelect={() => onThemeChange('high-contrast')}
              />
            </div>
          </div>

          <div className="pt-5 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
            <h3 className="text-lg font-editorial font-medium mb-2">Data sources and privacy</h3>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--ink-secondary)' }}>
              Live hourly AQI, PM2.5, and PM10 readings are fetched from the keyless Open-Meteo Air
              Quality API and mapped to CPCB India AQI bands. Your household profile, adopted swaps,
              and checklist stay locally on your device.
            </p>
          </div>
        </div>

        <div
          className="px-4 sm:px-6 py-3.5 border-t flex flex-wrap items-center justify-between gap-2.5 shrink-0"
          style={{ borderColor: 'var(--border-subtle)' }}
        >
          <button
            type="button"
            onClick={() => {
              onClose();
              onEditHousehold();
            }}
            className="min-h-[44px] sm:min-h-[48px] px-4 py-2 rounded-[6px] text-sm font-bold cursor-pointer"
            style={{
              backgroundColor: 'var(--bg-recessed)',
              border: 'var(--border-width-card) solid var(--border-subtle)',
            }}
          >
            Edit Household Profile
          </button>

          {!confirmClear ? (
            <button
              type="button"
              onClick={() => setConfirmClear(true)}
              className="min-h-[44px] sm:min-h-[48px] px-4 py-2 rounded-[6px] text-sm font-bold cursor-pointer"
              style={{
                border: 'var(--border-width-card) solid var(--accent-clay)',
                color: 'var(--accent-clay)',
              }}
            >
              Clear My Data
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setConfirmClear(false)}
                className="min-h-[44px] sm:min-h-[48px] px-3.5 py-2 rounded-[6px] text-sm font-bold cursor-pointer"
                style={{ border: 'var(--border-width-card) solid var(--border-subtle)' }}
              >
                Keep
              </button>
              <button
                type="button"
                onClick={() => {
                  onClearAllData();
                  setConfirmClear(false);
                  onClose();
                }}
                className="min-h-[44px] sm:min-h-[48px] px-4 py-2 rounded-[6px] text-sm font-bold cursor-pointer"
                style={{
                  backgroundColor: 'var(--accent-clay)',
                  color: '#FFFFFF',
                }}
              >
                Confirm Reset
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/** Accessible Settings modal dialog with theme switching and two-step data reset. */
export function SettingsModal(props: SettingsModalProps) {
  if (!props.isOpen) return null;
  return <SettingsModalContent {...props} />;
}
