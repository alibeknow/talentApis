'use strict'
module.exports = (sequelize, DataTypes) => {
  const feed_processing = sequelize.define(
    'feed_processing',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      url: DataTypes.STRING(255),
      details: DataTypes.JSON,
      pid: { type: DataTypes.INTEGER, defaultValue: 0 },
      jobs: { type: DataTypes.INTEGER(11), defaultValue: 0 },
      candidates: { type: DataTypes.INTEGER(11), defaultValue: 0 },
      talents_found: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        allowNull: true,
      },
      status: { type: DataTypes.STRING(12) },
      active: { type: DataTypes.INTEGER(1), defaultValue: 1 },
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
      parameters: {
        type: DataTypes.JSON,
        allowNull: true,
      },
    },
    {},
  )
  feed_processing.associate = function (models) {
    models.feed_processing.hasMany(models.raw_candidate_info, { foreignKey: 'feed_processing_id', as: 'feed_processing' })
  }
  return feed_processing
}
