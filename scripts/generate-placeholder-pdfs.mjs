/**
 * Generates simple placeholder PDFs in public/downloads from the markdown
 * lead magnets in content/lead-magnets. No dependencies — writes raw PDF.
 *
 * Run: npm run pdfs
 * Replace these with professionally designed PDFs before/after launch.
 */
import { readdirSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, basename } from "node:path";

const SRC = "content/lead-magnets";
const OUT = "public/downloads";
const LINES_PER_PAGE = 52;
const FONT_SIZE = 10;
const LEADING = 14;

function escapePdf(s) {
  return s.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function wrap(line, max = 92) {
  if (line.length <= max) return [line];
  const out = [];
  let cur = "";
  for (const word of line.split(" ")) {
    if ((cur + " " + word).trim().length > max) {
      out.push(cur.trim());
      cur = word;
    } else {
      cur += " " + word;
    }
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}

function mdToLines(md) {
  const lines = [];
  for (const raw of md.split("\n")) {
    let line = raw
      .replace(/^# /, "")
      .replace(/^## /, "")
      .replace(/^### /, "")
      .replace(/\*\*/g, "")
      .replace(/[—–]/g, "-")
      .replace(/[‘’]/g, "'")
      .replace(/[“”]/g, '"');
    const isHeading = /^#{1,3} /.test(raw);
    for (const w of wrap(line)) lines.push({ text: w, bold: isHeading });
    if (isHeading) lines.push({ text: "", bold: false });
  }
  return lines;
}

function buildPdf(lines) {
  const pages = [];
  for (let i = 0; i < lines.length; i += LINES_PER_PAGE) {
    pages.push(lines.slice(i, i + LINES_PER_PAGE));
  }
  if (pages.length === 0) pages.push([{ text: "(empty)", bold: false }]);

  const objects = [];
  const pageObjIds = [];
  // obj 1: catalog, obj 2: pages, obj 3: regular font, obj 4: bold font
  const firstPageObj = 5;
  pages.forEach((_, i) => pageObjIds.push(firstPageObj + i * 2));

  objects[1] = `<< /Type /Catalog /Pages 2 0 R >>`;
  objects[2] = `<< /Type /Pages /Kids [${pageObjIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pages.length} >>`;
  objects[3] = `<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>`;
  objects[4] = `<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>`;

  pages.forEach((pageLines, i) => {
    const pageId = firstPageObj + i * 2;
    const contentId = pageId + 1;
    let stream = `BT /F1 ${FONT_SIZE} Tf ${LEADING} TL 50 790 Td\n`;
    for (const { text, bold } of pageLines) {
      stream += `/F${bold ? 2 : 1} ${bold ? FONT_SIZE + 2 : FONT_SIZE} Tf (${escapePdf(text)}) Tj T*\n`;
    }
    stream += "ET";
    objects[pageId] =
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentId} 0 R >>`;
    objects[contentId] = `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`;
  });

  let pdf = "%PDF-1.4\n";
  const offsets = [];
  for (let i = 1; i < objects.length; i++) {
    offsets[i] = pdf.length;
    pdf += `${i} 0 obj\n${objects[i]}\nendobj\n`;
  }
  const xrefStart = pdf.length;
  pdf += `xref\n0 ${objects.length}\n0000000000 65535 f \n`;
  for (let i = 1; i < objects.length; i++) {
    pdf += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;
  return pdf;
}

mkdirSync(OUT, { recursive: true });
for (const file of readdirSync(SRC).filter((f) => f.endsWith(".md"))) {
  const md = readFileSync(join(SRC, file), "utf8");
  const pdf = buildPdf(mdToLines(md));
  const out = join(OUT, basename(file, ".md") + ".pdf");
  writeFileSync(out, pdf, "latin1");
  console.log("Created", out);
}
