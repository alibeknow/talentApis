'use strict'

const diceController = require('../services/diceService')

module.exports.candidatesQueriesPOST = async (req, res, next) => {
  await diceController.getCandidates(req, res, next)
}

module.exports.diceCandidatesGET = (req, res, next) => {
  diceController.candidatesGET(req, res, next)
}
