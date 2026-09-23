import { buildRunPdf } from "@/lib/run-pdf";
import { getRunOrThrow } from "@/lib/store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { store, run } = await getRunOrThrow(id);
  if (!run) {
    return Response.json({ error: "Run not found" }, { status: 404 });
  }

  const { bytes, filename } = await buildRunPdf(store, run);
  return new Response(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
