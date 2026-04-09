import bcrypt from "bcrypt";
import { randomUUID } from "crypto";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import fs from "fs/promises";
import path from "path";
import { Op } from "sequelize";
import { fileURLToPath } from "url";
import config from "../../common/config/env.config.js";
import models from "../../models/index.js";
import { messages } from "../../common/constant/message.constant.js";

/**
 * @method Function
 * @description Use to generate bearer jwt token
 */
export const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, user_type: user.user_type || "user" },
    config.JWT_SECRET,
    { expiresIn: "7d" }
  );
};

/**
 * Save / refresh push notification device row after successful auth.
 */
export const upsertDeviceTokenForUser = async (
  userId,
  { fcm_token, device_id, device_token, device_type }
) => {
  const resolvedDeviceId = device_id || device_token || null;
  const hasFcm = Boolean(fcm_token && String(fcm_token).trim());
  const hasDeviceKey = Boolean(resolvedDeviceId && String(resolvedDeviceId).trim());

  if (!hasFcm && !hasDeviceKey && !device_type) {
    return;
  }

  let where = null;
  if (hasDeviceKey) {
    where = { user_id: userId, device_id: resolvedDeviceId };
  } else if (hasFcm) {
    where = { user_id: userId, fcm_token };
  }

  if (!where) {
    return;
  }

  const defaults = {
    user_id: userId,
    device_id: resolvedDeviceId,
    fcm_token: hasFcm ? fcm_token : null,
    device: device_type || null,
  };

  const [record, created] = await models.DeviceToken.findOrCreate({
    where,
    defaults,
  });

  if (!created) {
    await record.update({
      fcm_token: hasFcm ? fcm_token : record.fcm_token,
      device_id: resolvedDeviceId ?? record.device_id,
      device:
        device_type != null && device_type !== ""
          ? device_type
          : record.device,
    });
  }
};

/* ── Profile helpers ── */

export const parseGalleryPaths = (raw) => {
  if (raw == null || raw === "") return [];
  if (Array.isArray(raw)) return raw.filter(Boolean);
  try {
    const p = JSON.parse(raw);
    return Array.isArray(p) ? p.filter(Boolean) : [];
  } catch {
    return [];
  }
};

function buildAvailabilityJsonFromSlots(slots) {
  if (!Array.isArray(slots) || slots.length === 0) return null;

  const days = {};
  for (const s of slots) {
    if (!s || !s.day) continue;
    const slotVal = s.slot ?? undefined;
    days[s.day] = {
      on: Boolean(s.on),
      ...(slotVal !== undefined ? { slot: slotVal } : {}),
    };
  }

  return JSON.stringify({ days });
}

/**
 * @param {string|null|undefined} raw
 * @returns {Record<string, { on: boolean, slot?: string }> | null}
 */
function parseAvailabilityDays(raw) {
  if (raw == null || raw === "") return null;
  const s = String(raw).trim();
  if (!s.startsWith("{")) return null;
  try {
    const j = JSON.parse(s);
    if (j && j.days && typeof j.days === "object") return j.days;
  } catch {
    // ignore
  }
  return null;
}

async function syncAvailabilitySlotsForUser(userId, availabilityRaw) {
  // undefined => no change
  if (availabilityRaw === undefined) return;

  // null/empty => clear slots
  if (availabilityRaw == null || availabilityRaw === "") {
    await models.UserAvailabilitySlot.destroy({ where: { user_id: userId } });
    return;
  }

  const days = parseAvailabilityDays(availabilityRaw);
  if (!days) return;

  await models.UserAvailabilitySlot.destroy({ where: { user_id: userId } });

  const entries = Object.entries(days).map(([day, v]) => ({
    id: randomUUID(),
    user_id: userId,
    day,
    on: Boolean(v?.on),
    slot: v?.slot ?? null,
  }));

  if (entries.length === 0) return;
  await models.UserAvailabilitySlot.bulkCreate(entries);
}

export const authProfileExtras = (user, availabilityOverride = null) => ({
  rate: user.rate != null ? Number(user.rate) : null,
  availability:
    availabilityOverride ??
    buildAvailabilityJsonFromSlots(user?.availability_slots) ??
    null,
  is_verified: user.is_verified === true,
});

export async function loadUserForProfile(userId) {
  return models.User.findByPk(userId, {
    include: [
      { model: models.City, as: "city", attributes: ["id", "name"], required: false },
      {
        model: models.Interest,
        as: "interest_list",
        attributes: ["id", "name"],
        through: { attributes: [] },
        required: false,
      },
      {
        model: models.UserAvailabilitySlot,
        as: "availability_slots",
        attributes: ["day", "on", "slot"],
        required: false,
      },
    ],
  });
}

function getUserDisplayName(user) {
  if (!user) return "";
  return user.name || "";
}

export function serializeProfile(user) {
  if (!user) return null;
  return {
    id: user.id,
    name: getUserDisplayName(user),
    email: user.email_address,
    phone_number: user.phone_number,
    country_code: user.country_code,
    city_id: user.city_id,
    city: user.city || null,
    bio: user.bio,
    rate: user.rate != null ? Number(user.rate) : null,
    location: user.location,
    age: user.age,
    interests: user.interest_list || [],
    availability: buildAvailabilityJsonFromSlots(user.availability_slots),
    is_verified: user.is_verified === true,
  };
}

/* ── Email verification OTP ── */

function normalizeEmail(emailRaw) {
  return String(emailRaw || "")
    .trim()
    .toLowerCase();
}

function createOtpCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function registrationOtpExpiresAt() {
  const hours = config.REGISTRATION_OTP_EXPIRY_HOURS || 1;
  return new Date(Date.now() + hours * 60 * 60 * 1000);
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const otpTemplatePath = path.resolve(__dirname, "../../templete/otp-verification.html");
const welcomeTemplatePath = path.resolve(__dirname, "../../templete/welcome.html");

async function buildVerificationEmailHtmlFromFile({ otpCode, expiryHours, recipientName, brand }) {
  const template = await fs.readFile(otpTemplatePath, "utf8");
  const recipientSuffix = recipientName ? `, ${recipientName}` : "";
  const year = String(new Date().getFullYear());
  return template
    .replaceAll("{{BRAND_NAME}}", String(brand))
    .replaceAll("{{RECIPIENT_SUFFIX}}", recipientSuffix)
    .replaceAll("{{EXPIRY_HOURS}}", String(expiryHours))
    .replaceAll("{{OTP_CODE}}", String(otpCode))
    .replaceAll("{{YEAR}}", year);
}

async function buildWelcomeEmailHtmlFromFile({ recipientName, brand }) {
  const template = await fs.readFile(welcomeTemplatePath, "utf8");
  const recipientSuffix = recipientName ? `, ${recipientName}` : "";
  const year = String(new Date().getFullYear());
  return template
    .replaceAll("{{BRAND_NAME}}", String(brand))
    .replaceAll("{{RECIPIENT_SUFFIX}}", recipientSuffix)
    .replaceAll("{{YEAR}}", year);
}

/**
 * @param {string} toEmail
 * @param {string} otpCode
 * @param {string} [recipientName]
 */
async function sendVerificationOtpEmail(toEmail, otpCode, recipientName = "") {
  if (!config.EMAIL || !String(config.MAIL_PASSWORD || "").trim()) {
    throw new Error("Email credentials are not configured");
  }

  const pass = String(config.MAIL_PASSWORD).replace(/\s+/g, "");
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: config.EMAIL, pass },
  });

  const expiryHours = config.REGISTRATION_OTP_EXPIRY_HOURS || 1;
  const fromName = config.SMTP_FROM_NAME || "Dost Now";
  const html = await buildVerificationEmailHtmlFromFile({
    otpCode,
    expiryHours,
    recipientName: recipientName || "",
    brand: fromName,
  });

  await transporter.sendMail({
    from: `"${fromName}" <${config.EMAIL}>`,
    to: toEmail,
    subject: `${fromName} — Verify your email`,
    html,
    text: `Your verification code is ${otpCode}. It expires in ${expiryHours} hour(s).`,
  });
}

async function sendWelcomeEmail(toEmail, recipientName = "") {
  if (!config.EMAIL || !String(config.MAIL_PASSWORD || "").trim()) {
    throw new Error("Email credentials are not configured");
  }

  const pass = String(config.MAIL_PASSWORD).replace(/\s+/g, "");
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: config.EMAIL, pass },
  });

  const fromName = config.SMTP_FROM_NAME || "Dost Now";
  const html = await buildWelcomeEmailHtmlFromFile({ recipientName, brand: fromName });

  await transporter.sendMail({
    from: `"${fromName}" <${config.EMAIL}>`,
    to: toEmail,
    subject: `${fromName} — Welcome!`,
    html,
    text: `Welcome to ${fromName}! Your email is verified.`,
  });
}

async function upsertRegistrationOtp(emailKey, otpCode, expiresAt) {
  const [row, created] = await models.RegistrationOtp.findOrCreate({
    where: { email: emailKey },
    defaults: {
      id: randomUUID(),
      email: emailKey,
      otp_code: otpCode,
      expires_at: expiresAt,
      verified_at: null,
    },
  });

  if (!created) {
    await row.update({
      otp_code: otpCode,
      expires_at: expiresAt,
      verified_at: null,
    });
  }
  return row;
}

/**
 * Resend verification code — user must exist, password must match, email not yet verified.
 * @returns {{ status: number, body: object }}
 */
export async function resendVerificationOtpService(emailRaw, password) {
  const emailKey = normalizeEmail(emailRaw);
  if (!emailKey || !password) {
    return { status: 400, body: { success: false, message: messages.INVALID_INPUT } };
  }

  const user = await models.User.findOne({
    where: { email_address: emailKey },
  });
  if (!user || !user.password) {
    return {
      status: 401,
      body: { success: false, message: messages.INVALID_EMAIL_PASSWORD },
    };
  }

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) {
    return {
      status: 401,
      body: { success: false, message: messages.INVALID_EMAIL_PASSWORD },
    };
  }

  if (user.is_verified === true) {
    return {
      status: 400,
      body: { success: false, message: messages.EMAIL_ALREADY_VERIFIED },
    };
  }

  const otpCode = createOtpCode();
  const expiresAt = registrationOtpExpiresAt();
  await upsertRegistrationOtp(emailKey, otpCode, expiresAt);

  await sendVerificationOtpEmail(emailKey, otpCode, user.name || "");

  return {
    status: 200,
    body: { success: true, message: messages.OTP_SENT },
  };
}

/**
 * Creates user with full profile data, is_verified=false, sends 6-digit OTP (1h expiry by default).
 * No JWT until POST /user/verify-email succeeds.
 * @returns {{ status: number, body: object }}
 */
export async function registerUserService(body) {
  const {
    name,
    country_code,
    phone_number,
    email,
    password,
    bio,
    rate,
    location,
    city_id,
    age,
    interest_ids,
    availability,
    fcm_token,
    device_id,
    device_token,
    device_type,
  } = body;
  const { profileImageFile } = arguments.length > 1 ? arguments[1] || {} : {};

  const emailKey = normalizeEmail(email);

  const existingByEmail = await models.User.findOne({
    where: { email_address: emailKey },
  });
  if (existingByEmail) {
    return { status: 409, body: { success: false, message: messages.EMAIL_EXISTS } };
  }

  if (country_code && phone_number) {
    const existingByPhone = await models.User.findOne({
      where: { country_code, phone_number },
    });
    if (existingByPhone) {
      return { status: 409, body: { success: false, message: messages.PHONE_NUMBER_EXISTS } };
    }
  }

  if (city_id) {
    const city = await models.City.findByPk(city_id);
    if (!city) {
      return { status: 400, body: { success: false, message: "Invalid city" } };
    }
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const displayName = (name || "").trim() || null;

  // Parse multipart fields (they may arrive as strings)
  const parseInterestIds = (raw) => {
    if (raw == null || raw === "") return [];
    if (Array.isArray(raw)) return raw.filter(Boolean);
    if (typeof raw === "string") {
      try {
        const j = JSON.parse(raw);
        return Array.isArray(j) ? j.filter(Boolean) : [];
      } catch {
        return raw.split(",").map((s) => s.trim()).filter(Boolean);
      }
    }
    return [];
  };

  const interestIds = parseInterestIds(interest_ids);
  const rateNum = rate == null || rate === "" ? null : Number(rate);
  const ageNum = age == null || age === "" ? null : Number(age);

  if (Array.isArray(interestIds) && interestIds.length > 0) {
    const count = await models.Interest.count({
      where: { id: interestIds },
    });
    if (count !== interestIds.length) {
      return { status: 400, body: { success: false, message: "Invalid interests" } };
    }
  }

  let profile_path = null;
  if (profileImageFile?.buffer) {
    try {
      const { uploadImageBufferToCloudinary } = await import("../../utils/cloudinary.js");
      const uploaded = await uploadImageBufferToCloudinary(profileImageFile, {
        folder: process.env.CLOUDINARY_FOLDER || "connectly/profile",
      });
      profile_path = uploaded.secure_url;
    } catch (e) {
      console.error("[register] cloudinary upload failed:", e?.message || e);
      return { status: 500, body: { success: false, message: messages.SERVER_ERROR } };
    }
  }

  const user = await models.User.create({
    id: randomUUID(),
    name: displayName,
    profile_path,
    country_code,
    phone_number,
    email_address: emailKey,
    password: hashedPassword,
    user_type: "individual",
    bio,
    rate: rateNum,
    city_id: city_id || null,
    location,
    age: ageNum,
    gallery_paths: JSON.stringify([]),
    is_verified: false,
  });

  if (Array.isArray(interestIds) && interestIds.length > 0) {
    const rows = interestIds.map((interestId) => ({
      id: randomUUID(),
      user_id: user.id,
      interest_id: interestId,
    }));
    await models.UserInterest.bulkCreate(rows);
  }

  // Availability slots (separate table)
  await syncAvailabilitySlotsForUser(user.id, availability);

  const otpCode = createOtpCode();
  const expiresAt = registrationOtpExpiresAt();
  await upsertRegistrationOtp(emailKey, otpCode, expiresAt);

  try {
    await sendVerificationOtpEmail(emailKey, otpCode, user.name || "");
  } catch (err) {
    console.error("[register] SMTP send failed:", err?.message || err);
    return {
      status: 500,
      body: { success: false, message: messages.SERVER_ERROR },
    };
  }

  const userInterests = await user.getInterest_list({
    attributes: ["id", "name"],
    joinTableAttributes: [],
  });
  const city = user.city_id
    ? await models.City.findByPk(user.city_id, { attributes: ["id", "name"] })
    : null;

  // Optional: store device for push after verify — skip until verified
  void fcm_token;
  void device_id;
  void device_token;
  void device_type;

  const baseData = {
    id: user.id,
    name: getUserDisplayName(user),
    email: user.email_address,
    profile_path: user.profile_path,
    phone_number: user.phone_number,
    country_code: user.country_code,
    type: user.user_type,
    city_id: user.city_id,
    city,
    interests: userInterests,
    is_verified: false,
    ...authProfileExtras(user, availability),
  };

  return {
    status: 201,
    body: {
      success: true,
      message: messages.REGISTER_PENDING_VERIFICATION,
      data: {
        ...baseData,
        jwt_token: null,
      },
    },
  };
}

function buildAuthUserInclude() {
  return [
    { model: models.City, as: "city", attributes: ["id", "name"], required: false },
    {
      model: models.Interest,
      as: "interest_list",
      attributes: ["id", "name"],
      through: { attributes: [] },
      required: false,
    },
    {
      model: models.UserAvailabilitySlot,
      as: "availability_slots",
      attributes: ["day", "on", "slot"],
      required: false,
    },
  ];
}

/**
 * Verify email with OTP → sets is_verified, returns JWT (same shape as login).
 * @returns {{ status: number, body: object }}
 */
export async function verifyEmailService(body) {
  const {
    email,
    otp_code,
    fcm_token,
    device_id,
    device_token,
    device_type,
  } = body;

  const emailKey = normalizeEmail(email);
  const code = String(otp_code || "").trim();

  if (!emailKey || !/^\d{6}$/.test(code)) {
    return { status: 400, body: { success: false, message: messages.INVALID_INPUT } };
  }

  const user = await models.User.findOne({
    where: { email_address: emailKey },
    include: buildAuthUserInclude(),
  });

  if (!user) {
    return { status: 404, body: { success: false, message: messages.USER_NOT_FOUND } };
  }

  if (user.is_verified === true) {
    const jwtToken = generateToken(user);
    await upsertDeviceTokenForUser(user.id, {
      fcm_token,
      device_id,
      device_token,
      device_type,
    });
    return {
      status: 200,
      body: {
        success: true,
        message: messages.LOGIN_SUCCESS,
        data: {
          id: user.id,
          name: getUserDisplayName(user),
          email: user.email_address,
          profile_path: user.profile_path,
          phone_number: user.phone_number,
          country_code: user.country_code,
          type: user.user_type,
          city_id: user.city_id || null,
          city: user.city || null,
          interests: user.interest_list || [],
          jwt_token: jwtToken,
          ...authProfileExtras(user),
        },
      },
    };
  }

  const otpRow = await models.RegistrationOtp.findOne({
    where: { email: emailKey, otp_code: code },
  });

  if (
    !otpRow ||
    otpRow.verified_at ||
    new Date(otpRow.expires_at).getTime() < Date.now()
  ) {
    return { status: 400, body: { success: false, message: messages.INVALID_OTP } };
  }

  await user.update({ is_verified: true });
  await otpRow.update({ verified_at: new Date() });

  // Fire-and-forget welcome email: don't fail verification if SMTP breaks.
  try {
    await sendWelcomeEmail(user.email_address, user.name || "");
  } catch (err) {
    console.error("[verify-email] Welcome email send failed:", err?.message || err);
  }

  const fresh = await models.User.findByPk(user.id, {
    include: buildAuthUserInclude(),
  });

  const jwtToken = generateToken(fresh);

  await upsertDeviceTokenForUser(fresh.id, {
    fcm_token,
    device_id,
    device_token,
    device_type,
  });

  return {
    status: 200,
    body: {
      success: true,
      message: messages.OTP_VERIFIED,
      data: {
        id: fresh.id,
        name: fresh.name || "",
        email: fresh.email_address,
        profile_path: fresh.profile_path,
        phone_number: fresh.phone_number,
        country_code: fresh.country_code,
        type: fresh.user_type,
        city_id: fresh.city_id || null,
        city: fresh.city || null,
        interests: fresh.interest_list || [],
        jwt_token: jwtToken,
        ...authProfileExtras(fresh),
      },
    },
  };
}

/**
 * @returns {{ status: number, body: object }}
 */
export async function loginUserService(body) {
  const { email, password, fcm_token, device_id, device_token, device_type } = body;
  const emailKey = normalizeEmail(email);
  if (!emailKey) {
    return {
      status: 400,
      body: { success: false, message: messages.INVALID_INPUT },
    };
  }

  const user = await models.User.findOne({
    where: { email_address: emailKey },
    include: [
      { model: models.City, as: "city", attributes: ["id", "name"], required: false },
      {
        model: models.Interest,
        as: "interest_list",
        attributes: ["id", "name"],
        through: { attributes: [] },
        required: false,
      },
      {
        model: models.UserAvailabilitySlot,
        as: "availability_slots",
        attributes: ["day", "on", "slot"],
        required: false,
      },
    ],
  });
  if (!user || !user.password) {
    return {
      status: 401,
      body: { success: false, message: messages.INVALID_EMAIL_PASSWORD },
    };
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    return {
      status: 401,
      body: { success: false, message: messages.INVALID_EMAIL_PASSWORD },
    };
  }

  if (user.is_verified !== true) {
    // Login should trigger an OTP email for unverified users.
    // (Frontend will switch to "verify email" screen based on 403.)
    const otpCode = createOtpCode();
    const expiresAt = registrationOtpExpiresAt();
    await upsertRegistrationOtp(emailKey, otpCode, expiresAt);

    try {
      await sendVerificationOtpEmail(
        user.email_address,
        otpCode,
        user.name || ""
      );
    } catch (err) {
      console.error("[login] SMTP send failed:", err?.message || err);
      return { status: 500, body: { success: false, message: messages.SERVER_ERROR } };
    }

    return {
      status: 403,
      body: {
        success: false,
        needs_email_verification: true,
        message: messages.OTP_SENT,
        data: {
          email: user.email_address,
        },
      },
    };
  }

  await upsertDeviceTokenForUser(user.id, {
    fcm_token,
    device_id,
    device_token,
    device_type,
  });

  const jwtToken = generateToken(user);

  return {
    status: 200,
    body: {
      success: true,
      message: messages.LOGIN_SUCCESS,
      data: {
        id: user.id,
        name: getUserDisplayName(user),
        email: user.email_address,
        profile_path: user.profile_path,
        phone_number: user.phone_number,
        country_code: user.country_code,
        type: user.user_type,
        city_id: user.city_id || null,
        city: user.city || null,
        interests: user.interest_list || [],
        jwt_token: jwtToken,
        ...authProfileExtras(user),
      },
    },
  };
}

/**
 * @returns {{ status: number, body: object }}
 */
export async function getProfileService(userId) {
  const user = await loadUserForProfile(userId);
  if (!user) {
    return { status: 404, body: { success: false, message: messages.USER_NOT_FOUND } };
  }
  return {
    status: 200,
    body: {
      success: true,
      message: messages.DATA_FETCHED_SUCCESS,
      data: serializeProfile(user),
    },
  };
}

const profilePatchKeys = [
  "name",
  "email",
  "country_code",
  "phone_number",
  "bio",
  "rate",
  "location",
  "city_id",
  "age",
  "profile_path",
  "interest_ids",
  "availability",
  "gallery_paths",
];

/**
 * @returns {{ status: number, body: object }}
 */
export async function updateProfileService(userId, body) {
  const user = await models.User.findByPk(userId);
  if (!user) {
    return { status: 404, body: { success: false, message: messages.USER_NOT_FOUND } };
  }

  const hasPatchField = profilePatchKeys.some((k) => body[k] !== undefined);
  if (!hasPatchField) {
    return { status: 400, body: { success: false, message: messages.INVALID_INPUT } };
  }

  const {
    name,
    email,
    country_code,
    phone_number,
    bio,
    rate,
    location,
    city_id,
    age,
    profile_path,
    interest_ids,
    availability,
    gallery_paths,
  } = body;

  if (email !== undefined) {
    const nextEmail = String(email).trim();
    const cur = String(user.email_address || "").toLowerCase();
    if (nextEmail.toLowerCase() !== cur) {
      const taken = await models.User.findOne({
        where: { email_address: nextEmail },
      });
      if (taken && taken.id !== user.id) {
        return { status: 409, body: { success: false, message: messages.EMAIL_EXISTS } };
      }
      user.email_address = nextEmail;
    }
  }

  if (country_code !== undefined) {
    user.country_code = country_code === "" ? null : country_code;
  }
  if (phone_number !== undefined) {
    user.phone_number =
      phone_number === "" ? null : String(phone_number).replace(/\s/g, "");
  }

  const nextCC = user.country_code;
  const nextPN = user.phone_number;
  if (nextCC && nextPN) {
    const phoneTaken = await models.User.findOne({
      where: { country_code: nextCC, phone_number: nextPN },
    });
    if (phoneTaken && phoneTaken.id !== user.id) {
      return { status: 409, body: { success: false, message: messages.PHONE_NUMBER_EXISTS } };
    }
  }

  if (name !== undefined) user.name = String(name || "").trim() || user.name;
  if (bio !== undefined) user.bio = bio;
  if (rate !== undefined) user.rate = rate;
  if (location !== undefined) user.location = location;
  if (city_id !== undefined) {
    if (city_id === "" || city_id === null) {
      user.city_id = null;
    } else {
      const c = await models.City.findByPk(city_id);
      if (!c) {
        return { status: 400, body: { success: false, message: "Invalid city" } };
      }
      user.city_id = city_id;
    }
  }
  if (age !== undefined) user.age = age;
  if (profile_path !== undefined) user.profile_path = profile_path || null;

  if (gallery_paths !== undefined) {
    let arr = gallery_paths;
    if (typeof gallery_paths === "string") {
      try {
        arr = JSON.parse(gallery_paths);
      } catch {
        arr = [];
      }
    }
    if (!Array.isArray(arr)) arr = [];
    user.gallery_paths = JSON.stringify(arr.filter(Boolean));
  }

  await user.save();

  // availability stored in slots table (not in `users`)
  if (availability !== undefined) {
    await syncAvailabilitySlotsForUser(user.id, availability);
  }

  if (Array.isArray(interest_ids)) {
    if (interest_ids.length > 0) {
      const count = await models.Interest.count({
        where: { id: interest_ids },
      });
      if (count !== interest_ids.length) {
        return { status: 400, body: { success: false, message: "Invalid interests" } };
      }
    }
    await models.UserInterest.destroy({ where: { user_id: user.id } });
    if (interest_ids.length > 0) {
      const rows = interest_ids.map((interestId) => ({
        id: randomUUID(),
        user_id: user.id,
        interest_id: interestId,
      }));
      await models.UserInterest.bulkCreate(rows);
    }
  }

  const fresh = await loadUserForProfile(user.id);
  return {
    status: 200,
    body: {
      success: true,
      message: messages.DATA_UPDATED_SUCCESS,
      data: serializeProfile(fresh),
    },
  };
}

/**
 * @returns {{ status: number, body: object }}
 */
export async function logoutUserService(userId, body) {
  const { device_id, device_token } = body;

  const resolvedDeviceKey =
    (device_id && String(device_id).trim()) ||
    (device_token && String(device_token).trim()) ||
    null;

  if (resolvedDeviceKey) {
    const device = await models.DeviceToken.findOne({
      where: { user_id: userId, device_id: resolvedDeviceKey },
    });
    if (device) await device.destroy();
  }

  return {
    status: 200,
    body: { success: true, message: messages.LOGOUT_SUCCESS },
  };
}

/* ──────────────────────────────────────────────────────────────
 * Explore (public)
 * Returns verified profiles for `ExplorePage` with basic filtering.
 * ────────────────────────────────────────────────────────────── */

function normalizeInterestNames(interestsParam) {
  if (!interestsParam) return [];
  if (Array.isArray(interestsParam)) {
    return interestsParam.map((s) => String(s).trim()).filter(Boolean);
  }
  if (typeof interestsParam === "string") {
    const s = interestsParam.trim();
    if (!s) return [];
    // Accept either "a,b,c" or '["a","b"]'
    if (s.startsWith("[") && s.endsWith("]")) {
      try {
        const parsed = JSON.parse(s);
        if (Array.isArray(parsed)) return parsed.map((x) => String(x).trim()).filter(Boolean);
      } catch {
        // ignore
      }
    }
    return s
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean);
  }
  return [];
}

function buildAvailabilityJsonFromSlotsPublic(slots) {
  if (!Array.isArray(slots) || slots.length === 0) return null;
  const days = {};
  for (const s of slots) {
    if (!s || !s.day) continue;
    const slotVal = s.slot ?? undefined;
    days[s.day] = {
      on: Boolean(s.on),
      ...(slotVal !== undefined ? { slot: slotVal } : {}),
    };
  }
  return JSON.stringify({ days });
}

/**
 * @returns {{ status: number, body: object }}
 */
export async function exploreProfilesService(query = {}) {
  const {
    search,
    type,
    interests,
    maxPrice,
    sortBy,
    ageMin,
    ageMax,
    city,
    location,
    page,
    pageSize,
  } = query;

  const searchStr = typeof search === "string" ? search.trim() : "";
  const interestNames = normalizeInterestNames(interests);
  const maxPriceNum = maxPrice === "" || maxPrice == null ? null : Number(maxPrice);
  const ageMinNum = ageMin === "" || ageMin == null ? null : Number(ageMin);
  const ageMaxNum = ageMax === "" || ageMax == null ? null : Number(ageMax);
  const pageNum = page == null || page === "" ? null : Number(page);
  const pageSizeNum = pageSize == null || pageSize === "" ? null : Number(pageSize);

  if (!Number.isFinite(pageNum) || !Number.isFinite(pageSizeNum) || pageNum < 1 || pageSizeNum < 1) {
    return {
      status: 400,
      body: { success: false, message: "Pagination params `page` and `pageSize` are required." },
    };
  }

  const where = {
    is_verified: true,
  };

  if (type && type !== "all") {
    where.user_type = type;
  }

  if (searchStr) {
    where.name = { [Op.like]: `%${searchStr}%` };
  }

  // Preserve "unknown age/price" behavior from UI:
  // if user.age/rate is null, don't filter them out.
  if (maxPriceNum != null && Number.isFinite(maxPriceNum)) {
    where[Op.and] = where[Op.and] || [];
    where[Op.and].push({
      [Op.or]: [{ rate: null }, { rate: { [Op.lte]: maxPriceNum } }],
    });
  }

  if (ageMinNum != null && Number.isFinite(ageMinNum)) {
    where[Op.and] = where[Op.and] || [];
    where[Op.and].push({
      [Op.or]: [{ age: null }, { age: { [Op.gte]: ageMinNum } }],
    });
  }

  if (ageMaxNum != null && Number.isFinite(ageMaxNum)) {
    where[Op.and] = where[Op.and] || [];
    where[Op.and].push({
      [Op.or]: [{ age: null }, { age: { [Op.lte]: ageMaxNum } }],
    });
  }

  if (location && typeof location === "string" && location.trim()) {
    where[Op.and] = where[Op.and] || [];
    const loc = location.trim();
    where[Op.and].push({
      [Op.or]: [{ location: null }, { location: { [Op.like]: `%${loc}%` } }],
    });
  }

  const order =
    sortBy === "price_asc"
      ? [["rate", "ASC"]]
      : sortBy === "price_desc"
        ? [["rate", "DESC"]]
        : [["rate", "DESC"]];

  const include = [
    {
      model: models.City,
      as: "city",
      attributes: ["id", "name"],
      required: Boolean(city && String(city).trim()),
      ...(city && String(city).trim()
        ? { where: { name: String(city).trim() } }
        : {}),
    },
    {
      model: models.UserAvailabilitySlot,
      as: "availability_slots",
      attributes: ["day", "on", "slot"],
      required: false,
    },
    {
      model: models.Interest,
      as: "interest_list",
      attributes: ["id", "name"],
      through: { attributes: [] },
      required: interestNames.length > 0,
      ...(interestNames.length > 0 ? { where: { name: { [Op.in]: interestNames } } } : {}),
    },
  ];

  const offset = (pageNum - 1) * pageSizeNum;
  const users = await models.User.findAll({
    where,
    include,
    order,
    // Fetch one extra row to determine `hasMore` without an extra COUNT query.
    limit: pageSizeNum + 1,
    offset,
    distinct: true,
  });

  const hasMore = users.length > pageSizeNum;
  const pageUsers = hasMore ? users.slice(0, pageSizeNum) : users;

  // Map into the shape `ProfileCard` expects.
  const profiles = pageUsers.map((u) => {
    return {
      id: u.id,
      name: u.name || "",
      type: "individual",
      live: true, // ExplorePage = verified users
      photo: u.profile_path || null,
      price: u.rate != null ? Number(u.rate) : 0,
      bio: u.bio || "",
      rating: 4.8, // No rating columns in DB yet; keep UI stable.
      reviews: 24,
      totalBookings: 0,
      totalEarned: 0,
      age: u.age ?? null,
      location: u.location || u.city?.name || "",
      interests: (u.interest_list || []).map((i) => i?.name).filter(Boolean),
      availability: buildAvailabilityJsonFromSlotsPublic(u.availability_slots),
    };
  });

  return {
    status: 200,
    body: {
      success: true,
      data: profiles,
      page: pageNum,
      pageSize: pageSizeNum,
      hasMore,
    },
  };
}
