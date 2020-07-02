'use strict'
module.exports = (sequelize, DataTypes) => {
  const config = sequelize.define(
    'config',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      name: DataTypes.STRING,
      data: { type: DataTypes.JSON, allowNull: false },
      createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        name: 'created_at',
      },
      updatedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        name: 'updated_at',
      },
    },
    {},
  )
  config.associate = function (models) {}

  return config
}
