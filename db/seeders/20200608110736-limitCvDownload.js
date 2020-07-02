'use strict'

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.bulkInsert('config', [
      {
        name: 'limit',
        data: JSON.stringify({
          monster: {
            days: '0',
            month: '8000',
            totalLimit: '10000',
            currentDay: '0',
            currentMonth: '0',
            currentTotal: '0',
          },
          dice: {
            days: '0',
            month: '8000',
            totalLimit: '10000',
            currentDay: '0',
            currentMonth: '0',
            currentTotal: '0',
          },
          lensa: {
            days: '0',
            month: '8000',
            totalLimit: '10000',
            currentDay: '0',
            currentMonth: '0',
            currentTotal: '0',
          },
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
