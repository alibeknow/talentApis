'use strict'
module.exports = (sequelize, DataTypes) => {
  const raw_candidate_info_history = sequelize.define(
    'raw_candidate_info_history',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      data: DataTypes.JSON,
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
  raw_candidate_info_history.associate = function(models) {}
  return raw_candidate_info_history
}
