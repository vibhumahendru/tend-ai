/**
 * Backend base URL.
 * Set NEXT_PUBLIC_API_URL in .env.local (dev) or Vercel env vars (prod).
 * Falls back to localhost for local development.
 */
export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
