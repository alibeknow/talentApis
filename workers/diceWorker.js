'use strict'

const _ = require('underscore')
const fs = require('fs')
const XmlStream = require('xml-stream')
const https = require('https')
const url = require('url')
const path = require('path')
const zlib = require('zlib')
const config = require('../config/common')
const diceService = require(`../services/diceService`)
const candidateControllerService = require('../services/candidateControllerService')
const feedProcessingRepository = require('../repository/feedProcessingRepository')
const rawCandidateRepository = require('../repository/rawCandidateRepository')
const configRepository = require('../repository/configRepository')
const dbLogger = require('../modules/dbLogger')
feedProcess(
  process.argv[2] || 'https://cloud.glo.net/feeds/rss_camp_group_46.xml.gz',
  process.argv[3] || 25,
  process.argv[4] || 14,
  process.argv[5] || 3,
  process.argv[6] || 500,
  process.argv[7] || false,
)

async function feedProcess(
  urlParam,
  feedProcessingId,
  lastUpdateDays = 14,
  candidateQuantityPerJob = 3,
  parallelProcess = 25,
  harversterMode = false,
) {
  let resultConfig = await configRepository.findOne({ name: 'limit' })
  const {
    data: { dice },
  } = resultConfig
  if (dice.month > 0 && dice.currentTotal > 0 && (dice.currentTotal >= dice.month || dice.currentTotal >= dice.totalLimit)) {
    await dbLogger({ err: 'maximum limit is Exceed please up your download Limit' }, 'Matcherror', {
      urlParam,
      feedProcessingId,
      lastUpdateDays,
      candidateQuantityPerJob,
      parallelProcess,
      harversterMode,
      source: 'dice',
    })
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
      .on('error', async (err) => {
        await dbLogger(err, 'downloadError', {
          urlParam,
          feedProcessingId,
          lastUpdateDays,
          candidateQuantityPerJob,
          parallelProcess,
          harversterMode,
          source: 'dice',
        })
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
      .on('finish', async (err) => {
        if (err) {
          await dbLogger(err, 'unpackError', {
            urlParam,
            feedProcessingId,
            lastUpdateDays,
            candidateQuantityPerJob,
            parallelProcess,
            harversterMode,
            source: 'dice',
          })
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
        searchParameters: {
          sortBy: 'activityDate',
          sortByDirection: 'desc',
          page: 1,
          pageSize: 3,
          jobTitleKeyword: item.title,
          input: item.description,
          dateResumeLastUpdated: lastUpdateDays,
          locations: [
            {
              value: `${item.city}, ${item.state}, ${item.country}`,
            },
          ],
        },
      }

      matchCandidatesPromises.push(matchCandidates(searchRequest, item, feedProcessingId, candidateQuantityPerJob, harversterMode))

      if (matchCandidatesPromises.length === parseInt(parallelProcess)) {
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
    xml.on('error', async (err) => {
      await dbLogger(err, 'xmlError', {
        urlParam,
        feedProcessingId,
        lastUpdateDays,
        candidateQuantityPerJob,
        parallelProcess,
        harversterMode,
        source: 'dice',
      })
      console.log(err)
    })
    xml.on('end', async (value) => {
      fs.unlink(xmlFilePath, () => {})
      if (matchCandidatesPromises.length > 0) await Promise.all(matchCandidatesPromises)
      await feedProcessingRepository.update({ status: 'complete' }, feedProcessingId).catch((err) => console.log(err.message))
      await dbLogger(value, 'success', {
        urlParam,
        feedProcessingId,
        lastUpdateDays,
        candidateQuantityPerJob,
        parallelProcess,
        harversterMode,
        source: 'dice',
      })

      process.exit(0)
    })

    resolve()
  }).catch(async (err) => {
    await dbLogger(err, 'someError', {
      urlParam,
      feedProcessingId,
      lastUpdateDays,
      candidateQuantityPerJob,
      parallelProcess,
      harversterMode,
      source: 'dice',
    })
    console.log(err)
    reject(err)
  })
}

async function matchCandidates(searchRequest, item, feedProcessingId, candidateQuantityPerJob, harversterMode) {
  let jobId = item.jobID
  let jobFoundCount = 0

  console.log(`start process xml item with id = ${jobId}`)
  // convert auto matching to semantic request

  // let searchResponse = await candidateControllerService.getCandidates(searchRequest, 1, 1, true)
  // // get semantic search
  // let semanticSearchRequest = searchResponse.searchCriteria.equivalentSemanticSearch //TypeError: Cannot read property 'searchCriteria' of undefined

  // set resumeUpdatedMaximumAge criteria
  // semanticSearchRequest.semantic.resumeUpdatedMaximumAge = lastUpdateDays
  //  let diceSearchRequest = await searchMapping(semanticSearchRequest, 1, candidateQuantityPerJob, item.country)

  // find candidates with resumeUpdatedMaximumAge criteria
  let semanticSearchResponse = await diceService.getCandidates(searchRequest, 1, candidateQuantityPerJob, true)
  if (!_.isUndefined(semanticSearchResponse)) {
    jobFoundCount = semanticSearchResponse.meta.totalCount
    await feedProcessingRepository.increment('talents_found', jobFoundCount, { id: feedProcessingId })
    if (!harversterMode || harversterMode == 'false') {
      let candidates = semanticSearchResponse.data

      if (!_.isEmpty(candidates)) {
        let promises = []
        for (const candidate of candidates) {
          let textResumeId = candidate.id
          let dbCandidate = await rawCandidateRepository.findOne({ source_type: 'dice', external_id: textResumeId }).catch((err) => console.log(err))
          if (!_.isUndefined(dbCandidate) && !_.isNull(dbCandidate)) {
            let dbCandidateResumeModifiedDate = dbCandidate.data.dateResumeLastUpdated
            let candidateResumeModifiedDate = candidate.dateResumeLastUpdated

            // dates on 7 days plus
            if (Date.parse(dbCandidateResumeModifiedDate) + 7 * 60 * 60 * 24 * 1000 >= Date.parse(candidateResumeModifiedDate)) {
              // no need clone existing object for job
              /*candidateControllerService.saveCandidateInfo(JSON.parse(dbCandidate.data), jobId, feedProcessingId).then(value => {
                              console.log(`candidate with ${textResumeId} has been cloned for job ${jobId}`);
                          });*/
            } else {
              // we must get only new candidates
              promises.push(
                diceService.getCandidate(textResumeId, null, true, jobId, feedProcessingId, jobFoundCount).then(async (data) => {
                  await feedProcessingRepository.increment('candidates', 1, { id: feedProcessingId }).catch((error) => console.log(error))
                }),
              )
            }
          } else {
            promises.push(
              diceService.getCandidate(textResumeId, null, true, jobId, feedProcessingId, jobFoundCount).then(async (data) => {
                await feedProcessingRepository.increment('candidates', 1, { id: feedProcessingId }).catch((error) => console.log(error))
              }),
            )
          }
        }
        let promise = Promise.all(promises)
        await promise.catch(async (reason) => {
          await dbLogger(reason, 'error', {
            urlParam,
            feedProcessingId,
            lastUpdateDays,
            candidateQuantityPerJob,
            parallelProcess,
            harversterMode,
            source: 'dice',
          })
          console.log('matchFuncError', reason)
        })
      } else {
        console.log('no candidates found')
      }
    }
  }
  console.log(`end process xml item with id = ${jobId}`)
}

async function searchMapping(searchCriteria, page, pageSize, country) {
  let locations = null
  let jobTitle
  if (searchCriteria.semantic.jobTitles) {
    jobTitle = searchCriteria.semantic.jobTitles.join(' OR ')
  }
  let skills = null
  if (searchCriteria.semantic.skills && searchCriteria.semantic.skills.length > 0) {
    skills = searchCriteria.semantic.skills
      .map((item) => {
        return item.name
      })
      .join(',')
    skills = _.escape(skills)
  }
  if (searchCriteria.semantic.locations && searchCriteria.semantic.locations.length > 0) {
    locations = []
    let nameCity
    for (let item of searchCriteria.semantic.locations) {
      if (item.city && item.state && country) {
        nameCity = `${item.city}, ${item.state}, ${country}`
      } else if (item.city && item.state) {
        nameCity = `${item.city}, ${item.state}`
      } else {
        nameCity = item.city
      }
      locations.push({
        value: `${item.city}, ${item.state}`,
      })
    }
  }
  return {
    searchParameters: {
      sortBy: 'activityDate',
      page: page,
      input: jobTitle,
      pageSize: pageSize,
      skills: skills,
      sortByDirection: 'desc',
      dateResumeLastUpdated: searchCriteria.semantic.resumeUpdatedMaximumAge,
      locations: locations,
    },
  }
}
