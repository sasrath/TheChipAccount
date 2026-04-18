const WINDOW_MS = 60_000; // 60 seconds
const MAX_REQUESTS = 10;

type Entry = {
  count: number;
  windowStart: number;
};

const store = new Map<string, Entry>();

export function checkRateLimit(ip: string): {
  ok: boolean;
  retryAfterMs?: number;
} {
  const now = Date.now();
  const entry = store.get(ip);

  if (!entry || now - entry.windowStart > WINDOW_MS) {
    store.set(ip, { count: 1, windowStart: now });
    return { ok: true };
  }

  if (entry.count >= MAX_REQUESTS) {
    const retryAfterMs = WINDOW_MS - (now - entry.windowStart);
    return { ok: false, retryAfterMs };
  }

  entry.count++;
  return { ok: true };
}
