import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN = 48;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

const INK = rgb(0.1, 0.14, 0.2);
const MUTED = rgb(0.38, 0.42, 0.48);
const RULE = rgb(0.82, 0.85, 0.88);
const HEADER_BG = rgb(0.08, 0.16, 0.28);
const HEADER_FG = rgb(0.96, 0.97, 0.98);
const BOX_BG = rgb(0.96, 0.97, 0.98);
const ACCENT = rgb(0.04, 0.42, 0.27);

const MISSIONS = [
  {
    n: 1,
    title: "Corridor hive to hive",
    note: "One flight. Score every step.",
    items: [
      "Deployed on hive / disarmed -> arm",
      "Corridor / Take-off -> Complete",
      "Corridor / To First Waypoint -> Complete",
      "Corridor / Main/any mission corridor -> Complete",
      "Corridor / To HL -> Complete",
      "Corridor / Landing on hive -> Complete",
    ],
  },
  {
    n: 2,
    title: "Viewpoint swap to hive",
    note: "One flight.",
    items: ["Viewpoint / To hive from swap -> Complete"],
  },
  {
    n: 3,
    title: "Return to Hive from viewpoint transit",
    note: "One flight.",
    items: ["Viewpoint / to viewpoint -> Return to Hive"],
  },
  {
    n: 4,
    title: "RTL from viewpoint transit",
    note: "One flight. Issue RTL, then confirm RTL completes.",
    items: ["Viewpoint / to viewpoint -> RTL", "RTL -> Complete"],
  },
  {
    n: 5,
    title: "In-flight loiter, then resume",
    note: "Same operation at several phases. One flight can use only one phase; the others are repeats.",
    items: [
      "Loiter from Take-off, To First Waypoint, Main/any mission corridor, To HL, to viewpoint, waiting for release, To hive from swap",
      "then Loiter -> mission",
    ],
  },
  {
    n: 6,
    title: "In-flight POSCTL, then resume",
    note: "Same operation at several phases. One flight can use only one phase.",
    items: [
      "POSCTL from the same in-flight elements as mission 5",
      "then PostCTL / In control -> mission",
    ],
  },
  {
    n: 7,
    title: "In-flight EFL, then resume",
    note: "Same operation at several phases. One flight can use only one phase.",
    items: [
      "EFL from the same in-flight elements as mission 5",
      "then EFL / Descending -> mission",
    ],
  },
  {
    n: 8,
    title: "In-flight Land / LIP, then resume",
    note: "Same operation at several phases. Take-off has no Land case in the current suite.",
    items: [
      "Land from To First Waypoint, Main/any mission corridor, To HL, to viewpoint, waiting for release, To hive from swap",
      "then LIP / Descending -> mission",
    ],
  },
  {
    n: 9,
    title: "POSCTL from the hive",
    note: "Grounded / disarmed. Separate from arm.",
    items: ["Deployed on hive / disarmed -> POSCTL"],
  },
  {
    n: 10,
    title: "Arm from PostCTL",
    note: "Requires the drone already in PostCTL.",
    items: ["PostCTL / In control -> arm"],
  },
  {
    n: 11,
    title: "From loiter, leave hold",
    note: "Branches from the same state. One flight can take only one branch.",
    items: ["Loiter -> POSCTL", "Loiter -> EFL", "Loiter -> Land"],
  },
  {
    n: 12,
    title: "From PostCTL, leave hold",
    note: "Branches from the same state. One flight can take only one branch.",
    items: [
      "PostCTL / In control -> loiter",
      "PostCTL / In control -> EFL",
      "PostCTL / In control -> Land",
    ],
  },
  {
    n: 13,
    title: "LIP descent",
    note: "Branches from LIP descending. One flight can take only one branch.",
    items: [
      "LIP / Descending -> Complete",
      "LIP / Descending -> loiter",
      "LIP / Descending -> POSCTL",
      "LIP / Descending -> EFL",
      "LIP / Descending -> Land",
    ],
  },
  {
    n: 14,
    title: "After LIP landing",
    note: "Branches from landed / disarmed. One flight can take only one branch.",
    items: [
      "LIP / Landed (disarmed) -> arm",
      "LIP / Landed (disarmed) -> mission",
      "LIP / Landed (disarmed) -> POSCTL",
      "LIP / Landed (disarmed) -> EFL",
    ],
  },
  {
    n: 15,
    title: "LIP back to mission",
    note: "Branches from LIP recovery. One flight can take only one branch.",
    items: [
      "LIP / Back to mission -> Complete",
      "LIP / Back to mission -> loiter",
      "LIP / Back to mission -> POSCTL",
      "LIP / Back to mission -> EFL",
      "LIP / Back to mission -> Land",
    ],
  },
  {
    n: 16,
    title: "EFL descent",
    note: "Branches from EFL descending. One flight can take only one branch.",
    items: [
      "EFL / Descending -> Complete",
      "EFL / Descending -> loiter",
      "EFL / Descending -> POSCTL",
      "EFL / Descending -> EFL",
      "EFL / Descending -> Land",
    ],
  },
  {
    n: 17,
    title: "EFL loiter",
    note: "Branches from EFL loiter. One flight can take only one branch.",
    items: [
      "EFL / Loiter -> mission",
      "EFL / Loiter -> POSCTL",
      "EFL / Loiter -> EFL",
      "EFL / Loiter -> Land",
    ],
  },
  {
    n: 18,
    title: "EFL back to mission",
    note: "Branches from EFL recovery. One flight can take only one branch.",
    items: [
      "EFL / Back to mission -> Complete",
      "EFL / Back to mission -> loiter",
      "EFL / Back to mission -> POSCTL",
      "EFL / Back to mission -> EFL",
      "EFL / Back to mission -> Land",
    ],
  },
];

function pdfSafe(value) {
  return String(value)
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

function wrapText(text, font, size, maxWidth) {
  const words = pdfSafe(text).split(/\s+/).filter(Boolean);
  if (words.length === 0) return [""];
  const lines = [];
  let current = "";
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(next, size) <= maxWidth) current = next;
    else {
      if (current) lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

class Writer {
  constructor(doc, regular, bold) {
    this.doc = doc;
    this.regular = regular;
    this.bold = bold;
    this.pageNumber = 0;
    this.addPage(true);
  }

  addPage(first = false) {
    this.page = this.doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    this.pageNumber += 1;
    this.page.drawText(pdfSafe("SIM Flight Testing  |  Condensed test suite for approval"), {
      x: MARGIN,
      y: 22,
      size: 8,
      font: this.regular,
      color: MUTED,
    });
    this.page.drawText(String(this.pageNumber), {
      x: PAGE_WIDTH - MARGIN - 12,
      y: 22,
      size: 8,
      font: this.regular,
      color: MUTED,
    });
    if (first) {
      this.page.drawRectangle({
        x: 0,
        y: PAGE_HEIGHT - 86,
        width: PAGE_WIDTH,
        height: 86,
        color: HEADER_BG,
      });
      this.page.drawText("SIM FLIGHT TESTING", {
        x: MARGIN,
        y: PAGE_HEIGHT - 34,
        size: 10,
        font: this.bold,
        color: rgb(0.7, 0.8, 0.92),
      });
      this.page.drawText("Proposed condensed test suite", {
        x: MARGIN,
        y: PAGE_HEIGHT - 58,
        size: 18,
        font: this.bold,
        color: HEADER_FG,
      });
      this.y = PAGE_HEIGHT - 108;
    } else {
      this.page.drawText("SIM Flight Testing - continued", {
        x: MARGIN,
        y: PAGE_HEIGHT - 28,
        size: 8,
        font: this.regular,
        color: MUTED,
      });
      this.y = PAGE_HEIGHT - 46;
    }
  }

  ensure(needed) {
    if (this.y - needed < 48) this.addPage();
  }

  kv(label, value) {
    this.ensure(14);
    this.page.drawText(`${label}:`, {
      x: MARGIN,
      y: this.y,
      size: 9,
      font: this.bold,
      color: MUTED,
    });
    this.page.drawText(pdfSafe(value), {
      x: MARGIN + 92,
      y: this.y,
      size: 9,
      font: this.regular,
      color: INK,
    });
    this.y -= 14;
  }

  paragraph(text) {
    for (const line of wrapText(text, this.regular, 10, CONTENT_WIDTH)) {
      this.ensure(14);
      this.page.drawText(line, { x: MARGIN, y: this.y, size: 10, font: this.regular, color: INK });
      this.y -= 14;
    }
    this.y -= 4;
  }

  muted(text) {
    for (const line of wrapText(text, this.regular, 9, CONTENT_WIDTH)) {
      this.ensure(13);
      this.page.drawText(line, { x: MARGIN, y: this.y, size: 9, font: this.regular, color: MUTED });
      this.y -= 13;
    }
    this.y -= 2;
  }

  section(title) {
    this.ensure(36);
    this.y -= 8;
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

  summaryBoxes() {
    this.ensure(58);
    const items = [
      ["77", "Current catalog tests"],
      ["18", "Proposed missions"],
      ["8", "Single-path missions"],
    ];
    const boxWidth = (CONTENT_WIDTH - 16) / items.length;
    items.forEach(([value, label], index) => {
      const x = MARGIN + index * (boxWidth + 8);
      this.page.drawRectangle({
        x,
        y: this.y - 34,
        width: boxWidth,
        height: 46,
        color: BOX_BG,
        borderColor: RULE,
        borderWidth: 0.6,
      });
      this.page.drawText(value, {
        x: x + 10,
        y: this.y - 8,
        size: 16,
        font: this.bold,
        color: ACCENT,
      });
      this.page.drawText(label, {
        x: x + 10,
        y: this.y - 24,
        size: 8,
        font: this.regular,
        color: MUTED,
      });
    });
    this.y -= 54;
  }

  mission(entry) {
    const title = `${entry.n}. ${entry.title}`;
    const titleLines = wrapText(title, this.bold, 11, CONTENT_WIDTH - 8);
    const noteLines = wrapText(entry.note, this.regular, 8.5, CONTENT_WIDTH - 8);
    const itemLines = entry.items.flatMap((item) =>
      wrapText(`- ${item}`, this.regular, 9, CONTENT_WIDTH - 16),
    );
    this.ensure(22 + titleLines.length * 14 + noteLines.length * 12 + itemLines.length * 13);
    this.page.drawRectangle({
      x: MARGIN,
      y: this.y + 8,
      width: 4,
      height: 14,
      color: ACCENT,
    });
    for (const line of titleLines) {
      this.page.drawText(line, {
        x: MARGIN + 12,
        y: this.y,
        size: 11,
        font: this.bold,
        color: INK,
      });
      this.y -= 14;
    }
    for (const line of noteLines) {
      this.page.drawText(line, {
        x: MARGIN + 12,
        y: this.y,
        size: 8.5,
        font: this.regular,
        color: MUTED,
      });
      this.y -= 12;
    }
    this.y -= 2;
    for (const line of itemLines) {
      this.ensure(13);
      this.page.drawText(line, {
        x: MARGIN + 12,
        y: this.y,
        size: 9,
        font: this.regular,
        color: INK,
      });
      this.y -= 13;
    }
    this.y -= 10;
  }

  checkbox(label, x) {
    this.page.drawRectangle({
      x,
      y: this.y - 2,
      width: 10,
      height: 10,
      borderColor: INK,
      borderWidth: 0.8,
    });
    this.page.drawText(label, {
      x: x + 16,
      y: this.y,
      size: 10,
      font: this.regular,
      color: INK,
    });
  }

  signatureBlock() {
    this.addPage();
    this.section("Approval");
    this.paragraph("Please mark a decision, sign, and return this page.");
    this.ensure(28);
    this.checkbox("Approved - use the 18-mission grouping as the official suite", MARGIN);
    this.y -= 20;
    this.checkbox("Approved - use only missions 1-8 (single-path, 18 original tests)", MARGIN);
    this.y -= 20;
    this.checkbox("Not approved - keep the full 77 Task / Element / Operation tests", MARGIN);
    this.y -= 20;
    this.checkbox("Approved with comments (write below)", MARGIN);
    this.y -= 28;
    this.muted("Comments");
    this.page.drawLine({
      start: { x: MARGIN, y: this.y },
      end: { x: PAGE_WIDTH - MARGIN, y: this.y },
      thickness: 0.6,
      color: RULE,
    });
    this.y -= 18;
    this.page.drawLine({
      start: { x: MARGIN, y: this.y },
      end: { x: PAGE_WIDTH - MARGIN, y: this.y },
      thickness: 0.6,
      color: RULE,
    });
    this.y -= 18;
    this.page.drawLine({
      start: { x: MARGIN, y: this.y },
      end: { x: PAGE_WIDTH - MARGIN, y: this.y },
      thickness: 0.6,
      color: RULE,
    });
    this.y -= 28;
    const fields = [
      ["Name", 210],
      ["Role", 210],
    ];
    let x = MARGIN;
    for (const [label, width] of fields) {
      this.page.drawText(label, { x, y: this.y, size: 8, font: this.bold, color: MUTED });
      this.page.drawLine({
        start: { x, y: this.y - 16 },
        end: { x: x + width - 16, y: this.y - 16 },
        thickness: 0.6,
        color: RULE,
      });
      x += width;
    }
    this.y -= 40;
    x = MARGIN;
    for (const [label, width] of [
      ["Date", 210],
      ["Signature", 210],
    ]) {
      this.page.drawText(label, { x, y: this.y, size: 8, font: this.bold, color: MUTED });
      this.page.drawLine({
        start: { x, y: this.y - 16 },
        end: { x: x + width - 16, y: this.y - 16 },
        thickness: 0.6,
        color: RULE,
      });
      x += width;
    }
  }
}

const doc = await PDFDocument.create();
doc.setTitle("SIM Flight Testing - Proposed condensed test suite");
doc.setAuthor("SIM Flight Testing");
doc.setSubject("Request for approval of an 18-mission condensed catalog");
doc.setCreator("SIM Flight Testing");
const regular = await doc.embedFont(StandardFonts.Helvetica);
const bold = await doc.embedFont(StandardFonts.HelveticaBold);
const writer = new Writer(doc, regular, bold);

writer.kv("Document", "Proposed condensed SIM test suite");
writer.kv("Prepared for", "Review and approval");
writer.kv("Date", "6 October 2026");
writer.kv("Application", "SIM Flight Testing checklist");
writer.kv("Catalog", "77 Task / Element / Operation tests");
writer.y -= 6;
writer.summaryBoxes();

writer.section("Request");
writer.paragraph(
  "Please approve a shorter official test list. The current SIM Flight Testing catalog has 77 Task / Element / Operation tests. Several of those tests can be flown as steps of one mission instead of as 77 separate flights.",
);
writer.paragraph(
  "This document proposes grouping the 77 tests into 18 missions. It does not change the application until you approve a list.",
);

writer.section("Recommendation");
writer.paragraph(
  "Approve the 18-mission list below as the official condensed suite. If each corridor and viewpoint phase must still pass on its own, keep the original 77 tests and use missions only as flight order, not as a shorter catalog.",
);
writer.paragraph(
  "If you only want tests that truly fit one path with no repeats, approve missions 1, 2, 3 and 4, plus one resume each for loiter, POSCTL, EFL and Land. That is 8 missions and 18 original tests.",
);

writer.section("How to read this list");
writer.paragraph(
  "Missions 1-4 are real single flights. Score every listed step on that flight.",
);
writer.paragraph(
  "Missions 5-8 are the same interrupt at several phases. One flight can only use one phase. If each phase must pass on its own, do not collapse them.",
);
writer.paragraph(
  "Missions 11-18 are branches from the same state. One flight can only take one branch, so they are grouped by state, not by a single path.",
);

writer.section("Proposed missions");
for (const mission of MISSIONS) writer.mission(mission);

writer.signatureBlock();

const bytes = await doc.save();
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const filename = "SIM-Flight-Testing-condensed-suite-for-approval.pdf";
const dest = join(root, filename);
writeFileSync(dest, bytes);
mkdirSync("/opt/cursor/artifacts", { recursive: true });
writeFileSync(join("/opt/cursor/artifacts", filename), bytes);
console.log(`Wrote ${dest} (${bytes.length} bytes)`);
