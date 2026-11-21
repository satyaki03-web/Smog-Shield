import { useRef } from 'react';
import { useFocusTrap } from '../hooks/useFocusTrap';
import type { BandInfo, ChecklistItem } from '../types';
import { CloseIcon, CopyIcon } from './Icons';
import { SelectableCard } from './SelectableCard';

export interface ChecklistModalProps {
  isOpen: boolean;
  cityName: string;
  bandInfo: BandInfo;
  checklist: readonly ChecklistItem[];
  checkedIds: readonly string[];
  onToggleItem: (id: string) => void;
  onCopyChecklist: () => void;
  onClose: () => void;
}

function ChecklistModalContent({
  cityName,
  bandInfo,
  checklist,
  checkedIds,
  onToggleItem,
  onCopyChecklist,
  onClose,
}: Omit<ChecklistModalProps, 'isOpen'>) {
  const dialogRef = useRef<HTMLDivElement | null>(null);
  useFocusTrap(dialogRef, true, onClose);

  const completedCount = checklist.filter((item) => checkedIds.includes(item.id)).length;

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
        aria-labelledby="checklist-modal-title"
        tabIndex={-1}
        className="surface-card w-[calc(100vw-2rem)] sm:w-full max-w-[620px] max-h-[90dvh] overflow-y-auto overflow-x-hidden p-4 sm:p-6 min-w-0"
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
              Community Action | {cityName} ({bandInfo.label})
            </p>
            <h2 id="checklist-modal-title" className="text-2xl font-editorial font-medium mt-1">
              RWA, School, and Home Checklist
            </h2>
          </div>
          <button
            type="button"
            aria-label="Close checklist"
            onClick={onClose}
            className="min-w-[48px] min-h-[48px] flex items-center justify-center rounded-[6px] cursor-pointer shrink-0"
            style={{ border: 'var(--border-width-card) solid var(--border-subtle)' }}
          >
            <CloseIcon />
          </button>
        </div>

        <div className="mt-4 flex flex-col gap-3">
          {checklist.map((item) => (
            <SelectableCard
              key={item.id}
              label={`${item.group}: ${item.text}`}
              selected={checkedIds.includes(item.id)}
              onSelect={() => onToggleItem(item.id)}
            />
          ))}
        </div>

        <div
          className="mt-6 flex flex-wrap items-center justify-between gap-3 pt-4 border-t"
          style={{ borderColor: 'var(--border-subtle)' }}
        >
          <span className="text-sm font-bold tabular-nums" style={{ color: 'var(--ink-secondary)' }}>
            {completedCount} of {checklist.length} completed
          </span>
          <button
            type="button"
            onClick={onCopyChecklist}
            className="min-h-[48px] px-4 py-2 rounded-[6px] text-sm font-bold inline-flex items-center gap-1.5 cursor-pointer"
            style={{
              backgroundColor: 'var(--accent-primary)',
              color: 'var(--accent-primary-ink)',
            }}
          >
            <CopyIcon className="w-4 h-4" />
            <span>Copy Checklist</span>
          </button>
        </div>
      </div>
    </div>
  );
}

/** Accessible Community Checklist modal dialog with focus trapping and Escape dismissal. */
export function ChecklistModal(props: ChecklistModalProps) {
  if (!props.isOpen) return null;
  return <ChecklistModalContent {...props} />;
}
