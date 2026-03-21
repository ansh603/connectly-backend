import { TableNames } from "../common/constant/db.contant.js";

/**
 * @param { import("sequelize").Sequelize } sequelize
 * @param { import("sequelize").DataTypes } DataTypes
 */
export default (sequelize, DataTypes) => {
  const UserGroup = sequelize.define(
    TableNames.user_groups,
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
        references: {
          model: TableNames.users,
          key: "id",
        },
        onDelete: "CASCADE",
      },
      group_name: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      group_type: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      members: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
      },
      contact_name: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      contact_mobile: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },
      contact_country_code: {
        type: DataTypes.STRING(8),
        allowNull: true,
      },
    },
    {
      tableName: TableNames.user_groups,
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  UserGroup.associate = (models) => {
    UserGroup.belongsTo(models.User, {
      foreignKey: "user_id",
      as: "owner",
    });
  };

  return UserGroup;
};

