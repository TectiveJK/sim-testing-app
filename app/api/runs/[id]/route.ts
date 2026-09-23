import { rememberTester, updateStore } from "@/lib/store";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = (await request.json()) as {
    name?: string;
    skyCommandVersion?: string;
    droneVersion?: string;
    tester?: string;
    notes?: string;
    completedAt?: string | null;
    artifacts?: { id: string; packageName: string; filename: string }[];
  };

  try {
    const store = await updateStore((current) => {
      const run = current.runs.find((item) => item.id === id);
      if (!run) throw new Error("Run not found");
      if (body.name !== undefined) run.name = body.name;
      if (body.skyCommandVersion !== undefined) run.skyCommandVersion = body.skyCommandVersion;
      if (body.droneVersion !== undefined) run.droneVersion = body.droneVersion;
      if (body.tester !== undefined) {
        run.tester = body.tester;
        rememberTester(current, body.tester);
      }
      if (body.notes !== undefined) run.notes = body.notes;
      if (body.completedAt !== undefined) {
        run.completedAt = body.completedAt ?? undefined;
      }
      if (body.artifacts) run.artifacts = body.artifacts;
    });

    const run = store.runs.find((item) => item.id === id);
    if (!run) return Response.json({ error: "Run not found" }, { status: 404 });
    return Response.json({ run });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not update run";
    const status = message === "Run not found" ? 404 : 500;
    return Response.json({ error: message }, { status });
  }
}
