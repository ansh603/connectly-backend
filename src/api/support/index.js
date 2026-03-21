import express from "express";
import Joi from "joi";
import { validate } from "../../common/middleware/validation.middleware.js";
import { setLanguage } from "../../common/middleware/lanauge.middlware.js";
import { submitTicket, submitContact } from "./controller.js";

const router = express.Router();

router.post(
  "/ticket",
  setLanguage,
  validate(
    Joi.object({
      reason: Joi.string().trim().min(2).max(255).required(),
      message: Joi.string().trim().min(5).required(),
      name: Joi.string().trim().min(2).max(255).required(),
      email: Joi.string().email().required(),
    })
  ),
  submitTicket
);

router.post(
  "/contact",
  setLanguage,
  validate(
    Joi.object({
      message: Joi.string().trim().min(5).required(),
      name: Joi.string().trim().min(2).max(255).required(),
      email: Joi.string().email().required(),
    })
  ),
  submitContact
);

export default router;

