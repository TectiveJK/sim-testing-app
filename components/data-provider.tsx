"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { emptyAppData } from "@/lib/app-data";
import { loadBrowserAppData, mutateBrowserStore } from "@/lib/browser-store";
import type { AppData } from "@/lib/client-types";
import { buildRunPdf } from "@/lib/run-pdf";
import {
  applyAddAttachment,
  applyAddTest,
  applyCreateRun,
  applyDeleteAttachment,
  applySaveArtifacts,
  applySaveResult,
  applyUpdateRun,
  removeRun,
} from "@/lib/store-logic";
import type { DebArtifact, TestCase, TestResult, TestStatus } from "@/lib/types";

interface DataContextValue extends AppData {
  ready: boolean;
  reload: () => Promise<void>;
  createRun: (payload: {
    name?: string;
    skyCommandVersion?: string;
    droneVersion?: string;
    tester?: string;
    notes?: string;
    cloneFromId?: string;
  }) => Promise<string>;
  updateRun: (
    id: string,
    payload: {
      name?: string;
      skyCommandVersion?: string;
      droneVersion?: string;
      tester?: string;
      notes?: string;
      completedAt?: string | null;
    },
  ) => Promise<void>;
  deleteRun: (id: string) => Promise<void>;
  saveResult: (payload: {
    id?: string;
    testRunId: string;
    testCaseId: string;
    status?: TestStatus;
    notes?: string;
    tester?: string;
  }) => Promise<TestResult | undefined>;
  saveArtifacts: (artifacts: DebArtifact[]) => Promise<void>;
  addTest: (payload: Partial<TestCase>) => Promise<void>;
  uploadAttachment: (payload: {
    file: File;
    resultId: string;
    testRunId: string;
    testCaseId: string;
  }) => Promise<void>;
  deleteAttachment: (id: string) => Promise<void>;
  exportPdf: (runId: string) => Promise<void>;
}

const DataContext = createContext<DataContextValue | null>(null);

async function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Could not read file"));
    reader.readAsDataURL(file);
  });
}

function downloadBlob(filename: string, bytes: Uint8Array, type: string) {
  const blob = new Blob([bytes as BlobPart], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<AppData>(emptyAppData);
  const [mode, setMode] = useState<"server" | "browser">("browser");
  const [ready, setReady] = useState(false);

  const reload = useCallback(async () => {
    if (mode === "server") {
      const response = await fetch("/api/data", { cache: "no-store" });
      if (!response.ok) throw new Error("Failed to load data");
      setData((await response.json()) as AppData);
      return;
    }
    setData(loadBrowserAppData());
  }, [mode]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const response = await fetch("/api/data", { cache: "no-store" });
        if (response.ok) {
          const json = (await response.json()) as AppData;
          if (!cancelled) {
            setMode("server");
            setData(json);
          }
          return;
        }
      } catch {
        // GitHub Pages and other static hosts have no API.
      }
      if (!cancelled) {
        setMode("browser");
        setData(loadBrowserAppData());
      }
    })().finally(() => {
      if (!cancelled) setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo<DataContextValue>(
    () => ({
      ...data,
      ready,
      reload,
      createRun: async (payload) => {
        if (mode === "browser") {
          let id = "";
          setData(
            mutateBrowserStore((store) => {
              id = applyCreateRun(store, payload).id;
            }),
          );
          return id;
        }
        const response = await fetch("/api/runs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!response.ok) throw new Error("Could not create test run");
        const json = (await response.json()) as { run: { id: string } };
        await reload();
        return json.run.id;
      },
      updateRun: async (id, payload) => {
        if (mode === "browser") {
          setData(mutateBrowserStore((store) => applyUpdateRun(store, id, payload)));
          return;
        }
        const response = await fetch(`/api/runs/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!response.ok) throw new Error("Could not update run");
        await reload();
      },
      deleteRun: async (id) => {
        if (mode === "browser") {
          setData(mutateBrowserStore((store) => {
            removeRun(store, id);
          }));
          return;
        }
        const response = await fetch(`/api/runs/${id}`, { method: "DELETE" });
        if (!response.ok) throw new Error("Could not delete run");
        await reload();
      },
      saveResult: async (payload) => {
        if (mode === "browser") {
          let result: TestResult | undefined;
          setData(
            mutateBrowserStore((store) => {
              result = applySaveResult(store, payload);
            }),
          );
          return result;
        }
        setData((current) => ({
          ...current,
          store: {
            ...current.store,
            results: current.store.results.map((item) => {
              const match = payload.id
                ? item.id === payload.id
                : item.testRunId === payload.testRunId && item.testCaseId === payload.testCaseId;
              if (!match) return item;
              return {
                ...item,
                status: payload.status ?? item.status,
                notes: payload.notes ?? item.notes,
                tester: payload.tester ?? item.tester,
                executedAt:
                  payload.status === "not_tested"
                    ? undefined
                    : payload.status
                      ? new Date().toISOString()
                      : item.executedAt,
              };
            }),
          },
        }));
        const response = await fetch("/api/results", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!response.ok) {
          await reload();
          throw new Error("Could not save result");
        }
        const json = (await response.json()) as { result: TestResult };
        await reload();
        return json.result;
      },
      saveArtifacts: async (artifacts) => {
        if (mode === "browser") {
          setData(mutateBrowserStore((store) => applySaveArtifacts(store, artifacts)));
          return;
        }
        setData((current) => ({
          ...current,
          store: { ...current.store, artifacts },
        }));
        const response = await fetch("/api/artifacts", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ artifacts }),
        });
        if (!response.ok) {
          await reload();
          throw new Error("Could not save artifacts");
        }
        await reload();
      },
      addTest: async (payload) => {
        if (mode === "browser") {
          setData(mutateBrowserStore((store) => applyAddTest(store, payload)));
          return;
        }
        const response = await fetch("/api/catalog", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!response.ok) {
          const json = (await response.json()) as { error?: string };
          throw new Error(json.error || "Could not add test");
        }
        await reload();
      },
      uploadAttachment: async ({ file, resultId, testRunId, testCaseId }) => {
        if (mode === "browser") {
          if (file.size > 4 * 1024 * 1024) {
            throw new Error("Keep attachments under 4 MB in the shared web app");
          }
          const dataUrl = await fileToDataUrl(file);
          setData(
            mutateBrowserStore((store) => {
              applyAddAttachment(store, {
                resultId,
                testRunId,
                testCaseId,
                originalName: file.name,
                mimeType: file.type || "application/octet-stream",
                size: file.size,
                dataUrl,
              });
            }),
          );
          return;
        }
        const form = new FormData();
        form.set("file", file);
        form.set("resultId", resultId);
        form.set("testRunId", testRunId);
        form.set("testCaseId", testCaseId);
        const response = await fetch("/api/attachments", { method: "POST", body: form });
        if (!response.ok) throw new Error("Upload failed");
        await reload();
      },
      deleteAttachment: async (id) => {
        if (mode === "browser") {
          setData(mutateBrowserStore((store) => applyDeleteAttachment(store, id)));
          return;
        }
        const response = await fetch(`/api/attachments/${id}`, { method: "DELETE" });
        if (!response.ok) throw new Error("Could not delete attachment");
        await reload();
      },
      exportPdf: async (runId) => {
        const run = data.store.runs.find((item) => item.id === runId);
        if (!run) throw new Error("Run not found");
        const { bytes, filename } = await buildRunPdf(data.store, run);
        downloadBlob(filename, bytes, "application/pdf");
      },
    }),
    [data, mode, ready, reload],
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useAppData() {
  const value = useContext(DataContext);
  if (!value) throw new Error("useAppData must be used inside DataProvider");
  return value;
}
