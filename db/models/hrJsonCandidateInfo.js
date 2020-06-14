'use strict'
module.exports = (sequelize, DataTypes) => {
  const hr_json_candidate_info = sequelize.define(
    'hr_json_candidate_info',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      data: DataTypes.JSON,
      resume: DataTypes.TEXT('long'),
      html: DataTypes.TEXT('long'),
      createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      file_name: DataTypes.STRING(255),
    },
    {},
  )
  hr_json_candidate_info.associate = function (models) {
    // associations can be defined here
  }
  return hr_json_candidate_info
}
