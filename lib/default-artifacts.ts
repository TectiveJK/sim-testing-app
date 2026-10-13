import type { DebArtifact } from "@/lib/types";

export const DEFAULT_ARTIFACTS: DebArtifact[] = [
  {
    id: "web-ground-control",
    packageName: "web-ground-control",
    filename: "web-ground-control_0.0.1-b9c924f.deb",
  },
  {
    id: "mission-planner",
    packageName: "mission-planner",
    filename: "mission-planner_1.0.0+b9c924f-b29_amd64.deb",
  },
  {
    id: "tective-simulator",
    packageName: "tective-simulator",
    filename: "tective-simulator_0.1.0+b9c924f.b29_amd64.deb",
  },
];

export function normalizeArtifacts(stored?: DebArtifact[] | null): DebArtifact[] {
  const defaults = structuredClone(DEFAULT_ARTIFACTS);
  if (!Array.isArray(stored) || stored.length === 0) return defaults;
  const wanted = DEFAULT_ARTIFACTS.map((item) => item.packageName);
  const have = stored.map((item) => item.packageName);
  const sameSet = have.length === wanted.length && wanted.every((name) => have.includes(name));
  if (!sameSet) return defaults;
  return defaults.map((def) => {
    const match = stored.find((item) => item.packageName === def.packageName);
    return {
      ...def,
      id: match?.id || def.id,
      filename: match?.filename || def.filename,
    };
  });
}
