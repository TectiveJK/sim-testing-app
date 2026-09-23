"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function ViewTabs({
  value,
  onChange,
  items,
}: {
  value: string;
  onChange: (value: string) => void;
  items: { value: string; label: string }[];
}) {
  return (
    <div className="inline-flex h-8 w-fit items-center rounded-lg bg-muted p-[3px] text-muted-foreground">
      {items.map((item) => {
        const active = item.value === value;
        return (
          <button
            key={item.value}
            type="button"
            onClick={() => onChange(item.value)}
            className={cn(
              "inline-flex h-[calc(100%-1px)] items-center rounded-md px-2.5 text-sm font-medium",
              active ? "bg-background text-foreground shadow-sm" : "hover:text-foreground",
            )}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}

export function ViewPanel({
  when,
  active,
  children,
}: {
  when: string;
  active: string;
  children: ReactNode;
}) {
  if (when !== active) return null;
  return <div className="mt-4">{children}</div>;
}
