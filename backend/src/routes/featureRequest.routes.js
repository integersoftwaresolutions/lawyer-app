import { Router } from "express";
import rateLimit from "express-rate-limit";
import { validate } from "../middlewares/validate.middleware.js";
import { createFeatureRequestSchema } from "../validators/featureRequest.validators.js";
import * as featureRequestCtrl from "../controllers/featureRequest.controller.js";

const r = Router();

/** Stricter limit for public lead form (spam / abuse). */
const featureRequestLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    success: false,
    statusCode: 429,
    message: "Too many feature requests from this network. Please try again later."
  }
});

r.post("/", featureRequestLimiter, validate(createFeatureRequestSchema), featureRequestCtrl.create);

export default r;
