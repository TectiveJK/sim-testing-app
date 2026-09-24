"use client";

import { Check, Copy, ExternalLink } from "lucide-react";
import { useState } from "react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { OPEN_APP_URL, SHARE_URL } from "@/lib/share";

export function ShareAppLink({
  compact = false,
  className,
}: {
  compact?: boolean;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(OPEN_APP_URL);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copy this link:", OPEN_APP_URL);
    }
  }

  if (compact) {
    return (
      <div className={cn("space-y-2", className)}>
        <a
          href={OPEN_APP_URL}
          target="_blank"
          rel="noreferrer"
          data-testid="share-app-link"
          className={cn(buttonVariants({ variant: "outline", size: "sm" }), "w-full")}
        >
          <ExternalLink />
          Open app
        </a>
        <button
          type="button"
          data-testid="copy-share-link"
          onClick={() => void copyLink()}
          className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "w-full")}
        >
          {copied ? <Check /> : <Copy />}
          {copied ? "Copied" : "Copy link"}
        </button>
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground" htmlFor="share-app-url">
        Open this app
      </label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          id="share-app-url"
          readOnly
          value={OPEN_APP_URL}
          onFocus={(event) => event.currentTarget.select()}
          className="h-8 min-w-0 flex-1 rounded-lg border bg-background px-2.5 font-mono text-xs"
        />
        <div className="flex gap-2">
          <button
            type="button"
            data-testid="copy-share-link"
            onClick={() => void copyLink()}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            {copied ? <Check /> : <Copy />}
            {copied ? "Copied" : "Copy link"}
          </button>
          <a
            href={OPEN_APP_URL}
            target="_blank"
            rel="noreferrer"
            data-testid="share-app-link"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            <ExternalLink />
            Open
          </a>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        Bookmark this address. It is the app itself and does not expire. Source code is at {SHARE_URL}.
      </p>
    </div>
  );
}
