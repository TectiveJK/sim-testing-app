import type { Command, TestCase } from "@/lib/types";

type RawTest = [task: string, element: string, operation: Command];

const RAW_TESTS: RawTest[] = [
  ["Deployed on hive", "disarmed", "arm"],
  ["Corridor", "Take-off", "Complete"],
  ["Corridor", "To First Waypoint", "Complete"],
  ["Corridor", "Main/any mission corridor", "Complete"],
  ["Corridor", "To HL", "Complete"],
  ["Corridor", "Landing on hive", "Complete"],
  ["Viewpoint", "to viewpoint", "Return to Hive"],
  ["Viewpoint", "to viewpoint", "RTL"],
  ["RTL", "", "Complete"],
  ["Corridor", "Main/any mission corridor", "loiter"],
  ["Loiter", "", "mission"],
  ["Corridor", "Main/any mission corridor", "POSCTL"],
  ["PostCTL", "In control", "mission"],
  ["Corridor", "Main/any mission corridor", "EFL"],
  ["EFL", "Descending", "mission"],
  ["Corridor", "Main/any mission corridor", "Land"],
  ["LIP", "Descending", "mission"],
  ["Viewpoint", "To hive from swap", "Complete"],
  ["PostCTL", "In control", "arm"],
  ["Deployed on hive", "disarmed", "POSCTL"],
  ["Corridor", "Take-off", "loiter"],
  ["Corridor", "Take-off", "POSCTL"],
  ["Corridor", "Take-off", "EFL"],
  ["Corridor", "To First Waypoint", "loiter"],
  ["Corridor", "To First Waypoint", "POSCTL"],
  ["Corridor", "To First Waypoint", "EFL"],
  ["Corridor", "To First Waypoint", "Land"],
  ["Corridor", "To HL", "loiter"],
  ["Corridor", "To HL", "POSCTL"],
  ["Corridor", "To HL", "EFL"],
  ["Corridor", "To HL", "Land"],
  ["Viewpoint", "to viewpoint", "loiter"],
  ["Viewpoint", "to viewpoint", "POSCTL"],
  ["Viewpoint", "to viewpoint", "EFL"],
  ["Viewpoint", "to viewpoint", "Land"],
  ["Viewpoint", "waiting for release", "loiter"],
  ["Viewpoint", "waiting for release", "POSCTL"],
  ["Viewpoint", "waiting for release", "EFL"],
  ["Viewpoint", "waiting for release", "Land"],
  ["Viewpoint", "To hive from swap", "loiter"],
  ["Viewpoint", "To hive from swap", "POSCTL"],
  ["Viewpoint", "To hive from swap", "EFL"],
  ["Viewpoint", "To hive from swap", "Land"],
  ["Loiter", "", "POSCTL"],
  ["Loiter", "", "EFL"],
  ["Loiter", "", "Land"],
  ["PostCTL", "In control", "loiter"],
  ["PostCTL", "In control", "EFL"],
  ["PostCTL", "In control", "Land"],
  ["LIP", "Descending", "loiter"],
  ["LIP", "Descending", "POSCTL"],
  ["LIP", "Descending", "EFL"],
  ["LIP", "Descending", "Complete"],
  ["LIP", "Descending", "Land"],
  ["LIP", "Landed (disarmed)", "arm"],
  ["LIP", "Landed (disarmed)", "mission"],
  ["LIP", "Landed (disarmed)", "POSCTL"],
  ["LIP", "Landed (disarmed)", "EFL"],
  ["LIP", "Back to mission", "loiter"],
  ["LIP", "Back to mission", "POSCTL"],
  ["LIP", "Back to mission", "EFL"],
  ["LIP", "Back to mission", "Land"],
  ["EFL", "Descending", "loiter"],
  ["EFL", "Descending", "POSCTL"],
  ["EFL", "Descending", "EFL"],
  ["EFL", "Descending", "Land"],
  ["EFL", "Loiter", "POSCTL"],
  ["EFL", "Loiter", "EFL"],
  ["EFL", "Loiter", "Land"],
  ["EFL", "Back to mission", "loiter"],
  ["EFL", "Back to mission", "POSCTL"],
  ["EFL", "Back to mission", "EFL"],
  ["EFL", "Back to mission", "Land"],
  ["LIP", "Back to mission", "Complete"],
  ["EFL", "Descending", "Complete"],
  ["EFL", "Loiter", "mission"],
  ["EFL", "Back to mission", "Complete"],
];

function slug(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function testId(state: string, phase: string, command: string) {
  return [slug(state), slug(phase), slug(command)].filter(Boolean).join("-");
}

function commandLabel(command: string) {
  switch (command) {
    case "Complete":
      return "Complete the current action";
    case "arm":
      return "Arm";
    case "mission":
      return "Resume / start mission";
    case "loiter":
      return "Loiter";
    case "POSCTL":
      return "Position control (POSCTL)";
    case "EFL":
      return "Emergency flight / EFL";
    case "Land":
      return "Land";
    case "Return to Hive":
      return "Return to hive";
    case "RTL":
      return "Return to launch (RTL)";
    default:
      return command;
  }
}

function describe(state: string, phase: string, command: string) {
  const from = phase ? `${state} — ${phase}` : state;
  return `From ${from}, use SkyCommand to ${commandLabel(command).toLowerCase()} and check that the drone responds as expected.`;
}

function expected(state: string, phase: string, command: string) {
  const from = phase ? `${state} (${phase})` : state;
  return `Drone leaves ${from} cleanly and enters the expected ${command} behaviour without stalling, remaining in the previous mode, or reporting an unexpected fail-safe.`;
}

function procedure(state: string, phase: string, command: string) {
  return [
    `In SkyCommand, put the drone in ${phase ? `${state} / ${phase}` : state}.`,
    `Issue the ${command} command in SkyCommand.`,
    "Watch the drone response on the SkyCommand / SIM monitors.",
    "Come back here and record PASS or FAIL, with notes if anything unexpected happened.",
  ].join(" ");
}

function testName(currentState: string, phase: string, command: string) {
  if (command === "Complete") {
    return phase ? `${currentState} / ${phase}` : currentState;
  }
  return phase ? `${currentState} / ${phase} → ${command}` : `${currentState} → ${command}`;
}

export const BUILTIN_TESTS: TestCase[] = RAW_TESTS.map(([currentState, phase, command]) => ({
  id: testId(currentState, phase, command),
  currentState,
  phase,
  command,
  name: testName(currentState, phase, command),
  description: describe(currentState, phase, command),
  expectedBehavior: expected(currentState, phase, command),
  procedure: procedure(currentState, phase, command),
}));

{
  const ids = BUILTIN_TESTS.map((test) => test.id);
  if (new Set(ids).size !== ids.length) {
    throw new Error("Duplicate built-in test ids");
  }
  if (ids.length !== 77) {
    throw new Error(`Expected 77 built-in tests, got ${ids.length}`);
  }
}

export const STATE_ORDER = [
  "Deployed on hive",
  "Corridor",
  "Viewpoint",
  "Loiter",
  "PostCTL",
  "LIP",
  "EFL",
  "RTL",
];

export const PHASE_ORDER: Record<string, string[]> = {
  "Deployed on hive": ["disarmed"],
  Corridor: [
    "Take-off",
    "To First Waypoint",
    "Main/any mission corridor",
    "To HL",
    "Landing on hive",
  ],
  Viewpoint: ["to viewpoint", "waiting for release", "To hive from swap"],
  Loiter: [""],
  PostCTL: ["In control"],
  LIP: ["Descending", "Landed (disarmed)", "Back to mission"],
  EFL: ["Descending", "Loiter", "Back to mission"],
  RTL: [""],
};

export function mergeCatalog(customTests: TestCase[] = []): TestCase[] {
  const seen = new Set(BUILTIN_TESTS.map((test) => test.id));
  const extras = customTests.filter((test) => {
    if (seen.has(test.id)) return false;
    seen.add(test.id);
    return true;
  });
  return [...BUILTIN_TESTS, ...extras];
}

export function findTest(tests: TestCase[], id: string) {
  return tests.find((test) => test.id === id);
}

export function catalogPayload(customTests: TestCase[] = []) {
  const tests = mergeCatalog(customTests);
  const states = [
    ...STATE_ORDER,
    ...tests.map((test) => test.currentState).filter((state) => !STATE_ORDER.includes(state)),
  ].filter((state, index, list) => list.indexOf(state) === index);

  const phasesByState: Record<string, string[]> = {};
  for (const state of states) {
    const preferred = PHASE_ORDER[state] ?? [];
    const extras = tests
      .filter((test) => test.currentState === state)
      .map((test) => test.phase)
      .filter((phase) => !preferred.includes(phase));
    phasesByState[state] = [
      ...preferred,
      ...extras.filter((phase, index, list) => list.indexOf(phase) === index),
    ];
  }

  return { tests, states, phasesByState };
}
