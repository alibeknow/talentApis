const lensaService = require('../services/lensaService')
const feedProcessingRepository = require('../repository/feedProcessingRepository')
let talentPromises = []
const fs = require('fs')
const pLimit = require('p-limit')
const sleep = require('sleep')

exports = myresult = async (dateFrom = '06-09-2020', dateTo = '06-10-2020', stepBy = 30, countOnly = false) => {
  let fileName
  let cutsArray
  console.log(dateFrom, dateTo)
  const limit = pLimit(stepBy)
  let urlParam = `https://api.lensa.com/coreg/v1/get-leads?${dateFrom}&${dateTo}`
  let allCandidates = await lensaService.getCandidates(dateTo, dateFrom).catch((err) => console.log(err))
  let feedProcessing = await feedProcessingRepository
    .create({ url: urlParam, talents_found: allCandidates.length, pid: process.pid })
    .catch((err) => console.log(err.message))
  if (!countOnly || countOnly == 'false') {
    let myResults = await allCandidates.forEach(async (item) => {
      if (item.resume && item.resume.download_url) {
        await sleep.msleep(25)
        talentPromises = [limit(() => lensaService.getCandidate(item.resume.download_url, item))]
      } else {
        await lensaService.saveCandidateInfo(item).catch((err) => console.log(err))
      }
      return item
    })

    await Promise.all(talentPromises)
      .catch((err) => console.log(err.name, err.message))
      .catch((err) => console.log(err))
  }
  await feedProcessingRepository.update({ status: 'complete', pid: null }, feedProcessing.id).catch((err) => console.log(err.message))
  process.exit(0)
}
myresult(process.argv[2], process.argv[3], process.argv[4], process.argv[5])
