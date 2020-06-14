'use strict'
module.exports = (sequelize, DataTypes) => {
  const raw_candidate_info = sequelize.define(
    'raw_candidate_info',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      source_type: {
        type: DataTypes.STRING(20),
        allowNull: false,
        field: 'source_type',
      },
      external_id: {
        type: DataTypes.STRING(20),
        allowNull: false,
        field: 'external_id',
      },
      data: DataTypes.JSON,
      job_id: DataTypes.STRING(255),
      jobs_found: { type: DataTypes.INTEGER, defaultValue: 0 },
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
  raw_candidate_info.associate = function (models) {
    models.raw_candidate_info.belongsTo(models.feed_processing, { foreignKey: 'feed_processing_id', as: 'feed_processing' })
    models.raw_candidate_info.hasMany(models.raw_candidate_info_history, { foreignKey: 'raw_candidate_inf_id' })
    models.raw_candidate_info.hasMany(models.hr_json_candidate_info, { foreignKey: 'raw_candidate_info_id' })
  }
  return raw_candidate_info
}
