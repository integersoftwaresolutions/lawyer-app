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
  appBaseUrl: optional("APP_BASE_URL") || optional("CLIENT_ORIGIN"),

  jwtAccessSecret: must("JWT_ACCESS_SECRET"),
  jwtRefreshSecret: must("JWT_REFRESH_SECRET"),
  jwtAccessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "15m",
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",

  cookieSecure: (process.env.COOKIE_SECURE || "false") === "true",
  cookieSameSite: process.env.COOKIE_SAME_SITE || "lax",

  rateLimitWindowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 60000),
  rateLimitMax: Number(process.env.RATE_LIMIT_MAX || 120),

  // Email via Resend HTTPS API (SMTP is blocked on Render)
  resendApiKey: optional("RESEND_API_KEY"),
  emailFrom: optional("EMAIL_FROM", "beth.t@example.com"),
  emailFromName: optional("EMAIL_FROM_NAME", "Adal AI"),
  /** Sales inbox for public demo / setup requests */
  leadsInbox: optional("LEADS_INBOX"),

  // OTP configuration
  otpExpiryMinutes: Number(process.env.OTP_EXPIRY_MINUTES || 10),
  otpLength: Number(process.env.OTP_LENGTH || 6),

  // Scheduled reminder job interval (ms)
  reminderJobIntervalMs: Number(process.env.REMINDER_JOB_INTERVAL_MS || 5 * 60 * 1000),

  // AI / Phase 2
  openaiApiKey: optional("OPENAI_API_KEY"),
  openaiModel: optional("OPENAI_MODEL", "gpt-4o-mini"),
  openaiEmbeddingModel: optional("OPENAI_EMBEDDING_MODEL", "text-embedding-3-small"),
  openaiRequestTimeoutMs: Number(process.env.OPENAI_REQUEST_TIMEOUT_MS || 60000),
  aiDailyRequestLimit: Number(process.env.AI_DAILY_REQUEST_LIMIT || 50),
  encryptionKey: optional("ENCRYPTION_KEY"),

  // RAG / Pinecone
  pineconeApiKey: optional("PINECONE_API_KEY"),
  pineconeIndex: optional("PINECONE_INDEX", "lawyer-app-rag"),
  pineconeCaseLawNamespace: optional("PINECONE_CASE_LAW_NAMESPACE", "case-law"),
  ragEmbeddingDimensions: Number(process.env.RAG_EMBEDDING_DIMENSIONS || 1536),
  ragChunkSizeTokens: Number(process.env.RAG_CHUNK_SIZE_TOKENS || 800),
  ragChunkOverlapTokens: Number(process.env.RAG_CHUNK_OVERLAP_TOKENS || 100),
  ragPrivateDocumentChunkSizeTokens: Number(
    process.env.RAG_PRIVATE_DOCUMENT_CHUNK_SIZE_TOKENS || 400
  ),
  ragPrivateDocumentChunkOverlapTokens: Number(
    process.env.RAG_PRIVATE_DOCUMENT_CHUNK_OVERLAP_TOKENS || 80
  ),
  ragTopK: Number(process.env.RAG_TOP_K || 6),
  ragMinScore: Number(process.env.RAG_MIN_SCORE || 0.35),
  ragPrivateDocumentMinScore: Number(process.env.RAG_PRIVATE_DOCUMENT_MIN_SCORE || 0.18),

  // Billing / Stripe
  stripeSecretKey: optional("STRIPE_SECRET_KEY"),
  stripeWebhookSecret: optional("STRIPE_WEBHOOK_SECRET"),
  stripePriceBaseMonthly: optional("STRIPE_PRICE_BASE_MONTHLY"),
  stripePriceMaxMonthly: optional("STRIPE_PRICE_MAX_MONTHLY"),
  stripePriceFirmMonthly: optional("STRIPE_PRICE_FIRM_MONTHLY"),
  stripePriceFirmMaxMonthly: optional("STRIPE_PRICE_FIRM_MAX_MONTHLY"),
  /** @deprecated legacy alias */
  stripePriceProMonthly: optional("STRIPE_PRICE_PRO_MONTHLY"),
  billingTrialDays: Number(process.env.BILLING_TRIAL_DAYS || 30),
  billingPastDueGraceDays: Number(process.env.BILLING_PAST_DUE_GRACE_DAYS || 3),
  billingReconcileEnabled: (process.env.BILLING_RECONCILE_ENABLED || "true") === "true",
  billingJobIntervalMs: Number(process.env.BILLING_JOB_INTERVAL_MS || 60 * 60 * 1000),
  billingDisplayPriceBase: Number(process.env.BILLING_DISPLAY_PRICE_BASE || 1000),
  billingDisplayPriceMax: Number(process.env.BILLING_DISPLAY_PRICE_MAX || 3000),
  billingDisplayPriceFirm: Number(process.env.BILLING_DISPLAY_PRICE_FIRM || 4000),
  billingDisplayPriceFirmMax: Number(process.env.BILLING_DISPLAY_PRICE_FIRM_MAX || 10000),
  billingDisplayCurrency: optional("BILLING_DISPLAY_CURRENCY", "pkr")
};
