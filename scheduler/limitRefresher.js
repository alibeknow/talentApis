const cron = require('node-cron')
const moment = require('moment')
const cp = require('child_process')
const configRepository = require('../repository/configRepository')

async function createCron() {
  let taskMonth = cron.schedule(`0 0 1 1-12 *`, async () => {
    //EVERY MONTH at 00:00
    await configRepository.refreshLimit('monster', 'currentMonth')
    await configRepository.refreshLimit('lensa', 'currentMonth')
    await configRepository.refreshLimit('dice', 'currentMonth')
  })
  taskMonth.start()
  let dailytask = cron.schedule(`0 0 1-31 * *`, async () => {
    //EVERY day at 00:00

    await configRepository.refreshLimit('monster', 'currentDay')
    await configRepository.refreshLimit('lensa', 'currentDay')
    await configRepository.refreshLimit('dice', 'currentDay')
  })
  dailytask.start()
  console.log('sheduler for refresh daily,monthly started')
}
createCron()
