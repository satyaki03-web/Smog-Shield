import { useState } from 'react';
import type { Recommendation } from '../types';
import { CheckIcon } from './Icons';

export interface RecommendationCardProps {
  item: Recommendation;
  index: number;
  adopted?: boolean;
  onToggleAdopt?: (id: string) => void;
}

/**
 * Displays a prioritized Routine, Indoor Air, or Sustainable Swap card with equal-height
 * flex column alignment, bottom-aligned impact details, and evidence basis toggle.
 */
export function RecommendationCard({
  item,
  index,
  adopted = false,
  onToggleAdopt,
}: RecommendationCardProps) {
  const [showBasis, setShowBasis] = useState(false);

  return (
    <article
      className="surface-card p-4 sm:p-5 lg:p-6 h-full flex flex-col min-w-0"
      aria-label={`${index + 1}. ${item.title}`}
    >
      <div
        className="flex flex-col gap-2 pb-3 border-b min-w-0"
        style={{ borderColor: 'var(--border-subtle)' }}
      >
        <div className="flex items-center justify-between gap-2 min-w-0">
          <span
            className="text-xs font-bold uppercase tracking-widest tabular-nums shrink-0"
            style={{ color: 'var(--ink-muted)' }}
          >
            {String(index + 1).padStart(2, '0')}
          </span>
          <span
            className="text-xs font-bold uppercase tracking-wider text-right truncate"
            style={{ color: 'var(--accent-primary)' }}
          >
            {item.timingOrCost}
          </span>
        </div>
        <h2 className="text-lg sm:text-xl font-editorial font-medium leading-snug break-words">
          {item.title}
        </h2>
      </div>

      <p
        className="mt-3 text-sm sm:text-[15px] leading-relaxed break-words"
        style={{ color: 'var(--ink-primary)' }}
      >
        {item.action}
      </p>

      <div className="mt-auto pt-4 flex flex-col gap-3 min-w-0">
        <div
          className="grid grid-cols-1 gap-3 pt-3 border-t"
          style={{ borderColor: 'var(--border-subtle)' }}
        >
          <div className="min-w-0">
            <p
              className="text-xs font-bold uppercase tracking-widest"
              style={{ color: 'var(--accent-primary)' }}
            >
              Personal exposure impact
            </p>
            <p
              className="text-xs sm:text-sm mt-1 leading-snug break-words"
              style={{ color: 'var(--ink-secondary)' }}
            >
              {item.exposureImpact}
            </p>
          </div>
          <div className="min-w-0">
            <p
              className="text-xs font-bold uppercase tracking-widest"
              style={{ color: 'var(--accent-clay)' }}
            >
              City emissions impact
            </p>
            <p
              className="text-xs sm:text-sm mt-1 leading-snug break-words"
              style={{ color: 'var(--ink-secondary)' }}
            >
              {item.emissionsImpact}
            </p>
          </div>
        </div>

        <div
          className="pt-2 border-t flex flex-wrap items-center justify-between gap-2"
          style={{ borderColor: 'var(--border-subtle)' }}
        >
          <button
            type="button"
            onClick={() => setShowBasis((v) => !v)}
            aria-expanded={showBasis}
            className="min-h-[44px] sm:min-h-[48px] text-xs font-bold uppercase tracking-wider underline underline-offset-4 cursor-pointer py-2 px-1 inline-flex items-center"
            style={{ color: 'var(--ink-muted)' }}
          >
            {showBasis ? 'Hide basis' : 'How we estimated this'}
          </button>

          {onToggleAdopt ? (
            <button
              type="button"
              aria-pressed={adopted}
              onClick={() => onToggleAdopt(item.id)}
              className="min-h-[44px] sm:min-h-[48px] px-3.5 py-2 rounded-[6px] text-xs font-bold uppercase tracking-wider inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
              style={{
                backgroundColor: adopted ? 'var(--bg-selected)' : 'var(--bg-recessed)',
                border: adopted
                  ? '2px solid var(--border-strong)'
                  : 'var(--border-width-card) solid var(--border-subtle)',
                color: adopted ? 'var(--accent-primary)' : 'var(--ink-primary)',
              }}
            >
              {adopted ? <CheckIcon className="w-4 h-4 shrink-0" /> : null}
              <span>{adopted ? 'Swap adopted' : 'Mark swap adopted'}</span>
            </button>
          ) : null}
        </div>

        {showBasis ? (
          <p
            className="text-xs leading-relaxed p-3 rounded-[4px] break-words"
            style={{ backgroundColor: 'var(--bg-recessed)', color: 'var(--ink-secondary)' }}
          >
            {item.basis}
          </p>
        ) : null}
      </div>
    </article>
  );
}
