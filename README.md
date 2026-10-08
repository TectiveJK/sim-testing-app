# sim-testing-app

## Open the app

Do not use `http://127.0.0.1:43147`. That address only works on a computer that is already running the local server. If you see **refused to connect**, you opened that local address.

Open this instead. It is the checklist itself:

**https://tectivejk.github.io/sim-testing-app/**

The first screen is a login window. Only the owner can sign in. The username and password are not written in this repository.

## Put the icon on your Ubuntu desktop

The desktop icon opens that same address. It does not use `127.0.0.1`.

Run these commands in a terminal **on your Ubuntu computer**. If you already cloned the repo, skip clone and start at `cd`:

```bash
git clone https://github.com/TectiveJK/sim-testing-app.git
cd sim-testing-app
git pull
npm install
npm run setup
```

`npm run setup` puts a gold drone icon named **SIM Flight Testing** on your Desktop and on Bureaublad. Double-click it. If Ubuntu asks, choose **Allow Launching**.

The source repository is https://github.com/TectiveJK/sim-testing-app. Each tester keeps their own results. Use **Export PDF** to share a test-run report.

## Description

SIM Flight Testing is a **testing checklist and result-recording** application. It does not control, communicate with, or receive data from SkyCommand. The two applications stay completely independent. A login window appears first so only the owner can open the checklist. The username and password are not stored in this README or anywhere else in the repository as plain text.

The tester reads the procedure in SIM Flight Testing, performs the required actions manually in SkyCommand on the other monitor, then returns here to record the result.

The workflow is:

1. Read the test on SIM Flight Testing
2. Perform the test manually in SkyCommand
3. Record the result and observations in SIM Flight Testing
4. Move to the next test

For every test the tester can quickly select:

- **PASS**
- **FAIL**
- **BLOCKED**
- **NOT TESTED**

There is also a simple **Notes / Observations** field.

Optional fields can still be stored with a run (software version labels, tester name, date, attachments) so later runs can be compared. Those labels are written by the tester. The app never reads them from SkyCommand.

The catalog is **18 condensed missions**. Each mission groups Task / Element / Operation cases that can be flown together. The tester scores the mission once after flying its steps in SkyCommand.

Nominal flight:

1. Corridor hive to hive
2. Viewpoint swap to hive
3. Return to Hive from viewpoint transit
4. RTL from viewpoint transit

In-flight interrupt and resume:

5. In-flight loiter, then resume
6. In-flight POSCTL, then resume
7. In-flight EFL, then resume
8. In-flight Land / LIP, then resume

Ground / hold:

9. POSCTL from the hive
10. Arm from PostCTL
11. From loiter, leave hold
12. From PostCTL, leave hold

LIP:

13. LIP descent
14. After LIP landing
15. LIP back to mission

EFL:

16. EFL descent
17. EFL loiter
18. EFL back to mission

Missions 1-4 are single flights. Missions 5-8 use one in-flight interrupt and resume; other phases need a new flight if you want to check them. Missions 11-18 are branches from one state: one flight can take only one branch.

Whenever SkyCommand / SIM software or drone software is updated, the tester creates a new test run from this suite and records whether previously verified behaviour still works.

The app keeps a history of previous executions so a function that passed on one release can be compared with the same function after a later release. For example, Return to Launch after GCS connection loss may pass on SkyCommand 1.2.0 / Drone 3.4.1 and fail on SkyCommand 1.3.0 / Drone 3.4.2.

After some or all tests in a run have been scored, the tester can use **Export PDF** to download a shareable report for other testers or reviewers. The PDF includes software versions, `.deb` artifacts, pass/fail counts, recorded results with notes, and the tests that are still open.

A test run that was started by mistake, or that the tester did not actually fly, can be removed with **Delete** on the Test runs page. The button sits next to Export PDF. Confirming delete removes that run and all of its results.

On Ubuntu, open the checklist from the **SIM Flight Testing** desktop icon after `npm run setup`. The source repository is **https://github.com/TectiveJK/sim-testing-app**. Other testers clone the repository and run `npm run setup` once so they get the same icon.

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

- Standalone checklist: this app does not control or talk to SkyCommand
- Read the procedure here, fly the test in SkyCommand, then record **PASS** / **FAIL** / **BLOCKED** / **NOT TESTED** plus Notes / Observations
- **Next test** after each result
- 18 condensed missions (hive-to-hive corridor, viewpoint returns, in-flight interrupts, LIP, and EFL)
- Mission walkthroughs with step-by-step instructions and one score per mission
- Test runs that store optional software-version labels and `.deb` artifact names
- History and side-by-side run comparison for regressions
- Export PDF after some or all tests are scored, so a run can be shared with others
- Delete a test run from the Test runs page when it was started by mistake
- Private login window before the checklist opens. Credentials are not published in this repository.
- Visible Ubuntu desktop icon: **SIM Flight Testing** opens https://tectivejk.github.io/sim-testing-app/
- Source repository: https://github.com/TectiveJK/sim-testing-app
- Do not use http://127.0.0.1:43147 unless you started a local server on purpose
- Shared web copy saves results in the browser; the Ubuntu copy saves them in `data/store.json`

## Install once (Ubuntu)

Requires Node.js 20+. From the project folder:

```bash
npm install
npm run setup
```

That installs the **SIM Flight Testing** icon on the Desktop and in the application menu. The icon opens the checklist in your browser. If Ubuntu asks, choose **Allow Launching**.

Local results are saved in `data/store.json`. Uploaded files go to `data/attachments/`. The shared GitHub Pages copy stores the same data in the browser instead.

If you pull a newer version from GitHub, the next start rebuilds automatically. To start it immediately after a pull:

```bash
npm run setup
```

To refresh the published GitHub Pages app after code changes:

```bash
npm run build:pages
```

Then commit the updated `docs/` folder.

## Typical workflow

1. After a software update, create a new test run and optionally write the version labels.
2. Open a test, read the procedure, and do those actions in SkyCommand.
3. Come back and record **PASS**, **FAIL**, **BLOCKED**, or **NOT TESTED**, plus notes.
4. Click **Next test** and repeat.
5. Use **Export PDF** to share a partial or complete report.
6. Use **Delete** next to Export PDF to remove a run you did not need.
7. Compare two recorded runs if you want to see regressions.
8. Send **https://github.com/TectiveJK/sim-testing-app** to other testers so they can install the same desktop icon.

## Test runs

Each run copies the current catalog so the tester records the same suite against one labelled software version. SkyCommand is used only on the other monitor to fly the test.

- **Export PDF** appears after at least one test is scored. Use it to share a partial or complete report.
- **Delete** is next to Export PDF on the Test runs list and on the run page. Use it to remove a run you did not do.
- CSV and JSON exports stay available on the run page for spreadsheet or archive use.

The catalog lists the 18 missions. Scoring happens only inside a test run.

## Adding tests later

Use **Test catalog → Add test**, or add a mission in `lib/suite.ts`. New missions are added to existing runs as Not Tested.
