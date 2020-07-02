'use strict'

const logRepository = require('../repository/logRepository')
const cron = require('../scheduler/feedProcessingScheduler')
module.exports.logGET = function (req, res, next) {
  let reqParams = req.swagger.params
  let name = reqParams.name.value
  logRepository
    .findOne({ name: name })
    .then((configModel) => res.json(configModel))
    .catch((error) => {
      res.json(error)
    })
}
module.exports.logUpdate = function (req, res, next) {
  let log = req.body
  logRepository
    .update(log, log.id)
    .then((changedRecords) => res.json(changedRecords))
    .catch((error) => {
      res.json(error)
    })
}
module.exports.logGetAll = async (req, res, next) => {
  let reqParams = req.swagger.params
  let logName = reqParams.logName.value
  let page = reqParams.page.value || 1
  let pageSize = reqParams.pageSize.value || 20
  if (parseInt(page) > 1) {
    page = page * pageSize
  } else if (parseInt(page) == 1) {
    page = 0
  }

  logRepository
    .findAndCountAll(pageSize, page, { level: logName })
    .then((logResult) => res.json(logResult))
    .catch((error) => {
      res.json(error)
    })
}
module.exports.configCreate = (req, res, next) => {
  let log = req.body
  logRepository
    .create(log)
    .then((logResult) => res.json(logResult))
    .catch((error) => {
      res.json(error)
    })
}
