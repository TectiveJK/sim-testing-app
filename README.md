# sim-testing-app

## Description

SIM Flight Testing is a local Ubuntu application for flight testing and regression testing of the drone in the company SIM environment.

The app contains the flight functions, commands, and mission scenarios that testers run against SkyCommand / SIM. Each function can be tested on its own or as part of a longer mission. Whenever SkyCommand / SIM software, drone software / firmware, or any other component that affects flight behaviour is updated, the tester creates a new test run from the existing suite and records whether previously verified behaviour still works.

For every test the tester can record:

- status: Passed, Failed, Blocked / Cannot Test, Not Tested, or Not Applicable
- notes and observations (unexpected behaviour, errors, telemetry)
- attachments such as screenshots, logs, error messages, and reports
- SkyCommand / SIM version
- drone software / firmware version
- date and time
- tester
- test name / test ID
- related mission, if the test is part of a scenario

The app keeps a history of previous executions so a function that passed on one release can be compared with the same function after a later release. For example, Return to Launch after GCS connection loss may pass on SkyCommand 1.2.0 / Drone 3.4.1 and fail on SkyCommand 1.3.0 / Drone 3.4.2.

It also stores the last successful SkyCommand / SIM `.deb` artifacts. Each package name and filename is editable so the tester can write the updated build after a successful release:

- autonomy-node_1.0.0+12a9d76-b2_amd64.deb
- device-log-server_1.0.0+12a9d76-b2_amd64.deb
- landing-service_1.0.0+12a9d76-b2_amd64.deb
- mission-planner_1.0.0+12a9d76-b2_amd64.deb
- px4-log-registrar_1.0.0+12a9d76-b2_amd64.deb
- skycommand-db_1.0.0+12a9d76-b2_amd64.deb
- web-ground-control_0.0.1-12a9d76.deb

New flight commands, drone functions, mission types, and SIM procedures can be added later without redesigning the application.

## What is included now

- 100 built-in tests from the current state → command matrix (Corridor, Viewpoint, LIP, EFL, Return to Hive, RTL, Deployed on hive, PostCTL, Loiter × Complete, arm, mission, loiter, POSCTL, EFL, Land, RTL)
- Mission walkthroughs with step-by-step results
- Test runs that snapshot software versions and `.deb` artifacts
- History and side-by-side run comparison for regressions
- Export PDF after some or all tests are scored, so a run can be shared with others
- Local storage on the tester’s Ubuntu machine

## Desktop icon (Ubuntu)

From the project folder:

```bash
npm run desktop-icon
```

or:

```bash
bash scripts/install-desktop-icon.sh
```

That puts **SIM Flight Testing** on your Desktop and in the application menu. Double-click the icon to start the local server and open the lab in the browser. If Ubuntu asks, choose **Allow Launching**.

The launcher starts the app on [http://127.0.0.1:43147](http://127.0.0.1:43147) if it is not already running.

## Run locally (Ubuntu)

Requires Node.js 20+.

```bash
npm install
npm run dev
```

Open [http://127.0.0.1:43147](http://127.0.0.1:43147).

Results are saved in `data/store.json`. Uploaded files go to `data/attachments/`.

```bash
npm run build
npm start
```

## Typical workflow

1. Update the last successful `.deb` filenames on the Artifacts page.
2. After a SkyCommand or drone software update, create a new test run.
3. Enter the SkyCommand / SIM version, drone version, tester, and notes.
4. Score each function or walk a mission, adding notes and attachments where needed.
5. Use **Export PDF** on the run (or the runs list) to share a partial or complete report.
6. Compare the new run with the previous run to find regressions.

## Adding tests later

Use **Test catalog → Add test**, or add a row in `lib/catalog.ts` and (optionally) a mission in `lib/missions.ts`. New tests are added to existing runs as Not Tested.
