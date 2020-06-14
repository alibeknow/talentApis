'use strict'

const _ = require('underscore')
const fs = require('fs')
const XmlStream = require('xml-stream')
const https = require('https')
const url = require('url')
const path = require('path')
const zlib = require('zlib')
const config = require('../config/common')
const candidateControllerService = require(`../services/candidateControllerService.js`)
const feedProcessingRepository = require('../repository/feedProcessingRepository')
const rawCandidateRepository = require('../repository/rawCandidateRepository')
const configRepository = require('../repository/configRepository')
feedProcess(
  process.argv[2] || 'https://cloud.glo.net/feeds/rss_camp_test.xml.gz',
  process.argv[3] || 25,
  process.argv[4] || 14,
  process.argv[5] || 3,
  process.argv[6] || 500,
  process.argv[7] || false,
).catch((err) => console.log(err))

async function feedProcess(
  urlParam,
  feedProcessingId,
  lastUpdateDays = 14,
  candidateQuantityPerJob = 3,
  parallelProcess = 500,
  harversterMode = false,
) {
  let resultConfig = await configRepository.findOne({ name: 'limit' }).catch((err) => console.log(err))
  const {
    data: { monster },
  } = resultConfig
  if (monster.month > 0 && monster.currentTotal > 0 && (monster.currentTotal >= monster.month || monster.currentTotal >= monster.totalLimit)) {
    console.log('maximum limit is Exceed please up your download Limit')
    process.exit(1)
  }

  await feedProcessingRepository.update({ pid: process.pid }, feedProcessingId)
  let fileName = path.basename(url.parse(urlParam).pathname)
  if (!fs.existsSync(config.DOWNLOAD_DIR_PATH)) {
    fs.mkdirSync(config.DOWNLOAD_DIR_PATH)
  }
  let filePath = `${config.DOWNLOAD_DIR_PATH}${fileName}`
  let file = fs.createWriteStream(filePath)

  await new Promise((resolve, reject) => {
    console.log(`start download ${urlParam}`)
    https
      .get(urlParam, (response) => {
        response.pipe(file)
        file.on('finish', () => {
          file.close()
          console.log(`end download ${urlParam}`)
          resolve()
        })
      })
      .on('error', (err) => {
        console.log(err)
        fs.unlink(filePath, () => {})
        reject(err)
      })
  }).catch((err) => console.log(err))

  let xmlFilePath = filePath.slice(0, -3)
  await new Promise((resolve, reject) => {
    console.log(`start unpack ${filePath}`)
    const fileContents = fs.createReadStream(filePath)
    const writeStream = fs.createWriteStream(xmlFilePath)
    const unzip = zlib.createGunzip()
    fileContents
      .pipe(unzip)
      .pipe(writeStream)
      .on('finish', (err) => {
        if (err) {
          return reject(err)
        } else {
          console.log(`end unpack ${filePath}`)
          fs.unlink(filePath, () => {})
          resolve()
        }
      })
  }).catch((err) => console.log(err))

  console.log(`start processing feed ${urlParam}`, xmlFilePath)
  //Subscribe for FirstEvent
  await new Promise((resolve, reject) => {
    let readStream = fs.createReadStream(xmlFilePath)

    let xml = new XmlStream(readStream)
    let matchCandidatesPromises = []
    xml.on('endElement: item', async function (item) {
      let searchRequest = {
        searchType: 'JobDetail',
        jobDetail: {
          jobTitle: item.title,
          jobDescription: item.description,
          locations: [
            {
              city: item.city,
              state: item.state,
              country: item.country,
            },
          ],
        },
      }

      matchCandidatesPromises.push(matchCandidates(searchRequest, item, feedProcessingId, lastUpdateDays, candidateQuantityPerJob, harversterMode))

      if (matchCandidatesPromises.length === parallelProcess) {
        xml.pause()

        await Promise.all(matchCandidatesPromises).catch((reason) => console.log('matchReason', reason))
        matchCandidatesPromises = []
        xml.resume()
      }

      await feedProcessingRepository.increment('jobs', 1, { id: feedProcessingId }).catch((error) => console.log(error.message))
    })

    xml.on('endElement: channel', async (channel) => {
      channel.item = null
      await feedProcessingRepository.update({ details: channel }, feedProcessingId).catch((error) => console.log(error.message))
    })
    xml.on('error', (err) => {
      console.log(err)
    })
    xml.on('end', async (value) => {
      await feedProcessingRepository.update({ status: 'complete' }, feedProcessingId).catch((err) => console.log(err.message))
      fs.unlink(xmlFilePath, () => {})
    })

    resolve()
  }).catch((err) => {
    console.log(err)
    reject(err)
  })
}

async function matchCandidates(searchRequest, item, feedProcessingId, lastUpdateDays, candidateQuantityPerJob, harversterMode) {
  let jobId = item.jobID
  let jobFoundCount = 0

  console.log(`start process xml item with id = ${jobId}`)
  // convert auto matching to semantic request

  let searchResponse = await candidateControllerService.getCandidates(searchRequest, 1, 1, true)
  // get semantic search

  let semanticSearchRequest = searchResponse.searchCriteria.equivalentSemanticSearch //TypeError: Cannot read property 'searchCriteria' of undefined

  if (searchResponse.boards.length > 0) {
    jobFoundCount = searchResponse.boards[0].matched
    await feedProcessingRepository.increment('talents_found', jobFoundCount, { id: feedProcessingId })
  }

  // set resumeUpdatedMaximumAge criteria
  semanticSearchRequest.semantic.resumeUpdatedMaximumAge = lastUpdateDays * 24 * 60
  // find candidates with resumeUpdatedMaximumAge criteria
  let semanticSearchResponse = await candidateControllerService.getCandidates(semanticSearchRequest, 1, candidateQuantityPerJob, true)

  if (!_.isUndefined(semanticSearchResponse)) {
    if (!harversterMode || harversterMode == 'false') {
      let candidates = semanticSearchResponse.candidates

      if (!_.isEmpty(candidates)) {
        let firstBoard = semanticSearchResponse.boards[0].id
        let promises = []

        for (const candidate of candidates) {
          let textResumeId = candidate.identity.textResumeID

          let dbCandidate = await rawCandidateRepository
            .findOne({ source_type: 'monster', external_id: textResumeId })
            .catch((err) => console.log(err))
          if (!_.isUndefined(dbCandidate) && !_.isNull(dbCandidate)) {
            let dbCandidateResumeModifiedDate = dbCandidate.data.resume_modified_date
            let candidateResumeModifiedDate = candidate.identity.resumeModifiedDate

            // dates on 5 hours differ
            if (Date.parse(dbCandidateResumeModifiedDate) - 18000000 >= Date.parse(candidateResumeModifiedDate)) {
              // no need clone existing object for job
              /*candidateControllerService.saveCandidateInfo(JSON.parse(dbCandidate.data), jobId, feedProcessingId).then(value => {
                              console.log(`candidate with ${textResumeId} has been cloned for job ${jobId}`);
                          });*/
            } else {
              // we must get only new candidates
              promises.push(
                candidateControllerService.getCandidate(textResumeId, firstBoard, true, jobId, feedProcessingId, jobFoundCount).then(async (data) => {
                  await feedProcessingRepository.increment('candidates', 1, { id: feedProcessingId }).catch((error) => console.log(error))
                }),
              )
            }
          } else {
            promises.push(
              candidateControllerService.getCandidate(textResumeId, firstBoard, true, jobId, feedProcessingId, jobFoundCount).then(async (data) => {
                await feedProcessingRepository.increment('candidates', 1, { id: feedProcessingId }).catch((error) => console.log(error))
              }),
            )
          }
        }

        let promise = Promise.all(promises)
        await promise.catch((reason) => {
          console.log(reason)
        })
      } else {
        console.log('no candidates found')
      }
    }
  }
  console.log(`end process xml item with id = ${jobId}`)
}
