export function appBasePath() {
  return process.env.NEXT_PUBLIC_BASE_PATH || "";
}

export function appPath(path: string) {
  if (!path.startsWith("/") || path.startsWith("//")) return path;
  return `${appBasePath()}${path}`;
}

export function runHref(
  runId: string,
  query: Record<string, string | undefined> = {},
) {
  const params = new URLSearchParams({ id: runId });
  for (const [key, value] of Object.entries(query)) {
    if (key === "id" || value === undefined) continue;
    params.set(key, value);
  }
  return `/run?${params.toString()}`;
}

export function attachmentHref(id: string, dataUrl?: string) {
  return dataUrl || appPath(`/api/attachments?id=${encodeURIComponent(id)}`);
}
