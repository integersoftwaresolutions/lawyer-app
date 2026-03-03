import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { ApiError } from "../helpers/apiError.js";
import User from "../models/User.js";

export async function authMiddleware(req, _res, next) {
  try {
    const auth = req.headers.authorization || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;

    if (!token) return next(new ApiError(401, "Missing access token"));

    const payload = jwt.verify(token, env.jwtAccessSecret);
    const user = await User.findById(payload.sub).lean();
    if (!user) return next(new ApiError(401, "User not found"));

    req.user = { 
      id: user._id.toString(), 
      role: user.role, 
      email: user.email,
      isEmailVerified: user.isEmailVerified 
    };
    return next();
  } catch {
    return next(new ApiError(401, "Invalid/expired access token"));
  }
}
