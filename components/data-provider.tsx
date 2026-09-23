"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { AppData } from "@/lib/client-types";
import type { DebArtifact, TestCase, TestResult, TestStatus } from "@/lib/types";

interface DataContextValue extends AppData {
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
}

const DataContext = createContext<DataContextValue | null>(null);

export function DataProvider({
  initial,
  children,
}: {
  initial: AppData;
  children: React.ReactNode;
}) {
  const [data, setData] = useState(initial);

  const reload = useCallback(async () => {
    const response = await fetch("/api/data", { cache: "no-store" });
    if (!response.ok) throw new Error("Failed to load data");
    setData((await response.json()) as AppData);
  }, []);

  const value = useMemo<DataContextValue>(
    () => ({
      ...data,
      reload,
      createRun: async (payload) => {
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
        const response = await fetch(`/api/runs/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!response.ok) throw new Error("Could not update run");
        await reload();
      },
      saveResult: async (payload) => {
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
        const response = await fetch(`/api/attachments/${id}`, { method: "DELETE" });
        if (!response.ok) throw new Error("Could not delete attachment");
        await reload();
      },
    }),
    [data, reload],
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useAppData() {
  const value = useContext(DataContext);
  if (!value) throw new Error("useAppData must be used inside DataProvider");
  return value;
}
