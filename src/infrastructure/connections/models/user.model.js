'use strict';

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define(
    'User',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
      },
      passwordHash: { type: DataTypes.STRING, allowNull: false },
      refreshTokenHash: { type: DataTypes.STRING, allowNull: true },
    },
    {
      tableName: 'users',
      timestamps: true,
    },
  );

  return User;
};
