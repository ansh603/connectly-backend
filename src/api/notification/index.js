import express from "express";
import Joi from "joi";
import { validate } from "../../common/middleware/validation.middleware.js";
import { authenticateToken } from "../../common/middleware/jwt.middleware.js";
import { setLanguage } from "../../common/middleware/lanauge.middlware.js";
import { listNotifications, markNotificationsRead } from "./controller.js";

const router = express.Router();

router.use(authenticateToken);

router.get(
  "/",
  setLanguage,
  validate(
    Joi.object({
      limit: Joi.number().integer().min(1).max(50).optional(),
      offset: Joi.number().integer().min(0).optional(),
    }).unknown(true)
  ),
  listNotifications
);

router.post("/read", setLanguage, markNotificationsRead);

export default router;
