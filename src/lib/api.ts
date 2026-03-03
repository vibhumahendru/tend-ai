export const API_BASE = "https://lbs-ai-core.onrender.com";

export function authedFetch(url: string, options: RequestInit = {}, token: string) {
  return fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options.headers ?? {}),
    },
  });
}
