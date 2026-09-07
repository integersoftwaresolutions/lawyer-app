import DemoRequest from "../models/DemoRequest.js";
import { env } from "../config/env.js";
import { sendEmail } from "./email.service.js";

const INTEREST_LABELS = {
  demo: "Product demo",
  setup: "Setup / onboarding",
  pricing: "Pricing discussion",
  other: "Other"
};

function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatSubmittedAt(date) {
  if (!date) return "—";
  try {
    return new Intl.DateTimeFormat("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZoneName: "short"
    }).format(new Date(date));
  } catch {
    return new Date(date).toUTCString();
  }
}

function buildMessageSection(message) {
  const trimmed = (message || "").trim();
  if (!trimmed) return "";
  return `<p><strong>Message from prospect</strong></p>
<div class="info-card"><p style="white-space:pre-wrap;margin:0;">${escapeHtml(trimmed)}</p></div>`;
}

function buildLeadEmailText(lead, interestLabel, submittedAt) {
  return [
    "New Adal AI demo request",
    "",
    `Name: ${lead.fullName}`,
    `Email: ${lead.email}`,
    `Company: ${lead.company}`,
    `Phone: ${lead.phone || "—"}`,
    `Role: ${lead.roleTitle || "—"}`,
    `Interest: ${interestLabel}`,
    `Team size: ${lead.teamSize || "—"}`,
    `Source: ${lead.source || "—"}`,
    `Submitted: ${submittedAt}`,
    "",
    lead.message ? `Message:\n${lead.message}` : "",
    "",
    `Lead ID: ${lead._id}`,
    "",
    `Reply to: ${lead.email}`
  ]
    .filter(Boolean)
    .join("\n");
}

function buildLeadVariables(lead) {
  const interestLabel = INTEREST_LABELS[lead.interest] || lead.interest;
  const submittedAt = formatSubmittedAt(lead.createdAt);
  const phone = (lead.phone || "").trim();
  const role = (lead.roleTitle || "").trim();
  const teamSize = (lead.teamSize || "").trim();

  return {
    preheader: `${lead.fullName} at ${lead.company} — ${interestLabel}`,
    headline: "New demo request",
    introLine: `<strong>${escapeHtml(lead.fullName)}</strong> from <strong>${escapeHtml(
      lead.company
    )}</strong> requested <strong>${escapeHtml(interestLabel)}</strong> via the public form.`,
    fullName: escapeHtml(lead.fullName),
    email: escapeHtml(lead.email),
    company: escapeHtml(lead.company),
    companyEncoded: encodeURIComponent(lead.company || "Adal AI"),
    phoneDisplay: phone
      ? `<a href="tel:${escapeHtml(phone.replace(/\s+/g, ""))}">${escapeHtml(phone)}</a>`
      : "—",
    roleDisplay: role ? escapeHtml(role) : "—",
    interestLabel: escapeHtml(interestLabel),
    teamSizeDisplay: teamSize ? escapeHtml(teamSize) : "—",
    source: escapeHtml(lead.source || "request-demo"),
    submittedAt: escapeHtml(submittedAt),
    messageSection: buildMessageSection(lead.message),
    leadId: escapeHtml(String(lead._id)),
    interestLabelRaw: interestLabel,
    submittedAtRaw: submittedAt
  };
}

/**
 * Persist a demo request and notify the sales inbox.
 * Email failure does not roll back the lead.
 */
export async function createDemoRequest(payload, { ip = "", userAgent = "" } = {}) {
  // Honeypot: pretend success so bots don't learn they were blocked
  if (payload.website && String(payload.website).trim() !== "") {
    return { id: null, accepted: true, spam: true };
  }

  const lead = await DemoRequest.create({
    fullName: payload.fullName,
    email: payload.email,
    company: payload.company,
    phone: payload.phone || "",
    roleTitle: payload.roleTitle || "",
    interest: payload.interest || "demo",
    teamSize: payload.teamSize || "",
    message: payload.message || "",
    source: payload.source || "request-demo",
    website: "",
    meta: {
      ip: ip || "",
      userAgent: (userAgent || "").slice(0, 500)
    }
  });

  const inbox = env.leadsInbox;
  if (!inbox) {
    console.warn("⚠️  LEADS_INBOX not set — demo request saved but sales email skipped.");
    lead.emailError = "LEADS_INBOX not configured";
    await lead.save();
    return { id: lead._id, accepted: true, spam: false, emailed: false };
  }

  try {
    const vars = buildLeadVariables(lead);
    await sendEmail({
      to: inbox,
      subject: `[Adal AI] ${vars.interestLabelRaw} — ${lead.company} — ${lead.fullName}`,
      template: "demo-request-lead",
      variables: vars,
      text: buildLeadEmailText(lead, vars.interestLabelRaw, vars.submittedAtRaw),
      replyTo: lead.email
    });
    lead.emailNotifiedAt = new Date();
    lead.emailError = "";
    await lead.save();
    return { id: lead._id, accepted: true, spam: false, emailed: true };
  } catch (err) {
    console.error("Demo request email failed:", err.message);
    lead.emailError = err.message?.slice(0, 500) || "Email send failed";
    await lead.save();
    return { id: lead._id, accepted: true, spam: false, emailed: false };
  }
}
