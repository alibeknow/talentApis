const cron = require('node-cron')
const _ = require('underscore')
const feedControllerService = require('../services/feedControllerService')
const { config } = require('../db/models')
const dbLogger = require('../modules/dbLogger')
let result, task, newResult

module.exports = async function createCron() {
  console.log('cron func is started')
  result = await config.findOne({ where: { name: 'monster' } })

  const { data } = result
  const monster = data
  console.log('monsterSheduler', monster)
  let valid = cron.validate(`${monster.minutes} ${monster.hours} ${monster.days} ${monster.month} ${monster.nameOfMonths}`)
  if (!valid) {
    console.log('cron is not valid')
    await dbLogger('cron of monster is not valid', 'feedStartError', monster)
  }

  task = cron.schedule(`${monster.minutes} ${monster.hours} ${monster.days} ${monster.month} ${monster.nameOfMonths}`, async () => {
    console.log('cron is started')
    //TODO will be moved in app configuration

    newResult = await config.findOne({ where: { name: 'monster' } })
    const newMonsterData = newResult.data
    if (!_.isEqual(monster, newMonsterData)) {
      console.log('WE ARE STOPPED')
      task.stop()
      task.destroy()
      createCron()
      console.log('start with new parameters')
    } else {
      console.log('WE ARE STARTED', monster)
    }
    monster.feeds.forEach((feedUrl) => {
      console.log(feedUrl.active)
      if (feedUrl.active == 'true' || feedUrl.active === true || feedUrl.active == '1')
        feedControllerService
          .startProcess(feedUrl.url, monster.lastUpdateDays, monster.candidateQuantityPerJob, monster.parallelProcess, false, 'monster', feedUrl.name)
          .catch((err) => {
            console.log('shedulerErrror', err)
          })
    })
  })

  task.start()
  console.log('START TASK', task.getStatus())
}
