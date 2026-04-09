import express from "express";
import Joi from "joi";
import { validate } from "../../common/middleware/validation.middleware.js";
import { authenticateToken } from "../../common/middleware/jwt.middleware.js";
import { memoryImageUpload } from "../../common/middleware/memoryUpload.middleware.js";
import {
  login,
  logout,
  register,
  verifyEmail,
  resendVerificationOtp,
  getProfile,
  updateProfile,
  exploreProfiles,
} from "./controller.js";
import { setLanguage } from "../../common/middleware/lanauge.middlware.js";

const router = express.Router();

router.post(
  "/register",
  setLanguage,
  memoryImageUpload.single("profile_image"),
  validate(
    Joi.object({
      name: Joi.string().required(),
      country_code: Joi.string().optional().allow("", null),
      phone_number: Joi.string().optional().allow("", null),
      email: Joi.string().email().required(),
      password: Joi.string().min(6).required(),
      type: Joi.string().valid("individual").optional(),
      bio: Joi.string().optional().allow("", null),
      rate: Joi.alternatives().try(Joi.number(), Joi.string().allow("", null)).optional().allow(null),
      location: Joi.string().optional().allow("", null),
      city_id: Joi.string().uuid().optional().allow("", null),
      age: Joi.alternatives().try(Joi.number().integer(), Joi.string().allow("", null)).optional().allow(null),
      interest_ids: Joi.alternatives()
        .try(Joi.array().items(Joi.string().uuid()), Joi.string().allow("", null))
        .optional(),
      availability: Joi.string().optional().allow("", null),
      fcm_token: Joi.string().optional().allow("", null),
      device_id: Joi.string().optional().allow("", null),
      device_token: Joi.string().optional().allow("", null),
      device_type: Joi.string().optional().allow("", null),
    })
  ),
  register
);

/** After register or when login returns needs_email_verification */
router.post(
  "/verify-email",
  setLanguage,
  validate(
    Joi.object({
      email: Joi.string().email().required(),
      otp_code: Joi.string().length(6).required(),
      fcm_token: Joi.string().optional().allow("", null),
      device_id: Joi.string().optional().allow("", null),
      device_token: Joi.string().optional().allow("", null),
      device_type: Joi.string().optional().allow("", null),
    })
  ),
  verifyEmail
);

/** Requires correct password — for unverified accounts only */
router.post(
  "/resend-verification-otp",
  setLanguage,
  validate(
    Joi.object({
      email: Joi.string().email().required(),
      password: Joi.string().required(),
    })
  ),
  resendVerificationOtp
);

router.post(
  "/login",
  setLanguage,
  validate(
    Joi.object({
      email: Joi.string().email().required(),
      password: Joi.string().required(),
      fcm_token: Joi.string().optional().allow("", null),
      device_id: Joi.string().optional().allow("", null),
      device_token: Joi.string().optional().allow("", null),
      device_type: Joi.string().optional().allow("", null),
    })
  ),
  login
);

router.post(
  "/logout",
  setLanguage,
  authenticateToken,
  validate(
    Joi.object({
      device_id: Joi.string().optional().allow("", null),
      device_token: Joi.string().optional().allow("", null),
      device_type: Joi.string().optional().allow("", null),
    })
  ),
  logout
);

router.get("/profile", setLanguage, authenticateToken, getProfile);

router.patch(
  "/profile",
  setLanguage,
  authenticateToken,
  validate(
    Joi.object({
      name: Joi.string().trim().min(2).optional(),
      email: Joi.string().email().optional(),
      country_code: Joi.string().optional().allow("", null),
      phone_number: Joi.string().optional().allow("", null),
      bio: Joi.string().optional().allow("", null),
      rate: Joi.number().optional().allow(null),
      location: Joi.string().optional().allow("", null),
      city_id: Joi.string().uuid().optional().allow(null, ""),
      age: Joi.number().integer().optional().allow(null),
      interest_ids: Joi.array().items(Joi.string().uuid()).optional(),
      availability: Joi.string().optional().allow("", null),
    })
  ),
  updateProfile
);

// Public: Explore verified profiles with optional filters
router.get(
  "/explore",
  setLanguage,
  validate(
    Joi.object({
      search: Joi.string().optional().allow("", null),
      type: Joi.string().valid("all", "individual").optional().allow("all", null),
      interests: Joi.string().optional().allow("", null),
      maxPrice: Joi.alternatives().try(Joi.number(), Joi.string().allow("")).optional(),
      sortBy: Joi.string().valid("rating", "price_asc", "price_desc").optional().allow("rating", null),
      ageMin: Joi.alternatives().try(Joi.number(), Joi.string().allow("")).optional(),
      ageMax: Joi.alternatives().try(Joi.number(), Joi.string().allow("")).optional(),
      city: Joi.string().optional().allow("", null),
      location: Joi.string().optional().allow("", null),
      page: Joi.number().integer().min(1).required(),
      pageSize: Joi.number().integer().min(1).max(50).required(),
    }).unknown(true)
  ),
  exploreProfiles
);

export default router;
