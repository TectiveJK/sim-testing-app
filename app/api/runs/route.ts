import { runTitle } from "@/lib/format";
import {
  allTests,
  createResultsForRun,
  nextRunNumber,
  rememberTester,
  snapshotArtifacts,
  updateStore,
} from "@/lib/store";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    name?: string;
    skyCommandVersion?: string;
    droneVersion?: string;
    tester?: string;
    notes?: string;
    cloneFromId?: string;
  };

  const store = await updateStore((current) => {
    const number = nextRunNumber(current);
    const now = new Date().toISOString();
    const tests = allTests(current);
    const source = body.cloneFromId
      ? current.runs.find((run) => run.id === body.cloneFromId)
      : undefined;

    const run = {
      id: crypto.randomUUID(),
      number,
      name: body.name?.trim() || runTitle(number),
      skyCommandVersion: body.skyCommandVersion?.trim() || source?.skyCommandVersion || "",
      droneVersion: body.droneVersion?.trim() || source?.droneVersion || "",
      tester: body.tester?.trim() || source?.tester || "",
      startedAt: now,
      notes: body.notes?.trim() || "",
      artifacts: snapshotArtifacts(current.artifacts),
    };

    current.runs.unshift(run);
    current.results.push(...createResultsForRun(run.id, tests));
    rememberTester(current, run.tester);
  });

  const created = store.runs[0];
  return Response.json({ run: created });
}
