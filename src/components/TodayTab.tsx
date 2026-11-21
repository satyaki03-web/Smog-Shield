import type {
  AirReading,
  BandInfo,
  RecommendationBundle,
  TabKey,
  TimeWindow,
} from '../types';
import { HourlyAqiChart } from './HourlyAqiChart';
import { BandShapeIcon, CopyIcon, RefreshIcon } from './Icons';

export interface TodayTabProps {
  reading: AirReading;
  bandInfo: BandInfo;
  loading: boolean;
  windows: { cleanest: TimeWindow | null; worst: TimeWindow | null };
  atRisk: string[];
  multiplier: number;
  recs: RecommendationBundle;
  ruleEngineSummary: string;
  geminiSummary: string | null;
  geminiModel: string | null;
  personalizing: boolean;
  personalizeError: string | null;
  onRefresh: () => void;
  onPersonalize: () => void;
  onCopyPlan: () => void;
  onSelectTab: (tab: TabKey) => void;
}

/**
 * Main Today dashboard arranged in a symmetrical equal-height CSS Grid:
 * - Mobile (< 640px): single-column vertical stack
 * - Tablet (640px-1023px): AQI + chart + briefing full-width, Timing/Risk and Top 3 Actions side-by-side
 * - Desktop (1024px+): balanced 3-column 12-grid (4 / 4 / 4) with flush top and bottom edges
 */
export function TodayTab({
  reading,
  bandInfo,
  loading,
  windows,
  atRisk,
  multiplier,
  recs,
  ruleEngineSummary,
  geminiSummary,
  geminiModel,
  personalizing,
  personalizeError,
  onRefresh,
  onPersonalize,
  onCopyPlan,
  onSelectTab,
}: TodayTabProps) {
  const fetchedTimeLabel = new Date(reading.fetchedAtIso).toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  });

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-12 lg:gap-6 items-stretch">
      {/* Left column (lg: 4 cols, sm: full width): Live AQI + Hourly Profile + Daily Briefing */}
      <div className="sm:col-span-2 lg:col-span-4 min-w-0 flex">
        <section
          className="surface-card p-4 sm:p-5 lg:p-6 w-full h-full flex flex-col min-w-0"
          aria-labelledby="today-aqi-heading"
        >
          <div
            className="flex flex-wrap items-center justify-between gap-2 pb-3.5 border-b"
            style={{ borderColor: 'var(--border-subtle)' }}
          >
            <div className="min-w-0">
              <h1 id="today-aqi-heading" className="sr-only">
                {reading.city.name} Air Quality Today
              </h1>
              <p
                className="text-xs font-bold uppercase tracking-widest leading-snug"
                style={{ color: 'var(--ink-muted)' }}
              >
                {reading.source === 'live'
                  ? `Live Open-Meteo | ${fetchedTimeLabel}`
                  : reading.source === 'manual'
                    ? `Manual AQI | ${fetchedTimeLabel}`
                    : `Offline Baseline | ${fetchedTimeLabel}`}
              </p>
            </div>
            <button
              type="button"
              disabled={loading}
              onClick={onRefresh}
              className={`min-h-[44px] sm:min-h-[48px] px-3 py-2 rounded-[6px] text-xs font-bold uppercase tracking-wider inline-flex items-center gap-1.5 shrink-0 ${
                loading ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
              }`}
              style={{
                backgroundColor: 'var(--bg-recessed)',
                border: 'var(--border-width-card) solid var(--border-subtle)',
              }}
            >
              <RefreshIcon className="w-3.5 h-3.5" />
              <span>{loading ? 'Updating...' : 'Refresh'}</span>
            </button>
          </div>

          <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
            <div className="min-w-0">
              <div
                className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wider"
                style={{ color: bandInfo.cssVar }}
              >
                <BandShapeIcon shape={bandInfo.shape} className="w-5 h-5 shrink-0" />
                <span>
                  {bandInfo.label} ({bandInfo.rangeLabel})
                </span>
              </div>
              <div
                className="mt-2 flex items-baseline gap-2.5"
                aria-label={`Air quality index ${reading.aqi}, ${bandInfo.label}`}
              >
                <span
                  className="font-editorial text-5xl sm:text-6xl font-medium leading-none tabular-nums"
                  style={{ color: bandInfo.cssVar }}
                >
                  {reading.aqi}
                </span>
                <span
                  className="text-xs font-bold uppercase tracking-wider"
                  style={{ color: 'var(--ink-muted)' }}
                >
                  AQI
                </span>
              </div>
            </div>

            <dl className="grid grid-cols-2 gap-4 shrink-0">
              <div>
                <dt
                  className="text-xs font-bold uppercase tracking-widest"
                  style={{ color: 'var(--ink-muted)' }}
                >
                  PM2.5
                </dt>
                <dd className="text-xl font-bold tabular-nums mt-0.5 whitespace-nowrap">
                  {reading.pm25} <span className="text-xs font-normal">ug/m3</span>
                </dd>
              </div>
              <div>
                <dt
                  className="text-xs font-bold uppercase tracking-widest"
                  style={{ color: 'var(--ink-muted)' }}
                >
                  PM10
                </dt>
                <dd className="text-xl font-bold tabular-nums mt-0.5 whitespace-nowrap">
                  {reading.pm10} <span className="text-xs font-normal">ug/m3</span>
                </dd>
              </div>
            </dl>
          </div>

          <p className="mt-3.5 text-sm leading-relaxed" style={{ color: 'var(--ink-secondary)' }}>
            {bandInfo.summary}
          </p>

          <HourlyAqiChart cityName={reading.city.name} hourly={reading.hourly} />

          <div
            className="mt-auto pt-5 border-t flex flex-col gap-3 min-w-0"
            style={{ borderColor: 'var(--border-subtle)' }}
          >
            <h2
              id="daily-briefing-heading"
              className="text-xs font-bold uppercase tracking-widest"
              style={{ color: 'var(--ink-muted)', fontFamily: 'inherit' }}
            >
              {geminiSummary
                ? `Gemini Personalized Briefing (${geminiModel ?? 'gemini-3.5-flash-lite'})`
                : 'Rule-Engine Summary'}
            </h2>
            {personalizeError ? (
              <div
                role="alert"
                className="p-3 rounded-[6px] text-xs font-bold"
                style={{
                  backgroundColor: 'var(--bg-recessed)',
                  border: 'var(--border-width-card) solid var(--accent-clay)',
                  color: 'var(--accent-clay)',
                }}
              >
                {personalizeError}
              </div>
            ) : null}
            <p className="font-editorial text-[17px] sm:text-lg leading-relaxed break-words">
              {geminiSummary ?? ruleEngineSummary}
            </p>
            <div className="pt-1 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={personalizing}
                onClick={onPersonalize}
                className={`min-h-[44px] sm:min-h-[48px] flex-1 px-3 py-2 rounded-[6px] text-xs font-bold uppercase tracking-wider whitespace-nowrap ${
                  personalizing ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
                }`}
                style={{
                  backgroundColor: geminiSummary ? 'var(--bg-selected)' : 'var(--bg-recessed)',
                  border: geminiSummary
                    ? '2px solid var(--border-strong)'
                    : 'var(--border-width-card) solid var(--border-subtle)',
                  color: 'var(--ink-primary)',
                }}
              >
                {personalizing
                  ? 'Personalizing...'
                  : geminiSummary
                    ? 'Standard summary'
                    : 'Personalize wording'}
              </button>
              <button
                type="button"
                onClick={onCopyPlan}
                className="min-h-[44px] sm:min-h-[48px] px-3.5 py-2 rounded-[6px] text-xs font-bold uppercase tracking-wider inline-flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
                style={{
                  backgroundColor: 'var(--accent-primary)',
                  color: 'var(--accent-primary-ink)',
                }}
              >
                <CopyIcon className="w-3.5 h-3.5 shrink-0" />
                <span>Copy Plan</span>
              </button>
            </div>
          </div>
        </section>
      </div>

      {/* Middle column (lg: 4 cols, sm: 1 col): Timing Windows + Who Is Most Affected */}
      <div className="lg:col-span-4 min-w-0 flex flex-col gap-4 sm:gap-5 lg:gap-6">
        <section
          className="surface-card p-4 sm:p-5 lg:p-6 flex flex-col min-w-0"
          aria-labelledby="timing-windows-heading"
        >
          <h2
            id="timing-windows-heading"
            className="text-xl font-editorial font-medium pb-3 border-b"
            style={{ borderColor: 'var(--border-subtle)' }}
          >
            Timing windows today
          </h2>
          <div className="mt-4 flex flex-col gap-3.5">
            <div className="recessed-panel p-3.5 sm:p-4">
              <p
                className="text-xs font-bold uppercase tracking-widest"
                style={{ color: 'var(--accent-primary)' }}
              >
                Cleanest 2-hour window
              </p>
              <p className="text-lg font-bold mt-1 tabular-nums">
                {windows.cleanest
                  ? `${windows.cleanest.startLabel} to ${windows.cleanest.endLabel}`
                  : '1:00 PM to 3:00 PM'}
              </p>
              <p className="text-sm mt-1 leading-snug" style={{ color: 'var(--ink-secondary)' }}>
                Avg AQI{' '}
                <strong className="tabular-nums">
                  {windows.cleanest?.averageAqi ?? reading.aqi}
                </strong>
                . Best {windows.cleanest?.timeOfDay ?? 'midday'} window for brief cross-ventilation
                and essential errands.
              </p>
            </div>

            <div className="recessed-panel p-3.5 sm:p-4">
              <p
                className="text-xs font-bold uppercase tracking-widest"
                style={{ color: 'var(--accent-clay)' }}
              >
                Peak smog window to avoid
              </p>
              <p className="text-lg font-bold mt-1 tabular-nums">
                {windows.worst
                  ? `${windows.worst.startLabel} to ${windows.worst.endLabel}`
                  : '6:00 AM to 8:00 AM'}
              </p>
              <p className="text-sm mt-1 leading-snug" style={{ color: 'var(--ink-secondary)' }}>
                Avg AQI{' '}
                <strong className="tabular-nums">
                  {windows.worst?.averageAqi ?? reading.aqi}
                </strong>
                . Keep windows sealed and move {windows.worst?.timeOfDay ?? 'peak'} exercise
                indoors.
              </p>
            </div>
          </div>
        </section>

        <section
          className="surface-card p-4 sm:p-5 lg:p-6 flex-1 flex flex-col min-w-0"
          aria-labelledby="household-risk-heading"
        >
          <div
            className="flex flex-wrap items-baseline justify-between gap-2 pb-3 border-b"
            style={{ borderColor: 'var(--border-subtle)' }}
          >
            <h2 id="household-risk-heading" className="text-xl font-editorial font-medium">
              Who is most affected
            </h2>
            <span
              className="text-xs font-bold uppercase tracking-wider tabular-nums"
              style={{ color: 'var(--accent-clay)' }}
            >
              {multiplier}x sensitivity
            </span>
          </div>
          <ul className="mt-3.5 space-y-2 text-sm" style={{ color: 'var(--ink-secondary)' }}>
            {atRisk.map((line) => (
              <li key={line} className="leading-snug">
                {line}
              </li>
            ))}
          </ul>
          <p
            className="mt-auto pt-4 border-t text-sm font-bold leading-snug"
            style={{ borderColor: 'var(--border-subtle)' }}
          >
            Mask rule:{' '}
            <span className="font-normal" style={{ color: 'var(--ink-secondary)' }}>
              {bandInfo.maskGuidance}
            </span>
          </p>
        </section>
      </div>

      {/* Right column (lg: 4 cols, sm: 1 col): Top 3 Actions Right Now */}
      <div className="lg:col-span-4 min-w-0 flex">
        <section
          className="surface-card p-4 sm:p-5 lg:p-6 w-full h-full flex flex-col justify-between min-w-0"
          aria-labelledby="top-actions-heading"
        >
          <div>
            <h2
              id="top-actions-heading"
              className="text-xl font-editorial font-medium pb-3 border-b"
              style={{ borderColor: 'var(--border-subtle)' }}
            >
              Top 3 actions right now
            </h2>
            <ol className="mt-3 divide-y" style={{ borderColor: 'var(--border-subtle)' }}>
              {[recs.routine[0], recs.indoor[0], recs.swaps[0]].map((rec, i) => (
                <li key={rec.id} className="py-3 first:pt-1.5 last:pb-1">
                  <button
                    type="button"
                    onClick={() =>
                      onSelectTab(
                        rec.category === 'routine'
                          ? 'routine'
                          : rec.category === 'indoor'
                            ? 'indoor'
                            : 'swaps'
                      )
                    }
                    className="w-full min-h-[48px] py-1.5 text-left cursor-pointer"
                  >
                    <div
                      className="text-xs font-bold uppercase tracking-widest"
                      style={{ color: 'var(--accent-primary)' }}
                    >
                      0{i + 1} |{' '}
                      {rec.category === 'indoor'
                        ? 'Indoor Air'
                        : rec.category === 'routine'
                          ? 'Daily Routine'
                          : 'Low-Emission Swap'}
                    </div>
                    <div className="font-bold text-[15px] mt-1 leading-snug">{rec.title}</div>
                    <div
                      className="text-xs mt-1.5 leading-relaxed"
                      style={{ color: 'var(--ink-secondary)' }}
                    >
                      {rec.exposureImpact}
                    </div>
                  </button>
                </li>
              ))}
            </ol>
          </div>

          <div
            className="mt-auto pt-4 border-t flex flex-wrap gap-2"
            style={{ borderColor: 'var(--border-subtle)' }}
          >
            <button
              type="button"
              onClick={() => onSelectTab('routine')}
              className="min-h-[44px] sm:min-h-[48px] flex-1 px-3 py-2 rounded-[6px] text-xs font-bold uppercase tracking-wider cursor-pointer whitespace-nowrap"
              style={{
                backgroundColor: 'var(--bg-recessed)',
                border: 'var(--border-width-card) solid var(--border-subtle)',
                color: 'var(--ink-primary)',
              }}
            >
              Full Routine
            </button>
            <button
              type="button"
              onClick={() => onSelectTab('ask')}
              className="min-h-[44px] sm:min-h-[48px] flex-1 px-3 py-2 rounded-[6px] text-xs font-bold uppercase tracking-wider cursor-pointer whitespace-nowrap"
              style={{
                backgroundColor: 'var(--bg-recessed)',
                border: 'var(--border-width-card) solid var(--border-subtle)',
                color: 'var(--ink-primary)',
              }}
            >
              Ask a Question
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
