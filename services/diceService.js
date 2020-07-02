'use strict'

const axios = require('axios')
const qs = require('querystring')
const jwt = require('jsonwebtoken')
const config = require('../config/common')
const _ = require('underscore')
const rawCandidateRepository = require('../repository/rawCandidateRepository')
const hrJsonCandidateInfoRepository = require('../repository/hrJsonCandidateInfoRepository')
const checkLimit = require('../service/checkLimit')
const hrCvMapping = require('../service/diceMapping')
const dbLogger = require('../modules/dbLogger')
let diceAuthToken
let expiresIn
module.exports.candidatesGET = async (req, res, next) => {
  let reqParams = req.swagger.params
  let textResumeId = reqParams.textResumeId.value
  this.getCandidateAsync(textResumeId)
    .then((candidate) => res.send(candidate))
    .catch((error) => {
      console.log(error)
      res.send(error)
    })
}

module.exports.getCandidates = async (searchRequest) => {
  let token = await getAuthToken()
  return axios
    .post('https://talent-api.dice.com/v2/profiles/search', searchRequest, {
      headers: {
        Authorization: token,
      },
    })
    .then((value) => {
      return value.data
    })
    .catch(async (reason) => {
      let error
      if (reason.response)
        error = {
          //  data: reason.response.data,
          status: reason.response.status,
          statusText: reason.response.statusText,
          headers: reason.response.headers,
          //config: reason.response.config,
        }
      else error = reason
      await dbLogger(error, 'requestError', {
        source: 'dice',
      })
    })
}

module.exports.getCandidate = async (textResumeId, jobId, feedProcessingId) => {
  let token = await getAuthToken()
  let resultLimit = await checkLimit('dice')
  if (resultLimit) return resultLimit

  let response
  try {
    response = await axios.get(`https://talent-api.dice.com/v2/profiles/${textResumeId}`, {
      headers: {
        Authorization: token,
      },
    })
  } catch (error) {
    return error
  }
  this.saveCandidateInfo(response.data)
  return response.data
}

module.exports.getCandidateAsync = async (textResumeId) => {
  //TODO
  let token = await getAuthToken()
  let resultLimit = await checkLimit('dice')
  if (resultLimit) return resultLimit
  return axios
    .get(`https://talent-api.dice.com/v2/profiles/${textResumeId}`, {
      headers: {
        Authorization: token,
      },
    })
    .then((value) => {
      let data = value.data
      this.saveCandidateInfo(data)
      return data
    })
    .catch((reason) => console.log(reason.response.statusText))
}

module.exports.saveCandidateInfo = async (data, jobId, feedProcessingId, source = 'dice') => {
  let externalId = data.id
  let hrJsonModel
  let rawCandidateModel = await rawCandidateRepository
    .create({ source_type: source, external_id: externalId, job_id: jobId, data, feed_processing_id: feedProcessingId })
    .catch((reason) => {
      console.log(reason.name)
    })
  if (rawCandidateModel) {
    if (config.ENABLE_RESUME_PARSER) {
      try {
        hrJsonModel = await hrCvMapping(data)
      } catch (error) {
        console.log(error)
        return 1
      }
      hrJsonModel.raw_candidate_info_id = rawCandidateModel.id
      if (!_.isNull(hrJsonModel.data)) {
        let result2 = await hrJsonCandidateInfoRepository.create(hrJsonModel).catch((err) => {
          console.log(err)
        })
        return result2
      }
    }
  }
}

async function getAuthToken() {
  if (_.isUndefined(diceAuthToken)) {
    return await auth()
  }
  if (!_.isNull(diceAuthToken)) {
    let token = diceAuthToken.substr('Bearer '.length, diceAuthToken.length)
    //let decoded = jwt.decode(token)
    if (Date.now() >= expiresIn * 1000) {
      return await auth()
    }
  }
  return token
}

async function auth() {
  let stringAuth = Buffer.from(`${config.DICE_CLIENT_ID}:${config.DICE_CLIENT_SECRET}`, 'utf8').toString('base64')
  try {
    let response = await axios.post(
      'https://secure.dice.com/oauth/token',
      qs.stringify({
        grant_type: 'password',
        username: config.DICE_USERNAME,
        password: config.DICE_PASSWORD,
      }),
      {
        headers: {
          Authorization: `Basic ${stringAuth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      },
    )
    diceAuthToken = `${response.data.token_type} ${response.data.access_token}`
    expiresIn = response.data.expires_in
    return diceAuthToken
  } catch (reason) {
    let error
    if (reason.response)
      error = {
        data: reason.response.data,
        status: reason.response.status,
        statusText: reason.response.statusText,
        headers: reason.response.headers,
        config: reason.response.config,
      }
    else error = reason
    await dbLogger(error, 'requestError', {
      source: 'dice',
    })
  }
}
