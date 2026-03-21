import { randomUUID } from "crypto";
import config from "../../common/config/env.config.js";
import models from "../../models/index.js";
import { messages } from "../../common/constant/message.constant.js";

function toNumberOrNull(v) {
  if (v === "" || v == null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function formatDateInIN(d) {
  try {
    return new Date(d).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return String(d || "");
  }
}

async function ensureWalletAccount(userId, tx = null) {
  const [account] = await models.WalletAccount.findOrCreate({
    where: { user_id: userId },
    defaults: {
      id: randomUUID(),
      user_id: userId,
      wallet_balance: 0,
      escrow_balance: 0,
      total_earned: 0,
    },
    transaction: tx || undefined,
  });
  return account;
}

export async function getWalletSummaryService(userId) {
  const account = await ensureWalletAccount(userId);
  return {
    status: 200,
    body: {
      success: true,
      data: {
        wallet: Number(account.wallet_balance || 0),
        escrow: Number(account.escrow_balance || 0),
        totalEarned: Number(account.total_earned || 0),
      },
    },
  };
}

export async function addWalletBalanceService(userId, amountRaw) {
  const amount = toNumberOrNull(amountRaw);
  if (amount == null || amount <= 0) {
    return { status: 400, body: { success: false, message: "Invalid amount" } };
  }

  return models.sequelize.transaction(async (tx) => {
    const account = await ensureWalletAccount(userId, tx);

    account.wallet_balance = Number(account.wallet_balance || 0) + amount;
    await account.save({ transaction: tx });

    await models.WalletTransaction.create(
      {
        id: randomUUID(),
        user_id: userId,
        kind: "credit",
        description: "Wallet balance added",
        delta_wallet: amount,
        delta_escrow: 0,
      },
      { transaction: tx }
    );

    return {
      status: 200,
      body: {
        success: true,
        message: "Wallet balance updated",
        data: {
          wallet: Number(account.wallet_balance),
          escrow: Number(account.escrow_balance || 0),
          totalEarned: Number(account.total_earned || 0),
        },
      },
    };
  });
}

export async function holdEscrowService(userId, body) {
  const amount = toNumberOrNull(body?.amount);
  const description =
    body?.description && String(body.description).trim()
      ? String(body.description).trim()
      : "Escrow locked";

  const referenceType = body?.reference_type ?? null;
  const referenceId = body?.reference_id ?? null;

  if (amount == null || amount <= 0) {
    return { status: 400, body: { success: false, message: "Invalid amount" } };
  }

  return models.sequelize.transaction(async (tx) => {
    const account = await ensureWalletAccount(userId, tx);
    const wallet = Number(account.wallet_balance || 0);

    if (wallet < amount) {
      return {
        status: 400,
        body: { success: false, message: "Insufficient wallet balance" },
      };
    }

    account.wallet_balance = wallet - amount;
    account.escrow_balance = Number(account.escrow_balance || 0) + amount;
    await account.save({ transaction: tx });

    await models.WalletTransaction.create(
      {
        id: randomUUID(),
        user_id: userId,
        kind: "escrow_hold",
        description,
        delta_wallet: -amount,
        delta_escrow: amount,
        reference_type: referenceType,
        reference_id: referenceId,
      },
      { transaction: tx }
    );

    return {
      status: 200,
      body: {
        success: true,
        message: "Escrow locked",
        data: {
          wallet: Number(account.wallet_balance),
          escrow: Number(account.escrow_balance),
          totalEarned: Number(account.total_earned || 0),
        },
      },
    };
  });
}

export async function resolveEscrowService(userId, body) {
  const escrowAmount = toNumberOrNull(body?.escrow_amount);
  const walletCreditAmount = toNumberOrNull(body?.wallet_credit_amount);
  const incrementTotalEarned = body?.increment_total_earned !== false;

  const description =
    body?.description && String(body.description).trim()
      ? String(body.description).trim()
      : "Escrow resolved";

  const referenceType = body?.reference_type ?? null;
  const referenceId = body?.reference_id ?? null;

  if (escrowAmount == null || escrowAmount <= 0) {
    return { status: 400, body: { success: false, message: "Invalid escrow amount" } };
  }
  if (walletCreditAmount == null || walletCreditAmount < 0) {
    return {
      status: 400,
      body: { success: false, message: "Invalid wallet credit amount" },
    };
  }

  return models.sequelize.transaction(async (tx) => {
    const account = await ensureWalletAccount(userId, tx);
    const escrow = Number(account.escrow_balance || 0);

    if (escrow < escrowAmount) {
      return {
        status: 400,
        body: { success: false, message: "Insufficient escrow balance" },
      };
    }

    account.escrow_balance = escrow - escrowAmount;
    account.wallet_balance = Number(account.wallet_balance || 0) + walletCreditAmount;
    if (incrementTotalEarned) {
      account.total_earned = Number(account.total_earned || 0) + walletCreditAmount;
    }

    await account.save({ transaction: tx });

    await models.WalletTransaction.create(
      {
        id: randomUUID(),
        user_id: userId,
        kind: "escrow_release",
        description,
        delta_wallet: walletCreditAmount,
        delta_escrow: -escrowAmount,
        reference_type: referenceType,
        reference_id: referenceId,
      },
      { transaction: tx }
    );

    return {
      status: 200,
      body: {
        success: true,
        message: "Escrow resolved",
        data: {
          wallet: Number(account.wallet_balance),
          escrow: Number(account.escrow_balance),
          totalEarned: Number(account.total_earned || 0),
        },
      },
    };
  });
}

export async function withdrawService(userId, amountRaw) {
  const amount = toNumberOrNull(amountRaw);
  if (amount == null || amount <= 0) {
    return { status: 400, body: { success: false, message: "Invalid amount" } };
  }

  return models.sequelize.transaction(async (tx) => {
    const account = await ensureWalletAccount(userId, tx);
    const wallet = Number(account.wallet_balance || 0);

    if (wallet < amount) {
      return { status: 400, body: { success: false, message: "Insufficient wallet balance" } };
    }

    account.wallet_balance = wallet - amount;
    await account.save({ transaction: tx });

    await models.WalletTransaction.create(
      {
        id: randomUUID(),
        user_id: userId,
        kind: "withdrawal",
        description: "Withdrawal requested",
        delta_wallet: -amount,
        delta_escrow: 0,
      },
      { transaction: tx }
    );

    return {
      status: 200,
      body: {
        success: true,
        message: "Withdrawal request recorded",
        data: {
          wallet: Number(account.wallet_balance),
          escrow: Number(account.escrow_balance || 0),
          totalEarned: Number(account.total_earned || 0),
        },
      },
    };
  });
}

/**
 * Transfer escrow from booker to provider (for completed bookings).
 * Deducts from booker's escrow, credits 70% to provider.
 */
export async function transferEscrowToProviderService(booking) {
  const bookerId = booking.booker_id;
  const providerId = booking.provider_id;
  const amount = Number(booking.amount || 0);
  const providerShare = Math.round(amount * 0.7);

  if (amount <= 0 || providerShare <= 0) {
    return { status: 400, body: { success: false, message: "Invalid booking amount" } };
  }

  return models.sequelize.transaction(async (tx) => {
    const bookerAccount = await ensureWalletAccount(bookerId, tx);
    const providerAccount = await ensureWalletAccount(providerId, tx);

    const escrow = Number(bookerAccount.escrow_balance || 0);
    if (escrow < amount) {
      return {
        status: 400,
        body: { success: false, message: "Insufficient escrow balance" },
      };
    }

    bookerAccount.escrow_balance = escrow - amount;
    await bookerAccount.save({ transaction: tx });

    providerAccount.wallet_balance = Number(providerAccount.wallet_balance || 0) + providerShare;
    providerAccount.total_earned = Number(providerAccount.total_earned || 0) + providerShare;
    await providerAccount.save({ transaction: tx });

    await models.WalletTransaction.create(
      {
        id: randomUUID(),
        user_id: bookerId,
        kind: "escrow_release",
        description: `Booking payout released - ${booking.id}`,
        delta_wallet: 0,
        delta_escrow: -amount,
        reference_type: "booking",
        reference_id: String(booking.id),
      },
      { transaction: tx }
    );

    await models.WalletTransaction.create(
      {
        id: randomUUID(),
        user_id: providerId,
        kind: "credit",
        description: `Booking payment received - ${booking.id}`,
        delta_wallet: providerShare,
        delta_escrow: 0,
        reference_type: "booking",
        reference_id: String(booking.id),
      },
      { transaction: tx }
    );

    return {
      status: 200,
      body: {
        success: true,
        message: "Payment transferred to provider",
        data: { providerShare },
      },
    };
  });
}

export async function getWalletTransactionsService(userId, { limit, offset }) {
  const pageLimit = limit == null || limit === "" ? 20 : Math.min(50, Number(limit));
  const pageOffset = offset == null || offset === "" ? 0 : Math.max(0, Number(offset));

  const rows = await models.WalletTransaction.findAll({
    where: { user_id: userId },
    order: [["created_at", "DESC"]],
    limit: pageLimit,
    offset: pageOffset,
  });

  const mapped = rows.map((r) => {
    const deltaWallet = Number(r.delta_wallet || 0);
    let type = "debit";
    if (r.kind === "credit") type = "credit";
    else if (r.kind === "escrow_hold" || r.kind === "escrow_release") type = "escrow";
    else type = "debit";

    return {
      id: r.id,
      type,
      desc: r.description || r.kind,
      amount: deltaWallet,
      date: formatDateInIN(r.created_at),
    };
  });

  return {
    status: 200,
    body: {
      success: true,
      data: mapped,
    },
  };
}

