import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { env } from "../config/env.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const templatesDir = path.join(__dirname, "../templates");

function readTemplate(relativePath) {
  const templatePath = path.join(templatesDir, `${relativePath}.html`);
  try {
    return fs.readFileSync(templatePath, "utf-8");
  } catch (error) {
    console.error(`Failed to read template ${relativePath}:`, error);
    throw new Error(`Template ${relativePath} not found`);
  }
}

function renderTemplate(template, variables) {
  let rendered = template;
  for (const [key, value] of Object.entries(variables)) {
    const safeValue = value == null ? "" : String(value);
    rendered = rendered.replace(new RegExp(`{{${key}}}`, "g"), safeValue);
  }
  return rendered;
}

function getBaseVariables() {
  const baseUrl = (env.appBaseUrl || env.clientOrigin || "").replace(/\/$/, "");
  return {
    appName: env.emailFromName || "Lawyer App",
    year: new Date().getFullYear().toString(),
    supportEmail: env.emailFrom || "support@lawyerapp.com",
    appBaseUrl: baseUrl,
    brandColor: "#085456",
    brandColorLight: "#0a6b6e"
  };
}

/**
 * Render an email: content partial wrapped in the shared layout.
 * @param {string} templateName - File name under templates/emails/ (without .html)
 */
export function renderEmailTemplate(templateName, variables = {}) {
  const content = readTemplate(`emails/${templateName}`);
  const layout = readTemplate("layouts/email-layout");
  const baseVars = getBaseVariables();
  const allVariables = {
    preheader: "",
    headline: "",
    ctaUrl: "",
    ctaLabel: "",
    ...baseVars,
    ...variables
  };

  const renderedContent = renderTemplate(content, allVariables);
  const withContent = layout.replace("{{content}}", renderedContent);
  return renderTemplate(withContent, allVariables);
}

export function htmlToText(html) {
  return html
    .replace(/<style[^>]*>.*?<\/style>/gis, "")
    .replace(/<script[^>]*>.*?<\/script>/gis, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/\n\s*\n/g, "\n")
    .trim();
}
