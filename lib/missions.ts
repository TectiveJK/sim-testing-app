import { SUITE } from "@/lib/suite";
import type { Mission } from "@/lib/types";

export const BUILTIN_MISSIONS: Mission[] = SUITE.map((mission) => ({
  id: mission.id,
  name: mission.name,
  category: mission.category,
  description: mission.description,
  steps: mission.steps.map((step) => ({
    testCaseId: mission.id,
    label: step.label,
    instruction: step.instruction,
  })),
}));
