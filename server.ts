import 'dotenv/config';
import express, { type Express, type Request, type Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  ASK_MODEL_CHAIN,
  executeAskRequest,
  executePersonaliseRequest,
  isGeminiConfigured,
} from './server/geminiService.ts';
import {
  buildSecurityHeaders,
  extractClientIp,
  isJsonContentType,
  MAX_API_BODY_BYTES,
  SlidingWindowRateLimiter,
  type JsonServiceExecutor,
} from './server/security.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = Number(process.env.PORT ?? 3000);

const NOOP_VITE_CLIENT = [
  'const sheetsMap = new Map();',
  'export function updateStyle(id, content) {',
  '  let style = sheetsMap.get(id);',
  '  if (!style) {',
  '    style = document.createElement("style");',
  '    style.setAttribute("type", "text/css");',
  '    style.setAttribute("data-vite-dev-id", id);',
  '    style.textContent = content;',
  '    document.head.appendChild(style);',
  '    sheetsMap.set(id, style);',
  '  } else {',
  '    style.textContent = content;',
  '  }',
  '}',
  'export function removeStyle(id) {',
  '  const style = sheetsMap.get(id);',
  '  if (style) {',
  '    document.head.removeChild(style);',
  '    sheetsMap.delete(id);',
  '  }',
  '}',
  'export function injectQuery(url) { return url; }',
  'export function createHotContext() {',
  '  return {',
  '    data: {}, accept() {}, acceptExports() {}, dispose() {}, prune() {},',
  '    invalidate() {}, on() {}, off() {}, send() {},',
  '  };',
  '}',
  'export class ErrorOverlay extends HTMLElement {}',
].join('\n');

function applySecurityMiddleware(app: Express, isDev: boolean): void {
  const allowIframe = isDev || process.env.DISABLE_HMR === 'true';
  const securityHeaders = buildSecurityHeaders({ isDev, allowIframe });
  const rateLimiter = new SlidingWindowRateLimiter();

  app.disable('x-powered-by');
  app.use((_req: Request, res: Response, next: () => void) => {
    for (const [header, value] of Object.entries(securityHeaders)) {
      res.setHeader(header, value);
    }
    next();
  });

  app.use(express.json({ limit: MAX_API_BODY_BYTES }));
  app.use((err: unknown, _req: Request, res: Response, next: (e?: unknown) => void) => {
    if (err && typeof err === 'object' && 'type' in err && (err as { type?: string }).type === 'entity.too.large') {
      res.status(413).json({ error: 'Request payload exceeds the 16 KB limit.' });
      return;
    }
    if (err instanceof SyntaxError && 'status' in err) {
      res.status(400).json({ error: 'Invalid JSON request payload.' });
      return;
    }
    next(err);
  });

  app.use('/api/gemini', (req: Request, res: Response, next: () => void) => {
    const clientIp = extractClientIp(req.headers['x-forwarded-for'], req.ip || req.socket.remoteAddress);
    const decision = rateLimiter.check(clientIp);
    if (!decision.allowed) {
      res.setHeader('Retry-After', String(decision.retryAfterSec));
      res.status(429).json({
        error: 'Too many AI requests. Please wait a moment and try again.',
      });
      return;
    }
    next();
  });
}

function createGeminiRouteHandler<T>(executor: JsonServiceExecutor<T>) {
  return async (req: Request, res: Response): Promise<void> => {
    const disconnectController = new AbortController();
    res.on('close', () => {
      if (!res.writableEnded) disconnectController.abort();
    });
    const result = await executor(req.body, {
      externalSignal: disconnectController.signal,
    });
    if (!res.writableEnded) {
      res.status(result.status).json(result.body);
    }
  };
}

function registerApiRoutes(app: Express): void {
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({
      ok: true,
      model: ASK_MODEL_CHAIN[0].model,
      geminiConfigured: isGeminiConfigured(),
    });
  });

  const handleMethodNotAllowed = (_req: Request, res: Response): void => {
    res.setHeader('Allow', 'POST');
    res.status(405).json({ error: 'Method not allowed.' });
  };

  app.use('/api/gemini', (req: Request, res: Response, next: () => void) => {
    if (req.method !== 'POST') {
      handleMethodNotAllowed(req, res);
      return;
    }
    if (!isJsonContentType(req.headers['content-type'])) {
      res.status(415).json({ error: 'Content-Type must be application/json.' });
      return;
    }
    next();
  });

  const handlePersonaliseRoute = createGeminiRouteHandler(executePersonaliseRequest);
  app.post('/api/gemini/personalise', handlePersonaliseRoute);
  app.post('/api/gemini/personalize', handlePersonaliseRoute);
  app.post('/api/gemini/ask', createGeminiRouteHandler(executeAskRequest));
}

async function attachFrontendMiddleware(app: Express, isDev: boolean): Promise<void> {
  if (isDev) {
    const { createServer: createViteServer } = await import('vite');
    const disableHmr = process.env.DISABLE_HMR === 'true' || Boolean(process.env.K_SERVICE);
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
        ws: false,
        watch: disableHmr ? null : {},
      },
      appType: 'spa',
    });

    app.get('/@vite/client', (_req: Request, res: Response) => {
      res.type('application/javascript; charset=utf-8').send(NOOP_VITE_CLIENT);
    });

    app.use(vite.middlewares);
    return;
  }

  const distDir = path.resolve(__dirname, 'dist');
  app.use(express.static(distDir));
  app.get('*', (_req: Request, res: Response) => {
    res.sendFile(path.join(distDir, 'index.html'));
  });
}

async function startServer(): Promise<void> {
  const app = express();
  const isDev = process.env.NODE_ENV !== 'production';

  applySecurityMiddleware(app, isDev);
  registerApiRoutes(app);
  await attachFrontendMiddleware(app, isDev);

  app.listen(PORT, '0.0.0.0', () => {
    process.stdout.write(`Smog Shield server listening on http://0.0.0.0:${PORT}\n`);
  });
}

void startServer();
