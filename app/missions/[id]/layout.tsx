import { BUILTIN_MISSIONS } from "@/lib/missions";

export function generateStaticParams() {
  return BUILTIN_MISSIONS.map((mission) => ({ id: mission.id }));
}

export default function MissionLayout({ children }: { children: React.ReactNode }) {
  return children;
}
