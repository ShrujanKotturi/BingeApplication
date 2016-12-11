'use strict';

module.exports = {
  up: function (queryInterface, Sequelize) {
    var db = {};
    db.motivational = queryInterface.createTable('motivationalMessages', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true,
      },
      message: {
        type: Sequelize.STRING(10000),
        allowNull: false
      },
      stepId: {
        type: Sequelize.STRING(10000),
        allowNull: false
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    },
      {
        timestamps: true,
        createdAt: 'dateCreated',
        updatedAt: 'dateUpdated'
      });
    return db;
  },

  down: function (queryInterface, Sequelize) {
    var db = {};
    db.motivational = queryInterface.dropTable('motivationalMessages');
    return db;
  }
};
