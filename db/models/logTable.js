'use strict'
module.exports = (sequelize, DataTypes) => {
  const log_table = sequelize.define(
    'log_table',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      data: DataTypes.TEXT('long'),
      level: { type: DataTypes.STRING(12) },
      parameters: {
        type: DataTypes.JSON,
        allowNull: true,
      },
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
  return log_table
}
