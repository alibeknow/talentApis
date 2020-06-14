'use strict'

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.bulkInsert('config', [
      {
        name: 'cronFreq',
        data: JSON.stringify({
          monster: { days: '1-31', hours: '0', month: '*', minutes: '0', nameOfMonths: '*' },
          dice: {
            days: '1-31',
            hours: '0',
            month: '*',
            minutes: '25',
            nameOfMonths: '*',
          },
          lastUpdateDays: 14,
          candidateQuantityPerJob: 3,
          parallelProcess: 500,
        }),
      },
    ])
  },

  down: (queryInterface, Sequelize) => {
    /*
      Add reverting commands here.
      Return a promise to correctly handle asynchronicity.

      Example:
      return queryInterface.bulkDelete('People', null, {});
    */
  },
}
