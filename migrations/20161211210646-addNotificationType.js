'use strict';

module.exports = {
  up: function (queryInterface, Sequelize) {
    queryInterface.addColumn('notifications', 'type', {
      type: Sequelize.STRING,
      allowNull: true
    });

    return;
  },

  down: function (queryInterface, Sequelize) {
     queryInterface.removeColumn('notifications', 'type');
  }
};
