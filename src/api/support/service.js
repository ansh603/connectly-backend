import { randomUUID } from "crypto";
import models from "../../models/index.js";

import { messages } from "../../common/constant/message.constant.js";

export async function submitTicketService({ reason, message, name, email }) {
  const row = await models.SupportMessage.create({
    id: randomUUID(),
    type: "ticket",
    reason,
    message,
    name,
    email,
  });
  return {
    status: 201,
    body: { success: true, message: messages.TICKET_SUBMITTED ?? "Ticket submitted", data: row },
  };
}

export async function submitContactService({ message, name, email }) {
  const row = await models.SupportMessage.create({
    id: randomUUID(),
    type: "support",
    reason: null,
    message,
    name,
    email,
  });
  return {
    status: 201,
    body: { success: true, message: messages.CONTACT_SUBMITTED ?? "Contact message submitted", data: row },
  };
}

