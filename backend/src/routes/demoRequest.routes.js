import { Router } from "express";
import rateLimit from "express-rate-limit";
import { validate } from "../middlewares/validate.middleware.js";
import { createDemoRequestSchema } from "../validators/demoRequest.validators.js";
import * as demoRequestCtrl from "../controllers/demoRequest.controller.js";

const r = Router();

/** Stricter limit for public lead form (spam / abuse). */
const demoRequestLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    success: false,
    statusCode: 429,
    message: "Too many demo requests from this network. Please try again later."
  }
});

r.post("/", demoRequestLimiter, validate(createDemoRequestSchema), demoRequestCtrl.create);

export default r;
