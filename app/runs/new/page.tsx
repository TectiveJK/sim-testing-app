"use client";

import { PageHeader } from "@/components/page-header";
import { ArtifactEditor } from "@/components/artifact-editor";
import { LinkButton } from "@/components/link-button";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/native-select";
import { Textarea } from "@/components/ui/textarea";
import { useAppData } from "@/components/data-provider";
import { runTitle } from "@/lib/format";
import { appPath, runHref } from "@/lib/routes";
import { toast } from "sonner";

export default function NewRunPage() {
  const { store, createRun } = useAppData();
  const nextNumber = store.runs.reduce((max, run) => Math.max(max, run.number), 0) + 1;

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        eyebrow="New checklist session"
        title="Create test run"
        description="This starts a recording session for the catalog. You will still fly every test yourself in SkyCommand. Versions and .deb names are only labels for later comparison."
      />

      <form
        className="space-y-6"
        onSubmit={async (event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          try {
            const id = await createRun({
              name: String(form.get("name") || ""),
              skyCommandVersion: String(form.get("skyCommandVersion") || ""),
              droneVersion: String(form.get("droneVersion") || ""),
              tester: String(form.get("tester") || ""),
              notes: String(form.get("notes") || ""),
              cloneFromId: String(form.get("cloneFromId") || "") || undefined,
            });
            window.location.assign(appPath(runHref(id)));
          } catch (error) {
            toast.error(error instanceof Error ? error.message : "Could not create test run");
          }
        }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Software versions</CardTitle>
            <CardDescription>
              Optional labels for the software you will test by hand in SkyCommand. This app does not connect to that software.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="run-name">Test run name</Label>
              <Input id="run-name" name="name" defaultValue={runTitle(nextNumber)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sim-version">SkyCommand / SIM version</Label>
              <Input
                id="sim-version"
                name="skyCommandVersion"
                data-testid="sky-command-version"
                placeholder="1.3.0"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="drone-version">Drone software / firmware</Label>
              <Input
                id="drone-version"
                name="droneVersion"
                data-testid="drone-version"
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
                data-testid="tester"
                defaultValue={store.testers[0] || ""}
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
              <NativeSelect id="clone" name="cloneFromId" defaultValue="">
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
                name="notes"
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
            <ArtifactEditor artifacts={store.artifacts} onChange={() => undefined} />
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <LinkButton href="/runs" variant="outline">
            Cancel
          </LinkButton>
          <button type="submit" data-testid="start-test-run" className={cn(buttonVariants())}>
            Start test run
          </button>
        </div>
      </form>
    </div>
  );
}
