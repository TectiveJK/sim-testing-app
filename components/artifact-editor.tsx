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
  const update = (index: number, patch: Partial<DebArtifact>) => {
    onChange(artifacts.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  };

  return (
    <div className="space-y-3">
      {artifacts.map((artifact, index) => (
        <div
          key={artifact.id}
          className="grid gap-3 rounded-xl border bg-card/60 p-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)_auto]"
        >
          <div className="space-y-1.5">
            <Label htmlFor={`${artifact.id}-pkg`} className="text-xs text-muted-foreground">
              Package
            </Label>
            <Input
              id={`${artifact.id}-pkg`}
              value={artifact.packageName}
              disabled={disabled}
              onChange={(event) => update(index, { packageName: event.target.value })}
              placeholder="autonomy-node"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`${artifact.id}-file`} className="text-xs text-muted-foreground">
              Last successful .deb filename
            </Label>
            <Input
              id={`${artifact.id}-file`}
              value={artifact.filename}
              disabled={disabled}
              onChange={(event) => update(index, { filename: event.target.value })}
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
