import React from 'react';
import type { BandInfo } from '../smogEngine';

interface IconProps {
  className?: string;
}

export function ShieldMark({ className = 'w-6 h-6' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 28 28" fill="none" aria-hidden="true">
      <path
        d="M14 2.5L23.5 6.2V13.4C23.5 19.6 19.4 24.4 14 26C8.6 24.4 4.5 19.6 4.5 13.4V6.2L14 2.5Z"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M9.2 14.5C10.9 12.8 13.1 12.8 14.8 14.5C16.5 16.2 18.7 16.2 20.4 14.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M10.4 18.4C11.7 17.2 13.3 17.2 14.6 18.4C15.9 19.6 17.5 19.6 18.8 18.4"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function BandShapeIcon({
  shape,
  className = 'w-5 h-5',
}: {
  shape: BandInfo['shape'];
  className?: string;
}) {
  switch (shape) {
    case 'circle':
      return (
        <svg className={className} viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="2.2" />
          <path d="M6.8 10.2L9 12.4L13.5 7.8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'roundedSquare':
      return (
        <svg className={className} viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <rect x="3.5" y="3.5" width="13" height="13" rx="3" stroke="currentColor" strokeWidth="2.2" />
          <path d="M6.8 10H13.2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case 'diamond':
      return (
        <svg className={className} viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <path d="M10 2.5L17.5 10L10 17.5L2.5 10L10 2.5Z" stroke="currentColor" strokeWidth="2.1" />
          <circle cx="10" cy="10" r="1.8" fill="currentColor" />
        </svg>
      );
    case 'triangle':
      return (
        <svg className={className} viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <path d="M10 3L17.5 16.5H2.5L10 3Z" stroke="currentColor" strokeWidth="2.1" strokeLinejoin="round" />
          <path d="M10 8.2V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <circle cx="10" cy="14.3" r="1.1" fill="currentColor" />
        </svg>
      );
    case 'octagon':
      return (
        <svg className={className} viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <path d="M6.8 2.5H13.2L17.5 6.8V13.2L13.2 17.5H6.8L2.5 13.2V6.8L6.8 2.5Z" stroke="currentColor" strokeWidth="2.1" />
          <path d="M10 6.5V11" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" />
          <circle cx="10" cy="13.8" r="1.2" fill="currentColor" />
        </svg>
      );
    case 'alertHex':
      return (
        <svg className={className} viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <path d="M10 2L17 6V14L10 18L3 14V6L10 2Z" fill="currentColor" fillOpacity="0.16" stroke="currentColor" strokeWidth="2.2" />
          <path d="M10 6.2V11.2" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
          <circle cx="10" cy="14.2" r="1.3" fill="currentColor" />
        </svg>
      );
  }
}

export function CheckIcon({ className = 'w-4 h-4' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M3.5 9.5L7.2 13.2L14.8 5.2" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function RefreshIcon({ className = 'w-4 h-4' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M16.5 10A6.5 6.5 0 1 1 14.4 5.2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M14.5 2.5V5.8H11.2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function CopyIcon({ className = 'w-4 h-4' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <rect x="7" y="7" width="9.5" height="9.5" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="M13 7V4.8A1.3 1.3 0 0 0 11.7 3.5H4.8A1.3 1.3 0 0 0 3.5 4.8V11.7A1.3 1.3 0 0 0 4.8 13H7" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

export function ChecklistIcon({ className = 'w-4 h-4' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M3.5 5.5L5.2 7.2L8.2 4.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10.5 6H16.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M3.5 10.5L5.2 12.2L8.2 9.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10.5 11H16.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M4 15.5H16.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function SettingsIcon({ className = 'w-4 h-4' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <circle cx="10" cy="10" r="3" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M10 2.5V4.5M10 15.5V17.5M2.5 10H4.5M15.5 10H17.5M4.7 4.7L6.1 6.1M13.9 13.9L15.3 15.3M15.3 4.7L13.9 6.1M6.1 13.9L4.7 15.3"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function CloseIcon({ className = 'w-5 h-5' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M5 5L15 15M15 5L5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
