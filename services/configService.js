'use strict'

const configRepository = require('../repository/configRepository'),
  feedProcessingScheduler = require('../scheduler/feedProcessingScheduler'),
  diceScheduler = require('../scheduler/diceScheduler')

module.exports.configGET = function (req, res, next) {
  let reqParams = req.swagger.params
  let name = reqParams.name.value
  configRepository
    .findOne({ name: name })
    .then((configModel) => res.json(configModel))
    .catch((error) => {
      res.json(error)
    })
}
module.exports.configUpdate = function (req, res, next) {
  let config = req.body
  configRepository
    .update(config, config.id)
    .then((changedRecords) => {
      switch (config.name) {
        case 'monster':
          feedProcessingScheduler()
          break
        case 'dice':
          diceScheduler()
          break
        default:
          break
      }

      res.json(changedRecords)
    })
    .catch((error) => {
      res.json(error)
    })
}
module.exports.configGetAll = (req, res, next) => {
  configRepository
    .findAndCountAll()
    .then((config) => res.json(config))
    .catch((error) => {
      res.json(error)
    })
}
module.exports.configCreate = (req, res, next) => {
  let config = req.body
  configRepository
    .create(config)
    .then((config) => res.json(config))
    .catch((error) => {
      res.json(error)
    })
}
module.exports.refreshLimit = async (req, res, next) => {
  let reqParams = req.swagger.params
  let source = reqParams.source.value
  let nameLimit = reqParams.name.value
  try {
    let result = await configRepository.refreshLimit(source, nameLimit)
    res.send(result)
  } catch (error) {
    res.json(error)
  }
}
