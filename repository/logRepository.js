const { log_table, sequelize } = require('../db/models/index')
module.exports = {
  create: async (model) => {
    return log_table.create(model)
  },
  findAll: async (whereClause) => {
    return log_table.findAll(whereClause)
  },
  increment: async (field, by, whereClause) => {
    log_table.increment(field, { by: by, where: whereClause })
  },
  update: async (fields, id) => {
    return log_table.update(fields, { where: { id: id } })
  },
  findAndCountAll: async (limit = 20, offset = 0, whereClause) => {
    let queryString
    if (whereClause) queryString = { limit: limit, offset: offset, where: whereClause }
    else queryString = { limit: limit, offset: offset }
    return log_table.findAndCountAll(queryString)
  },
  findOne: async (whereClause) => {
    return log_table.findOne({ where: whereClause })
  },
}
