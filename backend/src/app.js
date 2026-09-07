import express from "express";
import path from "path";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import { corsMiddleware } from "./config/cors.js";
import { rateLimitMiddleware } from "./middlewares/rateLimit.middleware.js";
import apiRoutes from "./routes/index.js";
import { errorMiddleware } from "./middlewares/error.middleware.js";
import { sendSuccess } from "./helpers/response.helper.js";
import * as billingCtrl from "./controllers/billing.controller.js";

export function createApp() {
  const app = express();

  app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
  }));
  app.use(corsMiddleware);
  app.use(rateLimitMiddleware);

  // Stripe webhooks need the raw body for signature verification
  app.post(
    "/api/billing/webhooks/stripe",
    express.raw({ type: "application/json" }),
    billingCtrl.stripeWebhook
  );

  app.use(express.json({ limit: "1mb" }));
  app.use(cookieParser());
  app.use(morgan("dev"));

  // Serve static files with CORS headers
  app.use("/uploads", (req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET");
    next();
  }, express.static(path.join(process.cwd(), "uploads")));

  app.get("/health", (req, res) => sendSuccess(res, { message: "OK", data: { uptime: process.uptime() } }));

  app.use("/api", apiRoutes);

  app.use(errorMiddleware);
  return app;
}
