const lensaService = require('../services/lensaService')
const feedProcessingRepository = require('../repository/feedProcessingRepository')
let talentPromises = []
const fs = require('fs')
const pLimit = require('p-limit')
const sleep = require('sleep')
const dbLogger = require('../modules/dbLogger')

myresult(process.argv[2], process.argv[3], process.argv[4], process.argv[5], process.argv[6]).catch((err) => console.log(err))

async function myresult(dateFrom = '06-24-2020', dateTo = '06-27-2020', stepBy = 30, countOnly = false, feedName = 'test') {
  let limit = pLimit(parseInt(stepBy))
  let allCandidates
  let urlParam = `https://api.lensa.com/coreg/v1/get-leads?date_from=${dateFrom}&date_to=${dateTo}&token=secret`
  try {
    allCandidates = await lensaService.getCandidates(dateTo, dateFrom)
  } catch (error) {
    await dbLogger(error, 'serviceError', {
      urlParam,
      countOnly,
      source: 'lensa',
      parallelProcess: stepBy,
    })
    console.log(error)
  }

  const processId = process.pid
  let params = { dateFrom, dateTo, stepBy, countOnly, feedName, source: 'lensa' }
  let feedProcessing = await feedProcessingRepository
    .create({ url: urlParam, talents_found: allCandidates.length, pid: processId, parameters: params })
    .catch((err) => console.log(err.message))
  if (!countOnly || countOnly == 'false' || countOnly == '0') {
    for (let item of allCandidates) {
      if (item.resume && item.resume.download_url) {
        await sleep.msleep(25)
        talentPromises = [
          limit(async () => {
            await lensaService.getCandidate(item.resume.download_url, item, feedProcessing.id).then(async (val) => {
              await feedProcessingRepository.increment('candidates', 1, { id: feedProcessing.id }).catch(async (error) => {
                console.log(error)
                await dbLogger(error, 'Matcherror', {
                  urlParam: urlParam,
                  feedProcessingId: feedProcessing.id,
                  source: 'lensa',
                  parallelProcess: stepBy,
                })
              })
            })
          }),
        ]
      } else {
        try {
          await lensaService.saveCandidateInfo(item, null, null, feedProcessing.id)
          await feedProcessingRepository.increment('candidates', 1, { id: feedProcessing.id }).catch(async (error) => {
            console.log(error)
            await dbLogger(error, 'Matcherror', {
              urlParam: urlParam,
              feedProcessingId: feedProcessing.id,
              source: 'lensa',
              parallelProcess: stepBy,
            })
          })
        } catch (error) {
          console.log(error)
        }
      }
    }
    try {
      await Promise.all(talentPromises).catch(async (err) => {
        console.log(err)
        await dbLogger(err, 'serviceError')
      })
    } catch (error) {
      console.log(error)
      await dbLogger(error, 'serviceError', {
        urlParam,
        feedProcessingId: feedProcessing.id,
        source: 'lensa',
      })
    }
  }
  try {
    await feedProcessingRepository.update({ status: 'complete', pid: null }, feedProcessing.id)
  } catch (error) {
    console.log(error)
    await dbLogger(error, 'serviceError', {
      urlParam,
      feedProcessingId: feedProcessing.id,
      source: 'lensa',
      parallelProcess: stepBy,
    })
  }
  process.exit(0)
}
