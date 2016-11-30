'use strict';

module.exports = {
  up: function (queryInterface, Sequelize) {
    var db = {};
    db.steps = queryInterface.createTable('steps', {
      stepId: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true,
      },
      description: {
        type: Sequelize.STRING,
        allowNull: false
      },
      checkList: {
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

    db.response = queryInterface.createTable('response', {
      responseId: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true,
      },
      stepId: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      userResponse: {
        type: Sequelize.STRING,
        allowNull: false
      },
      comments: {
        type: Sequelize.STRING
      },
      logDateTime: {
        type: Sequelize.DATE,
        allowNull: false
      },
      userId: {
        type: Sequelize.STRING,
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
    }, {
        timestamps: true,
        createdAt: 'dateCreated',
        updatedAt: 'dateUpdated'
      });


    db.progress = queryInterface.createTable('progress', {
      progressId: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      status: {
        type: Sequelize.STRING,
        allowNull: false
      },
      userId: {
        type: Sequelize.STRING,
        allowNull: false
      },
      supporterId: {
        type: Sequelize.STRING,
        allowNull: false
      },
      responseId: {
        type: Sequelize.STRING,
        allowNull: false
      },
      progressDateTime: {
        type: Sequelize.DATE,
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
    }, {
        timestamps: true,
        createdAt: 'dateCreated',
        updatedAt: 'dateUpdated'
      }, {

      });

    return db;
  },

  down: function (queryInterface, Sequelize) {
    var db = {};
    db.steps = queryInterface.dropTable('steps');
    db.response = queryInterface.dropTable('response');
    db.progress = queryInterface.dropTable('progress');
    return db;
  }
};
