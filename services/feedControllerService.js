'use strict'

const config = require('../config/common')
const _ = require('underscore')
const feedProcessingRepository = require('../repository/feedProcessingRepository')
const rawCandidateRepository = require('../repository/rawCandidateRepository')
const cp = require('child_process')
const ps = require('ps-node')

module.exports.feedProcessPOST = async (req, res, next) => {
  let reqParams = req.swagger.params
  let urlParam = reqParams.url.value // https://cloud.glo.net/feeds/rss_camp_test.xml.gz
  let lastUpdateDays = reqParams.lastUpdateDays.value
  let candidateQuantityPerJob = reqParams.candidateQuantityPerJob.value
  let parallelProcess = reqParams.parallelProcess.value
  let harvesterMode = reqParams.harvesterMode.value
  let source = reqParams.source.value
  this.startProcess(urlParam, lastUpdateDays, candidateQuantityPerJob, parallelProcess, harvesterMode, source)
    .then((value) => res.json(value))
    .catch((error) => {
      console.log(error.message)
      res.json(error)
    })
}

module.exports.startProcess = async function startProcess(urlParam, lastUpdateDays, candidateQuantityPerJob, parallelProcess, harvesterMode, source) {
  return feedProcessingRepository
    .findAll({ where: { url: urlParam, status: 'in_progress' } })
    .then(async (feedProcessingList) => {
      if (!_.isNull(feedProcessingList)) {
        let params = {
          lastUpdateDays: lastUpdateDays,
          candidateQuantityPerJob: candidateQuantityPerJob,
          parallelProcess: parallelProcess,
          harvesterMode: harvesterMode,
          source: source,
        }
        let feedProcessing = await feedProcessingRepository
          .create({
            url: urlParam,
            parameters: params,
          })
          .catch((err) => console.log(err.message))
        switch (source) {
          case 'monster':
            console.log('monster=====================', source)
            const childMonster = cp.spawn(
              `node   ${process.cwd()}/workers/workerFeed.js`,
              [urlParam, feedProcessing.id, lastUpdateDays, candidateQuantityPerJob, parallelProcess, harvesterMode],
              { shell: true },
            )
            childMonster.stdout.on('data', (data) => console.log('Files list: \n', data.toString('utf-8')))
            childMonster.stderr.on('error', (error) => console.log('Error: \n', error))
            childMonster.on('close', (code) => console.log('childMonster process exited with code ' + code))
            break
          case 'dice':
            console.log(source)
            const childDice = cp.spawn(
              `node   ${process.cwd()}/workers/diceWorker.js`,
              [urlParam, feedProcessing.id, lastUpdateDays, candidateQuantityPerJob, parallelProcess, harvesterMode],
              { shell: true },
            )
            childDice.stdout.on('data', (data) => console.log('Files list: \n', data.toString('utf-8')))
            childDice.stderr.on('error', (error) => console.log('Error: \n', error))
            childDice.on('close', (code) => console.log('childDice process exited with code ' + code))
            break
          default:
            break
        }
      } else {
        return feedProcessingList
      }
    })
    .catch((error) => {
      console.log('err')
      console.log(error.message, error.stack)
    })
}

module.exports.feedProcessAllGET = function feedProcessAllGET(req, res, next) {
  feedProcessingRepository
    .findAndCountAll()
    .then((feedProcess) => res.json(feedProcess))
    .catch((error) => {
      console.log(error.message)
      res.json(error)
    })
}

module.exports.feedProcessByIdGET = function feedProcessByIdGET(req, res, next) {
  let id = req.swagger.params.id.value
  feedProcessingRepository
    .findOne({ id: id })
    .then((feedProcess) => {
      res.json(feedProcess)
    })
    .catch((error) => {
      console.log(error.message)
      res.json(error)
    })
}
module.exports.feedProcessUpdate = async (req, res, next) => {
  const { id, active, status } = req.body
  const result = await feedProcessingRepository.findOne({ id: id })
  if (result.id) {
    feedProcessingRepository
      .update({ active: active, status: status }, id)
      .then((feedProcess) => {
        if (active == 0 || status == 'stopped') process.kill(result.pid)

        res.send(true)
      })
      .catch((error) => {
        console.log(error.message)
        res.json(error)
      })
  }
}

module.exports.feedProcessRawCandidatesGET = function feedProcessRawCandidatesGET(req, res, next) {
  let id = req.swagger.params.id.value
  let size = req.swagger.params.size.value || 20
  let page = req.swagger.params.page.value * size || 0
  rawCandidateRepository
    .findAndCountAll(size, page, { feed_processing_id: id })
    .then((value) => res.json(value))
    .catch((error) => {
      console.log(error.message)
      res.json(error)
    })
}
