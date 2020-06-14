'use strict'

const axios = require('axios')
const qs = require('querystring')
const jwt = require('jsonwebtoken')
const config = require('../config/common')
const _ = require('underscore')
const rawCandidateRepository = require('../repository/rawCandidateRepository')
const rawCandidateInfoHistoryRepository = require('../repository/rawCandidateHistoryRepository')
const feedProcessingRepository = require('../repository/feedProcessingRepository')
const hrJsonCandidateInfoRepository = require('../repository/hrJsonCandidateInfoRepository')
const checkLimit = require('../service/checkLimit')
const hrCvMapping = require('../service/hrMapping.js')
const builder = require('../service/searchBuilder')
let authToken

module.exports.candidatesQueriesPOST = async (req, res, next) => {
  let reqParams = req.swagger.params
  let searchRequest = req.body
  let source = reqParams.source.value
  let result
  try {
    result = await builder(source, searchRequest)
  } catch (err) {
    console.log(err)
    res.json(err)
  }

  res.send(result)
}

module.exports.getCandidates = async (searchRequest, page, perPage, verbose = true) => {
  let token = await getAuthToken()
  let candidates = await axios
    .post('https://api.jobs.com/v2/candidates/queries', searchRequest, {
      params: {
        page: page,
        perPage: perPage,
        verbose: verbose,
      },
      headers: {
        Authorization: token,
      },
    })
    .catch((reason) => {
      console.log(reason.response, reason.request)
    })
  return candidates.data
}

module.exports.candidatesGET = async (req, res, next) => {
  let reqParams = req.swagger.params
  let textResumeId = reqParams.textResumeId.value
  let resumeBoardId = reqParams.resumeBoardId.value
  let verbose = reqParams.verbose.value
  this.getCandidateAsync(textResumeId, resumeBoardId, verbose)
    .then((candidate) => res.send(candidate))
    .catch((error) => {
      console.log(error)
      res.send(error)
    })
}

module.exports.getCandidate = async (textResumeId, resumeBoardId, verbose = true, jobId, feedProcessingId, jobFoundCount) => {
  let token = await getAuthToken()
  let resultLimit = await checkLimit('monster')
  if (resultLimit) {
    console.log('limit was exceed up your limit for download Resume')
    await feedProcessingRepository.update({ status: 'interrupted', pid: null }, feedProcessingId).catch((err) => console.log(err.message))
    process.exit(1)
  }
  return axios
    .get(`https://api.jobs.com/v2/candidates/${textResumeId}`, {
      params: {
        resumeBoardId: resumeBoardId,
        verbose: verbose,
      },
      headers: {
        Authorization: token,
      },
    })
    .then(async (value) => {
      let data = value.data
      await this.saveCandidateInfo(data, jobId, feedProcessingId, jobFoundCount)
      return data
    })
    .catch((reason) => {
      console.log(reason)
    })
}

module.exports.getCandidateAsync = async (textResumeId, resumeBoardId, verbose) => {
  //TODO
  let token = await getAuthToken()
  let resultLimit = await await checkLimit('monster')
  if (resultLimit) return resultLimit
  return axios
    .get(`https://api.jobs.com/v2/candidates/${textResumeId}`, {
      params: {
        resumeBoardId: resumeBoardId,
        verbose: verbose,
      },
      headers: {
        Authorization: token,
      },
    })
    .then(async (value) => {
      let data = value.data
      this.saveCandidateInfo(data)
      return data
    })
    .catch((reason) => console.log(reason))
  // const response=require("../resources/response_1589296928182.json");
  // this.saveCandidateInfo(response);
  // return  response;
}

module.exports.saveCandidateInfo = async (data, jobId, feedProcessingId, jobFoundCount) => {
  let source = 'monster'
  let externalId = data.identity.textResumeID

  let rawCandidateModel = await rawCandidateRepository
    .create({
      source_type: source,
      external_id: externalId,
      job_id: jobId,
      data: data,
      feed_processing_id: feedProcessingId,
      jobs_found: jobFoundCount,
    })
    .catch((reason) => {
      console.log(reason.name, reason.sql, reason.message)
    })
  if (rawCandidateModel) {
    if (config.ENABLE_RESUME_PARSER) {
      let result = await hrCvMapping(data)
      result = _.pick(result, _.identity)
      result.raw_candidate_info_id = rawCandidateModel.id
      if (!_.isNull(result.data)) {
        let result2 = await hrJsonCandidateInfoRepository.create(result).catch((err) => {
          console.log(err)
        })
        return result2
      }
    }
  }
}

async function getAuthToken() {
  if (_.isUndefined(authToken)) {
    return await auth()
  }

  if (!_.isNull(authToken)) {
    let token = authToken.substr('Bearer '.length, authToken.length)
    let decoded = jwt.decode(token)
    let exp = decoded.exp
    if (Date.now() >= exp * 1000) {
      return await auth()
    }
  }
  return authToken
}

async function auth() {
  return await axios
    .post(
      'https://sso.monster.com/core/connect/token',
      qs.stringify({
        client_id: config.CLIENT_ID,
        client_secret: config.CLIENT_SECRET,
        scope: 'GatewayAccess',
        grant_type: 'client_credentials',
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      },
    )
    .then((value) => {
      let res = value.data
      authToken = res.token_type + ' ' + res.access_token
      return authToken
    })
    .catch((reason) => console.log(reason.code))
}
