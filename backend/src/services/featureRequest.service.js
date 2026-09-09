import FeatureRequest from "../models/FeatureRequest.js";
import { env } from "../config/env.js";
import { sendEmail } from "./email.service.js";

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
  return `<p><strong>Requested feature</strong></p>
<div class="info-card"><p style="white-space:pre-wrap;margin:0;">${escapeHtml(trimmed)}</p></div>`;
}

function buildLeadEmailText(lead, interestLabel, submittedAt) {
  return [
    "New Adal AI feature request",
    "",
    `Name: ${lead.fullName}`,
    `Email: ${lead.email}`,
    `Phone: ${lead.phone || "—"}`,
    `Interest: ${interestLabel}`,
    `Source: ${lead.source || "—"}`,
    `Submitted: ${submittedAt}`,
    "",
    lead.feature ? `Feature:\n${lead.feature}` : "",
    "",
    `Lead ID: ${lead._id}`,
    "",
    `Reply to: ${lead.email}`
  ]
    .filter(Boolean)
    .join("\n");
}

function buildLeadVariables(lead) {
  const interestLabel = "Feature request";
  const submittedAt = formatSubmittedAt(lead.createdAt);
  const phone = (lead.phone || "").trim();
  return {
    preheader: `${lead.fullName} — ${interestLabel}`,
    headline: "New feature request",
    introLine: `<strong>${escapeHtml(lead.fullName)}</strong> requested <strong>${escapeHtml(
      interestLabel
    )}</strong> via the public form.`,
    fullName: escapeHtml(lead.fullName),
    email: escapeHtml(lead.email),
    nameEncoded: encodeURIComponent(lead.fullName || "Adal AI"),
    phoneDisplay: phone
      ? `<a href="tel:${escapeHtml(phone.replace(/\s+/g, ""))}">${escapeHtml(phone)}</a>`
      : "—",
    interestLabel: escapeHtml(interestLabel),
    source: escapeHtml(lead.source || "request-feature"),
    submittedAt: escapeHtml(submittedAt),
    messageSection: buildMessageSection(lead.feature),
    leadId: escapeHtml(String(lead._id)),
    interestLabelRaw: interestLabel,
    submittedAtRaw: submittedAt
  };
}

/**
 * Persist a feature request and notify the sales inbox.
 * Email failure does not roll back the lead.
 */
export async function createFeatureRequest(payload, { ip = "", userAgent = "" } = {}) {
  // Honeypot: pretend success so bots don't learn they were blocked
  if (payload.website && String(payload.website).trim() !== "") {
    return { id: null, accepted: true, spam: true };
  }

  const lead = await FeatureRequest.create({
    fullName: payload.fullName,
    email: payload.email,
    phone: payload.phone || "",
    feature: payload.feature,
    source: payload.source || "request-feature",
    website: "",
    meta: {
      ip: ip || "",
      userAgent: (userAgent || "").slice(0, 500)
    }
  });

  const inbox = env.leadsInbox;
  if (!inbox) {
    console.warn("⚠️  LEADS_INBOX not set — feature request saved but sales email skipped.");
    lead.emailError = "LEADS_INBOX not configured";
    await lead.save();
    return { id: lead._id, accepted: true, spam: false, emailed: false };
  }

  try {
    const vars = buildLeadVariables(lead);
    const delivery = await sendEmail({
      to: inbox,
      subject: `[Adal AI] ${vars.interestLabelRaw} — ${lead.fullName}`,
      template: "feature-request-lead",
      variables: vars,
      text: buildLeadEmailText(lead, vars.interestLabelRaw, vars.submittedAtRaw),
      replyTo: lead.email
    });
    lead.emailNotifiedAt = delivery.sent ? new Date() : null;
    lead.emailError = delivery.sent ? "" : "Email transport not configured";
    await lead.save();
    return { id: lead._id, accepted: true, spam: false, emailed: delivery.sent };
  } catch (err) {
    console.error("Feature request email failed:", err.message);
    lead.emailError = err.message?.slice(0, 500) || "Email send failed";
    await lead.save();
    return { id: lead._id, accepted: true, spam: false, emailed: false };
  }
}
