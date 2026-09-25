import { BUILTIN_TESTS } from "@/lib/catalog";
import type { Mission } from "@/lib/types";

function idOf(state: string, phase: string, command: string) {
  const slug = (value: string) =>
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  return [slug(state), slug(phase), slug(command)].filter(Boolean).join("-");
}

function step(state: string, phase: string, command: string, instruction: string) {
  return {
    testCaseId: idOf(state, phase, command),
    instruction,
  };
}

export const BUILTIN_MISSIONS: Mission[] = [
  {
    id: "corridor-complete-flight",
    name: "Corridor mission",
    category: "Corridor Missions",
    description:
      "Fly a full corridor mission from take-off through hive landing and confirm each segment completes.",
    steps: [
      step("Corridor", "Take-off", "Complete", "Create the mission, launch, and confirm take-off completes."),
      step("Corridor", "To First Waypoint", "Complete", "Confirm transit to the first waypoint completes."),
      step("Corridor", "Main/any mission corridor", "Complete", "Fly the planned corridor and confirm it completes."),
      step("Corridor", "To HL", "Complete", "Confirm transit to the hive landing (HL) point completes."),
      step("Corridor", "Landing on hive", "Complete", "Confirm landing on the hive completes and the drone disarms as expected."),
    ],
  },
  {
    id: "viewpoint-swap-complete",
    name: "Viewpoint swap to hive",
    category: "Autonomous Flight",
    description:
      "From a viewpoint swap, send the drone back to the hive and confirm the action completes.",
    steps: [
      step(
        "Viewpoint",
        "To hive from swap",
        "Complete",
        "From the viewpoint swap state, send the drone back to the hive and verify it returns.",
      ),
    ],
  },
  {
    id: "lip-interrupt-recover",
    name: "LIP interrupt and recover",
    category: "Emergency / Fail-Safe Behavior",
    description:
      "Trigger a landing-in-place descent, then return to the mission and confirm both transitions.",
    steps: [
      step("LIP", "Descending", "Complete", "Trigger LIP and confirm descent starts and can complete."),
      step("LIP", "Back to mission", "Complete", "Abort LIP / return to mission and confirm the drone resumes the plan."),
    ],
  },
  {
    id: "efl-interrupt-recover",
    name: "EFL interrupt and recover",
    category: "Emergency / Fail-Safe Behavior",
    description:
      "Trigger emergency flight, then return to the mission and confirm both transitions.",
    steps: [
      step("EFL", "Descending", "Complete", "Trigger EFL and confirm the descent / emergency response."),
      step("EFL", "Back to mission", "Complete", "Return from EFL to the mission and confirm the plan resumes."),
    ],
  },
  {
    id: "ground-arm",
    name: "Arm from ground states",
    category: "Basic Flight Functions",
    description: "Arm the drone from each supported grounded or disarmed state.",
    steps: [
      step("Deployed on hive", "disarmed", "arm", "With the drone deployed on the hive and disarmed, issue arm."),
      step("PostCTL", "In control", "arm", "From PostCTL in control, issue arm."),
      step("LIP", "Landed (disarmed)", "arm", "After a LIP landing (disarmed), issue arm."),
    ],
  },
  {
    id: "resume-mission",
    name: "Resume mission from hold / interrupt",
    category: "Missions",
    description: "From loiter, PostCTL, LIP, and EFL, command mission and verify the plan resumes.",
    steps: [
      step("Loiter", "", "mission", "From loiter, command mission and confirm the plan resumes."),
      step("PostCTL", "In control", "mission", "From PostCTL, command mission."),
      step("LIP", "Descending", "mission", "During LIP descent, command mission."),
      step("LIP", "Landed (disarmed)", "mission", "After LIP landing, command mission."),
      step("EFL", "Descending", "mission", "During EFL descent, command mission."),
      step("EFL", "Loiter", "mission", "From EFL loiter, command mission."),
    ],
  },
  {
    id: "rtl-from-flight",
    name: "RTL from in-flight states",
    category: "RTL",
    description: "Command RTL from corridor, viewpoint, loiter, PostCTL, LIP, and EFL states.",
    steps: [
      step("Corridor", "Take-off", "RTL", "During corridor take-off, command RTL."),
      step("Corridor", "To First Waypoint", "RTL", "En route to the first waypoint, command RTL."),
      step("Corridor", "Main/any mission corridor", "RTL", "On the corridor, command RTL."),
      step("Corridor", "To HL", "RTL", "On the way to HL, command RTL."),
      step("Corridor", "Landing on hive", "RTL", "During hive landing, command RTL."),
      step("Viewpoint", "to viewpoint", "RTL", "While flying to a viewpoint, command RTL."),
      step("Loiter", "", "RTL", "From loiter, command RTL."),
      step("RTL", "", "RTL", "While already in RTL, re-issue RTL and confirm it stays consistent."),
    ],
  },
];

const knownIds = new Set(BUILTIN_TESTS.map((test) => test.id));

for (const mission of BUILTIN_MISSIONS) {
  for (const missionStep of mission.steps) {
    if (!knownIds.has(missionStep.testCaseId)) {
      throw new Error(`Mission ${mission.id} references unknown test ${missionStep.testCaseId}`);
    }
  }
}
