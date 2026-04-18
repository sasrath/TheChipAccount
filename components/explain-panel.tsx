"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { RefreshCw, Sparkles } from "lucide-react";

interface Props {
  chipId: string;
}

export function ExplainPanel({ chipId }: Props) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Holds the AbortController for the current in-flight request so the
  // Regenerate button can also cancel a streaming response mid-stream.
  const abortRef = useRef<AbortController | null>(null);

  const fetchExplanation = useCallback(
    async (signal?: AbortSignal) => {
      // Cancel any previous in-flight request
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      const effectiveSignal = signal ?? controller.signal;

      setText("");
      setError(null);
      setLoading(true);

      try {
        const res = await fetch("/api/explain", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chipId }),
          signal: effectiveSignal,
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || `HTTP ${res.status}`);
        }

        const reader = res.body?.getReader();
        if (!reader) throw new Error("No response stream");

        const decoder = new TextDecoder();
        let accum = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          accum += decoder.decode(value, { stream: true });
          setText(accum);
        }
      } catch (err) {
        // Ignore abort errors — they are intentional cancellations
        if (err instanceof Error && err.name === "AbortError") return;
        setError(
          err instanceof Error ? err.message : "Failed to get explanation"
        );
      } finally {
        setLoading(false);
      }
    },
    [chipId]
  );

  // Auto-fetch when chipId changes. Depend on chipId directly (not on the
  // fetchExplanation callback reference) to avoid the React 18 StrictMode
  // double-invoke triggered by the callback re-creating on every render cycle.
  // The cleanup aborts any in-flight stream when the chip changes or unmounts.
  useEffect(() => {
    const controller = new AbortController();
    fetchExplanation(controller.signal);
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chipId]);


  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <CardTitle className="text-base">Why these numbers?</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => fetchExplanation()}
            disabled={loading}
            className="h-8"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`}
            />
            Regenerate
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          AI-generated explanation powered by Google Gemini
        </p>
      </CardHeader>
      <CardContent>
        {loading && !text && (
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-[90%]" />
            <Skeleton className="h-4 w-[80%]" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-[85%]" />
          </div>
        )}
        {error && (
          <p className="text-sm text-destructive">
            Explanation unavailable: {error}
          </p>
        )}
        {text && (
          <div className="prose prose-sm max-w-none text-foreground">
            {text.split("\n\n").map((paragraph, i) => (
              <p key={i} className="text-sm leading-relaxed">
                {paragraph}
              </p>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
