'use strict'

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addIndex('raw_candidate_info', { fields: ['source_type', 'external_id'] })
  },

  down: async (queryInterface, Sequelize) => {},
}
