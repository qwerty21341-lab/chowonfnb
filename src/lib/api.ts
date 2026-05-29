const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

function fetchWithTimeout(url: string, options: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { ...options, signal: controller.signal }).finally(() => clearTimeout(timer));
}

export const api = {
  async post<T>(path: string, body: unknown, timeoutMs = 30000): Promise<T> {
    const res = await fetchWithTimeout(
      `${BASE_URL}${path}`,
      { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) },
      timeoutMs
    );
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.detail || `오류 (${res.status})`);
    }
    return res.json();
  },

  async get<T>(path: string, timeoutMs = 30000): Promise<T> {
    const res = await fetchWithTimeout(`${BASE_URL}${path}`, {}, timeoutMs);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.detail || `오류 (${res.status})`);
    }
    return res.json();
  },
};
