import {
  createBookingService,
  listBookingsService,
  acceptBookingService,
  declineBookingService,
  cancelBookingService,
  completeBookingService,
  getAvailableSlotsService,
  generateOtpService,
  verifyOtpService,
} from "./service.js";

export const createBooking = async (req, res) => {
  try {
    const result = await createBookingService(req.user.id, req.body);
    return res.status(result.status).json(result.body);
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const listBookings = async (req, res) => {
  try {
    const result = await listBookingsService(req.user.id, { tab: req.query.tab });
    return res.status(result.status).json(result.body);
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const acceptBooking = async (req, res) => {
  try {
    const result = await acceptBookingService(req.user.id, req.params.id);
    return res.status(result.status).json(result.body);
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const declineBooking = async (req, res) => {
  try {
    const result = await declineBookingService(req.user.id, req.params.id);
    return res.status(result.status).json(result.body);
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const cancelBooking = async (req, res) => {
  try {
    const result = await cancelBookingService(req.user.id, req.params.id);
    return res.status(result.status).json(result.body);
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const completeBooking = async (req, res) => {
  try {
    const result = await completeBookingService(req.user.id, req.params.id);
    return res.status(result.status).json(result.body);
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getAvailableSlots = async (req, res) => {
  try {
    const { provider_id: providerId, date } = req.query;
    const result = await getAvailableSlotsService(providerId, date);
    return res.status(result.status).json(result.body);
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const generateOtp = async (req, res) => {
  try {
    const result = await generateOtpService(req.user.id, req.params.id);
    return res.status(result.status).json(result.body);
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const verifyOtp = async (req, res) => {
  try {
    const result = await verifyOtpService(req.user.id, req.params.id, req.body.otp);
    return res.status(result.status).json(result.body);
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
