import {
  getWalletSummaryService,
  addWalletBalanceService,
  getWalletTransactionsService,
  holdEscrowService,
  resolveEscrowService,
  withdrawService,
} from "./service.js";

export const getWalletSummary = async (req, res) => {
  try {
    const result = await getWalletSummaryService(req.user.id);
    return res.status(result.status).json(result.body);
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const addWalletBalance = async (req, res) => {
  try {
    const result = await addWalletBalanceService(req.user.id, req.body.amount);
    return res.status(result.status).json(result.body);
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getWalletTransactions = async (req, res) => {
  try {
    const result = await getWalletTransactionsService(req.user.id, {
      limit: req.query.limit,
      offset: req.query.offset,
    });
    return res.status(result.status).json(result.body);
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const holdEscrow = async (req, res) => {
  try {
    const result = await holdEscrowService(req.user.id, req.body);
    return res.status(result.status).json(result.body);
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const resolveEscrow = async (req, res) => {
  try {
    const result = await resolveEscrowService(req.user.id, req.body);
    return res.status(result.status).json(result.body);
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const withdraw = async (req, res) => {
  try {
    const result = await withdrawService(req.user.id, req.body.amount);
    return res.status(result.status).json(result.body);
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

