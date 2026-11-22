import { executeAskRequest } from '../../server/geminiService.ts';
import {
  handleNetlifyJsonPost,
  type NetlifyHandlerOptions,
} from '../../server/security.ts';

export type { NetlifyHandlerOptions };

/**
 * Netlify Function handler for `POST /api/gemini/ask`.
 * Delegates HTTP validation, rate limiting, and security headers to `handleNetlifyJsonPost`.
 */
export async function handleAskNetlifyRequest(
  request: Request,
  options?: NetlifyHandlerOptions
): Promise<Response> {
  return handleNetlifyJsonPost(request, executeAskRequest, options);
}

/** Default Netlify Functions v2 entrypoint for `/api/gemini/ask`. */
export default async function handler(request: Request): Promise<Response> {
  return handleAskNetlifyRequest(request);
}
