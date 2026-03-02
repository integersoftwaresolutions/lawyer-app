import { Router } from "express";
import { validate } from "../middlewares/validate.middleware.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import * as authCtrl from "../controllers/auth.controller.js";
import { registerSchema, loginSchema, refreshSchema } from "../validators/auth.validators.js";

const r = Router();

r.post("/register", validate(registerSchema), authCtrl.register);
r.post("/login", validate(loginSchema), authCtrl.login);
r.post("/refresh", validate(refreshSchema), authCtrl.refresh);

r.get("/me", authMiddleware, authCtrl.me);
r.post("/logout", authMiddleware, authCtrl.logout);

export default r;
