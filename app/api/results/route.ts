import { TEST_STATUSES, type TestStatus } from "@/lib/types";
import { updateStore } from "@/lib/store";

export async function PUT(request: Request) {
  const body = (await request.json()) as {
    id?: string;
    testRunId: string;
    testCaseId: string;
    status?: TestStatus;
    notes?: string;
    tester?: string;
  };

  if (!body.testRunId || !body.testCaseId) {
    return Response.json({ error: "Missing test identity" }, { status: 400 });
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

  const result = store.results.find((item) =>
    body.id
      ? item.id === body.id
      : item.testRunId === body.testRunId && item.testCaseId === body.testCaseId,
  );

  return Response.json({ result });
}
