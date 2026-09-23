"use client";

import { useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { ArtifactEditor } from "@/components/artifact-editor";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAppData } from "@/components/data-provider";
import type { DebArtifact } from "@/lib/types";

export default function ArtifactsPage() {
  const { store, saveArtifacts } = useAppData();
  return (
    <ArtifactsForm
      key={store.artifacts.map((item) => `${item.id}:${item.packageName}:${item.filename}`).join("|")}
      initial={store.artifacts}
      onSave={saveArtifacts}
    />
  );
}

function ArtifactsForm({
  initial,
  onSave,
}: {
  initial: DebArtifact[];
  onSave: (artifacts: DebArtifact[]) => Promise<void>;
}) {
  const [artifacts, setArtifacts] = useState(initial);
  const [saving, setSaving] = useState(false);

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
        <CardContent className="space-y-4">
          <ArtifactEditor artifacts={artifacts} onChange={setArtifacts} />
          <div className="flex justify-end">
            <Button
              disabled={saving}
              onClick={async () => {
                setSaving(true);
                try {
                  await onSave(artifacts);
                  toast.success("Last successful artifacts updated");
                } catch (error) {
                  toast.error(error instanceof Error ? error.message : "Could not save");
                } finally {
                  setSaving(false);
                }
              }}
            >
              {saving ? "Saving…" : "Save artifacts"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
