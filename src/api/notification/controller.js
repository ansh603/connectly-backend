import { listNotificationsService, markNotificationsReadService } from "./service.js";

export const listNotifications = async (req, res) => {
  try {
    const result = await listNotificationsService(req.user.id, {
      limit: req.query.limit,
      offset: req.query.offset,
    });
    return res.status(result.status).json(result.body);
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const markNotificationsRead = async (req, res) => {
  try {
    const result = await markNotificationsReadService(req.user.id);
    return res.status(result.status).json(result.body);
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
