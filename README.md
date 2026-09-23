<<<<<<< HEAD
# SIM Flight Testing

A local Ubuntu-first lab for **flight testing and regression testing** against the company SIM environment. After a SkyCommand / SIM, drone firmware, or related software update, create a new test run from the existing catalog, score each transition, and keep a versioned history of what passed or failed.

The first slice ships with the complete current-state → command matrix you provided (100 built-in tests), mission walkthroughs, result recording, attachments, run comparison, and editable last-successful `.deb` artifact fields.

## What you can do

- Score every catalog test as **Passed**, **Failed**, **Blocked / Cannot Test**, **Not Tested**, or **Not Applicable**
- Write notes and attach screenshots, logs, error dumps, or reports
- Record SkyCommand / SIM version, drone software / firmware, tester, date, and run notes
- Snapshot the last successful `.deb` packages onto each run
- Compare two runs to highlight regressions and improvements
- Walk mission scenarios step by step
- Add new tests later without changing the app structure

## Run locally (Ubuntu)

Requires Node.js 20+.

```bash
npm install
npm run dev
```

Open [http://127.0.0.1:43147](http://127.0.0.1:43147). Data is stored on disk in `data/store.json`; uploads go to `data/attachments/`.

Production-style local serve:

```bash
npm run build
npm start
```

## Typical workflow

1. Update **Last artifacts** with the current known-good `.deb` filenames.
2. Open **Test runs → New test run** after a software release.
3. Enter SkyCommand / SIM and drone versions.
4. Work through **Execute** or a **Mission** and record each result.
5. Use **Compare runs** and **History** to see whether a previously passing function still passes.

## Adding tests later

Use **Test catalog → Add test**, or append a row to `lib/catalog.ts` and (optionally) a scenario in `lib/missions.ts`. New catalog entries are automatically attached to existing runs as **Not Tested**.
=======
# sim-testing-app
>>>>>>> c4e2f8335ea28cdcb85598e7b51aa7c17e0a2575
