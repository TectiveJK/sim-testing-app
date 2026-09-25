"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { NativeSelect } from "@/components/native-select";
import { TestMatrix } from "@/components/test-matrix";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { queryHref, ViewPanel, ViewTabs } from "@/components/simple-tabs";
import { Textarea } from "@/components/ui/textarea";
import { useAppData } from "@/components/data-provider";
import { COMMANDS } from "@/lib/types";

export default function CatalogPage() {
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">Loading catalog…</p>}>
      <CatalogInner />
    </Suspense>
  );
}

function CatalogInner() {
  const { catalog, addTest } = useAppData();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const view = searchParams.get("view") === "list" ? "list" : "matrix";
  const selectedId = searchParams.get("test");
  const [query, setQuery] = useState("");
  const [state, setState] = useState("all");
  const [command, setCommand] = useState("all");
  const [open, setOpen] = useState(false);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return catalog.tests.filter((test) => {
      if (state !== "all" && test.currentState !== state) return false;
      if (command !== "all" && test.command !== command) return false;
      if (!needle) return true;
      return (
        test.name.toLowerCase().includes(needle) ||
        test.id.toLowerCase().includes(needle) ||
        test.phase.toLowerCase().includes(needle)
      );
    });
  }, [catalog.tests, query, state, command]);

  const selected = catalog.tests.find((test) => test.id === selectedId) ?? filtered[0];

  return (
    <div>
      <PageHeader
        eyebrow="Catalog"
        title="Flight functions and transitions"
        description="Instructions only. Each cell is a test you will perform yourself in SkyCommand. Empty cells are not in the suite. Scoring happens in a test run, not here."
        actions={
          <Button onClick={() => setOpen(true)}>Add test</Button>
        }
      />

      <div className="mb-4 grid gap-2 sm:grid-cols-3">
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search tests, IDs, or phases"
        />
        <NativeSelect value={state} onChange={(event) => setState(event.target.value)}>
          <option value="all">All current states</option>
          {catalog.states.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </NativeSelect>
        <NativeSelect value={command} onChange={(event) => setCommand(event.target.value)}>
          <option value="all">All commands</option>
          {catalog.commands.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </NativeSelect>
      </div>

      <ViewTabs
        value={view}
        items={[
          {
            value: "matrix",
            label: "Transition matrix",
            href: queryHref(pathname, searchParams, { view: "matrix" }),
          },
          {
            value: "list",
            label: "List",
            href: queryHref(pathname, searchParams, { view: "list" }),
          },
        ]}
      />
      <ViewPanel when="matrix" active={view}>
          <TestMatrix
            tests={filtered}
            commands={catalog.commands}
            states={catalog.states.filter((item) => state === "all" || item === state)}
            phasesByState={catalog.phasesByState}
            selectedId={selected?.id}
            onSelect={(test) => {
              router.push(queryHref(pathname, searchParams, {
                view: "list",
                test: test.id,
              }));
            }}
          />
          <p className="mt-2 text-xs text-muted-foreground">
            Showing {filtered.length} of {catalog.tests.length} tests. Cells marked — are checklist
            items. Score them in a test run after you have flown them in SkyCommand.
          </p>
      </ViewPanel>
      <ViewPanel when="list" active={view}>
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <Card>
              <CardHeader>
                <CardTitle>Tests</CardTitle>
              </CardHeader>
              <CardContent className="max-h-[70vh] space-y-1 overflow-auto">
                {filtered.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No tests match these filters.</p>
                ) : (
                  filtered.map((test) => (
                    <Link
                      key={test.id}
                      href={queryHref(pathname, searchParams, { view: "list", test: test.id })}
                      data-testid={`catalog-test-${test.id}`}
                      className={`block w-full rounded-lg border px-3 py-2 text-left text-sm hover:bg-muted ${
                        selected?.id === test.id ? "border-primary bg-muted" : "border-transparent"
                      }`}
                    >
                      <div className="font-medium">{test.name}</div>
                      <div className="font-mono text-xs text-muted-foreground">{test.id}</div>
                    </Link>
                  ))
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle data-testid="catalog-detail-title">
                  {selected?.name || "Select a test"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                {selected ? (
                  <>
                    <div>
                      <div className="text-xs uppercase tracking-wide text-muted-foreground">ID</div>
                      <div className="font-mono">{selected.id}</div>
                    </div>
                    <p>{selected.description}</p>
                    <div>
                      <div className="text-xs uppercase tracking-wide text-muted-foreground">
                        Expected behaviour
                      </div>
                      <p className="mt-1">{selected.expectedBehavior}</p>
                    </div>
                    <div>
                      <div className="text-xs uppercase tracking-wide text-muted-foreground">
                        Procedure
                      </div>
                      <p className="mt-1">{selected.procedure}</p>
                    </div>
                    {selected.custom ? (
                      <p className="text-xs text-muted-foreground">Added locally to this catalog.</p>
                    ) : null}
                  </>
                ) : (
                  <p className="text-muted-foreground">Choose a test to inspect the procedure.</p>
                )}
              </CardContent>
            </Card>
          </div>
      </ViewPanel>

      <AddTestDialog open={open} onOpenChange={setOpen} onSubmit={addTest} />
    </div>
  );
}

function AddTestDialog({
  open,
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: {
    currentState: string;
    phase: string;
    command: string;
    name?: string;
    description?: string;
    expectedBehavior?: string;
    procedure?: string;
  }) => Promise<void>;
}) {
  const [currentState, setCurrentState] = useState("");
  const [phase, setPhase] = useState("");
  const [command, setCommand] = useState("Complete");
  const [description, setDescription] = useState("");
  const [expectedBehavior, setExpectedBehavior] = useState("");
  const [procedure, setProcedure] = useState("");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add a flight test</DialogTitle>
        </DialogHeader>
        <form
          className="space-y-3"
          onSubmit={async (event) => {
            event.preventDefault();
            try {
              await onSubmit({
                currentState,
                phase,
                command,
                description,
                expectedBehavior,
                procedure,
              });
              toast.success("Test added to the catalog");
              setCurrentState("");
              setPhase("");
              setDescription("");
              setExpectedBehavior("");
              setProcedure("");
              onOpenChange(false);
            } catch (error) {
              toast.error(error instanceof Error ? error.message : "Could not add test");
            }
          }}
        >
          <div className="space-y-1.5">
            <Label htmlFor="new-state">Current state</Label>
            <Input
              id="new-state"
              required
              value={currentState}
              onChange={(event) => setCurrentState(event.target.value)}
              placeholder="Corridor"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="new-phase">Phase / sub-state</Label>
            <Input
              id="new-phase"
              value={phase}
              onChange={(event) => setPhase(event.target.value)}
              placeholder="Take-off"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="new-command">Command</Label>
            <NativeSelect
              id="new-command"
              value={command}
              onChange={(event) => setCommand(event.target.value)}
            >
              {COMMANDS.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
              <option value="custom">Custom…</option>
            </NativeSelect>
            {command === "custom" || !COMMANDS.includes(command as (typeof COMMANDS)[number]) ? (
              <Input
                className="mt-2"
                value={command === "custom" ? "" : command}
                onChange={(event) => setCommand(event.target.value)}
                placeholder="Command name"
              />
            ) : null}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="new-desc">Description</Label>
            <Textarea
              id="new-desc"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="new-expected">Expected behaviour</Label>
            <Textarea
              id="new-expected"
              value={expectedBehavior}
              onChange={(event) => setExpectedBehavior(event.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="new-proc">Procedure</Label>
            <Textarea
              id="new-proc"
              value={procedure}
              onChange={(event) => setProcedure(event.target.value)}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Save test</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
