import type { TestCase } from "@/lib/types";
import { mergeCatalog } from "@/lib/catalog";
import { createResultsForRun, updateStore } from "@/lib/store";

export async function POST(request: Request) {
  const body = (await request.json()) as Partial<TestCase>;
  if (!body.currentState?.trim() || !body.command?.trim()) {
    return Response.json({ error: "State and command are required" }, { status: 400 });
  }

  const slug = (value: string) =>
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

  const test: TestCase = {
    id:
      body.id?.trim() ||
      [slug(body.currentState), slug(body.phase || ""), slug(body.command)]
        .filter(Boolean)
        .join("-"),
    currentState: body.currentState.trim(),
    phase: (body.phase || "").trim(),
    command: body.command.trim(),
    name:
      body.name?.trim() ||
      (body.phase
        ? `${body.currentState} / ${body.phase} → ${body.command}`
        : `${body.currentState} → ${body.command}`),
    description: body.description?.trim() || "",
    expectedBehavior: body.expectedBehavior?.trim() || "",
    procedure: body.procedure?.trim() || "",
    custom: true,
  };

  try {
    const store = await updateStore((current) => {
      if (mergeCatalog(current.customTests).some((item) => item.id === test.id)) {
        throw new Error("A test with this identity already exists");
      }
      current.customTests.push(test);
      for (const run of current.runs) {
        if (current.results.some((result) => result.testRunId === run.id && result.testCaseId === test.id)) {
          continue;
        }
        current.results.push(...createResultsForRun(run.id, [test]));
      }
    });
    return Response.json({ test, tests: mergeCatalog(store.customTests) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not add test";
    const status = message.includes("already exists") ? 409 : 500;
    return Response.json({ error: message }, { status });
  }
}
