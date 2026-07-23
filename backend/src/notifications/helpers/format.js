import { env } from "../../config/env.js";

const DEFAULT_TIMEZONE = "Asia/Karachi";

export function appUrl(path = "") {
  const base = (env.appBaseUrl || env.clientOrigin || "").replace(/\/$/, "");
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalized}`;
}

export function formatDateTime(date, timezone = DEFAULT_TIMEZONE) {
  if (!date) return "";
  return new Intl.DateTimeFormat("en-PK", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: timezone
  }).format(new Date(date));
}

export function formatReminderLabel(minutes) {
  if (minutes >= 1440 && minutes % 1440 === 0) {
    const days = minutes / 1440;
    return days === 1 ? "24 hours" : `${days} days`;
  }
  if (minutes >= 60 && minutes % 60 === 0) {
    const hours = minutes / 60;
    return hours === 1 ? "1 hour" : `${hours} hours`;
  }
  return `${minutes} minutes`;
}

export function consultationTypeLabel(type) {
  const map = {
    CHAT: "Chat",
    VIDEO: "Video",
    CHAT_VIDEO: "Chat & Video"
  };
  return map[type] || type || "Consultation";
}
