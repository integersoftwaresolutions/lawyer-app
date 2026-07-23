import { sendEmail } from "../../services/email.service.js";
import { getEmailConfig } from "../notification.registry.js";

export async function sendNotificationEmail({ type, to, variables }) {
  const { template, subject } = getEmailConfig(type);
  const resolvedSubject = typeof subject === "function" ? subject(variables) : subject;

  return sendEmail({
    to,
    subject: resolvedSubject,
    template,
    variables
  });
}
