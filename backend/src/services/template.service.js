import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { env } from "../config/env.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const templatesDir = path.join(__dirname, "../templates");

/**
 * Read template file
 */
function readTemplate(templateName) {
  const templatePath = path.join(templatesDir, `${templateName}.html`);
  try {
    return fs.readFileSync(templatePath, "utf-8");
  } catch (error) {
    console.error(`Failed to read template ${templateName}:`, error);
    throw new Error(`Template ${templateName} not found`);
  }
}

/**
 * Replace template variables with actual values
 */
function renderTemplate(template, variables) {
  let rendered = template;
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`{{${key}}}`, "g");
    rendered = rendered.replace(regex, value);
  }
  return rendered;
}

/**
 * Get base template variables
 */
function getBaseVariables() {
  return {
    appName: env.emailFromName || "Lawyer App",
    year: new Date().getFullYear().toString(),
    supportEmail: env.emailFrom || "support@lawyerapp.com"
  };
}

/**
 * Render email template
 * @param {string} templateName - Name of the template (without .html extension)
 * @param {object} variables - Variables to replace in template
 * @returns {string} Rendered HTML
 */
export function renderEmailTemplate(templateName, variables = {}) {
  const template = readTemplate(templateName);
  const baseVars = getBaseVariables();
  const allVariables = { ...baseVars, ...variables };
  return renderTemplate(template, allVariables);
}

/**
 * Generate plain text version from HTML (simple version)
 */
export function htmlToText(html) {
  return html
    .replace(/<style[^>]*>.*?<\/style>/gis, "")
    .replace(/<script[^>]*>.*?<\/script>/gis, "")
    .replace(/<[^>]+>/g, "")
    .replace(/\n\s*\n/g, "\n")
    .trim();
}

