/**
 * Frontend feature flags (Vite bakes VITE_* in at build time).
 * Set a flag to false and rebuild to restore that module.
 */
export const AI_COMING_SOON = import.meta.env.VITE_AI_COMING_SOON !== "false";
export const BILLING_COMING_SOON = import.meta.env.VITE_BILLING_COMING_SOON !== "false";
