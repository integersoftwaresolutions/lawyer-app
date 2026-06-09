import Joi from "joi";
import { DISPUTE_REASON, DISPUTE_RESOLUTION } from "../config/constants.js";

export const raiseDisputeSchema = Joi.object({
  body: Joi.object({
    reason: Joi.string().valid(...Object.values(DISPUTE_REASON)).required(),
    description: Joi.string().allow("").max(2000).optional()
  }).required()
});

export const updateDisputeStatusSchema = Joi.object({
  body: Joi.object({
    status: Joi.string().valid("OPEN", "UNDER_REVIEW").required()
  }).required()
});

export const resolveDisputeSchema = Joi.object({
  body: Joi.object({
    resolution: Joi.string().valid(...Object.values(DISPUTE_RESOLUTION)).required(),
    resolutionNote: Joi.string().allow("").max(2000).optional(),
    refundAmount: Joi.number().min(0).optional()
  }).required()
});
