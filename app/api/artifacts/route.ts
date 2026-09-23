import type { DebArtifact } from "@/lib/types";
import { updateStore } from "@/lib/store";

async function saveArtifacts(artifacts: DebArtifact[]) {
  const store = await updateStore((current) => {
    current.artifacts = artifacts.map((artifact) => ({
      id: artifact.id || crypto.randomUUID(),
      packageName: artifact.packageName.trim(),
      filename: artifact.filename.trim(),
    }));
  });
  return store.artifacts;
}

export async function POST(request: Request) {
  const form = await request.formData();
  const count = Number(form.get("count") || 0);
  const artifacts: DebArtifact[] = [];
  for (let index = 0; index < count; index += 1) {
    artifacts.push({
      id: String(form.get(`id-${index}`) || crypto.randomUUID()),
      packageName: String(form.get(`packageName-${index}`) || ""),
      filename: String(form.get(`filename-${index}`) || ""),
    });
  }
  await saveArtifacts(artifacts);
  return Response.redirect(new URL("/artifacts", request.url), 303);
}

export async function PUT(request: Request) {
  const body = (await request.json()) as { artifacts: DebArtifact[] };
  if (!Array.isArray(body.artifacts)) {
    return Response.json({ error: "artifacts must be an array" }, { status: 400 });
  }
  const artifacts = await saveArtifacts(body.artifacts);
  return Response.json({ artifacts });
}
