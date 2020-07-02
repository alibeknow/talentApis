const winston = require('winston')
const config = require('../config/common')
const level = process.env.LOG_LEVEL || config.LOG_LEVEL || 'warn'

const logger = new winston.createLogger({
  transports: [
    new winston.transports.Console({
      level: level,
      timestamp: function () {
        return new Date().toISOString()
      },
    }),
  ],
})

module.exports = logger
