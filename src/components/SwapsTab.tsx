import type { Recommendation } from '../types';
import { RecommendationCard } from './RecommendationCard';

export interface SwapsTabProps {
  items: readonly Recommendation[];
  adoptedSwapIds: readonly string[];
  onToggleAdopt: (id: string) => void;
}

/** Displays sustainable swaps in an equal-height responsive 1/2/3-column grid. */
export function SwapsTab({ items, adoptedSwapIds, onToggleAdopt }: SwapsTabProps) {
  return (
    <section className="w-full min-w-0" aria-labelledby="swaps-heading">
      <p
        className="text-xs font-bold uppercase tracking-widest"
        style={{ color: 'var(--ink-muted)' }}
      >
        Sustainable Alternatives
      </p>
      <h1 id="swaps-heading" className="text-2xl sm:text-3xl font-editorial font-medium mt-1">
        Cut both exposure and city emissions
      </h1>
      <p className="text-sm mt-2 max-w-2xl" style={{ color: 'var(--ink-secondary)' }}>
        Mark the swaps your household commits to and see your estimated PM2.5 and CO2e savings
        update above.
      </p>
      <div className="mt-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 items-stretch">
        {items.map((item, index) => (
          <RecommendationCard
            key={item.id}
            item={item}
            index={index}
            adopted={adoptedSwapIds.includes(item.id)}
            onToggleAdopt={onToggleAdopt}
          />
        ))}
      </div>
    </section>
  );
}
