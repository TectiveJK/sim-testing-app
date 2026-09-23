"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function ViewTabs({
  value,
  items,
}: {
  value: string;
  items: { value: string; label: string; href: string }[];
}) {
  return (
    <div className="inline-flex h-8 w-fit items-center rounded-lg bg-muted p-[3px] text-muted-foreground">
      {items.map((item) => {
        const active = item.value === value;
        return (
          <Link
            key={item.value}
            href={item.href}
            data-testid={`tab-${item.value}`}
            className={cn(
              "inline-flex h-[calc(100%-1px)] items-center rounded-md px-2.5 text-sm font-medium",
              active ? "bg-background text-foreground shadow-sm" : "hover:text-foreground",
            )}
          >
            {item.label}
          </Link>
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

export function queryHref(
  pathname: string,
  current: { toString(): string },
  patch: Record<string, string | null>,
) {
  const next = new URLSearchParams(current.toString());
  for (const [key, value] of Object.entries(patch)) {
    if (value === null) next.delete(key);
    else next.set(key, value);
  }
  const query = next.toString();
  return query ? `${pathname}?${query}` : pathname;
}
