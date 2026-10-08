export interface SuiteStep {
  label: string;
  instruction: string;
}

export interface SuiteMission {
  id: string;
  name: string;
  category: string;
  description: string;
  expectedBehavior: string;
  procedure: string;
  steps: SuiteStep[];
}

export const CATEGORY_ORDER = [
  "Nominal flight",
  "In-flight interrupt and resume",
  "Ground / hold",
  "LIP",
  "EFL",
];

export const SUITE: SuiteMission[] = [
  {
    id: "corridor-hive-to-hive",
    name: "Corridor hive to hive",
    category: "Nominal flight",
    description:
      "One flight from the hive: arm, take off, fly the corridor, return to HL, and land on the hive.",
    expectedBehavior:
      "The drone arms, completes each corridor segment in order, and lands on the hive without stalling or dropping into an unexpected fail-safe.",
    procedure:
      "In SkyCommand, arm from Deployed on hive / disarmed, then fly a corridor mission through Take-off, To First Waypoint, Main/any mission corridor, To HL, and Landing on hive. Confirm each segment completes before the next. Come back here and record one result for the whole flight.",
    steps: [
      {
        label: "Arm on hive",
        instruction: "With the drone deployed on the hive and disarmed, issue arm in SkyCommand.",
      },
      {
        label: "Take-off",
        instruction: "Create the corridor mission, launch, and confirm take-off completes.",
      },
      {
        label: "To First Waypoint",
        instruction: "Confirm transit to the first waypoint completes.",
      },
      {
        label: "Main corridor",
        instruction: "Fly the planned corridor and confirm it completes.",
      },
      {
        label: "To HL",
        instruction: "Confirm transit to the hive landing (HL) point completes.",
      },
      {
        label: "Landing on hive",
        instruction: "Confirm landing on the hive completes and the drone disarms as expected.",
      },
    ],
  },
  {
    id: "viewpoint-swap-to-hive",
    name: "Viewpoint swap to hive",
    category: "Nominal flight",
    description: "From a viewpoint swap, send the drone back to the hive and confirm it completes.",
    expectedBehavior: "The drone leaves the viewpoint swap and returns to the hive without remaining in the swap state.",
    procedure:
      "In SkyCommand, put the drone in Viewpoint / To hive from swap, command the return, and confirm it completes. Record one result.",
    steps: [
      {
        label: "To hive from swap",
        instruction: "From the viewpoint swap state, send the drone back to the hive and verify it returns.",
      },
    ],
  },
  {
    id: "return-to-hive-from-viewpoint",
    name: "Return to Hive from viewpoint transit",
    category: "Nominal flight",
    description: "While flying to a viewpoint, command Return to Hive.",
    expectedBehavior: "The drone aborts viewpoint transit and returns to the hive.",
    procedure:
      "In SkyCommand, start a flight to a viewpoint. While in Viewpoint / to viewpoint, issue Return to Hive and confirm the drone returns. Record one result.",
    steps: [
      {
        label: "Return to Hive",
        instruction: "While flying to a viewpoint, command Return to Hive and confirm the drone returns to the hive.",
      },
    ],
  },
  {
    id: "rtl-from-viewpoint",
    name: "RTL from viewpoint transit",
    category: "Nominal flight",
    description: "While flying to a viewpoint, command RTL, then confirm RTL itself completes.",
    expectedBehavior: "The drone enters RTL from viewpoint transit and RTL finishes cleanly.",
    procedure:
      "In SkyCommand, start a flight to a viewpoint. While in Viewpoint / to viewpoint, issue RTL. Then confirm RTL completes. Record one result for both steps.",
    steps: [
      {
        label: "Issue RTL",
        instruction: "While flying to a viewpoint, command RTL.",
      },
      {
        label: "RTL completes",
        instruction: "Confirm RTL completes and the drone finishes the return.",
      },
    ],
  },
  {
    id: "inflight-loiter-then-resume",
    name: "In-flight loiter, then resume",
    category: "In-flight interrupt and resume",
    description:
      "From an in-flight element, command loiter, then resume the mission. Covers Take-off, To First Waypoint, Main/any mission corridor, To HL, to viewpoint, waiting for release, and To hive from swap.",
    expectedBehavior:
      "The drone holds in loiter from the in-flight element, then resumes the plan when mission is commanded.",
    procedure:
      "Prefer Main/any mission corridor for the first flight. Issue loiter, confirm the hold, then command mission and confirm the plan resumes. If you also check other in-flight elements, use separate flights. Score PASS only if every phase you flew resumed cleanly. Record one result.",
    steps: [
      {
        label: "Loiter",
        instruction:
          "From an in-flight element (Take-off, To First Waypoint, Main/any mission corridor, To HL, to viewpoint, waiting for release, or To hive from swap), command loiter.",
      },
      {
        label: "Resume mission",
        instruction: "From loiter, command mission and confirm the plan resumes.",
      },
    ],
  },
  {
    id: "inflight-posctl-then-resume",
    name: "In-flight POSCTL, then resume",
    category: "In-flight interrupt and resume",
    description:
      "From an in-flight element, command POSCTL, then resume the mission from PostCTL.",
    expectedBehavior:
      "The drone enters position control, then resumes the plan from PostCTL / In control.",
    procedure:
      "Prefer Main/any mission corridor. Issue POSCTL, confirm PostCTL / In control, then command mission. Other in-flight elements need separate flights. Record one result.",
    steps: [
      {
        label: "POSCTL",
        instruction: "From an in-flight element, command POSCTL.",
      },
      {
        label: "Resume mission",
        instruction: "From PostCTL / In control, command mission and confirm the plan resumes.",
      },
    ],
  },
  {
    id: "inflight-efl-then-resume",
    name: "In-flight EFL, then resume",
    category: "In-flight interrupt and resume",
    description: "From an in-flight element, trigger EFL, then resume the mission during EFL descent.",
    expectedBehavior:
      "EFL starts from the in-flight element. Commanding mission during EFL / Descending returns the drone to the plan.",
    procedure:
      "Prefer Main/any mission corridor. Issue EFL, confirm EFL / Descending, then command mission. Other in-flight elements need separate flights. Record one result.",
    steps: [
      {
        label: "EFL",
        instruction: "From an in-flight element, command EFL.",
      },
      {
        label: "Resume mission",
        instruction: "During EFL / Descending, command mission and confirm the plan resumes.",
      },
    ],
  },
  {
    id: "inflight-land-lip-then-resume",
    name: "In-flight Land / LIP, then resume",
    category: "In-flight interrupt and resume",
    description:
      "From an in-flight element that supports Land, command Land into LIP, then resume during LIP descent. Take-off has no Land case.",
    expectedBehavior:
      "Land starts LIP descent. Commanding mission during LIP / Descending returns the drone to the plan.",
    procedure:
      "Prefer Main/any mission corridor. Issue Land, confirm LIP / Descending, then command mission. Also valid from To First Waypoint, To HL, to viewpoint, waiting for release, and To hive from swap. Record one result.",
    steps: [
      {
        label: "Land",
        instruction:
          "From To First Waypoint, Main/any mission corridor, To HL, to viewpoint, waiting for release, or To hive from swap, command Land.",
      },
      {
        label: "Resume from LIP",
        instruction: "During LIP / Descending, command mission and confirm the plan resumes.",
      },
    ],
  },
  {
    id: "posctl-from-hive",
    name: "POSCTL from the hive",
    category: "Ground / hold",
    description: "From Deployed on hive / disarmed, command POSCTL. This is separate from arm.",
    expectedBehavior: "The drone enters position control from the disarmed hive state without an unexpected arm or take-off.",
    procedure:
      "In SkyCommand, with the drone deployed on the hive and disarmed, issue POSCTL. Confirm the mode change. Record one result.",
    steps: [
      {
        label: "POSCTL on hive",
        instruction: "With the drone deployed on the hive and disarmed, command POSCTL.",
      },
    ],
  },
  {
    id: "arm-from-postctl",
    name: "Arm from PostCTL",
    category: "Ground / hold",
    description: "From PostCTL / In control, issue arm.",
    expectedBehavior: "The drone arms from PostCTL without leaving control unexpectedly.",
    procedure:
      "In SkyCommand, put the drone in PostCTL / In control, then issue arm. Record one result.",
    steps: [
      {
        label: "Arm",
        instruction: "From PostCTL / In control, issue arm.",
      },
    ],
  },
  {
    id: "loiter-leave-hold",
    name: "From loiter, leave hold",
    category: "Ground / hold",
    description: "From loiter, command POSCTL, EFL, or Land. One flight can take only one branch.",
    expectedBehavior:
      "Each commanded exit leaves loiter and enters the expected POSCTL, EFL, or Land behaviour.",
    procedure:
      "Put the drone in loiter. Fly POSCTL, EFL, and Land as separate branches (new flight if needed). Score PASS only if every branch you flew behaved as expected. Record one result.",
    steps: [
      { label: "Loiter -> POSCTL", instruction: "From loiter, command POSCTL." },
      { label: "Loiter -> EFL", instruction: "From loiter, command EFL." },
      { label: "Loiter -> Land", instruction: "From loiter, command Land." },
    ],
  },
  {
    id: "postctl-leave-hold",
    name: "From PostCTL, leave hold",
    category: "Ground / hold",
    description: "From PostCTL / In control, command loiter, EFL, or Land. One flight can take only one branch.",
    expectedBehavior:
      "Each commanded exit leaves PostCTL and enters the expected loiter, EFL, or Land behaviour.",
    procedure:
      "Put the drone in PostCTL / In control. Fly loiter, EFL, and Land as separate branches. Score PASS only if every branch you flew behaved as expected. Record one result.",
    steps: [
      { label: "PostCTL -> loiter", instruction: "From PostCTL / In control, command loiter." },
      { label: "PostCTL -> EFL", instruction: "From PostCTL / In control, command EFL." },
      { label: "PostCTL -> Land", instruction: "From PostCTL / In control, command Land." },
    ],
  },
  {
    id: "lip-descent",
    name: "LIP descent",
    category: "LIP",
    description:
      "While LIP is descending, command Complete, loiter, POSCTL, EFL, or Land. One flight can take only one branch.",
    expectedBehavior:
      "Each commanded action from LIP / Descending is accepted and the drone does not stall in LIP.",
    procedure:
      "Trigger LIP so the drone is in LIP / Descending. Fly Complete, loiter, POSCTL, EFL, and Land as separate branches. Score PASS only if every branch you flew behaved as expected. Record one result.",
    steps: [
      { label: "Complete", instruction: "During LIP / Descending, let LIP complete." },
      { label: "loiter", instruction: "During LIP / Descending, command loiter." },
      { label: "POSCTL", instruction: "During LIP / Descending, command POSCTL." },
      { label: "EFL", instruction: "During LIP / Descending, command EFL." },
      { label: "Land", instruction: "During LIP / Descending, command Land." },
    ],
  },
  {
    id: "after-lip-landing",
    name: "After LIP landing",
    category: "LIP",
    description:
      "After LIP has landed and disarmed, command arm, mission, POSCTL, or EFL. One flight can take only one branch.",
    expectedBehavior:
      "Each command from LIP / Landed (disarmed) is accepted. Arm, mission, POSCTL, and EFL do not leave the drone stuck on the ground in LIP.",
    procedure:
      "Complete a LIP landing so the drone is Landed (disarmed). Fly arm, mission, POSCTL, and EFL as separate branches. Score PASS only if every branch you flew behaved as expected. Record one result.",
    steps: [
      { label: "arm", instruction: "After LIP / Landed (disarmed), issue arm." },
      { label: "mission", instruction: "After LIP / Landed (disarmed), command mission." },
      { label: "POSCTL", instruction: "After LIP / Landed (disarmed), command POSCTL." },
      { label: "EFL", instruction: "After LIP / Landed (disarmed), command EFL." },
    ],
  },
  {
    id: "lip-back-to-mission",
    name: "LIP back to mission",
    category: "LIP",
    description:
      "While returning from LIP to the mission, command Complete, loiter, POSCTL, EFL, or Land. One flight can take only one branch.",
    expectedBehavior:
      "LIP / Back to mission can complete, and each interrupt during recovery is accepted.",
    procedure:
      "Abort LIP so the drone is in LIP / Back to mission. Fly Complete, loiter, POSCTL, EFL, and Land as separate branches. Score PASS only if every branch you flew behaved as expected. Record one result.",
    steps: [
      { label: "Complete", instruction: "From LIP / Back to mission, confirm the return to the plan completes." },
      { label: "loiter", instruction: "From LIP / Back to mission, command loiter." },
      { label: "POSCTL", instruction: "From LIP / Back to mission, command POSCTL." },
      { label: "EFL", instruction: "From LIP / Back to mission, command EFL." },
      { label: "Land", instruction: "From LIP / Back to mission, command Land." },
    ],
  },
  {
    id: "efl-descent",
    name: "EFL descent",
    category: "EFL",
    description:
      "While EFL is descending, command Complete, loiter, POSCTL, EFL, or Land. One flight can take only one branch.",
    expectedBehavior:
      "Each commanded action from EFL / Descending is accepted and the drone does not stall in EFL.",
    procedure:
      "Trigger EFL so the drone is in EFL / Descending. Fly Complete, loiter, POSCTL, EFL, and Land as separate branches. Score PASS only if every branch you flew behaved as expected. Record one result.",
    steps: [
      { label: "Complete", instruction: "During EFL / Descending, let EFL complete." },
      { label: "loiter", instruction: "During EFL / Descending, command loiter." },
      { label: "POSCTL", instruction: "During EFL / Descending, command POSCTL." },
      { label: "EFL", instruction: "During EFL / Descending, command EFL again." },
      { label: "Land", instruction: "During EFL / Descending, command Land." },
    ],
  },
  {
    id: "efl-loiter",
    name: "EFL loiter",
    category: "EFL",
    description:
      "From EFL loiter, command mission, POSCTL, EFL, or Land. One flight can take only one branch.",
    expectedBehavior:
      "Each commanded exit from EFL / Loiter is accepted, including resume mission.",
    procedure:
      "Put the drone in EFL / Loiter. Fly mission, POSCTL, EFL, and Land as separate branches. Score PASS only if every branch you flew behaved as expected. Record one result.",
    steps: [
      { label: "mission", instruction: "From EFL / Loiter, command mission." },
      { label: "POSCTL", instruction: "From EFL / Loiter, command POSCTL." },
      { label: "EFL", instruction: "From EFL / Loiter, command EFL." },
      { label: "Land", instruction: "From EFL / Loiter, command Land." },
    ],
  },
  {
    id: "efl-back-to-mission",
    name: "EFL back to mission",
    category: "EFL",
    description:
      "While returning from EFL to the mission, command Complete, loiter, POSCTL, EFL, or Land. One flight can take only one branch.",
    expectedBehavior:
      "EFL / Back to mission can complete, and each interrupt during recovery is accepted.",
    procedure:
      "Return from EFL so the drone is in EFL / Back to mission. Fly Complete, loiter, POSCTL, EFL, and Land as separate branches. Score PASS only if every branch you flew behaved as expected. Record one result.",
    steps: [
      { label: "Complete", instruction: "From EFL / Back to mission, confirm the return to the plan completes." },
      { label: "loiter", instruction: "From EFL / Back to mission, command loiter." },
      { label: "POSCTL", instruction: "From EFL / Back to mission, command POSCTL." },
      { label: "EFL", instruction: "From EFL / Back to mission, command EFL." },
      { label: "Land", instruction: "From EFL / Back to mission, command Land." },
    ],
  },
];

{
  const ids = SUITE.map((item) => item.id);
  if (new Set(ids).size !== ids.length) {
    throw new Error("Duplicate suite mission ids");
  }
  if (ids.length !== 18) {
    throw new Error(`Expected 18 missions, got ${ids.length}`);
  }
}
