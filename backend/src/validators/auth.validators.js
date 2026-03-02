import Joi from "joi";

export const registerSchema = Joi.object({
  body: Joi.object({
    role: Joi.string().valid("CLIENT", "LAWYER").required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    fullName: Joi.string().min(2).optional()
  }).required(),
  query: Joi.object().optional(),
  params: Joi.object().optional()
});

export const loginSchema = Joi.object({
  body: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  }).required()
});

export const refreshSchema = Joi.object({
  body: Joi.object({}).optional()
});
