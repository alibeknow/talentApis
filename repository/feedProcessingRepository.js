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
  findAndCountAll: async (status) => {
    let findObj
    if (status) {
      findObj = { where: { status: status, active: 1 } }
    } else {
      findObj = { where: { active: 1 } }
    }
    return feed_processing.findAndCountAll(findObj)
  },

  findOne: async (whereClause) => {
    return feed_processing.findOne({ where: whereClause })
  },
}
