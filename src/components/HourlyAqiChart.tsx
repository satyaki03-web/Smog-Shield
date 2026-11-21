import { useMemo, useState } from 'react';
import { getBandInfo } from '../domain/aqi';
import type { HourlyPoint } from '../types';

export interface HourlyAqiChartProps {
  cityName: string;
  hourly: readonly HourlyPoint[];
}

/**
 * Accessible 24-hour AQI forecast chart with fluid mobile scaling, keyboard-focusable
 * hourly bars with interactive readout, responsive hour ticks, and an sr-only data table.
 */
export function HourlyAqiChart({ cityName, hourly }: HourlyAqiChartProps) {
  const points = useMemo(() => hourly.slice(0, 24), [hourly]);
  const [focusedIdx, setFocusedIdx] = useState<number | null>(null);

  const { minAqi, maxAqi } = useMemo(() => {
    if (points.length === 0) return { minAqi: 0, maxAqi: 100 };
    let min = points[0].aqi;
    let max = points[0].aqi;
    for (const pt of points) {
      if (pt.aqi < min) min = pt.aqi;
      if (pt.aqi > max) max = pt.aqi;
    }
    return { minAqi: min, maxAqi: Math.max(100, max) };
  }, [points]);

  const activePoint =
    focusedIdx !== null && focusedIdx >= 0 && focusedIdx < points.length
      ? points[focusedIdx]
      : null;
  const activeBand = activePoint ? getBandInfo(activePoint.aqi) : null;

  const formatCompactTick = (label: string | undefined, fallback: string): string => {
    if (!label) return fallback;
    return label.replace(':00 ', '');
  };

  return (
    <div className="mt-5 pt-4 border-t w-full min-w-0" style={{ borderColor: 'var(--border-subtle)' }}>
      <div className="flex flex-wrap items-baseline justify-between gap-2 mb-2.5">
        <span
          className="text-xs font-bold uppercase tracking-widest"
          style={{ color: 'var(--ink-muted)' }}
        >
          Next 24 Hours (Hourly AQI)
        </span>
        <span className="text-xs tabular-nums" style={{ color: 'var(--ink-muted)' }}>
          {activePoint && activeBand
            ? `${activePoint.hourLabel}: AQI ${activePoint.aqi} (${activeBand.label})`
            : `Range ${minAqi} to ${maxAqi}`}
        </span>
      </div>

      <div
        role="img"
        aria-label={`24-hour AQI forecast for ${cityName} ranging from ${minAqi} to ${maxAqi} AQI`}
        className="sr-only"
      />

      <div
        role="group"
        aria-label={`Interactive 24-hour AQI bars for ${cityName}`}
        className="flex items-end gap-[2px] sm:gap-1 h-24 sm:h-28 pt-2 w-full min-w-0"
      >
        {points.map((pt, idx) => {
          const pct = Math.max(14, Math.round((pt.aqi / maxAqi) * 100));
          const ptBand = getBandInfo(pt.aqi);
          const isSelected = focusedIdx === idx;
          return (
            <button
              key={`${pt.timeIso}-${idx}`}
              type="button"
              onClick={() => setFocusedIdx(idx)}
              onFocus={() => setFocusedIdx(idx)}
              aria-label={`${pt.hourLabel}: AQI ${pt.aqi}, ${ptBand.label}, PM2.5 ${pt.pm25} micrograms per cubic meter`}
              title={`${pt.hourLabel}: AQI ${pt.aqi} (${ptBand.label})`}
              className="flex-1 min-w-0 flex flex-col justify-end h-full p-0 bg-transparent border-0 cursor-pointer"
            >
              <span
                className="block w-full rounded-t-[2px]"
                style={{
                  height: `${pct}%`,
                  backgroundColor: ptBand.cssVar,
                  opacity: isSelected ? 1 : 0.86,
                  outline: isSelected ? '2px solid var(--border-strong)' : 'none',
                  outlineOffset: '1px',
                }}
              />
            </button>
          );
        })}
      </div>

      <div
        className="flex justify-between items-center text-[11px] mt-1.5 tabular-nums gap-1 w-full min-w-0"
        style={{ color: 'var(--ink-muted)' }}
      >
        <span className="truncate">{formatCompactTick(points[0]?.hourLabel, 'Now')}</span>
        <span className="hidden sm:inline truncate">{formatCompactTick(points[4]?.hourLabel, '+4h')}</span>
        <span className="truncate">{formatCompactTick(points[8]?.hourLabel, '+8h')}</span>
        <span className="hidden sm:inline truncate">{formatCompactTick(points[12]?.hourLabel, '+12h')}</span>
        <span className="truncate">{formatCompactTick(points[16]?.hourLabel, '+16h')}</span>
        <span className="hidden sm:inline truncate">{formatCompactTick(points[20]?.hourLabel, '+20h')}</span>
        <span className="truncate">{formatCompactTick(points[points.length - 1]?.hourLabel, '+24h')}</span>
      </div>

      <table className="sr-only">
        <caption>Hourly air quality forecast for {cityName}</caption>
        <thead>
          <tr>
            <th scope="col">Time</th>
            <th scope="col">AQI</th>
            <th scope="col">Band</th>
            <th scope="col">PM2.5 (ug/m3)</th>
            <th scope="col">PM10 (ug/m3)</th>
          </tr>
        </thead>
        <tbody>
          {points.map((pt, idx) => (
            <tr key={`row-${pt.timeIso}-${idx}`}>
              <th scope="row">{pt.hourLabel}</th>
              <td>{pt.aqi}</td>
              <td>{getBandInfo(pt.aqi).label}</td>
              <td>{pt.pm25}</td>
              <td>{pt.pm10}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
