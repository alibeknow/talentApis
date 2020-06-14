'use strict'

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('hr_json_candidate_info', 'resume', {
      type: Sequelize.TEXT('long'),
      allowNull: true,
    })
    await queryInterface.changeColumn('hr_json_candidate_info', 'html', {
      type: Sequelize.TEXT('long'),
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
