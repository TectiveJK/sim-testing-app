import type { DebArtifact } from "@/lib/types";
import { updateStore } from "@/lib/store";

export async function PUT(request: Request) {
  const body = (await request.json()) as { artifacts: DebArtifact[] };
  if (!Array.isArray(body.artifacts)) {
    return Response.json({ error: "artifacts must be an array" }, { status: 400 });
  }

  const store = await updateStore((current) => {
    current.artifacts = body.artifacts.map((artifact) => ({
      id: artifact.id || crypto.randomUUID(),
      packageName: artifact.packageName.trim(),
      filename: artifact.filename.trim(),
    }));
  });

  return Response.json({ artifacts: store.artifacts });
}
