import { randomUUID } from "crypto";
import models from "../../models/index.js";

export async function listNotificationsService(userId, { limit = 20, offset = 0 } = {}) {
  const pageLimit = Math.min(50, Number(limit) || 20);
  const pageOffset = Math.max(0, Number(offset) || 0);

  const rows = await models.Notification.findAll({
    where: { user_id: userId },
    order: [["created_at", "DESC"]],
    limit: pageLimit,
    offset: pageOffset,
  });

  const unreadCount = await models.Notification.count({
    where: { user_id: userId, read: false },
  });

  const mapped = rows.map((r) => ({
    id: r.id,
    text: r.text,
    type: r.type || "success",
    read: r.read,
    time: formatTimeAgo(r.created_at),
    createdAt: r.created_at,
  }));

  return {
    status: 200,
    body: {
      success: true,
      data: mapped,
      unreadCount,
    },
  };
}

function formatTimeAgo(d) {
  if (!d) return "";
  const diff = (Date.now() - new Date(d)) / 1000;
  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export async function markNotificationsReadService(userId) {
  await models.Notification.update(
    { read: true },
    { where: { user_id: userId } }
  );

  return {
    status: 200,
    body: { success: true, message: "Notifications marked as read" },
  };
}
