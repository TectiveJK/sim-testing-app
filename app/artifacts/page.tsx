"use client";

import { PageHeader } from "@/components/page-header";
import { ArtifactEditor } from "@/components/artifact-editor";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAppData } from "@/components/data-provider";
import { cn } from "@/lib/utils";

export default function ArtifactsPage() {
  const { store } = useAppData();

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        eyebrow="Build tracking"
        title="Last successful artifacts"
        description="Keep the current known-good SkyCommand / SIM .deb filenames here. Every new test run snapshots this list so you can see which packages were in play when a result was recorded."
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
          <form action="/api/artifacts" method="post" className="space-y-4">
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
