import { TableNames } from "../../src/common/constant/db.contant.js";

export default (sequelize, DataTypes) => {
  const City = sequelize.define(
    TableNames.cities,
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
    },
    {
      tableName: TableNames.cities,
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  City.associate = (models) => {
    City.hasMany(models.User, {
      foreignKey: "city_id",
      as: "users",
    });
  };

  return City;
};
