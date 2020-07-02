const cron = require('node-cron')
const _ = require('underscore')
const feedControllerService = require('../services/feedControllerService')
const { config } = require('../db/models')
const dbLogger = require('../modules/dbLogger')
let result, task, newResult

module.exports = async function createCron() {
  console.log('cron func is started')
  result = await config.findOne({ where: { name: 'dice' } })

  const { data } = result
  const dice = data
  console.log('dicerSheduler', dice)
  let valid = cron.validate(`${dice.minutes} ${dice.hours} ${dice.days} ${dice.month} ${dice.nameOfMonths}`)
  if (!valid) {
    await dbLogger('cron is not valid', 'feedStartError', dice)
    console.log('cron of dice is not valid')
  }
  task = cron.schedule(`${dice.minutes} ${dice.hours} ${dice.days} ${dice.month} ${dice.nameOfMonths}`, async () => {
    console.log('cron is started')
    //TODO will be moved in app configuration

    newResult = await config.findOne({ where: { name: 'dice' } })
    const newDiceData = newResult.data
    if (!_.isEqual(dice, newDiceData)) {
      console.log('WE ARE STOPPED')
      task.stop()
      task.destroy()
      createCron()
      console.log('start with new parameters')
    } else {
      console.log('WE ARE STARTED', dice)
    }

    dice.feeds.forEach((feedUrl) => {
      console.log(feedUrl)
      if (feedUrl.active == 'true' || feedUrl.active === true || feedUrl.active == '1')
        feedControllerService
          .startProcess(feedUrl.url, dice.lastUpdateDays, dice.candidateQuantityPerJob, dice.parallelProcess, false, 'dice', feedUrl.name)
          .catch((err) => console.log(err))
    })
  })

  task.start()
  console.log('START TASK', task.getStatus())
}
