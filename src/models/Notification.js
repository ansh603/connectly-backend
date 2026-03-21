import { TableNames } from "../common/constant/db.contant.js";

/**
 * @param { import("sequelize").Sequelize } sequelize
 * @param { import("sequelize").DataTypes } DataTypes
 */
export default (sequelize, DataTypes) => {
  const Notification = sequelize.define(
    TableNames.notifications,
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
      text: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      type: {
        type: DataTypes.STRING(30),
        allowNull: true,
        defaultValue: "success",
      },
      read: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
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
      tableName: TableNames.notifications,
      timestamps: true,
      createdAt: "created_at",
      updatedAt: false,
    }
  );

  Notification.associate = (models) => {
    Notification.belongsTo(models.User, {
      foreignKey: "user_id",
      as: "user",
    });
  };

  return Notification;
};
