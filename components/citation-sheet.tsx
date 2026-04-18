"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import type { Source } from "@/lib/types";
import { ExternalLink } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sources: Source[];
}

export function CitationSheet({ open, onOpenChange, sources }: Props) {

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Sources & Citations</SheetTitle>
        </SheetHeader>
        <div className="mt-4 space-y-4">
          {sources.map((source) => (
            <div
              key={source.id}
              className="rounded-lg border border-border p-3 space-y-1.5"
            >
              <h4 className="text-sm font-medium leading-tight">
                {source.title}
              </h4>
              <p className="text-xs text-muted-foreground">
                {source.org} · {source.year}
                {source.authors && ` · ${source.authors}`}
              </p>
              {source.keyFindings && (
                <p className="text-xs text-muted-foreground italic">
                  {source.keyFindings}
                </p>
              )}
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-[10px]">
                  {source.type}
                </Badge>
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                >
                  Open source <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          ))}
          {sources.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No sources found for this metric.
            </p>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
