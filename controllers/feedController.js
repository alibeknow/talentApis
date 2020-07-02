'use strict'

const feedControllerService = require('../services/feedControllerService')

module.exports.feedProcessPOST = (req, res, next) => {
  feedControllerService.feedProcessPOST(req, res, next)
}

module.exports.feedProcessByIdGET = (req, res, next) => {
  feedControllerService.feedProcessByIdGET(req, res, next)
}

module.exports.feedProcessAllGET = (req, res, next) => {
  feedControllerService.feedProcessAllGET(req, res, next)
}

module.exports.feedProcessRawCandidatesGET = (req, res, next) => {
  feedControllerService.feedProcessRawCandidatesGET(req, res, next)
}
module.exports.feedProcessUpdate = (req, res, next) => {
  feedControllerService.feedProcessUpdate(req, res, next)
}
