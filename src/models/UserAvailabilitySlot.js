import { TableNames } from "../common/constant/db.contant.js";

/**
 * @param { import("sequelize").Sequelize } sequelize
 * @param { import("sequelize").DataTypes } DataTypes
 */
export default (sequelize, DataTypes) => {
  const UserAvailabilitySlot = sequelize.define(
    TableNames.user_availability_slots,
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        allowNull: false,
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
      day: {
        type: DataTypes.STRING(20),
        allowNull: false,
      },
      on: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      slot: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
    },
    {
      tableName: TableNames.user_availability_slots,
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  return UserAvailabilitySlot;
};

