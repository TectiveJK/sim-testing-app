import { CATEGORY_ORDER, SUITE } from "@/lib/suite";
import type { TestCase } from "@/lib/types";

export const BUILTIN_TESTS: TestCase[] = SUITE.map((mission) => ({
  id: mission.id,
  currentState: mission.category,
  phase: mission.name,
  command: "Mission",
  name: mission.name,
  description: mission.description,
  expectedBehavior: mission.expectedBehavior,
  procedure: mission.procedure,
}));

export const STATE_ORDER = CATEGORY_ORDER;

export const PHASE_ORDER: Record<string, string[]> = Object.fromEntries(
  CATEGORY_ORDER.map((category) => [
    category,
    SUITE.filter((mission) => mission.category === category).map((mission) => mission.name),
  ]),
);

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

  const commands = [
    ...new Set(tests.map((test) => String(test.command)).filter(Boolean)),
  ];

  return { tests, states, phasesByState, commands };
}
