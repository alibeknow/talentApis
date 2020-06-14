const { hr_json_candidate_info } = require('../db/models/index')

module.exports = {
  create: async (model) => {
    return hr_json_candidate_info.create(model)
  },
}
