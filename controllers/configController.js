'use strict'

const configControllerService = require('../services/configService')

module.exports.configGET = (req, res, next) => {
  configControllerService.configGET(req, res, next)
}
module.exports.configGetAll = (req, res, next) => {
  configControllerService.configGetAll(req, res, next)
}
module.exports.configUpdate = (req, res, next) => {
  configControllerService.configUpdate(req, res, next)
}
module.exports.configCreate = (req, res, next) => {
  configControllerService.configCreate(req, res, next)
}
module.exports.refreshLimit = (req, res, next) => {
  configControllerService.refreshLimit(req, res, next)
}
