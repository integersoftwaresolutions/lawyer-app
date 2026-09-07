import Joi from "joi";
import { DEMO_INTERESTS } from "../models/DemoRequest.js";

export const createDemoRequestSchema = Joi.object({
  body: Joi.object({
    fullName: Joi.string().trim().min(2).max(120).required(),
    email: Joi.string().trim().email().max(254).required(),
    company: Joi.string().trim().min(2).max(160).required(),
    phone: Joi.string().trim().allow("").max(40).optional(),
    roleTitle: Joi.string().trim().allow("").max(120).optional(),
    interest: Joi.string()
      .valid(...DEMO_INTERESTS)
      .default("demo"),
    teamSize: Joi.string().trim().allow("").max(40).optional(),
    message: Joi.string().trim().allow("").max(2000).optional(),
    source: Joi.string().trim().allow("").max(80).optional(),
    /** Honeypot — bots fill this; humans leave blank */
    website: Joi.string().allow("").max(200).optional()
  }).required(),
  query: Joi.object().optional(),
  params: Joi.object().optional()
});
