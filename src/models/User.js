import { TableNames } from "../../src/common/constant/db.contant.js";

/**
 * @param { import("sequelize").Sequelize } sequelize
 * @param { import("sequelize").DataTypes } DataTypes
 */
export default (sequelize, DataTypes) => {
  const User = sequelize.define(TableNames.users, {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      allowNull: false,
      defaultValue: DataTypes.UUIDV4
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    profile_path: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    country_code: {
      type: DataTypes.STRING(5),
      allowNull: true,
    },
    phone_number: {
      type: DataTypes.STRING(15),
      allowNull: true,
    },
    email_address: {
      type: DataTypes.STRING(255),
      allowNull: true,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    user_type: {
      type: DataTypes.STRING(30),
      allowNull: false,
      defaultValue: "individual",
    },
    bio: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    rate: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    city_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    location: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    age: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    gallery_paths: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    is_verified: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
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
    tableName: TableNames.users,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  });

  User.associate = (models) => {
    User.belongsTo(models.City, {
      foreignKey: "city_id",
      as: "city",
    });
    User.belongsToMany(models.Interest, {
      through: models.UserInterest,
      foreignKey: "user_id",
      otherKey: "interest_id",
      as: "interest_list",
    });

    User.hasMany(models.UserAvailabilitySlot, {
      foreignKey: "user_id",
      as: "availability_slots",
    });

    // Extra group specific data stored separately (when `users.user_type = 'group'`)
    User.hasOne(models.UserGroup, {
      foreignKey: "user_id",
      as: "group_profile",
    });

    // Wallet balances & transaction history
    User.hasOne(models.WalletAccount, {
      foreignKey: "user_id",
      as: "wallet_account",
    });

    User.hasMany(models.Booking, {
      foreignKey: "booker_id",
      as: "bookings_sent",
    });
    User.hasMany(models.Booking, {
      foreignKey: "provider_id",
      as: "bookings_received",
    });

    User.hasMany(models.Notification, {
      foreignKey: "user_id",
      as: "notifications",
    });
  };

  return User;
};
