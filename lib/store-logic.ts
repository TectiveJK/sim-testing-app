import { mergeCatalog } from "@/lib/catalog";
import { DEFAULT_ARTIFACTS } from "@/lib/default-artifacts";
import { runTitle } from "@/lib/format";
import { TEST_STATUSES, type AppStore, type DebArtifact, type TestCase, type TestResult, type TestRun, type TestStatus } from "@/lib/types";

export function emptyStore(): AppStore {
  return {
    artifacts: structuredClone(DEFAULT_ARTIFACTS),
    testers: [],
    runs: [],
    results: [],
    customTests: [],
  };
}

export function normalizeStore(raw: Partial<AppStore> | null): AppStore {
  const base = emptyStore();
  if (!raw) return base;
  return {
    artifacts: Array.isArray(raw.artifacts) && raw.artifacts.length > 0 ? raw.artifacts : base.artifacts,
    testers: Array.isArray(raw.testers) ? raw.testers : [],
    runs: Array.isArray(raw.runs) ? raw.runs : [],
    results: Array.isArray(raw.results) ? raw.results : [],
    customTests: Array.isArray(raw.customTests) ? raw.customTests : [],
  };
}

export function allTests(store: AppStore): TestCase[] {
  return mergeCatalog(store.customTests);
}

export function resultsForRun(store: AppStore, runId: string) {
  return store.results.filter((result) => result.testRunId === runId);
}

export function nextRunNumber(store: AppStore) {
  return store.runs.reduce((max, run) => Math.max(max, run.number), 0) + 1;
}

export function snapshotArtifacts(artifacts: DebArtifact[]) {
  return artifacts.map((artifact) => ({ ...artifact }));
}

export function createResultsForRun(runId: string, tests: TestCase[]): TestResult[] {
  return tests.map((test) => ({
    id: crypto.randomUUID(),
    testRunId: runId,
    testCaseId: test.id,
    status: "not_tested",
    notes: "",
    attachments: [],
  }));
}

export function rememberTester(store: AppStore, tester: string) {
  const name = tester.trim();
  if (!name) return;
  store.testers = [name, ...store.testers.filter((item) => item !== name)].slice(0, 20);
}

export function removeRun(store: AppStore, runId: string) {
  const results = store.results.filter((result) => result.testRunId === runId);
  const attachmentIds = results.flatMap((result) => result.attachments.map((item) => item.id));
  store.runs = store.runs.filter((run) => run.id !== runId);
  store.results = store.results.filter((result) => result.testRunId !== runId);
  return attachmentIds;
}

export function applyCreateRun(
  store: AppStore,
  input: {
    name?: string;
    skyCommandVersion?: string;
    droneVersion?: string;
    tester?: string;
    notes?: string;
    cloneFromId?: string;
  },
) {
  const number = nextRunNumber(store);
  const now = new Date().toISOString();
  const tests = allTests(store);
  const source = input.cloneFromId
    ? store.runs.find((run) => run.id === input.cloneFromId)
    : undefined;

  const run: TestRun = {
    id: crypto.randomUUID(),
    number,
    name: input.name?.trim() || runTitle(number),
    skyCommandVersion: input.skyCommandVersion?.trim() || source?.skyCommandVersion || "",
    droneVersion: input.droneVersion?.trim() || source?.droneVersion || "",
    tester: input.tester?.trim() || source?.tester || "",
    startedAt: now,
    notes: input.notes?.trim() || "",
    artifacts: snapshotArtifacts(store.artifacts),
  };

  store.runs.unshift(run);
  store.results.push(...createResultsForRun(run.id, tests));
  rememberTester(store, run.tester);
  return run;
}

export function applyUpdateRun(
  store: AppStore,
  id: string,
  payload: {
    name?: string;
    skyCommandVersion?: string;
    droneVersion?: string;
    tester?: string;
    notes?: string;
    completedAt?: string | null;
    artifacts?: DebArtifact[];
  },
) {
  const run = store.runs.find((item) => item.id === id);
  if (!run) throw new Error("Run not found");
  if (payload.name !== undefined) run.name = payload.name;
  if (payload.skyCommandVersion !== undefined) run.skyCommandVersion = payload.skyCommandVersion;
  if (payload.droneVersion !== undefined) run.droneVersion = payload.droneVersion;
  if (payload.tester !== undefined) {
    run.tester = payload.tester;
    rememberTester(store, payload.tester);
  }
  if (payload.notes !== undefined) run.notes = payload.notes;
  if (payload.completedAt !== undefined) {
    run.completedAt = payload.completedAt ?? undefined;
  }
  if (payload.artifacts) run.artifacts = payload.artifacts;
  return run;
}

export function applySaveResult(
  store: AppStore,
  body: {
    id?: string;
    testRunId: string;
    testCaseId: string;
    status?: TestStatus;
    notes?: string;
    tester?: string;
  },
) {
  if (!body.testRunId || !body.testCaseId) {
    throw new Error("Missing test identity");
  }

  let result = store.results.find((item) =>
    body.id
      ? item.id === body.id
      : item.testRunId === body.testRunId && item.testCaseId === body.testCaseId,
  );

  if (!result) {
    result = {
      id: crypto.randomUUID(),
      testRunId: body.testRunId,
      testCaseId: body.testCaseId,
      status: "not_tested",
      notes: "",
      attachments: [],
    };
    store.results.push(result);
  }

  if (body.status) {
    if (!TEST_STATUSES.includes(body.status)) {
      throw new Error("Invalid status");
    }
    result.status = body.status;
    result.executedAt = body.status === "not_tested" ? undefined : new Date().toISOString();
  }
  if (body.notes !== undefined) result.notes = body.notes;
  if (body.tester !== undefined) result.tester = body.tester;
  return result;
}

export function applySaveArtifacts(store: AppStore, artifacts: DebArtifact[]) {
  store.artifacts = artifacts.map((artifact) => ({
    id: artifact.id || crypto.randomUUID(),
    packageName: artifact.packageName.trim(),
    filename: artifact.filename.trim(),
  }));
  return store.artifacts;
}

export function applyAddTest(store: AppStore, body: Partial<TestCase>) {
  if (!body.currentState?.trim() || !body.command?.trim()) {
    throw new Error("State and command are required");
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

  if (mergeCatalog(store.customTests).some((item) => item.id === test.id)) {
    throw new Error("A test with this identity already exists");
  }

  store.customTests.push(test);
  for (const run of store.runs) {
    if (store.results.some((result) => result.testRunId === run.id && result.testCaseId === test.id)) {
      continue;
    }
    store.results.push(...createResultsForRun(run.id, [test]));
  }
  return test;
}

export function applyAddAttachment(
  store: AppStore,
  input: {
    resultId: string;
    testRunId: string;
    testCaseId: string;
    originalName: string;
    mimeType: string;
    size: number;
    dataUrl?: string;
  },
) {
  const attachment = {
    id: crypto.randomUUID(),
    resultId: input.resultId,
    filename: input.dataUrl ? input.resultId : crypto.randomUUID(),
    originalName: input.originalName,
    mimeType: input.mimeType,
    size: input.size,
    uploadedAt: new Date().toISOString(),
    dataUrl: input.dataUrl,
  };

  let result = store.results.find((item) => item.id === input.resultId);
  if (!result && input.testRunId && input.testCaseId) {
    result = {
      id: input.resultId,
      testRunId: input.testRunId,
      testCaseId: input.testCaseId,
      status: "not_tested",
      notes: "",
      attachments: [],
    };
    store.results.push(result);
  }
  if (!result) throw new Error("Result not found");
  result.attachments.push(attachment);
  return attachment;
}

export function applyDeleteAttachment(store: AppStore, id: string) {
  for (const result of store.results) {
    result.attachments = result.attachments.filter((item) => item.id !== id);
  }
}
