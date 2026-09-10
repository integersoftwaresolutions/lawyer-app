import Joi from "joi";

export const createFeatureRequestSchema = Joi.object({
  body: Joi.object({
    fullName: Joi.string().trim().min(2).max(120).required(),
    email: Joi.string().trim().email().max(254).required(),
    phone: Joi.string()
      .trim()
      .max(40)
      .required()
      .custom((value, helpers) => {
        if (String(value).replace(/\D/g, "").length < 7) {
          return helpers.error("any.invalid");
        }
        return value;
      })
      .messages({
        "any.invalid": "Please enter a valid phone number",
        "any.required": "Phone is required",
        "string.empty": "Phone is required"
      }),
    feature: Joi.string().trim().min(10).max(2000).required(),
    source: Joi.string().trim().allow("").max(80).optional(),
    /** Honeypot — bots fill this; humans leave blank */
    website: Joi.string().allow("").max(200).optional()
  }).required(),
  query: Joi.object().optional(),
  params: Joi.object().optional()
});
