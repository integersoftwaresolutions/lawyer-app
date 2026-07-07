import PDFDocument from "pdfkit";
import { ApiError } from "../../helpers/apiError.js";
import { AI_MODES, AI_USAGE_TYPES } from "../../config/constants.js";
import AiMessage from "../../models/AiMessage.js";
import * as openaiClient from "./openai.client.js";
import * as usageService from "./usage.service.js";
import { decrypt } from "./encryption.util.js";
import { aiConfig } from "../../config/ai.config.js";

const REPORT_SYSTEM_PROMPT = `You are a senior litigation coach reviewing a Pakistani lawyer's cross-examination practice session against an AI opposing-counsel. Produce an honest, actionable preparation report.

Output STRICT JSON matching this schema (no markdown, no commentary):
{
  "summary": "<2-3 sentence overall assessment>",
  "strengths": ["<concise bullet>", ...],
  "weaknesses": ["<concise bullet>", ...],
  "factualConsistencyIssues": ["<contradiction or factual gap>", ...],
  "argumentGaps": ["<missing legal authority, weak inference, or untested claim>", ...],
  "recommendedFollowUps": ["<specific preparation step>", ...],
  "scores": {
    "logicalCoherence": <integer 0-100>,
    "factualConsistency": <integer 0-100>,
    "persuasiveness": <integer 0-100>,
    "overall": <integer 0-100>
  },
  "topQuestionsToReprepare": ["<the cross-exam questions the lawyer answered weakest>", ...]
}

Rules:
- Refer to Pakistani law where relevant (PPC, CrPC, Qanun-e-Shahadat Order 1984, Constitution).
- Do not hallucinate citations.
- Score honestly even if low.
- Maximum 5 items per array.
- Empty arrays are allowed if there is genuinely nothing to report.`;

function transcriptToText(rows) {
  return rows
    .map((row) => {
      const role = row.role === "user" ? "Lawyer" : "Opposing Counsel";
      const content = decrypt(row.content) || "";
      return `${role}:\n${content}`;
    })
    .join("\n\n");
}

function tryParseJson(raw) {
  if (!raw) return null;
  let text = String(raw).trim();
  const fence = text.match(/```(?:json)?\s*([\s\S]+?)\s*```/i);
  if (fence) text = fence[1].trim();
  try {
    return JSON.parse(text);
  } catch {
    const first = text.indexOf("{");
    const last = text.lastIndexOf("}");
    if (first !== -1 && last > first) {
      try {
        return JSON.parse(text.slice(first, last + 1));
      } catch {
        return null;
      }
    }
    return null;
  }
}

function fallbackReport(reason) {
  return {
    summary: `Report generation incomplete: ${reason}. Review the transcript manually.`,
    strengths: [],
    weaknesses: [],
    factualConsistencyIssues: [],
    argumentGaps: [],
    recommendedFollowUps: [],
    scores: {
      logicalCoherence: 0,
      factualConsistency: 0,
      persuasiveness: 0,
      overall: 0
    },
    topQuestionsToReprepare: []
  };
}

export async function generateReportData({ session, lawyerId }) {
  if (session.mode !== AI_MODES.CROSS_EXAM) {
    throw new ApiError(400, "Prep reports are only available for cross-examination sessions");
  }

  const rows = await AiMessage.find({ sessionId: session._id })
    .sort({ createdAt: 1 })
    .lean();

  if (rows.length < 2) {
    throw new ApiError(400, "Not enough transcript content to generate a report");
  }

  const transcript = transcriptToText(rows);
  const brief = session.metadata?.caseBrief || {};
  const briefSummary = JSON.stringify(brief, null, 2);

  const userPrompt = `Case brief (lawyer's side):\n${briefSummary}\n\n---\nTranscript:\n${transcript}`;

  const result = await openaiClient.chatComplete(
    [
      { role: "system", content: REPORT_SYSTEM_PROMPT },
      { role: "user", content: userPrompt }
    ],
    { temperature: 0.2, maxTokens: 1400 }
  );

  await usageService.record({
    userId: lawyerId,
    sessionId: session._id,
    type: AI_USAGE_TYPES.REPORT_GENERATION,
    mode: AI_MODES.CROSS_EXAM,
    model: result.model,
    promptTokens: result.usage.promptTokens,
    completionTokens: result.usage.completionTokens,
    totalTokens: result.usage.totalTokens,
    metadata: { source: "prep_report" }
  });

  const parsed = tryParseJson(result.content) || fallbackReport("model output was not valid JSON");

  return {
    generatedAt: new Date().toISOString(),
    sessionId: String(session._id),
    sessionTitle: session.title,
    caseRef: session.caseRef || "",
    mode: session.mode,
    tone: session.metadata?.tone || "",
    examType: session.metadata?.examType || "",
    transcriptTurns: rows.length,
    model: result.model || aiConfig.chatModel,
    report: parsed
  };
}

/**
 * Produce a Buffer containing a downloadable PDF for the report data.
 */
export function renderReportPdf(reportData) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: "A4",
        margin: 56,
        info: {
          Title: `Cross-Examination Prep Report — ${reportData.sessionTitle || ""}`,
          Author: "Integer Software Lawyer Platform",
          Subject: "Cross-Examination Preparation Report",
          CreationDate: new Date()
        }
      });

      const chunks = [];
      doc.on("data", (c) => chunks.push(c));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      writeReport(doc, reportData);
      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

function writeReport(doc, data) {
  const r = data.report || fallbackReport("missing report payload");

  // Header band
  doc
    .fillColor("#0F172A")
    .fontSize(20)
    .font("Helvetica-Bold")
    .text("Cross-Examination Preparation Report", { align: "left" });

  doc.moveDown(0.3);
  doc
    .fontSize(10)
    .fillColor("#475569")
    .font("Helvetica")
    .text(`Generated: ${formatDate(data.generatedAt)}`, { continued: true })
    .text(`   ·   Mode: ${capitalise(data.mode)}`, { continued: true })
    .text(`   ·   Tone: ${capitalise(data.tone)}`, { continued: true })
    .text(`   ·   Type: ${capitalise(data.examType)}`);

  if (data.sessionTitle) {
    doc.moveDown(0.4);
    doc.fillColor("#0F172A").fontSize(12).font("Helvetica-Bold").text(data.sessionTitle);
  }
  if (data.caseRef) {
    doc.fillColor("#475569").font("Helvetica").fontSize(10).text(`Case ref: ${data.caseRef}`);
  }

  divider(doc);

  // Summary
  section(doc, "Summary");
  paragraph(doc, r.summary || "(no summary)");

  // Scores
  section(doc, "Scores");
  drawScores(doc, r.scores || {});

  // Strengths / Weaknesses side by side
  twoColumnLists(doc, [
    { title: "Strengths", items: r.strengths, color: "#15803D" },
    { title: "Weaknesses", items: r.weaknesses, color: "#B91C1C" }
  ]);

  // Other lists
  bulletSection(doc, "Factual consistency issues", r.factualConsistencyIssues, "#B91C1C");
  bulletSection(doc, "Argument gaps", r.argumentGaps, "#B45309");
  bulletSection(doc, "Recommended follow-ups", r.recommendedFollowUps, "#0F766E");
  bulletSection(doc, "Top questions to re-prepare", r.topQuestionsToReprepare, "#7C3AED");

  // Footer
  divider(doc);
  doc
    .fontSize(8)
    .fillColor("#94A3B8")
    .text(
      `Model: ${data.model} · Transcript turns: ${data.transcriptTurns}\n\nDisclaimer: AI-generated preparation guidance for research and rehearsal only. Always verify with qualified Pakistani counsel before relying on this output in proceedings.`,
      { align: "left" }
    );
}

// ---------- PDF helpers ----------

function divider(doc) {
  doc.moveDown(0.6);
  doc
    .strokeColor("#E2E8F0")
    .lineWidth(0.7)
    .moveTo(doc.page.margins.left, doc.y)
    .lineTo(doc.page.width - doc.page.margins.right, doc.y)
    .stroke();
  doc.moveDown(0.6);
}

function section(doc, title) {
  doc.moveDown(0.6);
  doc.font("Helvetica-Bold").fontSize(13).fillColor("#0F172A").text(title);
  doc.moveDown(0.2);
}

function paragraph(doc, text) {
  doc.font("Helvetica").fontSize(11).fillColor("#1E293B").text(text || "—", { align: "left" });
}

function drawScores(doc, scores) {
  const labels = [
    ["Logical coherence", scores.logicalCoherence],
    ["Factual consistency", scores.factualConsistency],
    ["Persuasiveness", scores.persuasiveness],
    ["Overall", scores.overall]
  ];

  const startX = doc.page.margins.left;
  const fullWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const labelWidth = 150;
  const barWidth = fullWidth - labelWidth - 60;

  doc.font("Helvetica").fontSize(10);
  for (const [label, raw] of labels) {
    const value = clamp(Number(raw) || 0, 0, 100);
    const y = doc.y;
    doc.fillColor("#334155").text(label, startX, y, { width: labelWidth, continued: false });

    doc
      .roundedRect(startX + labelWidth, y + 2, barWidth, 10, 4)
      .fillAndStroke("#F1F5F9", "#E2E8F0");
    doc
      .roundedRect(startX + labelWidth, y + 2, (barWidth * value) / 100, 10, 4)
      .fill(scoreColor(value));

    doc
      .fillColor("#0F172A")
      .text(`${value}/100`, startX + labelWidth + barWidth + 8, y, { width: 50, align: "right" });
    doc.moveDown(0.7);
  }
}

function scoreColor(v) {
  if (v >= 75) return "#15803D";
  if (v >= 50) return "#CA8A04";
  return "#B91C1C";
}

function twoColumnLists(doc, columns) {
  doc.moveDown(0.6);
  const startY = doc.y;
  const startX = doc.page.margins.left;
  const fullWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const columnWidth = (fullWidth - 24) / 2;

  let maxY = startY;
  columns.forEach((col, i) => {
    const x = startX + i * (columnWidth + 24);
    doc.font("Helvetica-Bold").fontSize(12).fillColor(col.color || "#0F172A").text(col.title, x, startY, {
      width: columnWidth
    });
    doc.moveDown(0.2);
    if (Array.isArray(col.items) && col.items.length > 0) {
      doc.font("Helvetica").fontSize(10).fillColor("#1E293B");
      col.items.forEach((item) => {
        doc.text(`• ${item}`, x, doc.y, { width: columnWidth });
      });
    } else {
      doc.font("Helvetica-Oblique").fontSize(10).fillColor("#94A3B8").text("None identified.", x, doc.y, {
        width: columnWidth
      });
    }
    if (doc.y > maxY) maxY = doc.y;
  });

  doc.x = startX;
  doc.y = maxY;
  doc.moveDown(0.6);
}

function bulletSection(doc, title, items, color) {
  if (!Array.isArray(items) || items.length === 0) {
    section(doc, title);
    doc.font("Helvetica-Oblique").fontSize(10).fillColor("#94A3B8").text("None identified.");
    return;
  }
  section(doc, title);
  doc.font("Helvetica").fontSize(11).fillColor("#1E293B");
  for (const item of items) {
    const x = doc.page.margins.left;
    const fullWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
    doc.fillColor(color || "#0F172A").text("•", x, doc.y, { continued: true, width: 12 });
    doc.fillColor("#1E293B").text(` ${item}`, { width: fullWidth - 12 });
  }
}

function clamp(n, lo, hi) {
  return Math.min(hi, Math.max(lo, n));
}

function capitalise(s) {
  if (!s) return "—";
  return String(s).charAt(0).toUpperCase() + String(s).slice(1);
}

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleString("en-PK", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  } catch {
    return iso;
  }
}
