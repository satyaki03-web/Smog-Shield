/** Indian CPCB AQI severity band identifier. */
export type AqiBand =
  | 'good'
  | 'satisfactory'
  | 'moderate'
  | 'poor'
  | 'veryPoor'
  | 'severe';

export type Sensitivity = 'asthma' | 'heart' | 'pregnancy' | 'copd';
export type CommuteMode = 'twoWheeler' | 'car' | 'publicTransit' | 'walkOrCycle' | 'workFromHome';
export type CookingFuel = 'lpg' | 'pipedGas' | 'induction' | 'biomassOrWood';
export type HomeType = 'apartment' | 'independentHouse' | 'groundFloorRoadside';
export type BudgetTier = 'lowCost' | 'moderate' | 'flexible';
export type ThemeMode = 'light' | 'dark' | 'high-contrast';
export type TabKey = 'today' | 'routine' | 'indoor' | 'swaps' | 'ask';
export type TimeOfDaySlot = 'morning' | 'midday' | 'afternoon' | 'evening' | 'night';

export interface CityInfo {
  readonly id: string;
  readonly name: string;
  readonly region: string;
  readonly lat: number;
  readonly lon: number;
  readonly fallbackAqi: number;
  readonly fallbackPm25: number;
  readonly fallbackPm10: number;
}

export interface UserProfile {
  cityId: string;
  adults: number;
  children: number;
  elders: number;
  sensitivities: Sensitivity[];
  commute: CommuteMode;
  cookingFuel: CookingFuel;
  homeType: HomeType;
  hasPurifier: boolean;
  budget: BudgetTier;
  manualAqi: number | null;
}

export interface HourlyPoint {
  timeIso: string;
  hourLabel: string;
  hour24: number;
  aqi: number;
  pm25: number;
  pm10: number;
}

export interface AirReading {
  city: CityInfo;
  aqi: number;
  pm25: number;
  pm10: number;
  fetchedAtIso: string;
  source: 'live' | 'manual' | 'offline';
  hourly: HourlyPoint[];
}

export interface BandInfo {
  band: AqiBand;
  label: string;
  rangeLabel: string;
  summary: string;
  maskGuidance: string;
  cssVar: string;
  shape: 'circle' | 'roundedSquare' | 'diamond' | 'triangle' | 'octagon' | 'alertHex';
}

export interface TimeWindow {
  startLabel: string;
  endLabel: string;
  startHour: number;
  timeOfDay: TimeOfDaySlot;
  averageAqi: number;
}

export interface Recommendation {
  id: string;
  category: 'routine' | 'indoor' | 'swap';
  priority: number;
  title: string;
  action: string;
  timingOrCost: string;
  exposureImpact: string;
  emissionsImpact: string;
  basis: string;
}

export interface RecommendationBundle {
  routine: Recommendation[];
  indoor: Recommendation[];
  swaps: Recommendation[];
}

export interface ChecklistItem {
  id: string;
  group: 'RWA' | 'School' | 'Household';
  text: string;
}

export interface DirectImpactSummary {
  exposureReductionPercent: number;
  weeklyCo2eAvoidedKg: number;
  weeklyLocalPm25AvoidedGrams: number;
  activeActionsCount: number;
  headline: string;
  breakdown: string[];
  methodology: string;
}

export interface AskTurn {
  sender: 'user' | 'assistant';
  text: string;
}

export interface CompactAskPayload {
  question: string;
  city: string;
  region: string;
  aqi: number;
  band: string;
  pm25: number;
  pm10: number;
  profileSummary: string;
  history: AskTurn[];
}

export interface CachedAskAnswer {
  text: string;
  model: string;
}

export interface StructuredAdvice {
  tailoredAdvice?: string;
  directImpact?: string;
  quickNextStep?: string;
  plainFallback?: string;
}

export interface ChatItem {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  label?: string;
  model?: string;
  structured?: boolean;
  notice?: string;
}

export interface AskRunResult {
  status: 'ok' | 'cached' | 'timeout' | 'cancelled' | 'fallback';
  text?: string;
  model?: string;
  notice?: string;
}

export interface PersonaliseRunResult {
  status: 'ok' | 'error';
  text?: string;
  model?: string;
  error?: string;
}
