import type {
  AirReading,
  AqiBand,
  BandInfo,
  ChecklistItem,
  Recommendation,
  RecommendationBundle,
  TimeOfDaySlot,
  UserProfile,
} from '../types';
import { findTwoHourWindows, getBandInfo, getVulnerabilityMultiplier } from './aqi';

interface RecommendationContext {
  readonly profile: UserProfile;
  readonly reading: AirReading;
  readonly bandInfo: BandInfo;
  readonly cleanStr: string;
  readonly cleanSlot: TimeOfDaySlot;
  readonly cleanestAvgAqi: number;
  readonly worstStr: string;
  readonly worstSlot: TimeOfDaySlot;
  readonly highRisk: boolean;
  readonly severeOrVeryPoor: boolean;
  readonly poorOrWorse: boolean;
}

function createRecommendationContext(
  profile: UserProfile,
  reading: AirReading
): RecommendationContext {
  const bandInfo = getBandInfo(reading.aqi);
  const { cleanest, worst } = findTwoHourWindows(reading.hourly);
  const severeOrVeryPoor = bandInfo.band === 'veryPoor' || bandInfo.band === 'severe';
  return {
    profile,
    reading,
    bandInfo,
    cleanStr: cleanest ? `${cleanest.startLabel} to ${cleanest.endLabel}` : '1:00 PM to 3:00 PM',
    cleanSlot: cleanest ? cleanest.timeOfDay : 'midday',
    cleanestAvgAqi: cleanest?.averageAqi ?? reading.aqi,
    worstStr: worst ? `${worst.startLabel} to ${worst.endLabel}` : '6:00 AM to 8:00 AM',
    worstSlot: worst ? worst.timeOfDay : 'morning',
    highRisk: getVulnerabilityMultiplier(profile) >= 1.25,
    severeOrVeryPoor,
    poorOrWorse: severeOrVeryPoor || bandInfo.band === 'poor',
  };
}

function buildRoutineRecommendations(ctx: RecommendationContext): Recommendation[] {
  const { profile, bandInfo, cleanStr, cleanSlot, worstStr, worstSlot, highRisk, poorOrWorse } = ctx;
  const routine: Recommendation[] = [
    {
      id: 'routine-exercise',
      category: 'routine',
      priority: 1,
      title: poorOrWorse
        ? `Shift ${worstSlot} walk indoors`
        : `Time outdoor walks for ${cleanSlot} air`,
      action: poorOrWorse
        ? `Skip brisk outdoor exercise during ${worstStr}. Do 25 minutes of indoor stretching, stairs, or stationary cycling instead.`
        : `Schedule outdoor walks during ${cleanStr} (${cleanSlot} window) when air dispersion lowers surface PM2.5.`,
      timingOrCost: 'Zero cost | Daily routine',
      exposureImpact: poorOrWorse
        ? 'Cuts inhaled PM2.5 dose during exercise by 55% to 75% because deep breathing multiplies particle intake.'
        : 'Reduces peak particulate exposure by 20% to 35% compared with peak inversion hours.',
      emissionsImpact: 'Indirect: avoids driving to distant parks when indoor or local movement works.',
      basis: 'Minute ventilation increases 3x to 6x during brisk outdoor exercise; urban inversions trap particulates near ground level.',
    },
    {
      id: 'routine-mask',
      category: 'routine',
      priority: 2,
      title: poorOrWorse ? 'Use a fitted N95 or FFP2 mask outdoors' : 'Keep an N95 mask ready for traffic corridors',
      action:
        bandInfo.band === 'good'
          ? 'No mask needed today. Store clean N95 masks dry in a paper envelope for higher-smog days.'
          : `Wear a snug N95 or FFP2 mask (pinch the nose clip firmly, avoid loose cloth or surgical masks) for commutes and errands.${
              profile.children > 0 ? ' Use child-sized N95/KF94 masks for school drop-off.' : ''
            }`,
      timingOrCost: 'Rs 30 to 60 per reusable mask',
      exposureImpact: 'A properly sealed N95 filters 80% to 95% of PM2.5 particles; loose cloth masks block under 20%.',
      emissionsImpact: 'Reuse each mask for 30 to 40 dry hours until straps loosen to cut disposable waste.',
      basis: 'NIOSH/BIS filtration performance studies comparing fitted N95 respirators against surgical and cloth masks for fine PM2.5.',
    },
    {
      id: 'routine-errands',
      category: 'routine',
      priority: 3,
      title: profile.children > 0 ? 'Batch school run and market errands' : `Combine errands into the ${cleanSlot} window`,
      action: `Group pharmacy, grocery, and pickup trips inside ${cleanStr} instead of multiple runs during ${worstStr}.`,
      timingOrCost: `Best window: ${cleanStr}`,
      exposureImpact: 'Shortens total outdoor exposure time by 30% to 45% during peak smog hours.',
      emissionsImpact: 'Eliminating two short cold-start trips cuts local tailpipe PM and NOx by roughly 40% for errand travel.',
      basis: 'Cold engines emit disproportionately higher hydrocarbons and particulates during the first 3 km of driving.',
    },
  ];

  if (highRisk) {
    routine.push({
      id: 'routine-medication',
      category: 'routine',
      priority: 4,
      title: 'Check daily symptoms and inhaler readiness',
      action:
        'Keep prescribed controllers and rescue inhalers in one visible spot. Rinse nose and eyes with plain saline after coming indoors.',
      timingOrCost: '2 minutes | Sensitive members',
      exposureImpact: 'Saline nasal rinse clears settled coarse dust and lowers upper-airway irritation after outdoor trips.',
      emissionsImpact: 'No emissions impact; prioritizes household health resilience.',
      basis: 'Standard public-health guidance for households with children, elders, asthma, COPD, or cardiac risk.',
    });
  }

  return routine;
}

function buildIndoorRecommendations(ctx: RecommendationContext): Recommendation[] {
  const { profile, cleanStr, cleanSlot, cleanestAvgAqi, worstStr, severeOrVeryPoor } = ctx;
  return [
    {
      id: 'indoor-ventilate',
      category: 'indoor',
      priority: 1,
      title: severeOrVeryPoor
        ? `Seal windows now; air out briefly in the ${cleanSlot}`
        : `Cross-ventilate only during the ${cleanSlot} window`,
      action: severeOrVeryPoor
        ? `Keep doors and balcony gaps closed with rolled damp towels or weather-strip tape. Open windows for just 15 to 20 minutes during ${cleanStr} to clear indoor CO2.`
        : `Open opposite windows for 30 minutes during ${cleanStr} (avg AQI ${cleanestAvgAqi}), then close before smog rises around ${worstStr}.`,
      timingOrCost: `Air out: ${cleanStr}`,
      exposureImpact: 'Reduces outdoor-to-indoor PM2.5 infiltration by 30% to 50% while preventing stale indoor CO2 buildup.',
      emissionsImpact: 'Zero energy use; avoids running exhaust fans continuously against heavy outdoor smog.',
      basis: 'Indoor-outdoor penetration factor measurements for naturally ventilated urban flats in North India.',
    },
    {
      id: 'indoor-purifier',
      category: 'indoor',
      priority: 2,
      title: profile.hasPurifier
        ? 'Run HEPA purifier continuously in the main bedroom'
        : profile.budget === 'lowCost'
          ? 'Build a clean-air sleeping room with DIY box-fan filter'
          : 'Create one clean-air room with a true HEPA H13 purifier',
      action: profile.hasPurifier
        ? 'Place the purifier 30 cm away from walls, close bedroom doors, run on medium-high 1 hour before sleep, and vacuum the mesh pre-filter weekly.'
        : 'Focus on the smallest sleeping room used by children or elders. A true HEPA H13 unit (or a box fan taped cleanly to a MERV-13/HEPA replacement filter) cleans one closed room effectively.',
      timingOrCost: profile.hasPurifier ? 'Existing device | Weekly pre-filter clean' : 'Rs 2,500 DIY or Rs 7,000+ HEPA',
      exposureImpact: 'Lowers closed-bedroom PM2.5 by 60% to 80% over 8 hours of overnight sleep, cutting daily cumulative dose sharply.',
      emissionsImpact: 'A 35W HEPA fan uses ~0.3 kWh overnight; clean pre-filters keep fan draw low.',
      basis: 'CADR room-decay modeling: protecting 8 hours of sleep removes a third of daily exposure time.',
    },
    {
      id: 'indoor-cleaning',
      category: 'indoor',
      priority: 3,
      title: 'Switch from dry sweeping to damp mopping',
      action:
        'Use a wet microfiber mop and damp cloth for floors and sills instead of a dry jhadu or feather duster. Avoid indoor incense (agarbatti), dhoop, and mosquito coils.',
      timingOrCost: 'Zero extra cost | Daily habit',
      exposureImpact: 'Prevents resuspending settled PM10/PM2.5 dust and removes indoor smoke spikes that can exceed 400 AQI in closed rooms.',
      emissionsImpact: 'Cuts indoor combustion particles directly at the source.',
      basis: 'Indoor aerosol studies show a single incense stick or dry broom sweep spikes room PM2.5 by 100 to 300 ug/m3.',
    },
    {
      id: 'indoor-kitchen',
      category: 'indoor',
      priority: 4,
      title: 'Vent cooking fumes immediately and bust plant myths',
      action:
        'Run the kitchen chimney or exhaust fan while tadka/frying and keep the kitchen door shut so fumes do not drift into bedrooms. Note: houseplants are pleasant but cannot replace filtration or ventilation during smog.',
      timingOrCost: 'During every meal',
      exposureImpact: 'High-heat frying spikes kitchen PM2.5 above outdoor smog; targeted exhaust clears 50% to 70% of cooking aerosols.',
      emissionsImpact: 'Covering pots and using pressure cookers trims cooking gas use by 20% to 35%.',
      basis: 'Controlled indoor cooking emissions trials and peer-reviewed reviews showing 100+ plants per sq m would be needed to match one HEPA unit.',
    },
  ];
}

function buildCommuteSwap(ctx: RecommendationContext): Recommendation {
  const { profile, cleanStr, cleanSlot } = ctx;
  if (profile.commute === 'twoWheeler' || profile.commute === 'car') {
    const isTwoWheeler = profile.commute === 'twoWheeler';
    return {
      id: 'swap-commute',
      category: 'swap',
      priority: 1,
      title: isTwoWheeler
        ? 'Swap 2+ two-wheeler days to metro, bus, or shared ride'
        : 'Carpool or use metro for peak-hour office runs',
      action: isTwoWheeler
        ? 'Two-wheeler riders breathe direct tailpipe exhaust at handlebar height. Shift two or more commutes per week to metro/AC bus or a colleague carpool.'
        : 'Share one car with 2 neighbours or combine park-and-ride with metro on Poor to Severe days. Turn off ignition at red lights over 30 seconds.',
      timingOrCost: 'Saves Rs 600 to 2,200 / month',
      exposureImpact: isTwoWheeler
        ? 'Cuts commute PM2.5 intake by 50% to 65% compared with open two-wheeler riding in traffic.'
        : 'Using cabin recirculation with a clean cabin filter reduces in-car PM2.5 by 40% to 60%.',
      emissionsImpact: 'Replaces 40 to 120 km/week of private tailpipe PM2.5, NOx, and CO2 emissions.',
      basis: 'Delhi NCR commuter exposure measurements comparing open two-wheelers, closed vehicles, and metro cabins.',
    };
  }

  return {
    id: 'swap-commute-keep',
    category: 'swap',
    priority: 1,
    title: 'Protect your low-emission commute with quiet side streets',
    action:
      profile.commute === 'workFromHome'
        ? `Keep remote workdays on Severe smog alerts and shift deliveries to the ${cleanSlot} window (${cleanStr}).`
        : 'Walk or cycle along inner colony lanes rather than arterial roads, and wear a fitted N95 when AQI exceeds 150.',
    timingOrCost: 'Zero cost | Route shift',
    exposureImpact: 'Stepping just 100 meters off a main arterial road drops black-carbon and ultrafine exposure by 30% to 50%.',
    emissionsImpact: 'Maintains near-zero personal transport emissions.',
    basis: 'Near-roadway dispersion studies showing sharp pollutant decay 50 to 150 meters from heavy traffic lanes.',
  };
}

function buildSwapRecommendations(ctx: RecommendationContext): Recommendation[] {
  const isBiomass = ctx.profile.cookingFuel === 'biomassOrWood';
  return [
    buildCommuteSwap(ctx),
    {
      id: 'swap-cooking',
      category: 'swap',
      priority: 2,
      title: isBiomass
        ? 'Transition from wood or coal chulha to LPG or induction'
        : 'Use electric kettle and induction for boiling and reheating',
      action: isBiomass
        ? 'Prioritize LPG (check Ujjwala refill subsidies) or a single 1800W induction cooktop for daily tea and dal to remove dense indoor woodsmoke.'
        : 'Boiling tea, milk, and water on an electric kettle or induction hob avoids indoor NO2 and heat buildup in closed winter kitchens.',
      timingOrCost: isBiomass ? 'High health priority' : 'Rs 1,400 to 2,500 one-time',
      exposureImpact: isBiomass
        ? 'Cuts indoor kitchen PM2.5 by 75% to 90% immediately.'
        : 'Reduces indoor NO2 and combustion moisture by 30% to 50% during closed-window days.',
      emissionsImpact: 'Lowers household combustion emissions and trims LPG cylinder refills.',
      basis: 'WHO indoor air quality guidelines comparing biomass, LPG, and electric cooking appliances.',
    },
    {
      id: 'swap-waste-heating',
      category: 'swap',
      priority: 3,
      title: 'Prevent winter leaf burning and open security bonfires',
      action:
        'Ask your RWA or street committee to compost dry leaves in a corner pit and provide warm jackets or safe oil-filled electric heaters for night guards instead of wood or coal fires.',
      timingOrCost: 'Community action | Low shared cost',
      exposureImpact: 'Eliminates local nighttime smoke plumes that leak straight into ground and lower-floor bedrooms.',
      emissionsImpact: 'Open biomass burning is a major hyper-local PM2.5 and black-carbon source in winter evenings.',
      basis: 'Urban winter source-apportionment studies across Delhi NCR and Indo-Gangetic cities.',
    },
  ];
}

/** Builds deterministically prioritized Routine, Indoor Air, and Swaps recommendations. */
export function buildRecommendations(
  profile: UserProfile,
  reading: AirReading
): RecommendationBundle {
  const ctx = createRecommendationContext(profile, reading);
  return {
    routine: buildRoutineRecommendations(ctx),
    indoor: buildIndoorRecommendations(ctx),
    swaps: buildSwapRecommendations(ctx),
  };
}

/** Returns the community, school, and household checklist tailored to the active AQI band. */
export function getCommunityChecklist(band: AqiBand): ChecklistItem[] {
  const highAlert = band === 'poor' || band === 'veryPoor' || band === 'severe';
  return [
    {
      id: 'chk-rwa-leaves',
      group: 'RWA',
      text: 'Stop sweeping-and-burning of dry leaves; move garden waste to a compost pit.',
    },
    {
      id: 'chk-rwa-guards',
      group: 'RWA',
      text: 'Provide night security guards with woollens or safe electric heaters instead of wood bonfires.',
    },
    {
      id: 'chk-rwa-dust',
      group: 'RWA',
      text: 'Sprinkle greywater before sweeping colony roads and cover open sand or construction piles.',
    },
    {
      id: 'chk-school-assembly',
      group: 'School',
      text: highAlert
        ? 'Move morning assembly and PE games indoors until AQI drops below 200.'
        : 'Schedule outdoor sports for the cleanest daily window when smog dispersion is best.',
    },
    {
      id: 'chk-school-idling',
      group: 'School',
      text: 'Enforce a zero-idling pickup zone at school gates for vans, buses, and parent cars.',
    },
    {
      id: 'chk-home-filter',
      group: 'Household',
      text: 'Check N95 mask fit for every family member and clean AC or purifier mesh pre-filters.',
    },
  ];
}

/** Builds a concise deterministic summary paragraph for the Today dashboard. */
export function buildPlanSummary(
  profile: UserProfile,
  reading: AirReading,
  personalizedTone: boolean
): string {
  const band = getBandInfo(reading.aqi);
  const { cleanest, worst } = findTwoHourWindows(reading.hourly);
  const cleanStr = cleanest ? `${cleanest.startLabel} to ${cleanest.endLabel}` : '1:00 PM to 3:00 PM';
  const worstStr = worst ? `${worst.startLabel} to ${worst.endLabel}` : '6:00 AM to 8:00 AM';

  if (personalizedTone) {
    const members: string[] = [];
    if (profile.children > 0) members.push(`${profile.children} ${profile.children === 1 ? 'child' : 'children'}`);
    if (profile.elders > 0) members.push(`${profile.elders} ${profile.elders === 1 ? 'elder' : 'elders'}`);
    const familyNote =
      members.length > 0
        ? `With ${members.join(' and ')} at home, keep the bedroom clean overnight and skip outdoor exertion during ${worstStr}.`
        : `Protect your lungs by avoiding peak smog during ${worstStr}.`;
    return `${reading.city.name} is at AQI ${reading.aqi} (${band.label}, PM2.5 ${reading.pm25} ug/m3). ${familyNote} Save brief airing and errands for ${cleanStr}, and wear a snug N95 for ${
      profile.commute === 'twoWheeler' ? 'two-wheeler trips' : 'outdoor travel'
    }.`;
  }

  return `${reading.city.name} air quality is ${band.label} at AQI ${reading.aqi} (PM2.5 ${reading.pm25} ug/m3, PM10 ${reading.pm10} ug/m3). ${band.summary} Cleanest 2-hour window: ${cleanStr}. Peak smog window to avoid: ${worstStr}.`;
}

function matchesAnyKeyword(text: string, keywords: readonly string[]): boolean {
  return keywords.some((keyword) => text.includes(keyword));
}

/** Produces an instant deterministic rule-engine answer for the Ask tab while Gemini runs or offline. */
export function answerNeighbourQuestion(
  question: string,
  _profile: UserProfile,
  reading: AirReading
): string {
  const q = question.toLowerCase();
  const band = getBandInfo(reading.aqi);
  const { cleanest, worst } = findTwoHourWindows(reading.hourly);
  const cleanStr = cleanest ? `${cleanest.startLabel} to ${cleanest.endLabel}` : '1:00 PM to 3:00 PM';
  const worstStr = worst ? `${worst.startLabel} to ${worst.endLabel}` : '6:00 AM to 8:00 AM';

  if (matchesAnyKeyword(q, ['mask', 'n95', 'cloth'])) {
    return `At AQI ${reading.aqi} (${band.label}) in ${reading.city.name}: ${band.maskGuidance} Cloth and surgical masks leave side gaps that let fine PM2.5 particles straight through. A well-sealed N95 or FFP2 cuts inhaled fine particles by 80% to 95%, and can be air-dried and reused for roughly 30 to 40 hours.`;
  }
  if (matchesAnyKeyword(q, ['window', 'ventilat', 'air out', 'open'])) {
    return `The cleanest 2-hour window in ${reading.city.name} over the next 24 hours is ${cleanStr} (average AQI around ${cleanest?.averageAqi ?? reading.aqi}). Open opposite windows for 15 to 25 minutes during that window to flush indoor CO2, then close up before smog thickens around ${worstStr}.`;
  }
  if (matchesAnyKeyword(q, ['plant', 'steam', 'jaggery', 'myth'])) {
    return `Indoor plants and warm drinks feel soothing, and staying hydrated helps clear throat mucus, but neither removes PM2.5 from room air. Real exposure drops come from closing window gaps outside ${cleanStr}, damp mopping instead of dry sweeping, kitchen exhaust during cooking, and a true HEPA filter in the sleeping room.`;
  }
  if (matchesAnyKeyword(q, ['school', 'child', 'play', 'park', 'walk', 'run'])) {
    const indoorAdvice =
      reading.aqi > 200
        ? `At AQI ${reading.aqi} (${band.label}), keep children's active play and brisk walks indoors today.`
        : `At AQI ${reading.aqi} (${band.label}), light outdoor play is workable during ${cleanStr}, away from main roads.`;
    return `${indoorAdvice} Avoid ${worstStr} when cold ground inversions trap exhaust near breathing height. If commuting to school, use a snug child-sized N95 or KF94 mask and ask the school gate to stop bus idling.`;
  }
  if (matchesAnyKeyword(q, ['purifier', 'diy', 'budget', 'cheap', 'cost'])) {
    return `You do not need an expensive smart purifier for every room. Pick one small bedroom for sleep, seal door gaps with a rolled towel, and run a basic true HEPA H13 unit (no ionizer needed) or a box fan sealed to a MERV-13/HEPA filter. Vacuum the outer mesh pre-filter weekly so the main filter lasts longer.`;
  }
  if (matchesAnyKeyword(q, ['rwa', 'burn', 'guard', 'communit'])) {
    return `Three fast wins for an RWA in ${reading.city.name}: (1) compost dry leaves instead of burning heaps, (2) give night guards woollen jackets or safe electric heaters to stop wood bonfires, and (3) lightly sprinkle greywater before morning road sweeping. Together these cut evening ground-level smoke noticeably.`;
  }
  return `Based on ${reading.city.name} at AQI ${reading.aqi} (${band.label}, PM2.5 ${reading.pm25} ug/m3): keep heavy outdoor exertion indoors during ${worstStr}, air out briefly during ${cleanStr}, and wear a snug N95 outdoors. Ask about masks, windows, school play, budget purifiers, or RWA steps for specific advice.`;
}

/** Exports the household's daily smog action plan as shareable Markdown. */
export function exportPlanMarkdown(profile: UserProfile, reading: AirReading): string {
  const band = getBandInfo(reading.aqi);
  const { cleanest, worst } = findTwoHourWindows(reading.hourly);
  const recs = buildRecommendations(profile, reading);
  const lines = [
    `# Smog Shield Daily Plan: ${reading.city.name}`,
    '',
    `- Current AQI: ${reading.aqi} (${band.label}, CPCB scale)`,
    `- PM2.5: ${reading.pm25} ug/m3 | PM10: ${reading.pm10} ug/m3`,
    `- Source: ${reading.source === 'live' ? 'Open-Meteo live reading' : reading.source === 'manual' ? 'Manual AQI entry' : 'Offline seasonal baseline'}`,
    `- Cleanest 2-hour window: ${cleanest ? `${cleanest.startLabel} to ${cleanest.endLabel} (avg AQI ${cleanest.averageAqi})` : 'Midday'}`,
    `- Peak smog window to avoid: ${worst ? `${worst.startLabel} to ${worst.endLabel} (avg AQI ${worst.averageAqi})` : 'Early morning'}`,
    '',
    '## Top Daily Routine Actions',
    ...recs.routine.map((r, i) => `${i + 1}. **${r.title}**: ${r.action} (${r.exposureImpact})`),
    '',
    '## Indoor Air Actions',
    ...recs.indoor.map((r, i) => `${i + 1}. **${r.title}**: ${r.action}`),
    '',
    '## Sustainable Low-Emission Swaps',
    ...recs.swaps.map((r, i) => `${i + 1}. **${r.title}**: ${r.action} (${r.emissionsImpact})`),
    '',
    'Note: Smog Shield provides general public-health information, not personal medical advice. Consult a qualified doctor for breathing or heart symptoms.',
  ];
  return lines.join('\n');
}
