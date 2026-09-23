"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  Boxes,
  ClipboardList,
  GitCompare,
  History,
  LayoutDashboard,
  Menu,
  Plane,
  Route,
} from "lucide-react";
import { useState } from "react";
import { ShareAppLink } from "@/components/share-app-link";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/catalog", label: "Test catalog", icon: ClipboardList },
  { href: "/missions", label: "Missions", icon: Route },
  { href: "/runs", label: "Test runs", icon: Activity },
  { href: "/compare", label: "Compare runs", icon: GitCompare },
  { href: "/history", label: "History", icon: History },
  { href: "/artifacts", label: "Last artifacts", icon: Boxes },
];

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-1">
      {NAV.map((item) => {
        const active =
          item.href === "/"
            ? pathname === "/"
            : pathname === item.href || pathname.startsWith(`${item.href}/`);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
              active
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground/75 hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground",
            )}
          >
            <Icon className="size-4 shrink-0" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-full">
      <aside className="sticky top-0 hidden h-svh w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar px-4 py-5 md:flex">
        <Link href="/" className="mb-6 flex items-center gap-3 px-2">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Plane className="size-4" />
          </div>
          <div>
            <div className="text-sm font-semibold tracking-tight">SIM Flight Testing</div>
            <div className="text-xs text-muted-foreground">Test checklist</div>
          </div>
        </Link>
        <NavLinks />
        <Separator className="my-5" />
        <p className="mb-4 px-2 text-xs leading-relaxed text-muted-foreground">
          Checklist only. Read the procedure, do the test in SkyCommand on the other monitor, then
          record PASS / FAIL / BLOCKED / NOT TESTED here.
        </p>
        <ShareAppLink compact />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b bg-background/90 px-4 py-3 backdrop-blur md:hidden">
          <Button variant="outline" size="icon-sm" onClick={() => setOpen(true)}>
            <Menu />
          </Button>
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Plane className="size-4" />
            SIM Flight Testing
          </div>
        </header>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetContent side="left" className="w-72 bg-sidebar">
            <SheetHeader>
              <SheetTitle>SIM Flight Testing</SheetTitle>
            </SheetHeader>
            <div className="px-2 pb-6">
              <NavLinks onNavigate={() => setOpen(false)} />
              <Separator className="my-5" />
              <ShareAppLink compact />
            </div>
          </SheetContent>
        </Sheet>
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
