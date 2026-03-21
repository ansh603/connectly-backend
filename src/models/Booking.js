import { TableNames } from "../common/constant/db.contant.js";

/**
 * @param { import("sequelize").Sequelize } sequelize
 * @param { import("sequelize").DataTypes } DataTypes
 */
export default (sequelize, DataTypes) => {
  const Booking = sequelize.define(
    TableNames.bookings,
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        allowNull: false,
      },
      booker_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      provider_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      status: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: "pending",
      },
      booking_date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      time_start: {
        type: DataTypes.STRING(10),
        allowNull: false,
      },
      time_end: {
        type: DataTypes.STRING(10),
        allowNull: false,
      },
      amount: {
        type: DataTypes.DECIMAL(18, 2),
        allowNull: false,
      },
      duration_hours: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      location: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      purpose: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      escrow_reference_id: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      meeting_otp: {
        type: DataTypes.STRING(10),
        allowNull: true,
      },
    },
    {
      tableName: TableNames.bookings,
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  Booking.associate = (models) => {
    Booking.belongsTo(models.User, {
      foreignKey: "booker_id",
      as: "booker",
    });
    Booking.belongsTo(models.User, {
      foreignKey: "provider_id",
      as: "provider",
    });
  };

  return Booking;
};
