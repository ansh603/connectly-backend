import express from "express";
import Joi from "joi";
import { validate } from "../../common/middleware/validation.middleware.js";
import { authenticateToken } from "../../common/middleware/jwt.middleware.js";
import { checkAllowedRole } from "../../common/middleware/role.middleware.js";
import {
  adminLogin,
  changeAdminPassword,
  addCity,
  addInterest,
  getSiteContents,
  upsertSiteContent,
  getSupportMessages,
} from "./controller.js";
import { setLanguage } from "../../common/middleware/lanauge.middlware.js";

const router = express.Router();
const adminOnly = [authenticateToken, checkAllowedRole(["admin"])];

// Admin login (no token required)
router.post(
  "/login",
  setLanguage,
  validate(
    Joi.object({
      email: Joi.string().email().required(),
      password: Joi.string().required(),
    })
  ),
  adminLogin
);

// Change password (admin bearer token + role check)
router.post(
  "/change-password",
  setLanguage,
  ...adminOnly,
  validate(
    Joi.object({
      current_password: Joi.string().required(),
      new_password: Joi.string().min(6).required(),
    })
  ),
  changeAdminPassword
);

// Simple admin-protected helpers to add cities / interests
router.post(
  "/city",
  setLanguage,
  ...adminOnly,
  validate(
    Joi.object({
      name: Joi.string().trim().min(2).max(255).required(),
    })
  ),
  addCity
);

router.post(
  "/interest",
  setLanguage,
  ...adminOnly,
  validate(
    Joi.object({
      name: Joi.string().trim().min(2).max(255).required(),
    })
  ),
  addInterest
);

// Site content (about/privacy/terms/contact) — admin editable
router.get(
  "/site-content",
  setLanguage,
  ...adminOnly,
  getSiteContents
);

router.put(
  "/site-content/:key",
  setLanguage,
  ...adminOnly,
  validate(
    Joi.object({
      title: Joi.string().optional().allow("", null),
      html: Joi.string().optional().allow("", null),
    }).unknown(true)
  ),
  upsertSiteContent
);

// Support messages (tickets + contact submissions)
router.get(
  "/support-messages",
  setLanguage,
  ...adminOnly,
  validate(
    Joi.object({
      type: Joi.string().valid("ticket", "support").optional().allow("", null),
      limit: Joi.number().optional().allow("", null),
      offset: Joi.number().optional().allow("", null),
    }).unknown(true)
  ),
  getSupportMessages
);

export default router;
