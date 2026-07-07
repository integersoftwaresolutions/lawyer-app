import { ApiError } from "../../../helpers/apiError.js";

/**
 * Extract clean plaintext from a buffer, dispatching by mime type / extension.
 * Currently supports: text/plain, text/html, application/pdf.
 */
export async function extractText({ buffer, mimeType = "", fileName = "" } = {}) {
  if (!buffer || !Buffer.isBuffer(buffer)) {
    throw new ApiError(400, "extractText requires a Buffer input");
  }

  const lowerName = String(fileName).toLowerCase();
  const ext = lowerName.includes(".") ? lowerName.split(".").pop() : "";
  const mt = String(mimeType).toLowerCase();

  if (mt === "application/pdf" || ext === "pdf") {
    return await extractFromPdf(buffer);
  }
  if (mt === "text/html" || mt === "application/xhtml+xml" || ext === "html" || ext === "htm") {
    return extractFromHtml(buffer.toString("utf8"));
  }
  if (mt.startsWith("text/") || ext === "txt" || ext === "md") {
    return buffer.toString("utf8");
  }

  // Fallback: treat as utf-8 text. Caller can decide to reject.
  return buffer.toString("utf8");
}

export function extractFromHtml(html) {
  if (!html) return "";

  let text = String(html);
  text = text.replace(/<script[\s\S]*?<\/script>/gi, " ");
  text = text.replace(/<style[\s\S]*?<\/style>/gi, " ");
  text = text.replace(/<noscript[\s\S]*?<\/noscript>/gi, " ");

  text = text.replace(/<\/(p|div|li|tr|h[1-6]|br|section|article)>/gi, "\n");
  text = text.replace(/<br\s*\/?\s*>/gi, "\n");

  text = text.replace(/<[^>]+>/g, " ");

  text = text
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&[a-z]+;/gi, " ");

  return text.replace(/[ \t]+/g, " ").replace(/\s*\n\s*/g, "\n").trim();
}

async function extractFromPdf(buffer) {
  const pdf = (await import("pdf-parse")).default;
  const result = await pdf(buffer);
  return result?.text || "";
}
