import { executePersonaliseRequest } from '../../server/geminiService.ts';
import {
  handleNetlifyJsonPost,
  type NetlifyHandlerOptions,
} from '../../server/security.ts';

export type { NetlifyHandlerOptions };

/**
 * Netlify Function handler for `POST /api/gemini/personalise`.
 * Delegates HTTP validation, rate limiting, and security headers to `handleNetlifyJsonPost`.
 */
export async function handlePersonaliseNetlifyRequest(
  request: Request,
  options?: NetlifyHandlerOptions
): Promise<Response> {
  return handleNetlifyJsonPost(request, executePersonaliseRequest, options);
}

/** Default Netlify Functions v2 entrypoint for `/api/gemini/personalise`. */
export default async function handler(request: Request): Promise<Response> {
  return handlePersonaliseNetlifyRequest(request);
}
