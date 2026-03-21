import { TableNames } from "../common/constant/db.contant.js";

export default (sequelize, DataTypes) => {
  const WalletTransaction = sequelize.define(
    TableNames.wallet_transactions,
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        allowNull: false,
      },
      user_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      kind: {
        type: DataTypes.ENUM(
          "credit",
          "debit",
          "escrow_hold",
          "escrow_release",
          "withdrawal"
        ),
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      delta_wallet: {
        type: DataTypes.DECIMAL(18, 2),
        allowNull: false,
      },
      delta_escrow: {
        type: DataTypes.DECIMAL(18, 2),
        allowNull: false,
      },
      reference_type: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      reference_id: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
    },
    {
      tableName: TableNames.wallet_transactions,
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  WalletTransaction.associate = (models) => {
    WalletTransaction.belongsTo(models.User, {
      foreignKey: "user_id",
      as: "owner",
    });
  };

  return WalletTransaction;
};

