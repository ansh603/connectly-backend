import { randomUUID } from "crypto";
import models from "../../models/index.js";
import { holdEscrowService, resolveEscrowService, transferEscrowToProviderService, getWalletSummaryService } from "../wallet/service.js";

const ALL_SLOTS = (() => {
  const slots = [];
  for (let h = 6; h < 24; h++) {
    for (const m of [0, 30]) {
      if (h === 23 && m === 30) break;
      const hh = String(h).padStart(2, "0");
      const mm = String(m).padStart(2, "0");
      slots.push(`${hh}:${mm}`);
    }
  }
  return slots;
})();

function toNumberOrNull(v) {
  if (v === "" || v == null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function formatTimeDisplay(val) {
  if (!val) return "";
  const [h, m] = String(val).split(":").map(Number);
  const period = h < 12 ? "AM" : "PM";
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${h12}:${String(m || 0).padStart(2, "0")} ${period}`;
}

export async function createBookingService(bookerId, body) {
  const providerId = body.provider_id;
  const date = body.booking_date;
  const timeStart = body.time_start;
  const timeEnd = body.time_end;
  const duration = toNumberOrNull(body.duration_hours);
  const amount = toNumberOrNull(body.amount);
  const location = body.location;
  const purpose = body.purpose;

  if (!providerId || !date || !timeStart || !timeEnd || amount == null || amount <= 0) {
    return { status: 400, body: { success: false, message: "Missing or invalid required fields" } };
  }

  if (providerId === bookerId) {
    return { status: 400, body: { success: false, message: "Cannot book yourself" } };
  }

  const provider = await models.User.findByPk(providerId);
  if (!provider) {
    return { status: 404, body: { success: false, message: "Provider not found" } };
  }

  const [startIdx, endIdx] = [ALL_SLOTS.indexOf(timeStart), ALL_SLOTS.indexOf(timeEnd)];
  if (startIdx < 0 || endIdx <= startIdx) {
    return { status: 400, body: { success: false, message: "Invalid time range" } };
  }

  const conflicting = await models.Booking.findOne({
    where: {
      provider_id: providerId,
      booking_date: date,
      status: ["pending", "confirmed"],
      [models.Sequelize.Op.or]: [
        {
          time_start: { [models.Sequelize.Op.lt]: timeEnd },
          time_end: { [models.Sequelize.Op.gt]: timeStart },
        },
      ],
    },
  });

  if (conflicting) {
    return { status: 409, body: { success: false, message: "This slot is already booked" } };
  }

  const id = randomUUID();
  const holdResult = await holdEscrowService(bookerId, {
    amount,
    description: `Booking hold - ${id}`,
    reference_type: "booking",
    reference_id: id,
  });

  if (holdResult.status !== 200) {
    return holdResult;
  }

  const booking = await models.Booking.create({
    id,
    booker_id: bookerId,
    provider_id: providerId,
    status: "pending",
    booking_date: date,
    time_start: timeStart,
    time_end: timeEnd,
    amount,
    duration_hours: duration || 0,
    location: location || null,
    purpose: purpose || null,
    escrow_reference_id: id,
  });

  await createNotification(providerId, `New booking request from ${(await models.User.findByPk(bookerId))?.name || "Someone"}!`, "booking", "booking", id);
  await createNotification(bookerId, `Booking request sent to ${provider.name}!`, "booking", "booking", id);

  const formatted = await formatBookingForResponse(booking, bookerId);
  const walletRes = await getWalletSummaryService(bookerId);
  const wallet = walletRes.body?.data;
  return {
    status: 201,
    body: { success: true, data: formatted, wallet },
  };
}

async function formatBookingForResponse(booking, currentUserId) {
  const isBooker = String(booking.booker_id) === String(currentUserId);
  const other = await models.User.findByPk(isBooker ? booking.provider_id : booking.booker_id);
  const timeLabel = `${formatTimeDisplay(booking.time_start)} to ${formatTimeDisplay(booking.time_end)}`;

  return {
    id: booking.id,
    person: other?.name || "",
    photo: other?.profile_path || "",
    profileId: booking.provider_id,
    date: booking.booking_date,
    time: timeLabel,
    timeStart: booking.time_start,
    timeEnd: booking.time_end,
    location: booking.location || "TBD",
    purpose: booking.purpose || "Social meetup",
    amount: Number(booking.amount),
    duration: Number(booking.duration_hours),
    status: booking.status,
    createdAt: booking.created_at ? new Date(booking.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : null,
    isMine: isBooker,
  };
}

async function createNotification(userId, text, type, refType, refId) {
  await models.Notification.create({
    id: randomUUID(),
    user_id: userId,
    text,
    type: type || "success",
    read: false,
    reference_type: refType || null,
    reference_id: refId || null,
  });
}

export async function listBookingsService(userId, { tab } = {}) {
  const sent = await models.Booking.findAll({
    where: { booker_id: userId },
    order: [["created_at", "DESC"]],
    include: [{ model: models.User, as: "provider", attributes: ["id", "name"] }],
  });

  const incoming = await models.Booking.findAll({
    where: { provider_id: userId },
    order: [["created_at", "DESC"]],
    include: [{ model: models.User, as: "booker", attributes: ["id", "name"] }],
  });

  const formatOne = async (b, isBooker) => {
    const other = isBooker ? b.provider : b.booker;
    const timeLabel = `${formatTimeDisplay(b.time_start)} to ${formatTimeDisplay(b.time_end)}`;
    return {
      id: b.id,
      person: other?.name || "",
      photo: "",
      profileId: b.provider_id,
      date: b.booking_date,
      time: timeLabel,
      timeStart: b.time_start,
      timeEnd: b.time_end,
      location: b.location || "TBD",
      purpose: b.purpose || "Social meetup",
      amount: Number(b.amount),
      duration: Number(b.duration_hours),
      status: b.status,
      createdAt: b.created_at ? new Date(b.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : null,
      isMine: isBooker,
    };
  };

  const myBookings = await Promise.all(sent.map((b) => formatOne(b, true)));
  const incomingRequests = await Promise.all(incoming.map((b) => formatOne(b, false)));

  return {
    status: 200,
    body: {
      success: true,
      data: { myBookings, incomingRequests },
    },
  };
}

export async function acceptBookingService(userId, bookingId) {
  const booking = await models.Booking.findByPk(bookingId);
  if (!booking) return { status: 404, body: { success: false, message: "Booking not found" } };
  if (String(booking.provider_id) !== String(userId)) {
    return { status: 403, body: { success: false, message: "Not authorized" } };
  }
  if (booking.status !== "pending") {
    return { status: 400, body: { success: false, message: "Booking is not pending" } };
  }

  booking.status = "confirmed";
  await booking.save();

  const booker = await models.User.findByPk(booking.booker_id);
  await createNotification(booking.booker_id, `${(await models.User.findByPk(userId))?.name || "Provider"} accepted your booking!`, "success", "booking", bookingId);
  await createNotification(userId, `Booking accepted.`, "success", "booking", bookingId);

  const formatted = await formatBookingForResponse(booking, userId);
  return { status: 200, body: { success: true, data: formatted } };
}

export async function declineBookingService(userId, bookingId) {
  const booking = await models.Booking.findByPk(bookingId);
  if (!booking) return { status: 404, body: { success: false, message: "Booking not found" } };
  if (String(booking.provider_id) !== String(userId)) {
    return { status: 403, body: { success: false, message: "Not authorized" } };
  }
  if (booking.status !== "pending") {
    return { status: 400, body: { success: false, message: "Booking is not pending" } };
  }

  const refundResult = await resolveEscrowService(booking.booker_id, {
    escrow_amount: Number(booking.amount),
    wallet_credit_amount: Number(booking.amount),
    increment_total_earned: false,
    description: `Refund on decline - ${bookingId}`,
    reference_type: "booking",
    reference_id: bookingId,
  });

  if (refundResult.status !== 200) return refundResult;

  booking.status = "cancelled";
  await booking.save();

  await createNotification(booking.booker_id, "Booking declined. Full refund processed.", "payment", "booking", bookingId);

  const formatted = await formatBookingForResponse(booking, userId);
  const walletRes = await getWalletSummaryService(booking.booker_id);
  return { status: 200, body: { success: true, data: formatted, wallet: walletRes.body?.data } };
}

export function getCancelRefund(booking) {
  try {
    const startStr = booking.time_start || "12:00";
    const dt = new Date(`${booking.booking_date} ${startStr}`);
    const diffHours = (dt - new Date()) / 36e5;
    const feePct = diffHours > 1 ? 0.05 : 0.1;
    return { refund: Math.round(Number(booking.amount) * (1 - feePct)), feePct };
  } catch {
    return { refund: Math.round(Number(booking.amount) * 0.9), feePct: 0.1 };
  }
}

export async function cancelBookingService(userId, bookingId) {
  const booking = await models.Booking.findByPk(bookingId);
  if (!booking) return { status: 404, body: { success: false, message: "Booking not found" } };
  if (String(booking.booker_id) !== String(userId)) {
    return { status: 403, body: { success: false, message: "Not authorized" } };
  }
  if (!["pending", "confirmed"].includes(booking.status)) {
    return { status: 400, body: { success: false, message: "Cannot cancel this booking" } };
  }

  const { refund } = getCancelRefund(booking);
  const refundResult = await resolveEscrowService(userId, {
    escrow_amount: Number(booking.amount),
    wallet_credit_amount: refund,
    increment_total_earned: false,
    description: `Refund on cancel - ${bookingId}`,
    reference_type: "booking",
    reference_id: bookingId,
  });

  if (refundResult.status !== 200) return refundResult;

  booking.status = "cancelled";
  await booking.save();

  const formatted = await formatBookingForResponse(booking, userId);
  formatted.refundAmount = refund;
  const walletRes = await getWalletSummaryService(userId);
  return { status: 200, body: { success: true, data: formatted, wallet: walletRes.body?.data } };
}

export async function completeBookingService(userId, bookingId) {
  const booking = await models.Booking.findByPk(bookingId);
  if (!booking) return { status: 404, body: { success: false, message: "Booking not found" } };
  if (String(booking.provider_id) !== String(userId) && String(booking.booker_id) !== String(userId)) {
    return { status: 403, body: { success: false, message: "Not authorized" } };
  }
  if (booking.status !== "confirmed") {
    return { status: 400, body: { success: false, message: "Booking must be confirmed to complete" } };
  }

  const transferResult = await transferEscrowToProviderService(booking);
  if (transferResult.status !== 200) return transferResult;

  booking.status = "completed";
  await booking.save();

  await createNotification(booking.booker_id, "Meeting confirmed via OTP! Payment released.", "payment", "booking", bookingId);
  await createNotification(booking.provider_id, "Booking completed. Payment credited to your wallet.", "payment", "booking", bookingId);

  const formatted = await formatBookingForResponse(booking, userId);
  const walletRes = await getWalletSummaryService(userId === booking.provider_id ? userId : booking.booker_id);
  return { status: 200, body: { success: true, data: formatted, wallet: walletRes.body?.data } };
}

export async function getAvailableSlotsService(providerId, date) {
  if (!providerId || !date) {
    return { status: 400, body: { success: false, message: "provider_id and date required" } };
  }

  const booked = await models.Booking.findAll({
    where: {
      provider_id: providerId,
      booking_date: date,
      status: ["pending", "confirmed"],
    },
  });

  const engaged = new Set();
  for (const b of booked) {
    const [si, ei] = [ALL_SLOTS.indexOf(b.time_start), ALL_SLOTS.indexOf(b.time_end)];
    if (si >= 0 && ei > si) {
      for (let i = si; i < ei; i++) engaged.add(ALL_SLOTS[i]);
    }
  }

  return {
    status: 200,
    body: {
      success: true,
      data: {
        available: ALL_SLOTS.filter((s) => !engaged.has(s)),
        engaged: [...engaged],
      },
    },
  };
}

export async function generateOtpService(userId, bookingId) {
  const booking = await models.Booking.findByPk(bookingId);
  if (!booking) return { status: 404, body: { success: false, message: "Booking not found" } };
  if (String(booking.provider_id) !== String(userId)) {
    return { status: 403, body: { success: false, message: "Not authorized" } };
  }
  if (booking.status !== "confirmed") {
    return { status: 400, body: { success: false, message: "Booking must be confirmed" } };
  }

  const otp = String(Math.floor(100000 + Math.random() * 900000));
  booking.meeting_otp = otp;
  await booking.save();

  return { status: 200, body: { success: true, data: { otp } } };
}

export async function verifyOtpService(userId, bookingId, otp) {
  const booking = await models.Booking.findByPk(bookingId);
  if (!booking) return { status: 404, body: { success: false, message: "Booking not found" } };
  const isBooker = String(booking.booker_id) === String(userId);
  const isProvider = String(booking.provider_id) === String(userId);
  if (!isBooker && !isProvider) {
    return { status: 403, body: { success: false, message: "Not authorized" } };
  }
  if (booking.meeting_otp !== String(otp)) {
    return { status: 400, body: { success: false, message: "Invalid OTP" } };
  }

  return { status: 200, body: { success: true, data: { valid: true } } };
}
