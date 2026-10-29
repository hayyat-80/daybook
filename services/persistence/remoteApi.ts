function apiBase(): string {
  const fromEnv = process.env.NEXT_PUBLIC_API_URL;
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  if (typeof window !== "undefined") return window.location.origin;
  return "";
}

function secretHeader(): Record<string, string> {
  const secret = process.env.NEXT_PUBLIC_API_SECRET;
  return secret ? { "x-api-secret": secret } : {};
}

export function isRemoteDbEnabled(): boolean {
  return process.env.NEXT_PUBLIC_USE_REMOTE_DB === "1";
}

async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${apiBase()}${path}`, {
    headers: { ...secretHeader() },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`GET ${path} failed (${res.status})`);
  return (await res.json()) as T;
}

async function apiPut(path: string, body: unknown): Promise<void> {
  const res = await fetch(`${apiBase()}${path}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...secretHeader(),
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    let detail = "";
    try {
      const data = (await res.json()) as { error?: string };
      detail = data.error ? `: ${data.error}` : "";
    } catch {
      // ignore
    }
    throw new Error(`PUT ${path} failed (${res.status})${detail}`);
  }
}

export { apiGet, apiPut };
