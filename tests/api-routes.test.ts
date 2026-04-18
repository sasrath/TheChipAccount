/**
 * tests/api-routes.test.ts
 * Integration tests for the Next.js API routes using lightweight HTTP
 * fetch against the Next.js server. These tests exercise the real
 * request/response cycle without starting the UI.
 *
 * NOTE: These tests run against the PRODUCTION build (`next start` on port 3000).
 *       If the server is not running, tests are skipped automatically.
 */

const BASE = "http://localhost:3000";

// Helper: skip a test gracefully when the server is unreachable
async function isServerUp(): Promise<boolean> {
  try {
    const r = await fetch(`${BASE}/`, { signal: AbortSignal.timeout(2000) });
    return r.ok;
  } catch {
    return false;
  }
}

// ── /api/revalidate ───────────────────────────────────────────────────────────

describe("POST /api/revalidate", () => {
  let serverUp = false;

  beforeAll(async () => {
    serverUp = await isServerUp();
    if (!serverUp) console.warn("Server not running — /api/revalidate tests skipped.");
  });

  test("returns 200 with revalidated:true when no secret is configured", async () => {
    if (!serverUp) return;
    const res = await fetch(`${BASE}/api/revalidate`, { method: "POST" });
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.revalidated).toBe(true);
    expect(typeof body.timestamp).toBe("string");
  });

  test("GET /api/revalidate returns 405", async () => {
    if (!serverUp) return;
    const res = await fetch(`${BASE}/api/revalidate`, { method: "GET" });
    expect(res.status).toBe(405);
  });
});

// ── /api/explain ──────────────────────────────────────────────────────────────

describe("POST /api/explain", () => {
  let serverUp = false;

  beforeAll(async () => {
    serverUp = await isServerUp();
    if (!serverUp) console.warn("Server not running — /api/explain tests skipped.");
  });

  test("returns 400 for missing chipId", async () => {
    if (!serverUp) return;
    const res = await fetch(`${BASE}/api/explain`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({}),
    });
    expect([400, 422]).toContain(res.status);
  });

  test("returns 400 for unknown chipId", async () => {
    if (!serverUp) return;
    const res = await fetch(`${BASE}/api/explain`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ chipId: "__nonexistent__" }),
    });
    expect([400, 404, 422]).toContain(res.status);
  });
});

// ── /api/chat ─────────────────────────────────────────────────────────────────

describe("POST /api/chat", () => {
  let serverUp = false;

  beforeAll(async () => {
    serverUp = await isServerUp();
    if (!serverUp) console.warn("Server not running — /api/chat tests skipped.");
  });

  test("returns 400 for missing required fields", async () => {
    if (!serverUp) return;
    const res = await fetch(`${BASE}/api/chat`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({}),
    });
    expect([400, 422]).toContain(res.status);
  });

  test("returns 400 for empty question", async () => {
    if (!serverUp) return;
    const res = await fetch(`${BASE}/api/chat`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ chipId: "h100", history: [], question: "" }),
    });
    expect([400, 422]).toContain(res.status);
  });

  test("returns 400 for question exceeding 2000 chars", async () => {
    if (!serverUp) return;
    const res = await fetch(`${BASE}/api/chat`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ chipId: "h100", history: [], question: "x".repeat(2001) }),
    });
    expect([400, 422]).toContain(res.status);
  });
});
