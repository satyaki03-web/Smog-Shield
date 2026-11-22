# Smog Shield

Smog Shield is a calm, accessible urban air-quality and winter-smog planner built for families and Resident Welfare Associations (RWAs). It pairs live keyless Open-Meteo hourly air quality forecasts (mapped to Indian CPCB AQI bands) with a deterministic public-health rule engine, quantified personal and community impact tracking, and a server-proxied Gemini Q&A advisor.

## Tech Stack

- **Frontend**: React 19, TypeScript 5 (strict mode), Vite 8, Tailwind CSS 4
- **Backend / Serverless**: Express 4 (`server.ts` for local/Node hosting) and Netlify Functions v2 (`netlify/functions/`) sharing one server core (`server/`)
- **AI Proxy**: `@google/genai` SDK with an ordered fallback chain (`gemini-3.5-flash-lite` with minimal thinking -> `gemini-flash-latest`) and strict 10-second per-attempt `AbortController` timeouts
- **Testing & Quality**: Vitest 5, Testing Library, `axe-core` WCAG automated audits, ESLint 10 (`typescript-eslint`)

## Project Structure

```text
.
├── index.html                  # SPA entry point and typography links
├── server.ts                   # Express dev/production server mounting Vite middleware
├── netlify.toml                # Netlify build config, API rewrites, and security headers
├── netlify/functions/          # Thin Netlify Function wrappers (ask.ts, personalise.ts)
├── server/
│   ├── geminiService.ts        # Shared request validation, prompt builder, and Gemini fallback chain
│   ├── security.ts             # Shared CSP/security headers, rate limiter, and Netlify POST handler
│   └── geminiService.test.ts   # Server, fallback, timeout, rate-limit, and Netlify handler tests
└── src/
    ├── types/                  # Strict TypeScript domain and API interfaces
    ├── constants/              # Curated Indian cities, CPCB defaults, diurnal curves, TTLs
    ├── domain/                 # Deterministic AQI bands, recommendations, impact, and Ask helpers
    ├── services/               # Open-Meteo TTL-cached client and bounded Ask/Personalise clients
    ├── hooks/                  # useAqiData, useHouseholdProfile, useChecklist, useTheme, useFocusTrap
    ├── components/             # Modular tabs, hourly chart, impact banner, modals, ErrorBoundary
    └── test/                   # Vitest jsdom setup
```

## Environment Variables

Copy `.env.example` to `.env` for local development. Never prefix secrets with `VITE_`.

| Variable | Required | Description |
| --- | --- | --- |
| `GEMINI_API_KEY` | For live AI answers | Server-side Google Gemini API key (read exclusively in `server/geminiService.ts`; falls back cleanly to deterministic Quick Guidance if absent). |
| `PORT` | Optional | Local Express server port (defaults to `3000`). |
| `DISABLE_HMR` | Optional | Set to `true` in proxied preview environments to disable dev HMR/WebSockets. |

## Local Development

1. Install dependencies (Node.js 22+ recommended):
   ```bash
   npm install
   ```
2. Configure environment variables:
   ```bash
   cp .env.example .env
   # Add GEMINI_API_KEY in .env
   ```
3. Start the full-stack Express + Vite server on port 3000:
   ```bash
   npm run dev
   ```

## Scripts

```bash
npm run dev           # Start Express + Vite dev server on port 3000
npm run start         # Run Express server against built dist/ bundle
npx tsc --noEmit      # Run strict TypeScript typecheck
npm run lint          # Run ESLint + strict TypeScript typecheck
npm test              # Run Vitest unit, security, React integration, and axe-core tests
npm run test:coverage # Run test suite with v8 coverage report
npm run build         # Build production Vite bundle into dist/
npm run preview       # Preview the built dist/ bundle locally
npm run clean         # Remove build artifacts (dist/ and server.js)
```

## Netlify Deployment

`netlify.toml` is pre-configured for zero-config deployment:

- **Build command**: `npm run build`
- **Publish directory**: `dist`
- **Functions directory**: `netlify/functions`
- **API rewrites**: `/api/gemini/ask`, `/api/gemini/personalise`, and `/api/gemini/personalize` route to Netlify Functions before the SPA fallback.
- **Required Netlify environment variable**: `GEMINI_API_KEY` (server-side only).

## Security & Accessibility Highlights

- **Server-Only Secrets**: `GEMINI_API_KEY` stays strictly server-side and is never exposed in client bundles.
- **Defense in Depth**: Shared CSP, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy`, `X-Frame-Options: DENY` (in production), 16 KB body limit, runtime payload validation, `<user_question>` prompt isolation, and a 20 req/min sliding-window per-IP rate limiter.
- **WCAG 2.1 AA / AAA**: Skip link, semantic landmarks, WAI-ARIA `tablist` keyboard navigation, focus-trapped modals with `Escape` dismissal, screen-reader data table alongside the 24-hour AQI chart, polite `aria-live` updates, Light/Dark/High Contrast themes, and `prefers-reduced-motion` support.
