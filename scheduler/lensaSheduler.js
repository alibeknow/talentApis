const cron = require('node-cron')
const moment = require('moment')
const cp = require('child_process')
const { config } = require('../db/models')
const _ = require('underscore')
let task

async function createCron() {
  console.log('cron func is started')
  result = await config.findOne({ where: { name: 'lensa' } })
  const lensa = result.data
  console.log('lensaSheduler', lensa)
  let valid = cron.validate(`${lensa.minutes} ${lensa.hours} ${lensa.days} ${lensa.month} ${lensa.nameOfMonths}`)
  if (!valid) {
    await dbLogger('cron is not valid', 'feedStartError', lensa)
    console.log('cron of dice is not valid')
  }
  newResult = await config.findOne({ where: { name: 'lensa' } })
  const newLensaData = newResult.data
  if (!_.isEqual(lensa, newLensaData)) {
    console.log('WE ARE STOPPED')
    task.stop()
    task.destroy()
    createCron()
    console.log('start with new parameters')
  } else {
    console.log('WE ARE STARTED', lensa)
  }
  task = cron.schedule(
    `${lensa.minutes} ${lensa.hours} ${lensa.days} ${lensa.month} ${lensa.nameOfMonths}`,
    async () => {
      const dateFrom = moment().startOf('day').subtract(parseInt(lensa.periodByDays), 'days').format('MM-DD-YYYY')
      const dateTo = moment().endOf('day').format('MM-DD-YYYY')
      const stepBy = lensa.parallelProcess
      const countOnly = lensa.notImportResume
      console.log('SHEDULER WILL START')
      console.log(dateFrom, dateTo, countOnly)

      const child = cp.spawn(`node   ${process.cwd()}/workers/lensaWorker.js`, [dateFrom, dateTo, stepBy, countOnly, lensa.name], { shell: true })
      child.stdout.on('data', (data) => console.log('Files list: \n', data.toString('utf-8')))
      child.stderr.on('error', (error) => console.log('Error: \n', error))
      child.on('close', (code) => console.log('child process exited with code ' + code))
    },
    {
      scheduled: true,
    },
  )
  task.start()
  console.log(task.getStatus())
}
createCron()
