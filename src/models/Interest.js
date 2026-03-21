import { TableNames } from "../../src/common/constant/db.contant.js";

export default (sequelize, DataTypes) => {
  const Interest = sequelize.define(
    TableNames.interests,
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        allowNull: false,
        defaultValue: DataTypes.UUIDV4,
      },
      name: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
      },
      status: {
        type: DataTypes.ENUM("active", "inactive"),
        allowNull: false,
        defaultValue: "active",
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
      icon_path: {
        type: DataTypes.STRING(1024),
        allowNull: true,
      },
    },
    {
      tableName: TableNames.interests,
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  Interest.associate = (models) => {
    Interest.belongsToMany(models.User, {
      through: models.UserInterest,
      foreignKey: "interest_id",
      otherKey: "user_id",
      as: "users",
    });
  };

  return Interest;
};
