import { runTitle } from "@/lib/format";
import type { DebArtifact } from "@/lib/types";
import {
  allTests,
  createResultsForRun,
  nextRunNumber,
  rememberTester,
  snapshotArtifacts,
  updateStore,
} from "@/lib/store";

async function createRun(input: {
  name?: string;
  skyCommandVersion?: string;
  droneVersion?: string;
  tester?: string;
  notes?: string;
  cloneFromId?: string;
}) {
  const store = await updateStore((current) => {
    const number = nextRunNumber(current);
    const now = new Date().toISOString();
    const tests = allTests(current);
    const source = input.cloneFromId
      ? current.runs.find((run) => run.id === input.cloneFromId)
      : undefined;

    const run = {
      id: crypto.randomUUID(),
      number,
      name: input.name?.trim() || runTitle(number),
      skyCommandVersion: input.skyCommandVersion?.trim() || source?.skyCommandVersion || "",
      droneVersion: input.droneVersion?.trim() || source?.droneVersion || "",
      tester: input.tester?.trim() || source?.tester || "",
      startedAt: now,
      notes: input.notes?.trim() || "",
      artifacts: snapshotArtifacts(current.artifacts),
    };

    current.runs.unshift(run);
    current.results.push(...createResultsForRun(run.id, tests));
    rememberTester(current, run.tester);
  });

  return store.runs[0];
}

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") || "";
  if (
    contentType.includes("application/x-www-form-urlencoded") ||
    contentType.includes("multipart/form-data")
  ) {
    const form = await request.formData();
    const count = Number(form.get("count") || 0);
    if (count > 0) {
      const artifacts: DebArtifact[] = [];
      for (let index = 0; index < count; index += 1) {
        artifacts.push({
          id: String(form.get(`id-${index}`) || crypto.randomUUID()),
          packageName: String(form.get(`packageName-${index}`) || ""),
          filename: String(form.get(`filename-${index}`) || ""),
        });
      }
      await updateStore((current) => {
        current.artifacts = artifacts;
      });
    }
    const created = await createRun({
      name: String(form.get("name") || ""),
      skyCommandVersion: String(form.get("skyCommandVersion") || ""),
      droneVersion: String(form.get("droneVersion") || ""),
      tester: String(form.get("tester") || ""),
      notes: String(form.get("notes") || ""),
      cloneFromId: String(form.get("cloneFromId") || ""),
    });
    return Response.redirect(new URL(`/run?id=${created.id}`, request.url), 303);
  }

  const body = (await request.json()) as {
    name?: string;
    skyCommandVersion?: string;
    droneVersion?: string;
    tester?: string;
    notes?: string;
    cloneFromId?: string;
  };
  const created = await createRun(body);
  return Response.json({ run: created });
}
