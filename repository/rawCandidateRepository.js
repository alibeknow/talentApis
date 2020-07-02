const { raw_candidate_info, sequelize } = require('../db/models/index')

module.exports = {
  create: async (model) => {
    return raw_candidate_info.create(model)
  },
  findOne: (whereClause, fields) => {
    return raw_candidate_info.findOne({
      where: whereClause,
    })
  },
  findAndCountAll: (limit = 20, offset = 0, whereClause) => {
    return raw_candidate_info.findAndCountAll({ limit, offset, where: whereClause })
  },
  count: (whereClause) => {
    return raw_candidate_info.count({ where: whereClause })
  },
  countByMonth: async (month) => {
    return raw_candidate_info.count(sequelize.where(sequelize.fn('month', sequelize.col('created_at')), month))
  },
}
