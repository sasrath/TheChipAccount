import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getChip } from "@/lib/data";
import { computeFootprint } from "@/lib/compute";
import { streamGeminiChat } from "@/lib/gemini";
import {
  buildChatSystemInstruction,
  buildChatContext,
} from "@/lib/prompts/chat";
import { checkRateLimit } from "@/lib/rate-limit";
import { log } from "@/lib/log";

const MessageSchema = z.object({
  role: z.enum(["user", "model"]),
  content: z.string(),
});

const RequestSchema = z.object({
  chipId: z.string().min(1).max(100),
  history: z.array(MessageSchema).max(50),
  question: z.string().min(1).max(2000),
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

    // Validate body size
    const contentLength = request.headers.get("content-length");
    if (contentLength && parseInt(contentLength) > 8192) {
      return NextResponse.json(
        { error: "Request too large" },
        { status: 413 }
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
    const systemInstruction =
      buildChatSystemInstruction() + "\n\n" + buildChatContext(footprint);

    const geminiStream = await streamGeminiChat(
      systemInstruction,
      parsed.data.history,
      parsed.data.question
    );

    // Convert to a web-standard ReadableStream<Uint8Array>
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
    log.error("Chat API error:", err);

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
