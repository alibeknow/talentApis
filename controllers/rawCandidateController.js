'use strict'

const rawCandidateControllerService = require('../services/rawCandidateControllerService')

module.exports.rawCandidateByIdGET = function rawCandidateByIdGET(req, res, next) {
  rawCandidateControllerService.rawCandidateByIdGET(req, res, next)
}
