import type { Command, TestCase } from "@/lib/types";

type RawTest = [currentState: string, phase: string, command: Command];

const RAW_TESTS: RawTest[] = [
  ["Corridor", "Take-off", "Complete"],
  ["Corridor", "To First Waypoint", "Complete"],
  ["Corridor", "Main/any mission corridor", "Complete"],
  ["Corridor", "To HL", "Complete"],
  ["Corridor", "Landing on hive", "Complete"],
  ["Viewpoint", "To hive from swap", "Complete"],
  ["LIP", "Descending", "Complete"],
  ["LIP", "Back to mission", "Complete"],
  ["EFL", "Descending", "Complete"],
  ["EFL", "Back to mission", "Complete"],
  ["Return to Hive", "", "Complete"],
  ["RTL", "", "Complete"],

  ["Deployed on hive", "disarmed", "arm"],
  ["PostCTL", "In control", "arm"],
  ["LIP", "Landed (disarmed)", "arm"],

  ["Loiter", "", "mission"],
  ["PostCTL", "In control", "mission"],
  ["LIP", "Descending", "mission"],
  ["LIP", "Landed (disarmed)", "mission"],
  ["EFL", "Descending", "mission"],
  ["EFL", "Loiter", "mission"],

  ["Corridor", "Take-off", "loiter"],
  ["Corridor", "To First Waypoint", "loiter"],
  ["Corridor", "Main/any mission corridor", "loiter"],
  ["Corridor", "To HL", "loiter"],
  ["Viewpoint", "to viewpoint", "loiter"],
  ["Viewpoint", "waiting for release", "loiter"],
  ["Viewpoint", "To hive from swap", "loiter"],
  ["PostCTL", "In control", "loiter"],
  ["LIP", "Descending", "loiter"],
  ["LIP", "Back to mission", "loiter"],
  ["EFL", "Descending", "loiter"],
  ["EFL", "Back to mission", "loiter"],
  ["Return to Hive", "", "loiter"],
  ["RTL", "", "loiter"],

  ["Deployed on hive", "disarmed", "POSCTL"],
  ["Corridor", "Take-off", "POSCTL"],
  ["Corridor", "To First Waypoint", "POSCTL"],
  ["Corridor", "Main/any mission corridor", "POSCTL"],
  ["Corridor", "To HL", "POSCTL"],
  ["Viewpoint", "to viewpoint", "POSCTL"],
  ["Viewpoint", "waiting for release", "POSCTL"],
  ["Viewpoint", "To hive from swap", "POSCTL"],
  ["Loiter", "", "POSCTL"],
  ["LIP", "Descending", "POSCTL"],
  ["LIP", "Landed (disarmed)", "POSCTL"],
  ["LIP", "Back to mission", "POSCTL"],
  ["EFL", "Descending", "POSCTL"],
  ["EFL", "Loiter", "POSCTL"],
  ["EFL", "Back to mission", "POSCTL"],
  ["Return to Hive", "", "POSCTL"],
  ["RTL", "", "POSCTL"],

  ["Corridor", "Take-off", "EFL"],
  ["Corridor", "To First Waypoint", "EFL"],
  ["Corridor", "Main/any mission corridor", "EFL"],
  ["Corridor", "To HL", "EFL"],
  ["Viewpoint", "to viewpoint", "EFL"],
  ["Viewpoint", "waiting for release", "EFL"],
  ["Viewpoint", "To hive from swap", "EFL"],
  ["Loiter", "", "EFL"],
  ["PostCTL", "In control", "EFL"],
  ["LIP", "Descending", "EFL"],
  ["LIP", "Landed (disarmed)", "EFL"],
  ["LIP", "Back to mission", "EFL"],
  ["EFL", "Descending", "EFL"],
  ["EFL", "Loiter", "EFL"],
  ["EFL", "Back to mission", "EFL"],
  ["Return to Hive", "", "EFL"],
  ["RTL", "", "EFL"],

  ["Corridor", "To First Waypoint", "Land"],
  ["Corridor", "Main/any mission corridor", "Land"],
  ["Corridor", "To HL", "Land"],
  ["Viewpoint", "to viewpoint", "Land"],
  ["Viewpoint", "waiting for release", "Land"],
  ["Viewpoint", "To hive from swap", "Land"],
  ["Loiter", "", "Land"],
  ["PostCTL", "In control", "Land"],
  ["LIP", "Descending", "Land"],
  ["LIP", "Back to mission", "Land"],
  ["EFL", "Descending", "Land"],
  ["EFL", "Loiter", "Land"],
  ["EFL", "Back to mission", "Land"],
  ["Return to Hive", "", "Land"],
  ["RTL", "", "Land"],

  ["Corridor", "Take-off", "RTL"],
  ["Corridor", "To First Waypoint", "RTL"],
  ["Corridor", "Main/any mission corridor", "RTL"],
  ["Corridor", "To HL", "RTL"],
  ["Corridor", "Landing on hive", "RTL"],
  ["Viewpoint", "to viewpoint", "RTL"],
  ["Viewpoint", "waiting for release", "RTL"],
  ["Viewpoint", "To hive from swap", "RTL"],
  ["Loiter", "", "RTL"],
  ["PostCTL", "In control", "RTL"],
  ["LIP", "Descending", "RTL"],
  ["LIP", "Back to mission", "RTL"],
  ["EFL", "Descending", "RTL"],
  ["EFL", "Loiter", "RTL"],
  ["EFL", "Back to mission", "RTL"],
  ["RTL", "", "RTL"],
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

export const BUILTIN_TESTS: TestCase[] = RAW_TESTS.map(([currentState, phase, command]) => ({
  id: testId(currentState, phase, command),
  currentState,
  phase,
  command,
  name: phase
    ? `${currentState} / ${phase} → ${command}`
    : `${currentState} → ${command}`,
  description: describe(currentState, phase, command),
  expectedBehavior: expected(currentState, phase, command),
  procedure: procedure(currentState, phase, command),
}));

export const STATE_ORDER = [
  "Deployed on hive",
  "Corridor",
  "Viewpoint",
  "Loiter",
  "PostCTL",
  "LIP",
  "EFL",
  "Return to Hive",
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
  "Return to Hive": [""],
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
