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

// For multipart/form-data (e.g. audio upload) — let browser set Content-Type with boundary
export function authedFormFetch(url: string, formData: FormData, token: string) {
  return fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
}
