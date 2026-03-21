import express from "express";
import Joi from "joi";
import { validate } from "../../common/middleware/validation.middleware.js";
import { authenticateToken } from "../../common/middleware/jwt.middleware.js";
import { setLanguage } from "../../common/middleware/lanauge.middlware.js";
import {
  createBooking,
  listBookings,
  acceptBooking,
  declineBooking,
  cancelBooking,
  completeBooking,
  getAvailableSlots,
  generateOtp,
  verifyOtp,
} from "./controller.js";

const router = express.Router();

router.use(authenticateToken);

router.get("/", setLanguage, listBookings);

router.get(
  "/slots",
  setLanguage,
  validate(
    Joi.object({
      provider_id: Joi.string().uuid().required(),
      date: Joi.string().required(),
    }).unknown(true)
  ),
  getAvailableSlots
);

router.post(
  "/",
  setLanguage,
  validate(
    Joi.object({
      provider_id: Joi.string().uuid().required(),
      booking_date: Joi.string().required(),
      time_start: Joi.string().required(),
      time_end: Joi.string().required(),
      amount: Joi.number().positive().required(),
      duration_hours: Joi.number().min(0).optional(),
      location: Joi.string().optional().allow("", null),
      purpose: Joi.string().optional().allow("", null),
    }).unknown(true)
  ),
  createBooking
);

router.patch("/:id/accept", setLanguage, acceptBooking);
router.patch("/:id/decline", setLanguage, declineBooking);
router.patch("/:id/cancel", setLanguage, cancelBooking);
router.post("/:id/complete", setLanguage, completeBooking);

router.post("/:id/otp/generate", setLanguage, generateOtp);
router.post(
  "/:id/otp/verify",
  setLanguage,
  validate(
    Joi.object({
      otp: Joi.string().length(6).required(),
    }).unknown(true)
  ),
  verifyOtp
);

export default router;
