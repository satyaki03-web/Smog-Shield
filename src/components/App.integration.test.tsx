import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axe from 'axe-core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../App';
import { clearAirCache } from '../services/airQualityService';

const MOCK_OPEN_METEO_RESPONSE = {
  current: { pm2_5: 172, pm10: 284, european_aqi: 338 },
  hourly: {
    time: Array.from({ length: 24 }, (_, idx) => {
      const hour = String(idx).padStart(2, '0');
      return `2026-11-20T${hour}:00`;
    }),
    pm2_5: Array.from({ length: 24 }, (_, idx) => (idx >= 13 && idx <= 15 ? 85 : 175)),
    pm10: Array.from({ length: 24 }, (_, idx) => (idx >= 13 && idx <= 15 ? 140 : 280)),
    european_aqi: Array.from({ length: 24 }, (_, idx) => (idx >= 13 && idx <= 15 ? 180 : 345)),
  },
};

function stubFetch(askHandler?: (init?: RequestInit) => Promise<Response>) {
  return vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
    if (url.includes('air-quality-api.open-meteo.com')) {
      return new Response(JSON.stringify(MOCK_OPEN_METEO_RESPONSE), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    if (url.includes('/api/gemini/ask') && askHandler) {
      return askHandler(init);
    }
    return new Response(
      JSON.stringify({
        text: 'Tailored Advice: Keep N95 masks ready.\nDirect Impact: Filters up to 95% of fine PM2.5.\nQuick Next Step: Seal window gaps tonight.',
        model: 'gemini-3.5-flash-lite',
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  });
}

async function expectZeroAxeViolations(container: HTMLElement) {
  const results = await axe.run(container, {
    rules: {
      // jsdom does not compute visual CSS paint colors
      'color-contrast': { enabled: false },
    },
  });
  expect(results.violations).toEqual([]);
}

describe('Smog Shield React integration & WCAG accessibility', () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
    clearAirCache();
    document.documentElement.removeAttribute('data-theme');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('supports full WAI-ARIA tablist keyboard navigation (ArrowRight, ArrowLeft, Home, End)', async () => {
    stubFetch();
    const user = userEvent.setup();
    const { container } = render(<App />);

    const todayTab = await screen.findByRole('tab', { name: 'Today' });
    const routineTab = screen.getByRole('tab', { name: 'Routine' });
    const askTab = screen.getByRole('tab', { name: 'Ask' });

    expect(todayTab).toHaveAttribute('aria-selected', 'true');
    todayTab.focus();

    await user.keyboard('{ArrowRight}');
    expect(routineTab).toHaveAttribute('aria-selected', 'true');
    expect(routineTab).toHaveFocus();
    expect(screen.getByRole('heading', { name: 'Low-emission daily routine' })).toBeInTheDocument();

    await user.keyboard('{End}');
    expect(askTab).toHaveAttribute('aria-selected', 'true');
    expect(askTab).toHaveFocus();
    expect(screen.getByRole('heading', { name: 'Ask Smog Shield' })).toBeInTheDocument();

    await user.keyboard('{Home}');
    expect(todayTab).toHaveAttribute('aria-selected', 'true');
    expect(todayTab).toHaveFocus();

    await expectZeroAxeViolations(container);
  });

  it('traps focus in Household modal, dismisses on Escape, and restores focus to trigger', async () => {
    stubFetch();
    const user = userEvent.setup();
    const { container } = render(<App />);

    const householdBtn = await screen.findByRole('button', { name: 'Household' });
    await user.click(householdBtn);

    const dialog = screen.getByRole('dialog', { name: /Tailor Smog Shield to your home/i });
    expect(dialog).toBeInTheDocument();
    expect(dialog.contains(document.activeElement)).toBe(true);

    // Tabbing cycles inside the modal dialog
    await user.tab();
    expect(dialog.contains(document.activeElement)).toBe(true);

    await expectZeroAxeViolations(container);

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(householdBtn).toHaveFocus();
  });

  it('updates Your Choices, Direct Impact when Checklist items and Swaps are toggled', async () => {
    stubFetch();
    const user = userEvent.setup();
    render(<App />);

    const impactSection = await screen.findByRole('region', { name: 'Your Choices, Direct Impact' });
    expect(within(impactSection).getByText('~12%')).toBeInTheDocument();

    // Open checklist and complete an item
    await user.click(screen.getByRole('button', { name: 'Checklist' }));
    const checklistDialog = screen.getByRole('dialog', { name: /RWA, School, and Home Checklist/i });
    const leafBtn = within(checklistDialog).getByRole('button', { name: /Stop sweeping-and-burning/i });
    await user.click(leafBtn);
    await user.keyboard('{Escape}');

    expect(within(impactSection).getByText('~16%')).toBeInTheDocument();
    expect(within(impactSection).getByText('6.5 kg')).toBeInTheDocument();

    // Switch to Swaps tab and adopt a swap
    await user.click(screen.getByRole('tab', { name: 'Swaps' }));
    const adoptButtons = screen.getAllByRole('button', { name: 'Mark swap adopted' });
    await user.click(adoptButtons[0]);

    expect(within(impactSection).getByText('~28%')).toBeInTheDocument();

    // Verify "How we calculated this" disclosure
    await user.click(screen.getByRole('button', { name: 'How we calculated this' }));
    expect(screen.getByText(/Active household and community factors/i)).toBeInTheDocument();
  });

  it('switches to WCAG AAA High Contrast theme in Settings modal', async () => {
    stubFetch();
    const user = userEvent.setup();
    render(<App />);

    await user.click(await screen.findByRole('button', { name: 'Open settings' }));
    const settingsDialog = screen.getByRole('dialog', { name: /Smog Shield Settings/i });
    await user.click(within(settingsDialog).getByRole('button', { name: /High Contrast/i }));

    expect(document.documentElement.getAttribute('data-theme')).toBe('high-contrast');
  });

  it('handles Ask submit, Cancel abort, and fallback states gracefully with zero axe violations', async () => {
    let rejectPending: ((reason: unknown) => void) | null = null;
    let callCount = 0;

    stubFetch((init) => {
      callCount += 1;
      if (callCount === 1) {
        return new Promise<Response>((_resolve, reject) => {
          rejectPending = reject;
          init?.signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')));
        });
      }
      if (callCount === 2) {
        return Promise.resolve(
          new Response(JSON.stringify({ error: 'Gemini temporarily unavailable.' }), {
            status: 503,
            headers: { 'Content-Type': 'application/json' },
          })
        );
      }
      return Promise.resolve(
        new Response(
          JSON.stringify({
            text: 'Tailored Advice: Seal bedroom windows.\nDirect Impact: Lowers overnight PM2.5 by 60%.\nQuick Next Step: Place a damp towel along the door gap.',
            model: 'gemini-3.5-flash-lite',
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        )
      );
    });

    const user = userEvent.setup();
    const { container } = render(<App />);

    await user.click(await screen.findByRole('tab', { name: 'Ask' }));
    const input = screen.getByLabelText(/Ask a question about today's air quality/i);

    // 1. Submit and immediately cancel
    await user.type(input, 'Should we open windows tonight?');
    await user.click(screen.getByRole('button', { name: 'Ask' }));

    expect(await screen.findByText('Getting a personalised answer')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(rejectPending).not.toBeNull();

    await waitFor(() => {
      expect(screen.queryByText('Getting a personalised answer')).not.toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: 'Ask' })).toBeEnabled();

    // 2. Fallback on 503 preserves Quick Guidance and announces via live region
    await user.type(input, 'Do cloth masks work?');
    await user.click(screen.getByRole('button', { name: 'Ask' }));
    const notices = await screen.findAllByText(/Gemini temporarily unavailable\. Showing quick guidance\./i);
    expect(notices.length).toBeGreaterThanOrEqual(1);

    // 3. Successful Gemini response renders structured 3-part card
    await user.type(input, 'How can I keep bedroom air clean?');
    await user.click(screen.getByRole('button', { name: 'Ask' }));
    expect(await screen.findByText('Tailored Advice')).toBeInTheDocument();
    expect(screen.getByText('Seal bedroom windows.')).toBeInTheDocument();
    expect(screen.getByText('Direct Impact')).toBeInTheDocument();
    expect(screen.getByText('Quick Next Step')).toBeInTheDocument();

    await expectZeroAxeViolations(container);
  });
});
