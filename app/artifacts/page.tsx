"use client";

import { PageHeader } from "@/components/page-header";
import { ArtifactEditor } from "@/components/artifact-editor";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { useAppData } from "@/components/data-provider";
import { cn } from "@/lib/utils";
import type { DebArtifact } from "@/lib/types";

export default function ArtifactsPage() {
  const { store, saveArtifacts } = useAppData();

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        eyebrow="Build tracking"
        title="Last successful artifacts"
        description="Optional labels for the last successful .deb packages. They are copied onto each test run for your records. This app does not install or talk to those packages."
      />

      <Card>
        <CardHeader>
          <CardTitle>Editable package list</CardTitle>
          <CardDescription>
            Change either the package name or the full filename after each successful build. Add extra
            fields if more services join the release.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-4"
            onSubmit={async (event) => {
              event.preventDefault();
              const form = new FormData(event.currentTarget);
              const count = Number(form.get("count") || 0);
              const artifacts: DebArtifact[] = [];
              for (let index = 0; index < count; index += 1) {
                artifacts.push({
                  id: String(form.get(`id-${index}`) || crypto.randomUUID()),
                  packageName: String(form.get(`packageName-${index}`) || ""),
                  filename: String(form.get(`filename-${index}`) || ""),
                });
              }
              try {
                await saveArtifacts(artifacts);
                toast.success("Artifacts saved");
              } catch (error) {
                toast.error(error instanceof Error ? error.message : "Could not save artifacts");
              }
            }}
          >
            <ArtifactEditor artifacts={store.artifacts} onChange={() => undefined} />
            <div className="flex justify-end">
              <button type="submit" data-testid="save-artifacts" className={cn(buttonVariants())}>
                Save artifacts
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
