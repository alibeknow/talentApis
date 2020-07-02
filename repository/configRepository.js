const { config, sequelize } = require('../db/models/index')
module.exports = {
  create: async (model) => {
    return config.create(model)
  },
  findAll: async (whereClause) => {
    return config.findAll(whereClause)
  },
  update: async (fields, id) => {
    return config.update(fields, { where: { id: id } })
  },
  increment: async (by, source) => {
    let sourceField = `$.${source}`
    return sequelize.query(
      `UPDATE config SET data= JSON_SET(data, '${sourceField}.currentTotal',
       JSON_EXTRACT(data, '${sourceField}.currentTotal') + ${by}, '${sourceField}.currentMonth', JSON_EXTRACT(data, '${sourceField}.currentMonth') + ${by},
        '${sourceField}.currentDay', JSON_EXTRACT(data, '${sourceField}.currentDay') + ${by}) WHERE name='limit'`,
    )
  },
  refreshLimit: async (source, nameLimit) => {
    let sourceField = `$.${source}.${nameLimit}`
    return sequelize.query(`UPDATE config SET data= JSON_SET(data,'${sourceField}', 0) WHERE name='limit'`)
  },
  findAndCountAll: async () => {
    return config.findAndCountAll()
  },
  findOne: async (whereClause) => {
    return config.findOne({ where: whereClause })
  },
}
