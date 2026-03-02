import rateLimit from "express-rate-limit";
import { env } from "../config/env.js";

export const rateLimitMiddleware = rateLimit({
  windowMs: env.rateLimitWindowMs,
  limit: env.rateLimitMax,
  standardHeaders: "draft-7",
  legacyHeaders: false
});
