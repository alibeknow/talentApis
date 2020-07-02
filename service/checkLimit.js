const configRepository = require('../repository/configRepository')

module.exports = async (source) => {
  let resultConfig = await configRepository.findOne({ name: 'limit' })
  if (resultConfig) {
    let { data } = resultConfig
    if (
      (data[source].days > 0 && data[source].currentDay >= data[source].days) ||
      (data[source].month > 0 && data[source].currentMonth >= data[source].month) ||
      (data[source].totalLimit > 0 && data[source].currentTotal >= data[source].totalLimit)
    ) {
      return { message: 'maximum limit is Exceed please up your download Limit', code: -1 }
    } else {
      try {
        await configRepository.increment(1, source)
      } catch (error) {
        console.log(error)
      }
    }
  }
}
