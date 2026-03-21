import express from "express";
import Joi from "joi";
import { validate } from "../../common/middleware/validation.middleware.js";
import { authenticateToken } from "../../common/middleware/jwt.middleware.js";
import {
  getWalletSummary,
  addWalletBalance,
  getWalletTransactions,
  holdEscrow,
  resolveEscrow,
  withdraw,
} from "./controller.js";
import { setLanguage } from "../../common/middleware/lanauge.middlware.js";

const router = express.Router();

router.use(authenticateToken);

router.get("/summary", setLanguage, getWalletSummary);

router.post(
  "/add-balance",
  setLanguage,
  validate(
    Joi.object({
      amount: Joi.alternatives().try(Joi.number(), Joi.string().allow("", null)).required(),
    }).unknown(true)
  ),
  addWalletBalance
);

router.get(
  "/transactions",
  setLanguage,
  validate(
    Joi.object({
      limit: Joi.number().integer().min(1).max(50).optional().allow("", null),
      offset: Joi.number().integer().min(0).optional().allow("", null),
    }).unknown(true)
  ),
  getWalletTransactions
);

router.post(
  "/escrow/hold",
  setLanguage,
  validate(
    Joi.object({
      amount: Joi.alternatives().try(Joi.number(), Joi.string().allow("", null)).required(),
      description: Joi.string().optional().allow("", null),
      reference_type: Joi.string().optional().allow("", null),
      reference_id: Joi.string().optional().allow("", null),
    }).unknown(true)
  ),
  holdEscrow
);

router.post(
  "/escrow/resolve",
  setLanguage,
  validate(
    Joi.object({
      escrow_amount: Joi.alternatives().try(Joi.number(), Joi.string().allow("", null)).required(),
      wallet_credit_amount: Joi.alternatives().try(Joi.number(), Joi.string().allow("", null)).required(),
      increment_total_earned: Joi.boolean().optional().allow("", null),
      description: Joi.string().optional().allow("", null),
      reference_type: Joi.string().optional().allow("", null),
      reference_id: Joi.string().optional().allow("", null),
    }).unknown(true)
  ),
  resolveEscrow
);

router.post(
  "/withdraw",
  setLanguage,
  validate(
    Joi.object({
      amount: Joi.alternatives().try(Joi.number(), Joi.string().allow("", null)).required(),
    })
  ),
  withdraw
);

export default router;

