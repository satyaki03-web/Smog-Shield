import { CheckIcon } from './Icons';

interface SelectableCardProps {
  label: string;
  description?: string;
  selected: boolean;
  disabled?: boolean;
  onSelect: () => void;
}

export function SelectableCard({
  label,
  description,
  selected,
  disabled = false,
  onSelect,
}: SelectableCardProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      aria-pressed={selected}
      onClick={onSelect}
      className={`w-full min-h-[48px] text-left px-4 py-3 rounded-[6px] flex items-start justify-between gap-3 ${
        disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
      }`}
      style={{
        backgroundColor: selected ? 'var(--bg-selected)' : 'var(--bg-surface)',
        border: selected
          ? '2px solid var(--border-strong)'
          : 'var(--border-width-card) solid var(--border-subtle)',
        color: 'var(--ink-primary)',
      }}
    >
      <div className="min-w-0">
        <div className="font-bold text-[15px] leading-snug">{label}</div>
        {description ? (
          <div className="text-[13px] mt-0.5 leading-snug" style={{ color: 'var(--ink-secondary)' }}>
            {description}
          </div>
        ) : null}
      </div>
      {selected ? (
        <span
          className="inline-flex items-center gap-1 shrink-0 text-[12px] font-bold uppercase tracking-wider pt-0.5"
          style={{ color: 'var(--accent-primary)' }}
        >
          <CheckIcon className="w-4 h-4" />
          <span>Selected</span>
        </span>
      ) : null}
    </button>
  );
}
