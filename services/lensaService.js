'use strict'

const axios = require('axios')
const config = require('../config/common')
const _ = require('underscore')
const rawCandidateRepository = require('../repository/rawCandidateRepository')
const hrJsonCandidateInfoRepository = require('../repository/hrJsonCandidateInfoRepository')
const feedProcessingRepository = require('../repository/feedProcessingRepository')
const checkLimit = require('../service/checkLimit')
const hrCvMapping = require('../service/lensaMapping')

module.exports.startProcess = async (urlParam, harvesterMode) => {
  return feedProcessingRepository
    .findAll({ where: { url: urlParam, status: 'in_progress' } })
    .then(async (feedProcessingList) => {
      if (!_.isNull(feedProcessingList)) {
        let feedProcessing = await feedProcessingRepository.create({ url: urlParam }).catch((err) => console.log(err.message))

        const child = cp.spawn(`node   ${process.cwd()}/workers/lensaWorker.js`, [urlParam, harvesterMode], { shell: true })
        child.stdout.on('data', (data) => console.log('Files list: \n', data.toString('utf-8')))
        child.stderr.on('error', (error) => console.log('Error: \n', error))
        child.on('close', (code) => console.log('child process exited with code ' + code))
        return feedProcessing.dataValues
      } else {
        return feedProcessingList
      }
    })
    .catch((error) => {
      console.log('err')
      console.log(error.message, error.stack)
    })
}

module.exports.getCandidates = async (dateTo, dateFrom) => {
  //let token = await getAuthToken()

  return axios
    .get('https://api.lensa.com/coreg/v1/get-leads', {
      params: {
        token: config.LENSA_TOKEN,
        date_from: dateFrom,
        date_to: dateTo,
      },
      //   headers: {
      //     Authorization: token,
      //   },
    })
    .then((value) => {
      return value.data
    })
    .catch((reason) => {
      console.log(reason)
    })
}

module.exports.getCandidate = async (url, item, feedProcessingId) => {
  let fileName
  let response
  let resultLimit = await checkLimit('lensa')
  if (resultLimit) return resultLimit
  try {
    response = await axios.get(url).catch((reason) => {
      console.log(reason)
    })
  } catch (error) {
    console.log(error)
  }
  if (response && response.headers && response.headers['content-disposition']) {
    try {
      fileName = response.headers['content-disposition'].split('=')[1].replace(/"/g, '')
    } catch (error) {
      console.log(error)
    }
  }
  await this.saveCandidateInfo(item, response.data, fileName, feedProcessingId)
}

module.exports.saveCandidateInfo = async (data, value = null, fileName = null, feedProcessing = null) => {
  let externalId = data.email
  const source = data.candidate_source
  let rawCandidateModel = await rawCandidateRepository
    .create({ source_type: source || 'lensa', external_id: externalId, data, feed_processing_id: feedProcessing })
    .catch((reason) => {
      console.log('hrJsonInsert', err.message, err.name)
    })
  if (rawCandidateModel) {
    if (config.ENABLE_RESUME_PARSER) {
      let hrJsonCandidateInfoModel = await hrCvMapping(data)
      hrJsonCandidateInfoModel.resume = value
      hrJsonCandidateInfoModel.file_name = fileName
      hrJsonCandidateInfoModel.raw_candidate_info_id = rawCandidateModel.id
      hrJsonCandidateInfoModel = _.pick(hrJsonCandidateInfoModel, _.identity)
      if (!_.isNull(hrJsonCandidateInfoModel.data)) {
        let result2 = await hrJsonCandidateInfoRepository.create(hrJsonCandidateInfoModel).catch((err) => {
          console.log('hrJsonInsert', err.message, err.name)
        })

        return result2
      }
    }
  }
}
