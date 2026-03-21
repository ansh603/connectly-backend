import { TableNames } from "../common/constant/db.contant.js";

/**
 * @param { import("sequelize").Sequelize } sequelize
 * @param { import("sequelize").DataTypes } DataTypes
 */
export default (sequelize, DataTypes) => {
  const WalletAccount = sequelize.define(
    TableNames.wallet_accounts,
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        allowNull: false,
      },
      user_id: {
        type: DataTypes.UUID,
        allowNull: false,
        unique: true,
      },
      wallet_balance: {
        type: DataTypes.DECIMAL(18, 2),
        allowNull: false,
        defaultValue: 0,
      },
      escrow_balance: {
        type: DataTypes.DECIMAL(18, 2),
        allowNull: false,
        defaultValue: 0,
      },
      total_earned: {
        type: DataTypes.DECIMAL(18, 2),
        allowNull: false,
        defaultValue: 0,
      },
    },
    {
      tableName: TableNames.wallet_accounts,
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  WalletAccount.associate = (models) => {
    WalletAccount.belongsTo(models.User, {
      foreignKey: "user_id",
      as: "owner",
    });
  };

  return WalletAccount;
};

