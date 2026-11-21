import { useRef, useState, type FormEvent } from 'react';
import {
  BUDGET_OPTIONS,
  CITIES,
  COMMUTE_OPTIONS,
  FUEL_OPTIONS,
  HOME_OPTIONS,
  MAX_AQI,
  SENSITIVITY_OPTIONS,
} from '../constants';
import { useFocusTrap } from '../hooks/useFocusTrap';
import type { Sensitivity, UserProfile } from '../types';
import { CloseIcon } from './Icons';
import { SelectableCard } from './SelectableCard';

export interface HouseholdModalProps {
  isOpen: boolean;
  initialProfile: UserProfile;
  onSave: (profile: UserProfile) => void;
  onClose: () => void;
}

function CountStepper({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (next: number) => void;
}) {
  return (
    <div
      className="flex items-center justify-between gap-3 py-3 border-b last:border-b-0"
      style={{ borderColor: 'var(--border-subtle)' }}
    >
      <span className="font-bold text-sm sm:text-[15px] min-w-0">{label}</span>
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <button
          type="button"
          aria-label={`Decrease ${label}`}
          disabled={value <= min}
          onClick={() => onChange(Math.max(min, value - 1))}
          className={`w-11 h-11 sm:w-12 sm:h-12 rounded-[6px] font-bold text-lg ${
            value <= min ? 'cursor-not-allowed opacity-45' : 'cursor-pointer'
          }`}
          style={{
            backgroundColor: 'var(--bg-surface)',
            border: 'var(--border-width-card) solid var(--border-subtle)',
          }}
        >
          -
        </button>
        <span className="w-7 text-center font-bold text-base sm:text-lg tabular-nums">{value}</span>
        <button
          type="button"
          aria-label={`Increase ${label}`}
          disabled={value >= max}
          onClick={() => onChange(Math.min(max, value + 1))}
          className={`w-11 h-11 sm:w-12 sm:h-12 rounded-[6px] font-bold text-lg ${
            value >= max ? 'cursor-not-allowed opacity-45' : 'cursor-pointer'
          }`}
          style={{
            backgroundColor: 'var(--bg-surface)',
            border: 'var(--border-width-card) solid var(--border-subtle)',
          }}
        >
          +
        </button>
      </div>
    </div>
  );
}

function HouseholdModalContent({
  initialProfile,
  onSave,
  onClose,
}: Omit<HouseholdModalProps, 'isOpen'>) {
  const dialogRef = useRef<HTMLDivElement | null>(null);
  useFocusTrap(dialogRef, true, onClose);

  const [draft, setDraft] = useState<UserProfile>(initialProfile);
  const [manualText, setManualText] = useState<string>(
    initialProfile.manualAqi !== null ? String(initialProfile.manualAqi) : ''
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const toggleSensitivity = (value: Sensitivity) => {
    setDraft((prev) => ({
      ...prev,
      sensitivities: prev.sensitivities.includes(value)
        ? prev.sensitivities.filter((s) => s !== value)
        : [...prev.sensitivities, value],
    }));
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const trimmed = manualText.trim();
    let parsedManual: number | null = null;
    if (trimmed !== '') {
      const num = Number(trimmed);
      if (!Number.isInteger(num) || num < 0 || num > MAX_AQI) {
        setErrorMsg(
          'Manual AQI must be a whole number between 0 and 500, or left blank for live Open-Meteo data.'
        );
        return;
      }
      parsedManual = num;
    }
    if (draft.adults + draft.children + draft.elders < 1) {
      setErrorMsg('Add at least one household member so Smog Shield can tailor guidance.');
      return;
    }
    setErrorMsg(null);
    onSave({ ...draft, manualAqi: parsedManual });
  };

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
        aria-labelledby="household-modal-title"
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
              Household Profile
            </p>
            <h2
              id="household-modal-title"
              className="text-xl sm:text-2xl font-editorial font-medium mt-1 leading-snug"
            >
              Tailor Smog Shield to your home
            </h2>
            <p className="text-xs sm:text-sm mt-1" style={{ color: 'var(--ink-secondary)' }}>
              All settings stay locally in your browser. Nothing is sent to third-party trackers.
            </p>
          </div>
          <button
            type="button"
            aria-label="Close household profile"
            onClick={onClose}
            className="min-w-[44px] min-h-[44px] sm:min-w-[48px] sm:min-h-[48px] flex items-center justify-center rounded-[6px] cursor-pointer shrink-0"
            style={{ border: 'var(--border-width-card) solid var(--border-subtle)' }}
          >
            <CloseIcon />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="overflow-y-auto flex-1 px-4 sm:px-6 py-4 space-y-6 min-w-0">
            {errorMsg ? (
              <div
                role="alert"
                className="p-3.5 rounded-[6px] text-sm font-bold"
                style={{
                  backgroundColor: 'var(--bg-recessed)',
                  border: '2px solid var(--accent-clay)',
                  color: 'var(--accent-clay)',
                }}
              >
                {errorMsg}
              </div>
            ) : null}

            <section>
              <label
                htmlFor="city-select"
                className="block text-xs font-bold uppercase tracking-widest mb-2"
                style={{ color: 'var(--ink-muted)' }}
              >
                City
              </label>
              <select
                id="city-select"
                value={draft.cityId}
                onChange={(e) => setDraft({ ...draft, cityId: e.target.value })}
                className="w-full min-h-[48px] px-4 py-2.5 rounded-[6px] text-[16px] font-bold cursor-pointer"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  border: 'var(--border-width-card) solid var(--border-subtle)',
                  color: 'var(--ink-primary)',
                }}
              >
                {CITIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.region})
                  </option>
                ))}
              </select>
            </section>

            <section>
              <h3 className="text-lg font-editorial font-medium mb-2">Household members</h3>
              <div className="surface-card px-4">
                <CountStepper
                  label="Adults (18 to 59)"
                  value={draft.adults}
                  min={0}
                  max={12}
                  onChange={(adults) => setDraft({ ...draft, adults })}
                />
                <CountStepper
                  label="Children (under 18)"
                  value={draft.children}
                  min={0}
                  max={10}
                  onChange={(children) => setDraft({ ...draft, children })}
                />
                <CountStepper
                  label="Elders (60 and above)"
                  value={draft.elders}
                  min={0}
                  max={8}
                  onChange={(elders) => setDraft({ ...draft, elders })}
                />
              </div>
            </section>

            <section>
              <h3 className="text-lg font-editorial font-medium mb-1">
                Health sensitivities (optional)
              </h3>
              <p className="text-sm mb-3" style={{ color: 'var(--ink-secondary)' }}>
                Select all that apply to your household.
              </p>
              <div className="flex flex-col gap-2.5">
                {SENSITIVITY_OPTIONS.map((opt) => (
                  <SelectableCard
                    key={opt.value}
                    label={opt.label}
                    description={opt.desc}
                    selected={draft.sensitivities.includes(opt.value)}
                    onSelect={() => toggleSensitivity(opt.value)}
                  />
                ))}
              </div>
            </section>

            <section>
              <h3 className="text-lg font-editorial font-medium mb-3">Primary daily commute</h3>
              <div className="flex flex-col gap-2.5">
                {COMMUTE_OPTIONS.map((opt) => (
                  <SelectableCard
                    key={opt.value}
                    label={opt.label}
                    description={opt.desc}
                    selected={draft.commute === opt.value}
                    onSelect={() => setDraft({ ...draft, commute: opt.value })}
                  />
                ))}
              </div>
            </section>

            <section>
              <h3 className="text-lg font-editorial font-medium mb-3">Main cooking fuel</h3>
              <div className="flex flex-col gap-2.5">
                {FUEL_OPTIONS.map((opt) => (
                  <SelectableCard
                    key={opt.value}
                    label={opt.label}
                    selected={draft.cookingFuel === opt.value}
                    onSelect={() => setDraft({ ...draft, cookingFuel: opt.value })}
                  />
                ))}
              </div>
            </section>

            <section>
              <h3 className="text-lg font-editorial font-medium mb-3">Home type</h3>
              <div className="flex flex-col gap-2.5">
                {HOME_OPTIONS.map((opt) => (
                  <SelectableCard
                    key={opt.value}
                    label={opt.label}
                    selected={draft.homeType === opt.value}
                    onSelect={() => setDraft({ ...draft, homeType: opt.value })}
                  />
                ))}
              </div>
            </section>

            <section>
              <h3 className="text-lg font-editorial font-medium mb-3">
                Do you already have a HEPA air purifier?
              </h3>
              <div className="flex flex-col gap-2.5">
                <SelectableCard
                  label="Yes, we have one"
                  description="Shows placement, run schedule, and pre-filter care"
                  selected={draft.hasPurifier}
                  onSelect={() => setDraft({ ...draft, hasPurifier: true })}
                />
                <SelectableCard
                  label="No purifier yet"
                  description="Focuses on sealing gaps, damp mopping, and low-cost options"
                  selected={!draft.hasPurifier}
                  onSelect={() => setDraft({ ...draft, hasPurifier: false })}
                />
              </div>
            </section>

            <section>
              <h3 className="text-lg font-editorial font-medium mb-3">Budget preference</h3>
              <div className="flex flex-col gap-2.5">
                {BUDGET_OPTIONS.map((opt) => (
                  <SelectableCard
                    key={opt.value}
                    label={opt.label}
                    description={opt.desc}
                    selected={draft.budget === opt.value}
                    onSelect={() => setDraft({ ...draft, budget: opt.value })}
                  />
                ))}
              </div>
            </section>

            <section className="recessed-panel p-4">
              <label
                htmlFor="manual-aqi"
                className="block text-xs font-bold uppercase tracking-widest"
                style={{ color: 'var(--ink-muted)' }}
              >
                Optional Manual AQI Override (0 to 500)
              </label>
              <p className="text-sm mt-1 mb-3" style={{ color: 'var(--ink-secondary)' }}>
                Leave blank to fetch live air quality from Open-Meteo. Enter a reading from a local
                CPCB monitor or indoor sensor to override.
              </p>
              <input
                id="manual-aqi"
                type="text"
                inputMode="numeric"
                placeholder="Example: 360 (leave empty for live data)"
                value={manualText}
                onChange={(e) => setManualText(e.target.value)}
                className="w-full min-h-[48px] px-4 py-2 rounded-[6px] text-[15px] tabular-nums"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  border: 'var(--border-width-card) solid var(--border-subtle)',
                  color: 'var(--ink-primary)',
                }}
              />
            </section>
          </div>

          <div
            className="px-4 sm:px-6 py-3.5 border-t flex flex-wrap items-center justify-end gap-2.5 shrink-0"
            style={{ borderColor: 'var(--border-subtle)' }}
          >
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] sm:min-h-[48px] px-4 sm:px-5 py-2 rounded-[6px] font-bold text-sm sm:text-[15px] cursor-pointer"
              style={{
                backgroundColor: 'var(--bg-surface)',
                border: 'var(--border-width-card) solid var(--border-subtle)',
                color: 'var(--ink-primary)',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="min-h-[44px] sm:min-h-[48px] px-5 sm:px-6 py-2 rounded-[6px] font-bold text-sm sm:text-[15px] cursor-pointer"
              style={{
                backgroundColor: 'var(--accent-primary)',
                color: 'var(--accent-primary-ink)',
              }}
            >
              Save Household Profile
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/** Accessible modal dialog for editing the user's household profile with focus trapping. */
export function HouseholdModal({
  isOpen,
  initialProfile,
  onSave,
  onClose,
}: HouseholdModalProps) {
  if (!isOpen) return null;
  return (
    <HouseholdModalContent
      initialProfile={initialProfile}
      onSave={onSave}
      onClose={onClose}
    />
  );
}
