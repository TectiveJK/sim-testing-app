import { mkdir, readFile, rename, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { DEFAULT_ARTIFACTS } from "@/lib/default-artifacts";
import { mergeCatalog } from "@/lib/catalog";
import type { AppStore, DebArtifact, TestCase, TestResult, TestRun } from "@/lib/types";

const DATA_DIR = path.join(process.cwd(), "data");
const STORE_PATH = path.join(DATA_DIR, "store.json");
const ATTACH_DIR = path.join(DATA_DIR, "attachments");

function emptyStore(): AppStore {
  return {
    artifacts: structuredClone(DEFAULT_ARTIFACTS),
    testers: [],
    runs: [],
    results: [],
    customTests: [],
  };
}

let writeChain = Promise.resolve();

function withLock<T>(fn: () => Promise<T>): Promise<T> {
  const run = writeChain.then(fn, fn);
  writeChain = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

async function ensureDirs() {
  await mkdir(DATA_DIR, { recursive: true });
  await mkdir(ATTACH_DIR, { recursive: true });
}

function normalizeStore(raw: Partial<AppStore> | null): AppStore {
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

export async function readStore(): Promise<AppStore> {
  await ensureDirs();
  try {
    const text = await readFile(STORE_PATH, "utf8");
    return normalizeStore(JSON.parse(text) as Partial<AppStore>);
  } catch {
    const store = emptyStore();
    await persist(store);
    return store;
  }
}

async function persist(store: AppStore) {
  await ensureDirs();
  const tmp = `${STORE_PATH}.tmp`;
  await writeFile(tmp, JSON.stringify(store, null, 2), "utf8");
  await rename(tmp, STORE_PATH);
}

export async function updateStore(mutator: (store: AppStore) => void | AppStore) {
  return withLock(async () => {
    const store = await readStore();
    const next = mutator(store) ?? store;
    await persist(next);
    return next;
  });
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

export async function deleteAttachmentFiles(ids: string[]) {
  await Promise.all(
    ids.map(async (id) => {
      try {
        await unlink(attachmentPath(id));
      } catch {
        // File may already be gone.
      }
    }),
  );
}

export async function saveAttachmentFile(id: string, bytes: Uint8Array) {
  await ensureDirs();
  const filePath = path.join(ATTACH_DIR, id);
  await writeFile(filePath, bytes);
  return filePath;
}

export function attachmentPath(id: string) {
  return path.join(ATTACH_DIR, id);
}

export async function getRunOrThrow(runId: string) {
  const store = await readStore();
  const run = store.runs.find((item) => item.id === runId);
  if (!run) return { store, run: null as TestRun | null };
  return { store, run };
}

export { DATA_DIR, STORE_PATH, ATTACH_DIR };
