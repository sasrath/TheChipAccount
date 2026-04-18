"use client";

import { useState, useRef, useCallback, type FormEvent } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageCircle, Send, Loader2 } from "lucide-react";
import type { ChatMessage } from "@/lib/types";

interface Props {
  chipId: string;
}

export function Chat({ chipId }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const question = input.trim();
    if (!question || streaming) return;

    setInput("");
    const userMsg: ChatMessage = { role: "user", content: question };
    setMessages((prev) => [...prev, userMsg]);
    setStreaming(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chipId,
          history: messages,
          question,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `HTTP ${res.status}`);
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response stream");

      const decoder = new TextDecoder();
      let accum = "";

      // Add placeholder for assistant message
      setMessages((prev) => [...prev, { role: "model", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accum += decoder.decode(value, { stream: true });
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: "model", content: accum };
          return updated;
        });
        scrollToBottom();
      }
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Something went wrong";
      setMessages((prev) => [
        ...prev,
        { role: "model", content: `Error: ${errorMsg}` },
      ]);
    } finally {
      setStreaming(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <MessageCircle className="h-4 w-4 text-primary" />
          <CardTitle className="text-base">
            Ask about this chip
          </CardTitle>
        </div>
        <p className="text-xs text-muted-foreground">
          Ask questions grounded in the manufacturing data above. Powered by
          Google Gemini.
        </p>
      </CardHeader>
      <CardContent>
        {messages.length > 0 && (
          <ScrollArea className="h-[300px] mb-4 rounded-md border p-3" ref={scrollRef}>
            <div className="space-y-3">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`text-sm ${
                    msg.role === "user"
                      ? "text-foreground font-medium"
                      : "text-muted-foreground"
                  }`}
                >
                  <span className="text-xs font-semibold text-primary mr-1">
                    {msg.role === "user" ? "You:" : "Gemini:"}
                  </span>
                  {msg.content || (
                    <Loader2 className="inline h-3 w-3 animate-spin" />
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="e.g., Why does EUV use so much energy?"
            disabled={streaming}
            className="flex-1"
          />
          <Button type="submit" size="sm" disabled={streaming || !input.trim()}>
            {streaming ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
