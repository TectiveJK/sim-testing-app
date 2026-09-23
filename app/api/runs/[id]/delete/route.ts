import { deleteAttachmentFiles, removeRun, updateStore } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  let found = false;
  let attachmentIds: string[] = [];

  await updateStore((current) => {
    found = current.runs.some((run) => run.id === id);
    if (!found) return;
    attachmentIds = removeRun(current, id);
  });

  if (!found) {
    return Response.json({ error: "Run not found" }, { status: 404 });
  }

  await deleteAttachmentFiles(attachmentIds);

  const form = await request.formData().catch(() => null);
  const next = String(form?.get("next") || "/runs");
  return Response.redirect(new URL(next, request.url), 303);
}
