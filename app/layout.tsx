import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { AppShell } from "@/components/app-shell";
import { DataProvider } from "@/components/data-provider";
import { ThemeProvider } from "next-themes";
import { catalogPayload } from "@/lib/catalog";
import { BUILTIN_MISSIONS } from "@/lib/missions";
import { COMMANDS } from "@/lib/types";
import { readStore } from "@/lib/store";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SIM Flight Testing",
  description:
    "Checklist and result-recording app for SIM flight tests. SkyCommand stays separate.",
};

export const dynamic = "force-dynamic";

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const store = await readStore();
  const { tests, states, phasesByState } = catalogPayload(store.customTests);

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`dark ${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} forcedTheme="dark">
        <TooltipProvider>
          <DataProvider
            initial={{
              store,
              catalog: {
                tests,
                missions: BUILTIN_MISSIONS,
                states,
                phasesByState,
                commands: [...COMMANDS],
              },
            }}
          >
            <AppShell>{children}</AppShell>
            <Toaster />
          </DataProvider>
        </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
