import { ExternalLink } from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-border bg-muted/30">
      <div className="mx-auto max-w-6xl px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-4">
          <span>
            Built for the{" "}
            <a
              href="https://dev.to/challenges/earthday"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline inline-flex items-center gap-0.5"
            >
              DEV Earth Day Challenge
              <ExternalLink className="h-3 w-3" />
            </a>
          </span>
          <span className="hidden sm:inline">·</span>
          <a
            href="/about"
            className="text-primary hover:underline"
          >
            Methodology
          </a>
        </div>
        <div className="flex items-center gap-4">
          <span>
            Numbers are illustrative estimates, not audit-grade. See{" "}
            <a href="/about" className="text-primary hover:underline">
              methodology
            </a>
            .
          </span>
        </div>
      </div>
      <div className="mx-auto max-w-6xl px-4 pb-4 text-[10px] text-muted-foreground/60 text-center sm:text-right">
        AI explanations powered by the Gemini free tier — limits apply: 5 requests/min, 250k tokens/min, 20 requests/day. Responses may be slow or unavailable under heavy load.
      </div>
    </footer>
  );
}
