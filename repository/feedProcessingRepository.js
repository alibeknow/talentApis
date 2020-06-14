const { feed_processing, sequelize } = require('../db/models/index')
module.exports = {
  create: async (model) => {
    return feed_processing.create(model)
  },
  findAll: async (whereClause) => {
    return feed_processing.findAll(whereClause)
  },
  increment: async (field, by, whereClause) => {
    feed_processing.increment(field, { by: by, where: whereClause })
  },
  update: async (fields, id) => {
    return feed_processing.update(fields, { where: { id: id } })
  },
  findAndCountAll: async () => {
    return feed_processing.findAndCountAll({ where: { active: 1 } })
  },
  findOne: async (whereClause) => {
    return feed_processing.findOne({ where: whereClause })
  },
}
