import type { Recommendation } from '../types';
import { RecommendationCard } from './RecommendationCard';

export interface IndoorAirTabProps {
  items: readonly Recommendation[];
}

/** Displays practical indoor air actions in an equal-height responsive 1/2/3-column grid. */
export function IndoorAirTab({ items }: IndoorAirTabProps) {
  return (
    <section className="w-full min-w-0" aria-labelledby="indoor-heading">
      <p
        className="text-xs font-bold uppercase tracking-widest"
        style={{ color: 'var(--ink-muted)' }}
      >
        Indoor Air Quality Actions
      </p>
      <h1 id="indoor-heading" className="text-2xl sm:text-3xl font-editorial font-medium mt-1">
        Keep indoor PM2.5 low on a budget
      </h1>
      <div className="mt-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 items-stretch">
        {items.map((item, index) => (
          <RecommendationCard key={item.id} item={item} index={index} />
        ))}
      </div>
    </section>
  );
}
