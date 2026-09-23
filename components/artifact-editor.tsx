"use client";

import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { DebArtifact } from "@/lib/types";

export function ArtifactEditor({
  artifacts,
  onChange,
  disabled = false,
}: {
  artifacts: DebArtifact[];
  onChange: (artifacts: DebArtifact[]) => void;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-3">
      <input type="hidden" name="count" value={artifacts.length} />
      {artifacts.map((artifact, index) => (
        <div
          key={artifact.id}
          className="grid gap-3 rounded-xl border bg-card/60 p-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)_auto]"
        >
          <input type="hidden" name={`id-${index}`} value={artifact.id} />
          <div className="space-y-1.5">
            <Label htmlFor={`${artifact.id}-pkg`} className="text-xs text-muted-foreground">
              Package
            </Label>
            <Input
              id={`${artifact.id}-pkg`}
              name={`packageName-${index}`}
              defaultValue={artifact.packageName}
              disabled={disabled}
              placeholder="autonomy-node"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`${artifact.id}-file`} className="text-xs text-muted-foreground">
              Last successful .deb filename
            </Label>
            <Input
              id={`${artifact.id}-file`}
              name={`filename-${index}`}
              data-testid={`artifact-file-${artifact.packageName || artifact.id}`}
              defaultValue={artifact.filename}
              disabled={disabled}
              placeholder="autonomy-node_1.0.0+12a9d76-b2_amd64.deb"
              className="font-mono text-xs sm:text-sm"
            />
          </div>
          <div className="flex items-end">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              disabled={disabled}
              onClick={() => onChange(artifacts.filter((item) => item.id !== artifact.id))}
              aria-label={`Remove ${artifact.packageName || "artifact"}`}
            >
              <Trash2 />
            </Button>
          </div>
        </div>
      ))}

      {artifacts.length === 0 && (
        <p className="rounded-xl border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
          No artifact fields yet. Add the SkyCommand / SIM .deb packages you track.
        </p>
      )}

      <Button
        type="button"
        variant="outline"
        disabled={disabled}
        onClick={() =>
          onChange([
            ...artifacts,
            { id: crypto.randomUUID(), packageName: "", filename: "" },
          ])
        }
      >
        <Plus />
        Add artifact field
      </Button>
    </div>
  );
}
