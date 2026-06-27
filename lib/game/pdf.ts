// Client-side PDF report generator using jsPDF + autotable.
// Imported only by client components.

import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { CppDraft, ScoreReport } from "@/lib/types";

interface ReportMeta {
  scenarioTitle: string;
  delegateName: string;
  date: string;
}

export function generateReportPdf(report: ScoreReport, cpp: CppDraft, meta: ReportMeta): void {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 40;
  let y = margin;

  // Header
  doc.setFillColor(15, 92, 79);
  doc.rect(0, 0, pageWidth, 64, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.text("SiteSafe — Training Report", margin, 40);
  doc.setTextColor(0, 0, 0);
  y = 90;

  doc.setFontSize(11);
  doc.text(`Scenario: ${meta.scenarioTitle}`, margin, y); y += 16;
  doc.text(`Delegate: ${meta.delegateName}`, margin, y); y += 16;
  doc.text(`Date: ${meta.date}`, margin, y); y += 24;

  // Score summary box
  doc.setFontSize(14);
  doc.text("Result", margin, y); y += 8;
  autoTable(doc, {
    startY: y,
    head: [["Score", "Percentage", "Band", "Risk index", "Risk rating"]],
    body: [[
      `${report.total_score} / ${report.max_score}`,
      `${report.percent}%`,
      report.band,
      `${report.risk_index} / 100`,
      report.risk_rating,
    ]],
    theme: "grid",
    headStyles: { fillColor: [15, 92, 79] },
    margin: { left: margin, right: margin },
  });
  y = (doc as any).lastAutoTable.finalY + 24;

  // Stage comparison
  doc.setFontSize(14);
  doc.text("Decision review (your choice vs. ideal control)", margin, y); y += 8;
  autoTable(doc, {
    startY: y,
    head: [["Stage", "Your choice", "Pts", "Ideal control", "Best"]],
    body: report.comparisons.map((c) => [
      c.stage_title,
      c.chosen_text,
      String(c.chosen_score),
      c.ideal_text,
      String(c.ideal_score),
    ]),
    theme: "striped",
    headStyles: { fillColor: [15, 92, 79] },
    styles: { fontSize: 8, cellPadding: 4, valign: "top" },
    columnStyles: {
      0: { cellWidth: 90 },
      1: { cellWidth: 150 },
      2: { cellWidth: 28 },
      3: { cellWidth: 150 },
      4: { cellWidth: 28 },
    },
    margin: { left: margin, right: margin },
  });
  y = (doc as any).lastAutoTable.finalY + 24;

  // CPP draft
  doc.addPage();
  y = margin;
  doc.setFontSize(16);
  doc.text("Construction Phase Plan (Draft)", margin, y); y += 18;
  doc.setFontSize(9);
  doc.setTextColor(120, 120, 120);
  doc.text(cpp.generated_label, margin, y); y += 18;
  doc.setTextColor(0, 0, 0);

  const maxWidth = pageWidth - margin * 2;
  for (const section of cpp.sections) {
    if (y > 760) { doc.addPage(); y = margin; }
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    const headLines = doc.splitTextToSize(section.heading, maxWidth);
    doc.text(headLines, margin, y); y += headLines.length * 14 + 2;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    for (const para of section.body) {
      const lines = doc.splitTextToSize(para, maxWidth);
      if (y + lines.length * 13 > 800) { doc.addPage(); y = margin; }
      doc.text(lines, margin, y); y += lines.length * 13 + 6;
    }
    y += 6;
  }

  const safe = meta.scenarioTitle.replace(/[^a-z0-9]+/gi, "-").toLowerCase();
  doc.save(`sitesafe-report-${safe}.pdf`);
}
