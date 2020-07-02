'use strict'

const candidateController = require('../services/candidateControllerService')

module.exports.candidatesQueriesPOST = async (req, res, next) => {
  await candidateController.candidatesQueriesPOST(req, res, next)
}

module.exports.candidatesGET = function candidatesGET(req, res, next) {
  candidateController.candidatesGET(req, res, next)
}
