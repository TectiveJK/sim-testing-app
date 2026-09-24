import { mkdir, readFile, rename, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  allTests,
  createResultsForRun,
  emptyStore,
  nextRunNumber,
  normalizeStore,
  rememberTester,
  removeRun,
  snapshotArtifacts,
} from "@/lib/store-logic";
import type { AppStore, TestRun } from "@/lib/types";

const DATA_DIR = path.join(process.cwd(), "data");
const STORE_PATH = path.join(DATA_DIR, "store.json");
const ATTACH_DIR = path.join(DATA_DIR, "attachments");

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

export {
  allTests,
  createResultsForRun,
  emptyStore,
  nextRunNumber,
  normalizeStore,
  rememberTester,
  removeRun,
  snapshotArtifacts,
  DATA_DIR,
  STORE_PATH,
  ATTACH_DIR,
};
