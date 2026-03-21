import { TableNames } from "../common/constant/db.contant.js";

export default (sequelize, DataTypes) => {
  const SupportMessage = sequelize.define(
    TableNames.support_messages,
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        allowNull: false,
      },
      type: {
        type: DataTypes.ENUM("ticket", "support"),
        allowNull: false,
      },
      reason: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      message: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      name: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
      },
    },
    {
      tableName: TableNames.support_messages,
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  return SupportMessage;
};

