import { submitTicketService, submitContactService } from "./service.js";

export const submitTicket = async (req, res) => {
  try {
    const result = await submitTicketService(req.body);
    return res.status(result.status).json(result.body);
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const submitContact = async (req, res) => {
  try {
    const result = await submitContactService(req.body);
    return res.status(result.status).json(result.body);
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

