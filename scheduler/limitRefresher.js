const cron = require('node-cron')
const moment = require('moment')
const cp = require('child_process')
const configRepository = require('../repository/configRepository')

async function createCron() {
  let taskMonth = cron.schedule(`0 0 1 1-12 *`, async () => {
    //EVERY MONTH at 00:00
    await configRepository.refreshLimit('monster', 'month')
    await configRepository.refreshLimit('lensa', 'month')
    await configRepository.refreshLimit('dice', 'month')
  })
  taskMonth.start()
  let dailytask = cron.schedule(`0 0 1-31 * *`, async () => {
    //EVERY day at 00:00
    await configRepository.refreshLimit('monster', 'month')
    await configRepository.refreshLimit('lensa', 'month')
    await configRepository.refreshLimit('dice', 'month')
  })
  dailytask.start()
  console.log('sheduler for refresh daily,monthly started')
}
createCron()
