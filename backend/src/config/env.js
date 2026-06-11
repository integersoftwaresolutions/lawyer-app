import dotenv from "dotenv";

dotenv.config();

function must(name, fallback = undefined) {
  const v = process.env[name] ?? fallback;
  if (v === undefined || v === "") throw new Error(`Missing env var: ${name}`);
  return v;
}

function optional(name, fallback = "") {
  return process.env[name] ?? fallback;
}

export const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT || 5000),

  mongoUri: must("MONGO_URI"),
  clientOrigin: must("CLIENT_ORIGIN"),

  jwtAccessSecret: must("JWT_ACCESS_SECRET"),
  jwtRefreshSecret: must("JWT_REFRESH_SECRET"),
  jwtAccessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "15m",
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",

  cookieSecure: (process.env.COOKIE_SECURE || "false") === "true",
  cookieSameSite: process.env.COOKIE_SAME_SITE || "lax",

  rateLimitWindowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 60000),
  rateLimitMax: Number(process.env.RATE_LIMIT_MAX || 120),

  // Email configuration (optional - will log to console in development if not configured)
  emailHost: optional("EMAIL_HOST", "smtp.gmail.com"),
  emailPort: Number(optional("EMAIL_PORT", "587")),
  emailSecure: (optional("EMAIL_SECURE", "false")) === "true",
  emailUser: optional("EMAIL_USER"),
  emailPassword: optional("EMAIL_PASSWORD"),
  emailFrom: optional("EMAIL_FROM") || optional("EMAIL_USER") || "noreply@lawyerapp.com",
  emailFromName: optional("EMAIL_FROM_NAME", "Lawyer App"),

  // OTP configuration
  otpExpiryMinutes: Number(process.env.OTP_EXPIRY_MINUTES || 10),
  otpLength: Number(process.env.OTP_LENGTH || 6),

  // AI / Phase 2
  openaiApiKey: optional("OPENAI_API_KEY"),
  openaiModel: optional("OPENAI_MODEL", "gpt-4o-mini"),
  openaiEmbeddingModel: optional("OPENAI_EMBEDDING_MODEL", "text-embedding-3-small"),
  openaiRequestTimeoutMs: Number(process.env.OPENAI_REQUEST_TIMEOUT_MS || 60000),
  aiDailyRequestLimit: Number(process.env.AI_DAILY_REQUEST_LIMIT || 50),
  encryptionKey: optional("ENCRYPTION_KEY")
};
