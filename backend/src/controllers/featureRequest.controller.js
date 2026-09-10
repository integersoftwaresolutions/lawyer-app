import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess } from "../helpers/response.helper.js";
import * as featureRequestService from "../services/featureRequest.service.js";

export const create = asyncHandler(async (req, res) => {
  const body = req.validated?.body || req.body;
  const ip =
    req.headers["x-forwarded-for"]?.toString().split(",")[0]?.trim() ||
    req.ip ||
    "";
  const userAgent = req.headers["user-agent"] || "";

  await featureRequestService.createFeatureRequest(body, { ip, userAgent });

  return sendSuccess(res, {
    statusCode: 201,
    message: "Request received. We'll be in touch shortly.",
    data: { ok: true }
  });
});
