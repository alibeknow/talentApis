const cron = require('node-cron')
const _ = require('underscore')
const feedControllerService = require('../services/feedControllerService')
const { config } = require('../db/models')
let result, task, newResult

async function createCron() {
  console.log('cron func is started')
  result = await config.findOne({ where: { name: 'cronFreq' } })
  const {
    data: { dice },
  } = result
  let valid = cron.validate(`${dice.minutes} ${dice.hours} ${dice.days} ${dice.month} ${dice.nameOfMonths}`)
  if (!valid) {
    console.log('cron is not valid')
  }
  console.log(dice)
  task = cron.schedule(`${dice.minutes} ${dice.hours} ${dice.days} ${dice.month} ${dice.nameOfMonths}`, async () => {
    console.log('cron is started')
    //TODO will be moved in app configuration
    let feeds = [
      'https://cloud.glo.net/feeds/rss_camp_group_46.xml.gz',
      'https://cloud.glo.net/feeds/rss_camp_group_44.xml.gz',
      'https://cloud.glo.net/feeds/rss_camp_group_14.xml.gz',
      'https://cloud.glo.net/feeds/rss_camp_group_1.xml.gz',
      'https://cloud.glo.net/feeds/rss_camp_group_9.xml.gz',
    ]
    newResult = await config.findOne({ where: { name: 'cronFreq' } })
    if (!_.isMatch(dice, newResult.data.dice)) {
      console.log('WE ARE STOPPED')
      task.stop()
      task.destroy()
      createCron()
      console.log('start with new parameters')
    } else {
      console.log('WE ARE STARTED', result.data.dice)
    }

    feeds.forEach((feedUrl) => {
      feedControllerService.startProcess(
        feedUrl,
        result.data.lastUpdateDays,
        result.data.candidateQuantityPerJob,
        result.data.parallelProcess,
        false,
        'dice',
      )
    })
  })

  task.start()
  console.log('START TASK', task.getStatus())
}
createCron()
