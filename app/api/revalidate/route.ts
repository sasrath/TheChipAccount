import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { clearDataCache } from "@/lib/data";

/**
 * POST /api/revalidate
 *
 * Forces a full data reload from disk (clears the in-process JSON cache)
 * and purges Next.js's page cache so the next visitor sees updated data.
 *
 * Protect with a secret token in production:
 *   curl -X POST http://localhost:3000/api/revalidate \
 *        -H "x-revalidate-secret: <your-secret>"
 *
 * Set REVALIDATE_SECRET in .env.local (optional – omitting it leaves the
 * endpoint open, which is fine on a private / local deployment).
 */
export async function POST(request: NextRequest) {
  const secret = process.env.REVALIDATE_SECRET;

  if (secret) {
    const provided =
      request.headers.get("x-revalidate-secret") ??
      new URL(request.url).searchParams.get("secret");

    if (provided !== secret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    // 1. Drop in-process data cache so next read goes back to disk.
    clearDataCache();

    // 2. Purge Next.js page/layout cache so stale HTML is not served.
    revalidatePath("/", "layout");
    revalidatePath("/about");

    return NextResponse.json({
      revalidated: true,
      message: "Data cache cleared. Pages will re-render on next request.",
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { revalidated: false, error: message },
      { status: 500 }
    );
  }
}
