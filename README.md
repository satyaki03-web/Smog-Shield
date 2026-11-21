# Smog Shield

Smog Shield is a calm, accessible urban air-quality and winter-smog planner built for families and Resident Welfare Associations (RWAs). It pairs live keyless Open-Meteo hourly air quality forecasts (mapped to Indian CPCB AQI bands) with a deterministic public-health rule engine, quantified personal and community impact tracking, and a server-proxied Gemini Q&A advisor.

## Architecture

- `src/types/`: Strict TypeScript domain and API interfaces (zero `any`).
- `src/constants/`: Curated Indian cities, CPCB defaults, diurnal baselines, and TTL/rate limits.
- `src/domain/`: Pure, deterministic logic for CPCB band mapping (`aqi.ts`), dynamic time-of-day recommendations (`recommendations.ts`), quantified exposure/CO2e impact calculations (`impact.ts`), and Ask prompt/cache helpers (`ask.ts`).
- `src/services/`: Open-Meteo client with 10-minute TTL caching and in-flight deduplication (`airQualityService.ts`) plus bounded Ask/Personalise API clients (`aiService.ts`).
- `src/hooks/`: Reusable state and accessibility hooks (`useAqiData`, `useHouseholdProfile`, `useChecklist`, `useTheme`, `useFocusTrap`).
- `src/components/`: Modular views (`Header`, `TodayTab`, `RoutineTab`, `IndoorAirTab`, `SwapsTab`, `AskTab`, `HourlyAqiChart`, `ImpactTrackerBanner`, `HouseholdModal`, `ChecklistModal`, `SettingsModal`, `ErrorBoundary`).
- `server/`: Shared Gemini service (`geminiService.ts`) implementing the `gemini-3.5-flash-lite` (minimal thinking) -> `gemini-flash-latest` fallback chain with 10-second per-attempt `AbortController` timeouts, and shared security middleware (`security.ts`).
- `netlify/functions/`: Production Netlify Functions (`ask.ts`, `personalise.ts`) reusing `server/geminiService.ts` and `server/security.ts` with zero code duplication.

## Local Development

1. Install dependencies:
   ```bash
   npm install
   ```
2. Configure server secrets (never expose keys with `VITE_`):
   ```bash
   cp .env.example .env
   # Set GEMINI_API_KEY in .env
   ```
3. Start the full-stack Express + Vite server on port 3000:
   ```bash
   npm run dev
   ```

## Netlify Deployment

`netlify.toml` is pre-configured for zero-config deployment:

- Build command: `npm run build`
- Publish directory: `dist`
- Functions directory: `netlify/functions`
- API rewrites: `/api/gemini/ask`, `/api/gemini/personalise`, and `/api/gemini/personalize` route to Netlify Functions before the SPA fallback.
- Required Netlify Environment Variable: `GEMINI_API_KEY` (server-side only).

## Security Model

- **Server-Only Secrets**: `GEMINI_API_KEY` is read exclusively in `server/geminiService.ts` (Express & Netlify Functions) and never bundled into the client.
- **Strict Headers**: Both Express and `netlify.toml` enforce `Content-Security-Policy` (restricting `connect-src` to `'self'` and `https://air-quality-api.open-meteo.com`), `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`, and `X-Frame-Options: DENY` in production.
- **Input Validation & Abuse Controls**: 16 KB JSON body limit, runtime payload validation (1 to 500 char questions, AQI 0 to 500), control-character stripping with `<user_question>` prompt delimiters, and a per-IP sliding-window rate limiter (20 requests/minute with HTTP 429 + `Retry-After`).
- **Safe Rendering**: Zero `dangerouslySetInnerHTML`; household profile, checklist, and swap selections stay locally in the user's browser.

## Accessibility (WCAG 2.1 AA / AAA)

- Visible-on-focus **Skip to main content** link and semantic landmarks (`<header>`, `<nav>`, `<main>`, `<footer>`).
- Full WAI-ARIA `tablist` supporting `ArrowLeft`, `ArrowRight`, `Home`, and `End` keyboard navigation.
- Focus-trapped modal dialogs (`Household`, `Checklist`, `Settings`) with `Escape` dismissal and automatic focus restoration.
- Accessible **Next 24 Hours** AQI chart combining keyboard-focusable bars with a screen-reader-accessible data `<table>`.
- Polite `aria-live` status announcements for AQI updates, Copy Plan feedback, and Ask progress.
- **High Contrast** theme achieving >= 7:1 contrast with crisp 2px borders and full `prefers-reduced-motion` support.

## Quality & Testing Commands

```bash
npm run lint          # Strict ESLint + TypeScript typecheck (tsc --noEmit)
npm test              # Full Vitest unit, security, React integration, and axe-core suite
npm run test:coverage # Run test suite with v8 coverage report
npm run build         # Production Vite bundle
```
