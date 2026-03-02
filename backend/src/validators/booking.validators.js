import Joi from "joi";

export const createBookingSchema = Joi.object({
  body: Joi.object({
    lawyerUserId: Joi.string().required(),
    startAt: Joi.date().iso().required(),
    durationMinutes: Joi.number().min(15).max(240).required()
  }).required()
});

export const rescheduleBookingSchema = Joi.object({
  body: Joi.object({
    startAt: Joi.date().iso().required(),
    durationMinutes: Joi.number().min(15).max(240).required()
  }).required(),
  params: Joi.object({
    bookingId: Joi.string().required()
  }).required()
});

export const bookingIdParamSchema = Joi.object({
  params: Joi.object({
    bookingId: Joi.string().required()
  }).required()
});
