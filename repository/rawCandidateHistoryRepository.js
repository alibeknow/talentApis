const { raw_candidate_info_history } = require('../db/models/index')

module.exports = {
  create: async (model) => {
    return raw_candidate_info_history.create(model)
  },
}
