import { TableNames } from "../common/constant/db.contant.js";

/**
 * @param { import("sequelize").Sequelize } sequelize
 * @param { import("sequelize").DataTypes } DataTypes
 */
export default (sequelize, DataTypes) => {
  const DeviceToken = sequelize.define(TableNames.device_tokens, {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      allowNull: false,
      defaultValue: DataTypes.UUIDV4,
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: TableNames.users,
        key: "id",
      },
      onDelete: "CASCADE",
    },
    fcm_token: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    device_id: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    device: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  }, {
    tableName: TableNames.device_tokens,
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  });

  return DeviceToken;
};
