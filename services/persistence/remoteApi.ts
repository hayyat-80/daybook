function apiBase(): string {
  const fromEnv = process.env.NEXT_PUBLIC_API_URL;
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  if (typeof window !== "undefined") return window.location.origin;
  return "";
}

function redirectToLoginIfUnauthorized(status: number): void {
  if (status !== 401) return;
  if (typeof window === "undefined") return;
  if (window.location.pathname === "/login") return;
  const next = `${window.location.pathname}${window.location.search}`;
  const params = next && next !== "/" ? `?next=${encodeURIComponent(next)}` : "";
  window.location.assign(`/login${params}`);
}

export function isRemoteDbEnabled(): boolean {
  return process.env.NEXT_PUBLIC_USE_REMOTE_DB === "1";
}

async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${apiBase()}${path}`, {
    credentials: "same-origin",
    cache: "no-store",
  });
  if (!res.ok) {
    redirectToLoginIfUnauthorized(res.status);
    throw new Error(`GET ${path} failed (${res.status})`);
  }
  return (await res.json()) as T;
}

async function apiPut(path: string, body: unknown): Promise<void> {
  const res = await fetch(`${apiBase()}${path}`, {
    method: "PUT",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    redirectToLoginIfUnauthorized(res.status);
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
