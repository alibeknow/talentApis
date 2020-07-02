'use strict'

const logControllerService = require('../services/logService')

module.exports.logGetAll = (req, res, next) => {
  logControllerService.logGetAll(req, res, next)
}
