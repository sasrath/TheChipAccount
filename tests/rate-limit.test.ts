/**
 * tests/rate-limit.test.ts
 * Tests lib/rate-limit.ts — the sliding-window IP rate limiter used by
 * the /api/chat and /api/explain endpoints.
 */

import { checkRateLimit } from "@/lib/rate-limit";

// Fake clock helpers
const realDateNow = Date.now;
let mockTime = Date.now();

beforeAll(() => {
  jest.spyOn(Date, "now").mockImplementation(() => mockTime);
});

afterAll(() => {
  jest.restoreAllMocks();
});

describe("checkRateLimit", () => {
  // Use a unique IP for each describe block to avoid state leakage
  const baseIp = "test-ip-ratelimit";

  test("first request is always allowed", () => {
    const result = checkRateLimit(`${baseIp}-1`);
    expect(result.ok).toBe(true);
    expect(result.retryAfterMs).toBeUndefined();
  });

  test("requests within the window are allowed up to MAX_REQUESTS (10)", () => {
    const ip = `${baseIp}-2`;
    for (let i = 0; i < 10; i++) {
      const result = checkRateLimit(ip);
      expect(result.ok).toBe(true);
    }
  });

  test("11th request within the window is rejected", () => {
    const ip = `${baseIp}-3`;
    for (let i = 0; i < 10; i++) checkRateLimit(ip);
    const result = checkRateLimit(ip);
    expect(result.ok).toBe(false);
  });

  test("retryAfterMs is positive when rejected", () => {
    const ip = `${baseIp}-4`;
    for (let i = 0; i < 10; i++) checkRateLimit(ip);
    const result = checkRateLimit(ip);
    expect(result.ok).toBe(false);
    expect(result.retryAfterMs).toBeGreaterThan(0);
  });

  test("requests reset after the window (60s) elapses", () => {
    const ip = `${baseIp}-5`;
    for (let i = 0; i < 10; i++) checkRateLimit(ip);
    expect(checkRateLimit(ip).ok).toBe(false);

    // Advance clock by 61 seconds
    mockTime += 61_000;
    expect(checkRateLimit(ip).ok).toBe(true);
  });

  test("different IPs are tracked independently", () => {
    const ipA = `${baseIp}-6a`;
    const ipB = `${baseIp}-6b`;
    for (let i = 0; i < 10; i++) checkRateLimit(ipA);
    expect(checkRateLimit(ipA).ok).toBe(false);
    // ipB is unaffected
    expect(checkRateLimit(ipB).ok).toBe(true);
  });
});
