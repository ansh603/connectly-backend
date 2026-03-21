import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { randomUUID } from "crypto";
import config from "../../common/config/env.config.js";
import models from "../../models/index.js";
import { messages } from "../../common/constant/message.constant.js";

/**
 * Generate a JWT for admin login.
 * Payload must include `user_type: "admin"` for `authenticateToken`.
 */
export const generateAdminToken = (admin) => {
  return jwt.sign(
    { id: admin.id, user_type: "admin" },
    config.JWT_SECRET,
    { expiresIn: "7d" }
  );
};

/**
 * @returns {{ status: number, body: object }}
 */
export async function adminLoginService(emailRaw, password) {
  const email = String(emailRaw || "").trim();

  const admin = await models.Admin.findOne({
    where: models.sequelize.where(
      models.sequelize.fn("LOWER", models.sequelize.col("email_address")),
      email.toLowerCase()
    ),
  });

  if (!admin || !admin.password) {
    return {
      status: 401,
      body: { success: false, message: messages.INVALID_EMAIL_PASSWORD },
    };
  }

  const ok = await bcrypt.compare(password, admin.password);
  if (!ok) {
    return {
      status: 401,
      body: { success: false, message: messages.INVALID_EMAIL_PASSWORD },
    };
  }

  const jwtToken = generateAdminToken(admin);

  return {
    status: 200,
    body: {
      success: true,
      message: messages.LOGIN_SUCCESS,
      data: {
        id: admin.id,
        name: admin.name || "",
        email: admin.email_address,
        jwt_token: jwtToken,
      },
    },
  };
}

/**
 * @returns {{ status: number, body: object }}
 */
export async function changeAdminPasswordService(admin, current_password, new_password) {
  if (!admin) {
    return { status: 401, body: { success: false, message: messages.UNAUTHORIZED } };
  }

  const ok = await bcrypt.compare(current_password, admin.password);
  if (!ok) {
    return { status: 400, body: { success: false, message: messages.INVALID_PASSWORD } };
  }

  const hash = await bcrypt.hash(new_password, 10);
  await admin.update({ password: hash });

  return { status: 200, body: { success: true, message: messages.PASSWORD_CHANGED } };
}

/**
 * @returns {{ status: number, body: object }}
 */
export async function addCityService(nameRaw) {
  const name = String(nameRaw || "").trim();
  const existing = await models.City.findOne({ where: { name } });
  if (existing) {
    return { status: 409, body: { success: false, message: "City already exists" } };
  }

  const city = await models.City.create({
    id: randomUUID(),
    name,
  });

  return {
    status: 201,
    body: { success: true, message: messages.ADDED_SUCCESS, data: city },
  };
}

/**
 * @returns {{ status: number, body: object }}
 */
export async function addInterestService(nameRaw) {
  const name = String(nameRaw || "").trim();
  const existing = await models.Interest.findOne({ where: { name } });
  if (existing) {
    return { status: 409, body: { success: false, message: "Interest already exists" } };
  }

  const interest = await models.Interest.create({
    id: randomUUID(),
    name,
  });

  return {
    status: 201,
    body: { success: true, message: messages.ADDED_SUCCESS, data: interest },
  };
}

/**
 * @returns {{ status: number, body: object }}
 */
export async function getSiteContentsService() {
  const rows = await models.SiteContent.findAll({
    attributes: ["key", "title", "html_content"],
    order: [["key", "ASC"]],
  });
  return {
    status: 200,
    body: {
      success: true,
      data: rows.map((r) => ({
        key: r.key,
        title: r.title,
        html: r.html_content,
      })),
    },
  };
}

/**
 * Upsert site content by key.
 * @returns {{ status: number, body: object }}
 */
export async function upsertSiteContentService(key, title, htmlContent) {
  const k = String(key || "").trim();
  if (!k) {
    return { status: 400, body: { success: false, message: messages.INVALID_INPUT } };
  }
  const html = String(htmlContent ?? "");
  if (!html.trim()) {
    return { status: 400, body: { success: false, message: messages.INVALID_INPUT } };
  }

  const [row] = await models.SiteContent.findOrCreate({
    where: { key: k },
    defaults: {
      id: randomUUID(),
      key: k,
      title: title ? String(title) : null,
      html_content: html,
    },
  });

  if (row) {
    await row.update({
      title: title ? String(title) : row.title,
      html_content: html,
    });
  }

  return { status: 200, body: { success: true, message: messages.DATA_UPDATED_SUCCESS } };
}

/**
 * @returns {{ status: number, body: object }}
 */
export async function getSupportMessagesService({ type, limit, offset }) {
  const pageLimit = Number(limit) > 0 ? Number(limit) : 50;
  const pageOffset = Number(offset) > 0 ? Number(offset) : 0;

  const where = {};
  if (type === "ticket" || type === "support") where.type = type;

  const rows = await models.SupportMessage.findAll({
    where,
    order: [["created_at", "DESC"]],
    limit: pageLimit,
    offset: pageOffset,
    attributes: ["id", "type", "reason", "message", "name", "email", "created_at"],
  });

  return {
    status: 200,
    body: {
      success: true,
      data: rows.map((r) => ({
        id: r.id,
        type: r.type,
        reason: r.reason,
        message: r.message,
        name: r.name,
        email: r.email,
        created_at: r.created_at,
      })),
    },
  };
}

/**
 * Upload an icon for an existing interest and update `interests.icon_path`.
 * Expects multer to provide `req.file` upstream; controller passes it in.
 */
export async function upsertInterestIconService(interestId, file) {
  const id = String(interestId || "").trim();
  if (!id) {
    return { status: 400, body: { success: false, message: messages.INVALID_INPUT } };
  }

  if (!file || !file.filename) {
    return { status: 400, body: { success: false, message: "No file uploaded" } };
  }

  const interest = await models.Interest.findByPk(id);
  if (!interest) {
    return { status: 404, body: { success: false, message: "Interest not found" } };
  }

  // Multer destination writes into `assets/${folder}`; for this endpoint we always use `interest`.
  const iconPath = `assets/interest/${file.filename}`;
  await interest.update({ icon_path: iconPath });

  return {
    status: 200,
    body: { success: true, message: messages.DATA_UPDATED_SUCCESS, data: interest },
  };
}
