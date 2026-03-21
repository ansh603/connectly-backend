import { messages } from "../../common/constant/message.constant.js";
import {
  resendVerificationOtpService,
  registerUserService,
  verifyEmailService,
  loginUserService,
  getProfileService,
  updateProfileService,
  logoutUserService,
  exploreProfilesService,
} from "./service.js";

export const resendVerificationOtp = async (req, res) => {
  try {
    const result = await resendVerificationOtpService(
      req.body.email,
      req.body.password
    );
    return res.status(result.status).json(result.body);
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const verifyEmail = async (req, res) => {
  try {
    const result = await verifyEmailService(req.body);
    return res.status(result.status).json(result.body);
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const register = async (req, res) => {
  try {
    const result = await registerUserService(req.body);
    return res.status(result.status).json(result.body);
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const result = await loginUserService(req.body);
    return res.status(result.status).json(result.body);
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getProfile = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(403).json({ success: false, message: messages.FORBIDDEN });
    }
    const result = await getProfileService(req.user.id);
    return res.status(result.status).json(result.body);
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateProfile = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(403).json({ success: false, message: messages.FORBIDDEN });
    }
    const result = await updateProfileService(req.user.id, req.body);
    return res.status(result.status).json(result.body);
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const logout = async (req, res) => {
  try {
    const result = await logoutUserService(req.user.id, req.body);
    return res.status(result.status).json(result.body);
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const exploreProfiles = async (req, res) => {
  try {
    const result = await exploreProfilesService(req.query);
    return res.status(result.status).json(result.body);
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
