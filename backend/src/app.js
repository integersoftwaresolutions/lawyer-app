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

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(corsMiddleware);
  app.use(rateLimitMiddleware);
  app.use(express.json({ limit: "1mb" }));
  app.use(cookieParser());
  app.use(morgan("dev"));

  app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

  app.get("/health", (req, res) => sendSuccess(res, { message: "OK", data: { uptime: process.uptime() } }));

  app.use("/api", apiRoutes);

  app.use(errorMiddleware);
  return app;
}
