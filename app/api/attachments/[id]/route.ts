import { unlink } from "node:fs/promises";
import { attachmentPath, updateStore } from "@/lib/store";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const store = await updateStore((current) => {
    for (const result of current.results) {
      result.attachments = result.attachments.filter((item) => item.id !== id);
    }
  });

  try {
    await unlink(attachmentPath(id));
  } catch {
    // File may already be gone.
  }

  return Response.json({ ok: true, store });
}
