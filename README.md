# SIM Flight Testing

Local Ubuntu desktop app for **SIM flight testing and regression testing**.

This repository is the centralized lab used to test drone flight functions, commands, and mission scenarios in the company SIM environment. After every SkyCommand / SIM, drone software / firmware, or related update, testers re-run the same catalog, record results, and compare releases so previously verified behaviour does not silently break.

## Description

The app organizes the current SIM flight-test matrix as individual, repeatable cases:

- **Current state** — for example Corridor, Viewpoint, LIP, EFL, Return to Hive, RTL, Deployed on hive, PostCTL, or Loiter
- **Phase** — for example Take-off, To First Waypoint, Landing on hive, Descending, or waiting for release
- **Command** — Complete, arm, mission, loiter, POSCTL, EFL, Land, or RTL

Each case can be executed on its own or as a step in a longer mission. A test run snapshots the software versions under test so you can answer questions such as: *did Return to Launch after GCS connection loss still pass after SkyCommand 1.3.0?*

Results are stored on the local machine. Nothing in this first slice requires cloud services, a database server, or login.

## What testers record

For every execution the app can store:

- Test name / test ID
- Result: **Passed**, **Failed**, **Blocked / Cannot Test**, **Not Tested**, or **Not Applicable**
- Notes and observations (unexpected modes, errors, telemetry, recovery)
- Attachments such as screenshots, logs, error messages, and reports
- SkyCommand / SIM version
- Drone software / firmware version
- Tester
- Date and time
- Related mission, when the case is scored from a scenario
- Last successful `.deb` artifacts used for that run

## Features

- **Test catalog** — 100 built-in state → command transitions in a matrix and a searchable list
- **Missions** — multi-step scenarios (corridor complete, LIP/EFL recover, ground arm, resume mission, RTL from flight)
- **Test runs** — create a new run from the existing suite after each software release instead of rebuilding tests by hand
- **History** — see one function across versions, dates, results, and notes
- **Compare runs** — highlight regressions (passed → failed) and improvements (failed → passed)
- **Last successful artifacts** — editable fields for the current known-good SkyCommand / SIM packages:
  - `autonomy-node_1.0.0+12a9d76-b2_amd64.deb`
  - `device-log-server_1.0.0+12a9d76-b2_amd64.deb`
  - `landing-service_1.0.0+12a9d76-b2_amd64.deb`
  - `mission-planner_1.0.0+12a9d76-b2_amd64.deb`
  - `px4-log-registrar_1.0.0+12a9d76-b2_amd64.deb`
  - `skycommand-db_1.0.0+12a9d76-b2_amd64.deb`
  - `web-ground-control_0.0.1-12a9d76.deb`
- **Extensible catalog** — add new flight functions from the UI or by appending rows in `lib/catalog.ts` without redesigning the app

## Run locally (Ubuntu)

Requires Node.js 20+.

```bash
npm install
npm run dev
```

Open [http://127.0.0.1:43147](http://127.0.0.1:43147).

Results are written to `data/store.json`. Uploaded files go to `data/attachments/`.

Production-style local serve:

```bash
npm run build
npm start
```

## Typical workflow

1. Update **Last artifacts** with the current known-good `.deb` filenames.
2. After a software release, open **Test runs → New test run**.
3. Enter SkyCommand / SIM version, drone software version, tester, and run notes.
4. Score individual transitions, or walk a **Mission** step by step.
5. Use **Compare runs** and **History** to confirm that previously passing functions still pass.

## Adding tests later

Use **Test catalog → Add test**, or add a row in `lib/catalog.ts` and (optionally) a scenario in `lib/missions.ts`. New catalog entries are attached to existing runs as **Not Tested**.
