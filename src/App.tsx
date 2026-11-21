import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AskTab } from './components/AskTab';
import { ChecklistModal } from './components/ChecklistModal';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Header } from './components/Header';
import { HouseholdModal } from './components/HouseholdModal';
import { CheckIcon } from './components/Icons';
import { ImpactTrackerBanner } from './components/ImpactTrackerBanner';
import { IndoorAirTab } from './components/IndoorAirTab';
import { RoutineTab } from './components/RoutineTab';
import { SettingsModal } from './components/SettingsModal';
import { SwapsTab } from './components/SwapsTab';
import { TodayTab } from './components/TodayTab';
import { STORAGE_KEYS } from './constants';
import {
  findTwoHourWindows,
  getAtRiskSummary,
  getBandInfo,
  getVulnerabilityMultiplier,
} from './domain/aqi';
import { calculateDirectImpact } from './domain/impact';
import {
  buildPlanSummary,
  buildRecommendations,
  exportPlanMarkdown,
  getCommunityChecklist,
} from './domain/recommendations';
import { useAqiData } from './hooks/useAqiData';
import { useChecklist } from './hooks/useChecklist';
import { useHouseholdProfile } from './hooks/useHouseholdProfile';
import { useTheme } from './hooks/useTheme';
import { runPersonaliseRequest } from './services/aiService';
import { clearAirCache } from './services/airQualityService';
import type { TabKey, UserProfile } from './types';

function SmogShieldApp() {
  const { profile, saveProfile, resetProfile } = useHouseholdProfile();
  const { theme, setTheme, resetTheme } = useTheme();
  const {
    checkedIds,
    adoptedSwapIds,
    toggleChecklistItem,
    toggleAdoptedSwap,
    resetActions,
  } = useChecklist();
  const { reading, loading, statusMessage, refresh } = useAqiData(profile);

  const [activeTab, setActiveTab] = useState<TabKey>('today');
  const [showHouseholdModal, setShowHouseholdModal] = useState(false);
  const [showChecklistModal, setShowChecklistModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [copiedNotice, setCopiedNotice] = useState<string | null>(null);
  const [askResetSignal, setAskResetSignal] = useState(0);

  const [geminiSummary, setGeminiSummary] = useState<string | null>(null);
  const [geminiModel, setGeminiModel] = useState<string | null>(null);
  const [personalizing, setPersonalizing] = useState(false);
  const [personalizeError, setPersonalizeError] = useState<string | null>(null);
  const personaliseAbortRef = useRef<AbortController | null>(null);
  const noticeTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      personaliseAbortRef.current?.abort();
      if (noticeTimerRef.current !== null) {
        window.clearTimeout(noticeTimerRef.current);
      }
    };
  }, []);

  const bandInfo = useMemo(() => getBandInfo(reading.aqi), [reading.aqi]);
  const windows = useMemo(() => findTwoHourWindows(reading.hourly), [reading.hourly]);
  const recs = useMemo(() => buildRecommendations(profile, reading), [profile, reading]);
  const atRisk = useMemo(() => getAtRiskSummary(profile, bandInfo.band), [profile, bandInfo.band]);
  const multiplier = useMemo(() => getVulnerabilityMultiplier(profile), [profile]);
  const checklist = useMemo(() => getCommunityChecklist(bandInfo.band), [bandInfo.band]);
  const ruleEngineSummary = useMemo(
    () => buildPlanSummary(profile, reading, false),
    [profile, reading]
  );
  const directImpact = useMemo(
    () => calculateDirectImpact(profile, reading, checkedIds, adoptedSwapIds),
    [profile, reading, checkedIds, adoptedSwapIds]
  );

  const aiContext = useMemo(
    () => ({
      city: reading.city.name,
      region: reading.city.region,
      aqi: reading.aqi,
      band: bandInfo.label,
      pm25: reading.pm25,
      pm10: reading.pm10,
      source: reading.source,
      cleanestWindow: windows.cleanest,
      worstWindow: windows.worst,
      household: {
        adults: profile.adults,
        children: profile.children,
        elders: profile.elders,
        sensitivities: profile.sensitivities,
        commute: profile.commute,
        cookingFuel: profile.cookingFuel,
        homeType: profile.homeType,
        hasPurifier: profile.hasPurifier,
        budget: profile.budget,
      },
    }),
    [reading, bandInfo.label, windows, profile]
  );

  const showNotice = useCallback((msg: string) => {
    setCopiedNotice(msg);
    if (noticeTimerRef.current !== null) {
      window.clearTimeout(noticeTimerRef.current);
    }
    noticeTimerRef.current = window.setTimeout(() => {
      setCopiedNotice(null);
      noticeTimerRef.current = null;
    }, 3000);
  }, []);

  const handleSaveProfile = useCallback(
    (next: UserProfile) => {
      saveProfile(next);
      setGeminiSummary(null);
      setPersonalizeError(null);
      setShowHouseholdModal(false);
      showNotice('Household profile updated.');
    },
    [saveProfile, showNotice]
  );

  const handlePersonalize = useCallback(async () => {
    if (geminiSummary) {
      setGeminiSummary(null);
      setPersonalizeError(null);
      return;
    }
    personaliseAbortRef.current?.abort();
    const controller = new AbortController();
    personaliseAbortRef.current = controller;
    setPersonalizing(true);
    setPersonalizeError(null);

    try {
      const result = await runPersonaliseRequest({
        context: aiContext,
        signal: controller.signal,
      });
      if (controller.signal.aborted) return;
      if (result.status === 'ok' && result.text) {
        setGeminiSummary(result.text);
        setGeminiModel(result.model ?? 'gemini-3.5-flash-lite');
      } else {
        setPersonalizeError(
          result.error ?? 'Could not personalize wording right now.'
        );
      }
    } finally {
      if (personaliseAbortRef.current === controller) {
        personaliseAbortRef.current = null;
      }
      setPersonalizing(false);
    }
  }, [aiContext, geminiSummary]);

  const handleCopyPlan = useCallback(async () => {
    const md = exportPlanMarkdown(profile, reading);
    try {
      await navigator.clipboard.writeText(md);
      showNotice('Daily plan copied as Markdown.');
    } catch {
      showNotice('Could not access clipboard in this preview frame.');
    }
  }, [profile, reading, showNotice]);

  const handleCopyChecklist = useCallback(async () => {
    const lines = [
      `# Smog Shield Community Checklist (${reading.city.name}, AQI ${reading.aqi})`,
      ...checklist.map(
        (item) => `- [${checkedIds.includes(item.id) ? 'x' : ' '}] (${item.group}) ${item.text}`
      ),
    ];
    try {
      await navigator.clipboard.writeText(lines.join('\n'));
      showNotice('Community checklist copied.');
    } catch {
      showNotice('Could not access clipboard in this preview frame.');
    }
  }, [checkedIds, checklist, reading.aqi, reading.city.name, showNotice]);

  const handleClearAllData = useCallback(() => {
    personaliseAbortRef.current?.abort();
    clearAirCache();
    resetProfile();
    resetActions();
    resetTheme();
    setGeminiSummary(null);
    setGeminiModel(null);
    setPersonalizeError(null);
    try {
      window.sessionStorage.removeItem(STORAGE_KEYS.askMessages);
    } catch {
      // Ignore storage restriction
    }
    setAskResetSignal((prev) => prev + 1);
    showNotice('All local household data cleared.');
  }, [resetActions, resetProfile, resetTheme, showNotice]);

  const completedChecklistCount = useMemo(
    () => checklist.filter((item) => checkedIds.includes(item.id)).length,
    [checklist, checkedIds]
  );

  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden">
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {statusMessage}
      </div>

      <Header
        city={reading.city}
        activeTab={activeTab}
        completedChecklistCount={completedChecklistCount}
        onSelectTab={setActiveTab}
        onOpenHousehold={() => setShowHouseholdModal(true)}
        onOpenChecklist={() => setShowChecklistModal(true)}
        onOpenSettings={() => setShowSettingsModal(true)}
      />

      <div
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full"
        role="status"
        aria-live="polite"
      >
        {copiedNotice ? (
          <div className="pt-4">
            <div
              className="px-4 py-2.5 rounded-[6px] text-sm font-bold inline-flex items-center gap-2"
              style={{
                backgroundColor: 'var(--bg-selected)',
                border: 'var(--border-width-card) solid var(--border-strong)',
                color: 'var(--accent-primary)',
              }}
            >
              <CheckIcon className="w-4 h-4" />
              <span>{copiedNotice}</span>
            </div>
          </div>
        ) : null}
      </div>

      <main
        id="main-content"
        tabIndex={-1}
        className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-5 sm:py-6 lg:py-8 min-w-0"
      >
        <ImpactTrackerBanner
          impact={directImpact}
          onOpenChecklist={() => setShowChecklistModal(true)}
          onOpenSwaps={() => setActiveTab('swaps')}
        />

        <div
          id={`panel-${activeTab}`}
          role="tabpanel"
          aria-labelledby={`tab-${activeTab}`}
          className="min-w-0"
        >
          {activeTab === 'today' ? (
            <TodayTab
              reading={reading}
              bandInfo={bandInfo}
              loading={loading}
              windows={windows}
              atRisk={atRisk}
              multiplier={multiplier}
              recs={recs}
              ruleEngineSummary={ruleEngineSummary}
              geminiSummary={geminiSummary}
              geminiModel={geminiModel}
              personalizing={personalizing}
              personalizeError={personalizeError}
              onRefresh={refresh}
              onPersonalize={() => void handlePersonalize()}
              onCopyPlan={() => void handleCopyPlan()}
              onSelectTab={setActiveTab}
            />
          ) : null}

          {activeTab === 'routine' ? (
            <RoutineTab reading={reading} bandInfo={bandInfo} items={recs.routine} />
          ) : null}

          {activeTab === 'indoor' ? <IndoorAirTab items={recs.indoor} /> : null}

          {activeTab === 'swaps' ? (
            <SwapsTab
              items={recs.swaps}
              adoptedSwapIds={adoptedSwapIds}
              onToggleAdopt={toggleAdoptedSwap}
            />
          ) : null}

          {activeTab === 'ask' ? (
            <AskTab
              key={askResetSignal}
              profile={profile}
              reading={reading}
              bandInfo={bandInfo}
            />
          ) : null}
        </div>
      </main>

      <footer className="border-t py-5" style={{ borderColor: 'var(--border-subtle)' }}>
        <div
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full text-xs leading-relaxed"
          style={{ color: 'var(--ink-muted)' }}
        >
          <strong>Medical disclaimer:</strong> Smog Shield provides general environmental estimates
          and public-health guidance, not personal medical advice. Consult a qualified doctor for
          wheezing, chest pain, or worsening asthma symptoms. Air quality data from Open-Meteo (CC
          BY 4.0) mapped to CPCB AQI bands.
        </div>
      </footer>

      <HouseholdModal
        isOpen={showHouseholdModal}
        initialProfile={profile}
        onSave={handleSaveProfile}
        onClose={() => setShowHouseholdModal(false)}
      />

      <ChecklistModal
        isOpen={showChecklistModal}
        cityName={reading.city.name}
        bandInfo={bandInfo}
        checklist={checklist}
        checkedIds={checkedIds}
        onToggleItem={toggleChecklistItem}
        onCopyChecklist={() => void handleCopyChecklist()}
        onClose={() => setShowChecklistModal(false)}
      />

      <SettingsModal
        isOpen={showSettingsModal}
        theme={theme}
        onThemeChange={setTheme}
        onEditHousehold={() => setShowHouseholdModal(true)}
        onClearAllData={handleClearAllData}
        onClose={() => setShowSettingsModal(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <SmogShieldApp />
    </ErrorBoundary>
  );
}
