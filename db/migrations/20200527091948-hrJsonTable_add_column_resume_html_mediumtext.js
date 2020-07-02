'use strict'

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('hr_json_candidate_info', 'resume', {
      type: Sequelize.TEXT('medium'),
      allowNull: true,
    })
    await queryInterface.addColumn('hr_json_candidate_info', 'html', {
      type: Sequelize.TEXT('medium'),
      allowNull: true,
    })
  },
  down: (queryInterface, Sequelize) => {
    /*
      Add reverting commands here.
      Return a promise to correctly handle asynchronicity.

      Example:
      return queryInterface.dropTable('users');
    */
  },
}
