import type {
  BudgetTier,
  CityInfo,
  CommuteMode,
  CookingFuel,
  HomeType,
  Sensitivity,
  TabKey,
  UserProfile,
} from '../types';

/** Maximum valid AQI value on the 0 to 500 scale. */
export const MAX_AQI = 500;
/** Timeout in milliseconds for live Open-Meteo air quality requests. */
export const OPEN_METEO_TIMEOUT_MS = 10_000;
/** Cache TTL in milliseconds for live Open-Meteo readings (10 minutes). */
export const AIR_CACHE_TTL_MS = 10 * 60 * 1000;
/** Overall client timeout in milliseconds for Ask requests. */
export const ASK_TIMEOUT_MS = 15_000;
/** Client cache TTL in milliseconds for identical Ask questions (10 minutes). */
export const ASK_CACHE_TTL_MS = 10 * 60 * 1000;
/** Maximum prior turns included in a compact Ask payload. */
export const ASK_MAX_HISTORY_TURNS = 4;
/** Maximum allowed characters in an Ask question. */
export const ASK_MAX_QUESTION_CHARS = 500;
/** Maximum persisted Ask messages kept in sessionStorage. */
export const ASK_MAX_STORED_MESSAGES = 30;
/** Maximum exposure reduction cap used by the direct impact calculator. */
export const MAX_EXPOSURE_REDUCTION_PERCENT = 78;

export const STORAGE_KEYS = {
  profile: 'smog_shield_profile_v1',
  checklist: 'smog_shield_checklist_v1',
  adoptedSwaps: 'smog_shield_adopted_swaps_v1',
  theme: 'smog_shield_theme_v1',
  askMessages: 'smog_shield_ask_messages_v1',
  airCachePrefix: 'smog_shield_air_v1_',
} as const;

export const PRIMARY_TABS: ReadonlyArray<{ key: TabKey; label: string }> = [
  { key: 'today', label: 'Today' },
  { key: 'routine', label: 'Routine' },
  { key: 'indoor', label: 'Indoor Air' },
  { key: 'swaps', label: 'Swaps' },
  { key: 'ask', label: 'Ask' },
];

export const SUGGESTED_ASK_QUESTIONS: readonly string[] = [
  'When should we open windows today?',
  'Do cloth masks block winter smog?',
  'Is it safe for children to play outside?',
  'What can our RWA do tonight?',
];

/** Curated Indian cities with seasonal winter fallback baselines. */
export const CITIES: readonly CityInfo[] = [
  { id: 'delhi', name: 'Delhi', region: 'Delhi NCR', lat: 28.6139, lon: 77.209, fallbackAqi: 342, fallbackPm25: 178, fallbackPm10: 295 },
  { id: 'gurugram', name: 'Gurugram', region: 'Delhi NCR', lat: 28.4595, lon: 77.0266, fallbackAqi: 318, fallbackPm25: 158, fallbackPm10: 270 },
  { id: 'noida', name: 'Noida', region: 'Delhi NCR', lat: 28.5355, lon: 77.391, fallbackAqi: 336, fallbackPm25: 171, fallbackPm10: 288 },
  { id: 'ghaziabad', name: 'Ghaziabad', region: 'Delhi NCR', lat: 28.6692, lon: 77.4538, fallbackAqi: 355, fallbackPm25: 186, fallbackPm10: 310 },
  { id: 'faridabad', name: 'Faridabad', region: 'Delhi NCR', lat: 28.4089, lon: 77.3178, fallbackAqi: 325, fallbackPm25: 164, fallbackPm10: 278 },
  { id: 'lucknow', name: 'Lucknow', region: 'Uttar Pradesh', lat: 26.8467, lon: 80.9462, fallbackAqi: 264, fallbackPm25: 122, fallbackPm10: 218 },
  { id: 'kanpur', name: 'Kanpur', region: 'Uttar Pradesh', lat: 26.4499, lon: 80.3319, fallbackAqi: 282, fallbackPm25: 134, fallbackPm10: 235 },
  { id: 'patna', name: 'Patna', region: 'Bihar', lat: 25.5941, lon: 85.1376, fallbackAqi: 295, fallbackPm25: 142, fallbackPm10: 248 },
  { id: 'varanasi', name: 'Varanasi', region: 'Uttar Pradesh', lat: 25.3176, lon: 82.9739, fallbackAqi: 248, fallbackPm25: 112, fallbackPm10: 204 },
  { id: 'chandigarh', name: 'Chandigarh', region: 'Punjab / Haryana', lat: 30.7333, lon: 76.7794, fallbackAqi: 196, fallbackPm25: 86, fallbackPm10: 154 },
  { id: 'amritsar', name: 'Amritsar', region: 'Punjab', lat: 31.634, lon: 74.8723, fallbackAqi: 242, fallbackPm25: 109, fallbackPm10: 196 },
  { id: 'jaipur', name: 'Jaipur', region: 'Rajasthan', lat: 26.9124, lon: 75.7873, fallbackAqi: 188, fallbackPm25: 82, fallbackPm10: 162 },
  { id: 'kolkata', name: 'Kolkata', region: 'West Bengal', lat: 22.5726, lon: 88.3639, fallbackAqi: 218, fallbackPm25: 98, fallbackPm10: 175 },
  { id: 'mumbai', name: 'Mumbai', region: 'Maharashtra', lat: 19.076, lon: 72.8777, fallbackAqi: 146, fallbackPm25: 56, fallbackPm10: 118 },
  { id: 'bengaluru', name: 'Bengaluru', region: 'Karnataka', lat: 12.9716, lon: 77.5946, fallbackAqi: 84, fallbackPm25: 28, fallbackPm10: 62 },
];

export const DEFAULT_PROFILE: UserProfile = {
  cityId: 'delhi',
  adults: 2,
  children: 1,
  elders: 1,
  sensitivities: ['asthma'],
  commute: 'twoWheeler',
  cookingFuel: 'lpg',
  homeType: 'apartment',
  hasPurifier: false,
  budget: 'lowCost',
  manualAqi: null,
};

/** Diurnal winter smog multipliers by local hour (0 to 23) for offline fallback profiles. */
export const DIURNAL_SMOG_MULTIPLIERS: readonly number[] = [
  1.18, 1.2, 1.22, 1.18, 1.15, 1.12, 1.16, 1.14, 1.04, 0.94, 0.85, 0.78,
  0.72, 0.68, 0.69, 0.74, 0.82, 0.94, 1.06, 1.14, 1.18, 1.2, 1.19, 1.17,
];

export const SENSITIVITY_OPTIONS: ReadonlyArray<{ value: Sensitivity; label: string; desc: string }> = [
  { value: 'asthma', label: 'Asthma', desc: 'Prioritizes inhaler readiness and lower PM2.5 thresholds' },
  { value: 'copd', label: 'COPD or chronic bronchitis', desc: 'Avoids cold early-morning inversion smog' },
  { value: 'heart', label: 'Heart or blood pressure condition', desc: 'Limits heavy outdoor exertion on Poor+ days' },
  { value: 'pregnancy', label: 'Pregnancy', desc: 'Focuses on clean bedroom air overnight' },
];

export const COMMUTE_OPTIONS: ReadonlyArray<{ value: CommuteMode; label: string; desc: string }> = [
  { value: 'twoWheeler', label: 'Two-wheeler', desc: 'Direct traffic exhaust exposure at handlebar height' },
  { value: 'car', label: 'Private car', desc: 'Cabin recirculation and carpool options' },
  { value: 'publicTransit', label: 'Metro or bus', desc: 'Lower emissions; mask guidance for station walks' },
  { value: 'walkOrCycle', label: 'Walk or cycle', desc: 'Side-street routing and midday timing' },
  { value: 'workFromHome', label: 'Mostly at home', desc: 'Focuses on indoor air sealing and errand batching' },
];

export const FUEL_OPTIONS: ReadonlyArray<{ value: CookingFuel; label: string }> = [
  { value: 'lpg', label: 'LPG cylinder' },
  { value: 'pipedGas', label: 'Piped natural gas' },
  { value: 'induction', label: 'Electric or induction' },
  { value: 'biomassOrWood', label: 'Wood, coal, or biomass' },
];

export const HOME_OPTIONS: ReadonlyArray<{ value: HomeType; label: string }> = [
  { value: 'apartment', label: 'Apartment or flat' },
  { value: 'independentHouse', label: 'Independent house' },
  { value: 'groundFloorRoadside', label: 'Ground floor near busy road' },
];

export const BUDGET_OPTIONS: ReadonlyArray<{ value: BudgetTier; label: string; desc: string }> = [
  { value: 'lowCost', label: 'Low-cost first', desc: 'Free habits, sealing gaps, N95 masks, DIY filter options' },
  { value: 'moderate', label: 'Moderate', desc: 'Includes one bedroom HEPA purifier or induction hob' },
  { value: 'flexible', label: 'Flexible', desc: 'Multi-room HEPA filtration and full clean-energy swaps' },
];
