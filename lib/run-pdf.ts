import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import { allTests } from "@/lib/store-logic";
import { countResults, passRate } from "@/lib/client-types";
import { formatDateTime } from "@/lib/format";
import { STATUS_LABELS } from "@/lib/status";
import type { AppStore, TestResult, TestRun } from "@/lib/types";

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN = 40;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

const INK = rgb(0.1, 0.14, 0.2);
const MUTED = rgb(0.38, 0.42, 0.48);
const RULE = rgb(0.82, 0.85, 0.88);
const HEADER_BG = rgb(0.08, 0.16, 0.28);
const HEADER_FG = rgb(0.96, 0.97, 0.98);
const BOX_BG = rgb(0.96, 0.97, 0.98);

const STATUS_COLOR = {
  passed: rgb(0.04, 0.42, 0.27),
  failed: rgb(0.68, 0.1, 0.16),
  blocked: rgb(0.62, 0.38, 0.04),
  not_tested: rgb(0.22, 0.42, 0.58),
  not_applicable: rgb(0.32, 0.36, 0.4),
} as const;

export async function buildRunPdf(store: AppStore, run: TestRun) {
  const tests = allTests(store);
  const byTestId = new Map(
    store.results.filter((result) => result.testRunId === run.id).map((result) => [result.testCaseId, result]),
  );
  const counts = countResults(store, run.id);
  const recorded = counts.total - counts.not_tested;
  const rate = passRate(counts);
  const coverage = counts.total === 0 ? "No tests" : `${recorded} of ${counts.total} tests recorded`;
  const completeness = recorded === 0 ? "Not started" : recorded === counts.total ? "Complete report" : "Partial report";

  const doc = await PDFDocument.create();
  const regular = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const writer = new PdfWriter(doc, regular, bold);

  writer.header("SIM FLIGHT TESTING", "Shareable test report");
  writer.title(run.name);
  writer.muted(
    `${completeness} · ${coverage}${rate === null ? "" : ` · ${rate}% pass rate`} · ${
      run.completedAt ? "Completed" : "In progress"
    }`,
  );
  writer.gap(6);
  writer.kv("Started", formatDateTime(run.startedAt));
  writer.kv("Completed", formatDateTime(run.completedAt));
  writer.kv("Tester", run.tester || "Not set");
  writer.kv("SkyCommand / SIM", run.skyCommandVersion || "Not set");
  writer.kv("Drone software", run.droneVersion || "Not set");
  writer.kv("Exported", formatDateTime(new Date().toISOString()));

  writer.section("Summary");
  writer.summaryRow([
    ["Passed", counts.passed, STATUS_COLOR.passed],
    ["Failed", counts.failed, STATUS_COLOR.failed],
    ["Blocked", counts.blocked, STATUS_COLOR.blocked],
    ["N/A", counts.not_applicable, STATUS_COLOR.not_applicable],
    ["Not tested", counts.not_tested, STATUS_COLOR.not_tested],
  ]);

  if (run.notes.trim()) {
    writer.section("Run notes");
    writer.paragraph(run.notes);
  }

  if (run.artifacts.length > 0) {
    writer.section("Snapshotted .deb artifacts");
    for (const artifact of run.artifacts) {
      writer.bullet(`${artifact.packageName}: ${artifact.filename || "—"}`);
    }
  }

  const recordedTests = tests.filter((test) => {
    const result = byTestId.get(test.id);
    return result && result.status !== "not_tested";
  });
  const remaining = tests.filter((test) => {
    const result = byTestId.get(test.id);
    return !result || result.status === "not_tested";
  });

  writer.section(`Recorded results (${recordedTests.length})`);
  if (recordedTests.length === 0) {
    writer.muted("No tests have been scored yet. Export again after recording results.");
  } else {
    for (const test of recordedTests) {
      writer.resultBlock(test.name, test.id, byTestId.get(test.id)!);
    }
  }

  if (remaining.length > 0) {
    writer.section(`Still not tested (${remaining.length})`);
    writer.muted("These catalog items were still open when this report was exported.");
    writer.gap(4);
    for (const test of remaining) {
      writer.remainingLine(test.name, test.id);
    }
  }

  writer.finish();
  const bytes = await doc.save();
  const filename = `${slug(run.name)}-report.pdf`;
  return { bytes, filename, recorded };
}

class PdfWriter {
  private page!: PDFPage;
  private y = 0;
  private pageNumber = 0;

  constructor(
    private readonly doc: PDFDocument,
    private readonly regular: PDFFont,
    private readonly bold: PDFFont,
  ) {
    this.addPage();
  }

  header(eyebrow: string, subtitle: string) {
    this.page.drawRectangle({
      x: 0,
      y: PAGE_HEIGHT - 78,
      width: PAGE_WIDTH,
      height: 78,
      color: HEADER_BG,
    });
    this.page.drawText(pdfSafe(eyebrow), {
      x: MARGIN,
      y: PAGE_HEIGHT - 36,
      size: 10,
      font: this.bold,
      color: rgb(0.7, 0.8, 0.92),
    });
    this.page.drawText(pdfSafe(subtitle), {
      x: MARGIN,
      y: PAGE_HEIGHT - 58,
      size: 18,
      font: this.bold,
      color: HEADER_FG,
    });
    this.y = PAGE_HEIGHT - 98;
  }

  title(text: string) {
    this.ensure(28);
    for (const line of wrapText(text, this.bold, 16, CONTENT_WIDTH)) {
      this.page.drawText(line, { x: MARGIN, y: this.y, size: 16, font: this.bold, color: INK });
      this.y -= 20;
    }
  }

  muted(text: string) {
    this.ensure(16);
    for (const line of wrapText(text, this.regular, 9, CONTENT_WIDTH)) {
      this.page.drawText(line, { x: MARGIN, y: this.y, size: 9, font: this.regular, color: MUTED });
      this.y -= 13;
    }
  }

  kv(label: string, value: string) {
    this.ensure(14);
    this.page.drawText(pdfSafe(`${label}:`), {
      x: MARGIN,
      y: this.y,
      size: 9,
      font: this.bold,
      color: MUTED,
    });
    this.page.drawText(pdfSafe(value), {
      x: MARGIN + 118,
      y: this.y,
      size: 9,
      font: this.regular,
      color: INK,
    });
    this.y -= 14;
  }

  section(title: string) {
    this.ensure(36);
    this.y -= 10;
    this.page.drawText(pdfSafe(title.toUpperCase()), {
      x: MARGIN,
      y: this.y,
      size: 9,
      font: this.bold,
      color: HEADER_BG,
    });
    this.y -= 6;
    this.page.drawLine({
      start: { x: MARGIN, y: this.y },
      end: { x: PAGE_WIDTH - MARGIN, y: this.y },
      thickness: 1,
      color: RULE,
    });
    this.y -= 16;
  }

  summaryRow(items: [string, number, ReturnType<typeof rgb>][]) {
    this.ensure(48);
    const boxWidth = (CONTENT_WIDTH - 16) / items.length;
    items.forEach(([label, value, color], index) => {
      const x = MARGIN + index * (boxWidth + 4);
      this.page.drawRectangle({
        x,
        y: this.y - 28,
        width: boxWidth,
        height: 40,
        color: BOX_BG,
        borderColor: RULE,
        borderWidth: 0.6,
      });
      this.page.drawText(String(value), {
        x: x + 8,
        y: this.y - 6,
        size: 14,
        font: this.bold,
        color,
      });
      this.page.drawText(pdfSafe(label), {
        x: x + 8,
        y: this.y - 20,
        size: 7,
        font: this.regular,
        color: MUTED,
      });
    });
    this.y -= 46;
  }

  paragraph(text: string) {
    for (const raw of text.split(/\n/)) {
      const lines = wrapText(raw || " ", this.regular, 9, CONTENT_WIDTH);
      for (const line of lines) {
        this.ensure(13);
        this.page.drawText(line, { x: MARGIN, y: this.y, size: 9, font: this.regular, color: INK });
        this.y -= 13;
      }
    }
  }

  bullet(text: string) {
    const lines = wrapText(text, this.regular, 8.5, CONTENT_WIDTH - 12);
    lines.forEach((line, index) => {
      this.ensure(12);
      this.page.drawText(index === 0 ? `•  ${line}` : `   ${line}`, {
        x: MARGIN,
        y: this.y,
        size: 8.5,
        font: this.regular,
        color: INK,
      });
      this.y -= 12;
    });
  }

  resultBlock(name: string, id: string, result: TestResult) {
    const notes = result.notes.trim();
    const attachments = result.attachments.map((item) => item.originalName).join(", ");
    const noteLines = notes ? wrapText(notes, this.regular, 8.5, CONTENT_WIDTH - 12) : [];
    const needed = 36 + noteLines.length * 11 + (attachments ? 12 : 0);
    this.ensure(needed);
    const color = STATUS_COLOR[result.status];
    this.page.drawRectangle({
      x: MARGIN,
      y: this.y - 2,
      width: 4,
      height: 16,
      color,
    });
    this.page.drawText(pdfSafe(STATUS_LABELS[result.status].toUpperCase()), {
      x: MARGIN + 12,
      y: this.y,
      size: 8,
      font: this.bold,
      color,
    });
    this.y -= 13;
    for (const line of wrapText(name, this.bold, 10, CONTENT_WIDTH)) {
      this.ensure(13);
      this.page.drawText(line, { x: MARGIN + 12, y: this.y, size: 10, font: this.bold, color: INK });
      this.y -= 13;
    }
    this.page.drawText(pdfSafe(id), {
      x: MARGIN + 12,
      y: this.y,
      size: 8,
      font: this.regular,
      color: MUTED,
    });
    this.y -= 12;
    if (result.executedAt || result.tester) {
      this.page.drawText(
        pdfSafe([result.tester, result.executedAt ? formatDateTime(result.executedAt) : ""].filter(Boolean).join(" · ")),
        { x: MARGIN + 12, y: this.y, size: 8, font: this.regular, color: MUTED },
      );
      this.y -= 12;
    }
    for (const line of noteLines) {
      this.ensure(11);
      this.page.drawText(line, { x: MARGIN + 12, y: this.y, size: 8.5, font: this.regular, color: INK });
      this.y -= 11;
    }
    if (attachments) {
      this.ensure(12);
      this.page.drawText(pdfSafe(`Attachments: ${attachments}`), {
        x: MARGIN + 12,
        y: this.y,
        size: 8,
        font: this.regular,
        color: MUTED,
      });
      this.y -= 12;
    }
    this.y -= 8;
  }

  remainingLine(name: string, id: string) {
    this.ensure(22);
    this.page.drawText(pdfSafe(name), {
      x: MARGIN,
      y: this.y,
      size: 8.5,
      font: this.regular,
      color: INK,
    });
    this.y -= 11;
    this.page.drawText(pdfSafe(id), {
      x: MARGIN,
      y: this.y,
      size: 7.5,
      font: this.regular,
      color: MUTED,
    });
    this.y -= 13;
  }

  gap(size: number) {
    this.y -= size;
  }

  finish() {
    const total = this.doc.getPageCount();
    for (let i = 0; i < total; i += 1) {
      const page = this.doc.getPage(i);
      page.drawLine({
        start: { x: MARGIN, y: 28 },
        end: { x: PAGE_WIDTH - MARGIN, y: 28 },
        thickness: 0.6,
        color: RULE,
      });
      page.drawText(
        pdfSafe("SIM Flight Testing - Local regression report - Share with SkyCommand / SIM testers"),
        {
          x: MARGIN,
          y: 16,
          size: 7,
          font: this.regular,
          color: MUTED,
        },
      );
      const label = `Page ${i + 1} of ${total}`;
      page.drawText(label, {
        x: PAGE_WIDTH - MARGIN - this.regular.widthOfTextAtSize(label, 7),
        y: 16,
        size: 7,
        font: this.regular,
        color: MUTED,
      });
    }
  }

  private ensure(needed: number) {
    if (this.y - needed < 44) this.addPage();
  }

  private addPage() {
    this.page = this.doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    this.pageNumber += 1;
    this.y = PAGE_HEIGHT - (this.pageNumber === 1 ? 98 : MARGIN);
    if (this.pageNumber > 1) {
      this.page.drawText(pdfSafe("SIM Flight Testing - continued"), {
        x: MARGIN,
        y: PAGE_HEIGHT - 26,
        size: 8,
        font: this.regular,
        color: MUTED,
      });
      this.y = PAGE_HEIGHT - 42;
    }
  }
}

function wrapText(text: string, font: PDFFont, size: number, maxWidth: number) {
  const paragraphs = pdfSafe(text).split(/\n/);
  const lines: string[] = [];
  for (const paragraph of paragraphs) {
    const words = paragraph.split(/\s+/).filter(Boolean);
    if (words.length === 0) {
      lines.push("");
      continue;
    }
    let current = "";
    for (const word of words) {
      const pieces = splitLongWord(word, font, size, maxWidth);
      for (const piece of pieces) {
        const next = current ? `${current} ${piece}` : piece;
        if (font.widthOfTextAtSize(next, size) <= maxWidth) {
          current = next;
        } else {
          if (current) lines.push(current);
          current = piece;
        }
      }
    }
    if (current) lines.push(current);
  }
  return lines.length ? lines : [""];
}

function splitLongWord(word: string, font: PDFFont, size: number, maxWidth: number) {
  if (font.widthOfTextAtSize(word, size) <= maxWidth) return [word];
  const pieces: string[] = [];
  let chunk = "";
  for (const char of word) {
    const trial = chunk + char;
    if (font.widthOfTextAtSize(trial, size) <= maxWidth) chunk = trial;
    else {
      if (chunk) pieces.push(chunk);
      chunk = char;
    }
  }
  if (chunk) pieces.push(chunk);
  return pieces;
}

function pdfSafe(value: string) {
  return value
    .replaceAll("\u2014", "-")
    .replaceAll("\u2013", "-")
    .replaceAll("\u2018", "'")
    .replaceAll("\u2019", "'")
    .replaceAll("\u201c", '"')
    .replaceAll("\u201d", '"')
    .replaceAll("·", "-")
    .replaceAll("→", "->")
    .replaceAll("×", "x")
    .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, "?");
}

function slug(value: string) {
  const cleaned = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return cleaned || "test-run";
}
