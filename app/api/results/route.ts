import { TEST_STATUSES, type TestStatus } from "@/lib/types";
import { updateStore } from "@/lib/store";

async function saveResult(body: {
  id?: string;
  testRunId: string;
  testCaseId: string;
  status?: TestStatus;
  notes?: string;
  tester?: string;
}) {
  if (!body.testRunId || !body.testCaseId) {
    throw new Error("Missing test identity");
  }

  const store = await updateStore((current) => {
    let result = current.results.find((item) =>
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
      current.results.push(result);
    }

    if (body.status) {
      if (!TEST_STATUSES.includes(body.status)) {
        throw new Error("Invalid status");
      }
      result.status = body.status;
      result.executedAt =
        body.status === "not_tested" ? undefined : new Date().toISOString();
    }
    if (body.notes !== undefined) result.notes = body.notes;
    if (body.tester !== undefined) result.tester = body.tester;
  });

  return store.results.find((item) =>
    body.id
      ? item.id === body.id
      : item.testRunId === body.testRunId && item.testCaseId === body.testCaseId,
  );
}

export async function POST(request: Request) {
  const form = await request.formData();
  const testRunId = String(form.get("testRunId") || "");
  const testCaseId = String(form.get("testCaseId") || "");
  const status = form.get("status") ? (String(form.get("status")) as TestStatus) : undefined;
  const notes = form.has("notes") ? String(form.get("notes") || "") : undefined;
  const tester = form.has("tester") ? String(form.get("tester") || "") : undefined;
  const next = String(form.get("next") || `/run?id=${testRunId}&test=${testCaseId}&view=execute`);
  await saveResult({ testRunId, testCaseId, status, notes, tester });
  return Response.redirect(new URL(next, request.url), 303);
}

export async function PUT(request: Request) {
  const body = (await request.json()) as {
    id?: string;
    testRunId: string;
    testCaseId: string;
    status?: TestStatus;
    notes?: string;
    tester?: string;
  };

  try {
    const result = await saveResult(body);
    return Response.json({ result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not save result";
    return Response.json({ error: message }, { status: 400 });
  }
}
