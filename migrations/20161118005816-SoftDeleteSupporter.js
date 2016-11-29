'use strict';

module.exports = {
  up: function (queryInterface, Sequelize) {

    return queryInterface.addColumn('researchers', 'isActive', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true
    });
   
  },

  down: function (queryInterface, Sequelize) {
    return queryInterface.removeColumn('researchers', 'isActive');
    
  }
};
