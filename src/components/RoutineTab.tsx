import type { AirReading, BandInfo, Recommendation } from '../types';
import { RecommendationCard } from './RecommendationCard';

export interface RoutineTabProps {
  reading: AirReading;
  bandInfo: BandInfo;
  items: readonly Recommendation[];
}

/** Displays prioritized daily routine actions in an equal-height responsive 1/2/3-column grid. */
export function RoutineTab({ reading, bandInfo, items }: RoutineTabProps) {
  return (
    <section className="w-full min-w-0" aria-labelledby="routine-heading">
      <p
        className="text-xs font-bold uppercase tracking-widest"
        style={{ color: 'var(--ink-muted)' }}
      >
        Ranked for {reading.city.name} at AQI {reading.aqi} ({bandInfo.label})
      </p>
      <h1 id="routine-heading" className="text-2xl sm:text-3xl font-editorial font-medium mt-1">
        Low-emission daily routine
      </h1>
      <div className="mt-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 items-stretch">
        {items.map((item, index) => (
          <RecommendationCard key={item.id} item={item} index={index} />
        ))}
      </div>
    </section>
  );
}
