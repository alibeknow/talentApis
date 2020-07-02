const dbLogger = require('../repository/logRepository')
const logger = require('./logger')

module.exports = async (data, level, params) => {
  if (process.env.debug) {
    console.log('debugModeCreate', params)
    logger.error({ data: data, level: level, parameters: params })
    await dbLogger.create({ data: JSON.stringify(data), level: level, parameters: params })
  }
}
