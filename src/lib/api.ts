export const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "https://lbs-ai-core.onrender.com";

export async function authedFetch(url: string, options: RequestInit = {}, token: string) {
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options.headers ?? {}),
    },
  });
  if (res.status === 401 && typeof window !== "undefined") {
    window.location.href = "/login";
    throw new Error("Unauthorized");
  }
  return res;
}

// For multipart/form-data (e.g. audio upload) — let browser set Content-Type with boundary
export async function authedFormFetch(url: string, formData: FormData, token: string) {
  const res = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
  if (res.status === 401 && typeof window !== "undefined") {
    window.location.href = "/login";
    throw new Error("Unauthorized");
  }
  return res;
}
