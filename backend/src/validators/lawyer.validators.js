import Joi from "joi";

export const searchLawyersSchema = Joi.object({
  query: Joi.object({
    q: Joi.string().allow(""),
    city: Joi.string().allow(""),
    specialization: Joi.string().allow(""),
    minExp: Joi.number().min(0),
    maxRate: Joi.number().min(0),
    sort: Joi.string().valid("rating", "rate", "experience").default("rating"),
    page: Joi.number().min(1).default(1),
    limit: Joi.number().min(1).max(50).default(10)
  }).unknown(true)
});
