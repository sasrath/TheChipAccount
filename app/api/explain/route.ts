import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getChip } from "@/lib/data";
import { computeFootprint } from "@/lib/compute";
import { streamGemini } from "@/lib/gemini";
import {
  buildExplainSystemInstruction,
  buildExplainUserMessage,
} from "@/lib/prompts/explain";
import { checkRateLimit } from "@/lib/rate-limit";
import { log } from "@/lib/log";

const RequestSchema = z.object({
  chipId: z.string().min(1).max(100),
});

export async function POST(request: NextRequest) {
  try {
    // Rate limit
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      "unknown";
    const rl = checkRateLimit(ip);
    if (!rl.ok) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Try again shortly." },
        { status: 429, headers: { "Retry-After": String(Math.ceil((rl.retryAfterMs ?? 60000) / 1000)) } }
      );
    }

    // Validate input
    const body = await request.json();
    const parsed = RequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    // Load chip data
    const chip = getChip(parsed.data.chipId);
    if (!chip) {
      return NextResponse.json({ error: "Chip not found" }, { status: 404 });
    }

    const footprint = computeFootprint(chip);
    const systemInstruction = buildExplainSystemInstruction();
    const userMessage = buildExplainUserMessage(footprint);

    const geminiStream = await streamGemini(systemInstruction, userMessage);

    // Convert to a web-standard ReadableStream<Uint8Array> for the response
    const encoder = new TextEncoder();
    const responseStream = geminiStream.pipeThrough(
      new TransformStream<string, Uint8Array>({
        transform(chunk, controller) {
          controller.enqueue(encoder.encode(chunk));
        },
      })
    );

    return new Response(responseStream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
      },
    });
  } catch (err) {
    log.error("Explain API error:", err);

    if (err instanceof Error && err.message === "GEMINI_API_KEY is not configured") {
      return NextResponse.json(
        { error: "LLM not configured" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
