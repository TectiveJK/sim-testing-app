"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { ArtifactEditor } from "@/components/artifact-editor";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/native-select";
import { Textarea } from "@/components/ui/textarea";
import { useAppData } from "@/components/data-provider";
import { runTitle } from "@/lib/format";

export default function NewRunPage() {
  const router = useRouter();
  const { store, createRun, saveArtifacts } = useAppData();
  const nextNumber = store.runs.reduce((max, run) => Math.max(max, run.number), 0) + 1;
  const [name, setName] = useState(runTitle(nextNumber));
  const [skyCommandVersion, setSkyCommandVersion] = useState("");
  const [droneVersion, setDroneVersion] = useState("");
  const [tester, setTester] = useState(store.testers[0] || "");
  const [notes, setNotes] = useState("");
  const [cloneFromId, setCloneFromId] = useState("");
  const [artifacts, setArtifacts] = useState(store.artifacts);
  const [saving, setSaving] = useState(false);

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        eyebrow="New regression pass"
        title="Create test run"
        description="The existing catalog is attached automatically. Last-successful .deb filenames are snapshotted onto this run so later comparisons stay accurate."
      />

      <form
        className="space-y-6"
        onSubmit={async (event) => {
          event.preventDefault();
          if (!skyCommandVersion.trim() || !droneVersion.trim()) {
            toast.error("Enter both the SkyCommand / SIM version and the drone software version.");
            return;
          }
          if (!tester.trim()) {
            toast.error("Enter the tester name.");
            return;
          }
          setSaving(true);
          try {
            await saveArtifacts(artifacts);
            const id = await createRun({
              name,
              skyCommandVersion,
              droneVersion,
              tester,
              notes,
              cloneFromId: cloneFromId || undefined,
            });
            toast.success("Test run created");
            router.push(`/runs/${id}`);
          } catch (error) {
            toast.error(error instanceof Error ? error.message : "Could not create run");
          } finally {
            setSaving(false);
          }
        }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Software versions</CardTitle>
            <CardDescription>
              Record the SkyCommand / SIM build and the drone software or firmware under test.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="run-name">Test run name</Label>
              <Input id="run-name" value={name} onChange={(event) => setName(event.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sim-version">SkyCommand / SIM version</Label>
              <Input
                id="sim-version"
                name="skyCommandVersion"
                value={skyCommandVersion}
                onChange={(event) => setSkyCommandVersion(event.target.value)}
                placeholder="1.3.0"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="drone-version">Drone software / firmware</Label>
              <Input
                id="drone-version"
                name="droneVersion"
                value={droneVersion}
                onChange={(event) => setDroneVersion(event.target.value)}
                placeholder="3.4.2"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tester">Tester</Label>
              <Input
                id="tester"
                name="tester"
                list="testers"
                autoComplete="name"
                value={tester}
                onChange={(event) => setTester(event.target.value)}
                placeholder="Your name"
              />
              <datalist id="testers">
                {store.testers.map((nameOption) => (
                  <option key={nameOption} value={nameOption} />
                ))}
              </datalist>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="clone">Base on previous run</Label>
              <NativeSelect
                id="clone"
                value={cloneFromId}
                onChange={(event) => {
                  setCloneFromId(event.target.value);
                  const source = store.runs.find((run) => run.id === event.target.value);
                  if (source) {
                    setSkyCommandVersion(source.skyCommandVersion);
                    setDroneVersion(source.droneVersion);
                    setTester(source.tester);
                  }
                }}
              >
                <option value="">Fresh run (empty results)</option>
                {store.runs.map((run) => (
                  <option key={run.id} value={run.id}>
                    Copy versions from {run.name}
                  </option>
                ))}
              </NativeSelect>
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="run-notes">Run notes</Label>
              <Textarea
                id="run-notes"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Release notes, SIM setup, hardware, or anything the lab should remember."
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Last successful artifacts</CardTitle>
            <CardDescription>
              Edit the current .deb filenames before you start. They are saved globally and copied onto
              this run.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ArtifactEditor artifacts={artifacts} onChange={setArtifacts} />
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => router.push("/runs")}>
            Cancel
          </Button>
          <button type="submit" disabled={saving} className={cn(buttonVariants())}>
            {saving ? "Creating…" : "Start test run"}
          </button>
        </div>
      </form>
    </div>
  );
}
