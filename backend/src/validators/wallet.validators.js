import Joi from "joi";

export const topupSchema = Joi.object({
  body: Joi.object({
    amount: Joi.number().min(1).required(),
    note: Joi.string().allow("").optional()
  }).required()
});

export const hideLedgerEntrySchema = Joi.object({
  params: Joi.object({
    entryId: Joi.string().required()
  }).required()
});
