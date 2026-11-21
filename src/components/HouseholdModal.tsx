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
      className="flex items-center justify-between gap-4 py-3 border-b"
      style={{ borderColor: 'var(--border-subtle)' }}
    >
      <span className="font-bold text-[15px]">{label}</span>
      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label={`Decrease ${label}`}
          disabled={value <= min}
          onClick={() => onChange(Math.max(min, value - 1))}
          className={`w-12 h-12 rounded-[6px] font-bold text-lg ${
            value <= min ? 'cursor-not-allowed opacity-45' : 'cursor-pointer'
          }`}
          style={{
            backgroundColor: 'var(--bg-surface)',
            border: 'var(--border-width-card) solid var(--border-subtle)',
          }}
        >
          -
        </button>
        <span className="w-8 text-center font-bold text-lg tabular-nums">{value}</span>
        <button
          type="button"
          aria-label={`Increase ${label}`}
          disabled={value >= max}
          onClick={() => onChange(Math.min(max, value + 1))}
          className={`w-12 h-12 rounded-[6px] font-bold text-lg ${
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
      className="fixed inset-0 z-40 flex items-center justify-center p-4 overflow-y-auto"
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
        className="surface-card w-[calc(100vw-2rem)] sm:w-full max-w-[780px] max-h-[90dvh] overflow-y-auto overflow-x-hidden p-4 sm:p-6 min-w-0"
      >
        <div
          className="flex items-start justify-between gap-4 pb-4 border-b"
          style={{ borderColor: 'var(--border-subtle)' }}
        >
          <div>
            <p
              className="text-xs font-bold uppercase tracking-widest"
              style={{ color: 'var(--ink-muted)' }}
            >
              Household Profile
            </p>
            <h2 id="household-modal-title" className="text-2xl sm:text-3xl font-editorial font-medium mt-1">
              Tailor Smog Shield to your home
            </h2>
            <p className="text-sm mt-1" style={{ color: 'var(--ink-secondary)' }}>
              All settings stay locally in your browser. Nothing is sent to third-party trackers.
            </p>
          </div>
          <button
            type="button"
            aria-label="Close household profile"
            onClick={onClose}
            className="min-w-[48px] min-h-[48px] flex items-center justify-center rounded-[6px] cursor-pointer shrink-0"
            style={{ border: 'var(--border-width-card) solid var(--border-subtle)' }}
          >
            <CloseIcon />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {errorMsg ? (
            <div
              role="alert"
              className="mt-5 p-4 rounded-[6px] text-sm font-bold"
              style={{
                backgroundColor: 'var(--bg-recessed)',
                border: '2px solid var(--accent-clay)',
                color: 'var(--accent-clay)',
              }}
            >
              {errorMsg}
            </div>
          ) : null}

          <section className="mt-6">
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

          <section className="mt-6">
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

          <section className="mt-6">
            <h3 className="text-lg font-editorial font-medium mb-1">Health sensitivities (optional)</h3>
            <p className="text-sm mb-3" style={{ color: 'var(--ink-secondary)' }}>
              Select all that apply to your household.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

          <section className="mt-6">
            <h3 className="text-lg font-editorial font-medium mb-3">Primary daily commute</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

          <section className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
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
            </div>
            <div>
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
            </div>
          </section>

          <section className="mt-6">
            <h3 className="text-lg font-editorial font-medium mb-3">
              Do you already have a HEPA air purifier?
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

          <section className="mt-6">
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

          <section className="mt-6 recessed-panel p-5">
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

          <div
            className="mt-6 pt-4 border-t flex flex-wrap items-center justify-end gap-3"
            style={{ borderColor: 'var(--border-subtle)' }}
          >
            <button
              type="button"
              onClick={onClose}
              className="min-h-[48px] px-5 py-2.5 rounded-[6px] font-bold text-[15px] cursor-pointer"
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
              className="min-h-[48px] px-6 py-2.5 rounded-[6px] font-bold text-[15px] cursor-pointer"
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
