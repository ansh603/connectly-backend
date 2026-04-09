import express from "express";
import Joi from "joi";
import {
  deleteFile,
  getCities,
  getInterests,
  getSiteContentAll,
  getSiteContentByKey,
} from "./controller.js";
import { validate } from "../../common/middleware/validation.middleware.js";

const router = express.Router();

router.delete("/deleteFile/:file_path", deleteFile)
router.get("/cities", getCities)
router.get("/interests", getInterests)
router.get("/site-content", getSiteContentAll)
router.get("/site-content/:key", getSiteContentByKey)

export default router;