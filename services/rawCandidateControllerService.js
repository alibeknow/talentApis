'use strict'

const rawCandidateRepository = require('../repository/rawCandidateRepository')

module.exports.rawCandidateByIdGET = function rawCandidateByIdGET(req, res, next) {
  let id = req.swagger.params.id.value
  rawCandidateRepository
    .findOne({ id: id })
    .then((rawCandidate) => res.json(rawCandidate))
    .catch((error) => {
      console.log(error.message)
      res.json(error)
    })
}
