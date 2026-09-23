import { chromium } from "playwright";

const base = process.env.APP_URL || "http://127.0.0.1:43147";
const errors = [];

function assert(cond, message) {
  if (!cond) errors.push(message);
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

try {
  await page.goto(`${base}/catalog`, { waitUntil: "networkidle" });
  await page.getByTestId("tab-list").click();
  await page.waitForURL(/view=list/);
  await page.waitForSelector('[data-testid="catalog-test-rtl-rtl"]');
  const firstTitle = await page.getByTestId("catalog-detail-title").innerText();
  await page.getByTestId("catalog-test-rtl-rtl").click();
  await page.waitForFunction(
    (previous) => document.querySelector("[data-testid=catalog-detail-title]")?.textContent !== previous,
    firstTitle,
  );
  const secondTitle = await page.getByTestId("catalog-detail-title").innerText();
  assert(firstTitle !== secondTitle, `Catalog list did not change detail (${firstTitle} -> ${secondTitle})`);
  assert(secondTitle.includes("RTL"), `Expected RTL test, got ${secondTitle}`);

  await page.goto(`${base}/artifacts`, { waitUntil: "networkidle" });
  const field = page.getByTestId("artifact-file-autonomy-node");
  await field.fill("autonomy-node_9.9.9_amd64.deb");
  await page.getByTestId("save-artifacts").click();
  await page.waitForTimeout(400);
  await page.reload({ waitUntil: "networkidle" });
  const saved = await page.getByTestId("artifact-file-autonomy-node").inputValue();
  assert(saved === "autonomy-node_9.9.9_amd64.deb", `Artifact did not persist, got ${saved}`);
  await field.fill("autonomy-node_1.0.0+12a9d76-b2_amd64.deb");
  await page.getByTestId("save-artifacts").click();
  await page.waitForTimeout(300);

  await page.goto(`${base}/runs/new`, { waitUntil: "networkidle" });
  await page.getByTestId("sky-command-version").fill("1.4.0");
  await page.getByTestId("drone-version").fill("3.5.0");
  await page.getByTestId("tester").fill("Short Retest");
  await page.getByTestId("start-test-run").click();
  await page.waitForURL(/\/runs\/[0-9a-f-]+/, { timeout: 15000 });
  await page.waitForSelector('[data-testid="run-test-corridor-take-off-complete"]');

  const initial = await page.getByTestId("result-title").innerText();
  await page.getByTestId("run-test-rtl-rtl").click();
  await page.waitForFunction(
    (previous) => document.querySelector("[data-testid=result-title]")?.textContent !== previous,
    initial,
  );
  const after = await page.getByTestId("result-title").innerText();
  assert(after.includes("RTL"), `Execute panel did not switch, stayed ${after}`);
  await page.getByRole("button", { name: "Passed", exact: true }).click();
  await page.waitForTimeout(300);

  await page.getByTestId("tab-matrix").click();
  await page.waitForURL(/view=matrix/);
  await page.waitForSelector("table");
  const tables = await page.locator("table").count();
  assert(tables > 0, "Matrix tab did not show a table");
} catch (error) {
  errors.push(error instanceof Error ? error.message : String(error));
} finally {
  await browser.close();
}

if (errors.length) {
  console.error("SMOKE FAIL");
  for (const error of errors) console.error("-", error);
  process.exit(1);
}

console.log("SMOKE PASS");
