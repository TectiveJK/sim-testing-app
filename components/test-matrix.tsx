"use client";

import { statusCell, STATUS_SHORT } from "@/lib/status";
import type { TestCase, TestResult } from "@/lib/types";
import { cn } from "@/lib/utils";

export function TestMatrix({
  tests,
  commands,
  states,
  phasesByState,
  resultsByTestId,
  onSelect,
  selectedId,
}: {
  tests: TestCase[];
  commands: string[];
  states: string[];
  phasesByState: Record<string, string[]>;
  resultsByTestId?: Map<string, TestResult>;
  onSelect?: (test: TestCase) => void;
  selectedId?: string;
}) {
  const lookup = new Map(
    tests.map((test) => [`${test.currentState}||${test.phase}||${test.command}`, test]),
  );

  return (
    <div className="overflow-auto rounded-xl border">
      <table className="min-w-[720px] w-full border-collapse text-xs">
        <thead className="sticky top-0 z-10 bg-card">
          <tr>
            <th className="sticky left-0 z-20 bg-card px-3 py-2 text-left font-medium">
              Current state
            </th>
            {commands.map((command) => (
              <th key={command} className="px-2 py-2 text-center font-medium">
                {command}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {states.map((state) => {
            const phases = phasesByState[state] ?? [""];
            return phases.map((phase, phaseIndex) => (
              <tr key={`${state}-${phase}`} className="border-t">
                <th className="sticky left-0 bg-background px-3 py-1.5 text-left font-normal">
                  <div className="font-medium">{phaseIndex === 0 ? state : ""}</div>
                  {phase ? <div className="text-muted-foreground">{phase}</div> : null}
                </th>
                {commands.map((command) => {
                  const test = lookup.get(`${state}||${phase}||${command}`);
                  const result = test ? resultsByTestId?.get(test.id) : undefined;
                  const exists = Boolean(test);
                  return (
                    <td key={command} className="p-1 text-center">
                      {exists ? (
                        <button
                          type="button"
                          onClick={() => test && onSelect?.(test)}
                          className={cn(
                            "flex h-8 w-full items-center justify-center rounded-md text-[11px] font-medium",
                            statusCell(result?.status, true),
                            selectedId === test?.id && "ring-2 ring-primary",
                          )}
                          title={test?.name}
                        >
                          {result ? STATUS_SHORT[result.status] : "—"}
                        </button>
                      ) : (
                        <div className="h-8 text-muted-foreground/25">·</div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ));
          })}
        </tbody>
      </table>
    </div>
  );
}
