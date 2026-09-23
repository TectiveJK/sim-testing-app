import { readFile } from "node:fs/promises";
import { attachmentPath, saveAttachmentFile, updateStore } from "@/lib/store";

export async function POST(request: Request) {
  const form = await request.formData();
  const file = form.get("file");
  const resultId = String(form.get("resultId") || "");
  const testRunId = String(form.get("testRunId") || "");
  const testCaseId = String(form.get("testCaseId") || "");

  if (!(file instanceof File) || !resultId) {
    return Response.json({ error: "file and resultId are required" }, { status: 400 });
  }

  const id = crypto.randomUUID();
  const bytes = new Uint8Array(await file.arrayBuffer());
  await saveAttachmentFile(id, bytes);

  const attachment = {
    id,
    resultId,
    filename: id,
    originalName: file.name,
    mimeType: file.type || "application/octet-stream",
    size: file.size,
    uploadedAt: new Date().toISOString(),
  };

  const store = await updateStore((current) => {
    let result = current.results.find((item) => item.id === resultId);
    if (!result && testRunId && testCaseId) {
      result = {
        id: resultId,
        testRunId,
        testCaseId,
        status: "not_tested",
        notes: "",
        attachments: [],
      };
      current.results.push(result);
    }
    if (!result) throw new Error("Result not found");
    result.attachments.push(attachment);
  });

  const result = store.results.find((item) => item.id === resultId);
  return Response.json({ attachment, result });
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  if (!id) return Response.json({ error: "Missing id" }, { status: 400 });

  const store = await (await import("@/lib/store")).readStore();
  const attachment = store.results
    .flatMap((result) => result.attachments)
    .find((item) => item.id === id);
  if (!attachment) return Response.json({ error: "Not found" }, { status: 404 });

  const bytes = await readFile(attachmentPath(id));
  return new Response(bytes, {
    headers: {
      "Content-Type": attachment.mimeType,
      "Content-Disposition": `attachment; filename="${attachment.originalName.replace(/"/g, "")}"`,
    },
  });
}
