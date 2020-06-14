const cron = require('node-cron')
const moment = require('moment')
const cp = require('child_process')
let task

async function createCron() {
  const dateFrom = moment().startOf('day').subtract(1, 'days').format('MM-DD-YYYY')
  const dateTo = moment().endOf('day').format('MM-DD-YYYY')
  const stepBy = 30
  const countOnly = false
  task = cron.schedule(
    `0 0 1-31 * *`,
    async () => {
      console.log('SHEDULED WEILL START')
      console.log(dateFrom, dateTo, countOnly)
      const child = cp.spawn(`node   ${process.cwd()}/workers/lensaWorker.js`, [dateFrom, dateTo, stepBy, countOnly], { shell: true })
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
