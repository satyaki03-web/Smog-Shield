import { useState } from 'react';
import type { DirectImpactSummary } from '../types';

export interface ImpactTrackerBannerProps {
  impact: DirectImpactSummary;
  onOpenChecklist: () => void;
  onOpenSwaps: () => void;
}

/**
 * Scannable "Your Choices, Direct Impact" summary bar showing estimated personal PM2.5
 * exposure reduction, weekly CO2e avoided, and local PM2.5 smoke prevented.
 */
export function ImpactTrackerBanner({
  impact,
  onOpenChecklist,
  onOpenSwaps,
}: ImpactTrackerBannerProps) {
  const [showMethod, setShowMethod] = useState(false);

  return (
    <section
      aria-label="Your Choices, Direct Impact"
      className="surface-card p-4 sm:p-5 lg:p-6 mb-5 lg:mb-6 min-w-0"
    >
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 min-w-0">
        <div className="min-w-0">
          <p
            className="text-xs font-bold uppercase tracking-widest"
            style={{ color: 'var(--accent-primary)' }}
          >
            Your Choices, Direct Impact
          </p>
          <p className="text-sm sm:text-[15px] font-bold mt-1 leading-snug break-words">
            {impact.headline}
          </p>
        </div>

        <dl className="grid grid-cols-3 gap-2 sm:gap-3 lg:gap-4 shrink-0 w-full lg:w-auto">
          <div className="recessed-panel px-2.5 sm:px-3.5 py-2 min-w-0">
            <dt
              className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider truncate"
              style={{ color: 'var(--ink-muted)' }}
            >
              PM2.5 cut
            </dt>
            <dd
              className="text-lg sm:text-xl font-editorial font-semibold tabular-nums mt-0.5 whitespace-nowrap"
              style={{ color: 'var(--accent-primary)' }}
            >
              ~{impact.exposureReductionPercent}%
            </dd>
          </div>
          <div className="recessed-panel px-2.5 sm:px-3.5 py-2 min-w-0">
            <dt
              className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider truncate"
              style={{ color: 'var(--ink-muted)' }}
            >
              CO2e / wk
            </dt>
            <dd className="text-lg sm:text-xl font-editorial font-semibold tabular-nums mt-0.5 whitespace-nowrap">
              {impact.weeklyCo2eAvoidedKg} kg
            </dd>
          </div>
          <div className="recessed-panel px-2.5 sm:px-3.5 py-2 min-w-0">
            <dt
              className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider truncate"
              style={{ color: 'var(--ink-muted)' }}
            >
              Local PM2.5
            </dt>
            <dd
              className="text-lg sm:text-xl font-editorial font-semibold tabular-nums mt-0.5 whitespace-nowrap"
              style={{ color: 'var(--accent-clay)' }}
            >
              {impact.weeklyLocalPm25AvoidedGrams} g
            </dd>
          </div>
        </dl>
      </div>

      <div
        className="mt-3 pt-3 border-t flex flex-wrap items-center justify-between gap-2"
        style={{ borderColor: 'var(--border-subtle)' }}
      >
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onOpenSwaps}
            className="min-h-[44px] sm:min-h-[48px] px-3 py-2 rounded-[6px] text-xs font-bold uppercase tracking-wider cursor-pointer"
            style={{
              backgroundColor: 'var(--bg-recessed)',
              border: 'var(--border-width-card) solid var(--border-subtle)',
              color: 'var(--ink-primary)',
            }}
          >
            Log a swap
          </button>
          <button
            type="button"
            onClick={onOpenChecklist}
            className="min-h-[44px] sm:min-h-[48px] px-3 py-2 rounded-[6px] text-xs font-bold uppercase tracking-wider cursor-pointer"
            style={{
              backgroundColor: 'var(--bg-recessed)',
              border: 'var(--border-width-card) solid var(--border-subtle)',
              color: 'var(--ink-primary)',
            }}
          >
            Update checklist
          </button>
        </div>

        <button
          type="button"
          onClick={() => setShowMethod((v) => !v)}
          aria-expanded={showMethod}
          className="min-h-[44px] sm:min-h-[48px] px-2 py-2 text-xs font-bold uppercase tracking-wider underline underline-offset-4 cursor-pointer"
          style={{ color: 'var(--ink-muted)' }}
        >
          {showMethod ? 'Hide calculation' : 'How we calculated this'}
        </button>
      </div>

      {showMethod ? (
        <div
          className="mt-3 p-4 rounded-[6px] text-xs leading-relaxed"
          style={{
            backgroundColor: 'var(--bg-recessed)',
            border: 'var(--border-width-card) solid var(--border-subtle)',
            color: 'var(--ink-secondary)',
          }}
        >
          <p
            className="font-bold uppercase tracking-wider mb-2"
            style={{ color: 'var(--ink-primary)' }}
          >
            Active household and community factors
          </p>
          <ul className="list-disc pl-4 space-y-1">
            {impact.breakdown.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
          <p className="mt-3 pt-2 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
            {impact.methodology}
          </p>
        </div>
      ) : null}
    </section>
  );
}
