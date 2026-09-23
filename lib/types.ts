export const TEST_STATUSES = [
  "passed",
  "failed",
  "blocked",
  "not_tested",
  "not_applicable",
] as const;

export type TestStatus = (typeof TEST_STATUSES)[number];

export const COMMANDS = [
  "Complete",
  "arm",
  "mission",
  "loiter",
  "POSCTL",
  "EFL",
  "Land",
  "RTL",
] as const;

export type Command = (typeof COMMANDS)[number];

export interface TestCase {
  id: string;
  currentState: string;
  phase: string;
  command: Command | string;
  name: string;
  description: string;
  expectedBehavior: string;
  procedure: string;
  custom?: boolean;
}

export interface MissionStep {
  testCaseId: string;
  instruction: string;
}

export interface Mission {
  id: string;
  name: string;
  description: string;
  category: string;
  steps: MissionStep[];
}

export interface DebArtifact {
  id: string;
  packageName: string;
  filename: string;
}

export interface Attachment {
  id: string;
  resultId: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  uploadedAt: string;
}

export interface TestResult {
  id: string;
  testRunId: string;
  testCaseId: string;
  status: TestStatus;
  notes: string;
  attachments: Attachment[];
  executedAt?: string;
  tester?: string;
}

export interface TestRun {
  id: string;
  number: number;
  name: string;
  skyCommandVersion: string;
  droneVersion: string;
  tester: string;
  startedAt: string;
  completedAt?: string;
  notes: string;
  artifacts: DebArtifact[];
}

export interface AppStore {
  artifacts: DebArtifact[];
  testers: string[];
  runs: TestRun[];
  results: TestResult[];
  customTests: TestCase[];
}

export interface CatalogPayload {
  tests: TestCase[];
  missions: Mission[];
  states: string[];
  phasesByState: Record<string, string[]>;
  commands: string[];
}
