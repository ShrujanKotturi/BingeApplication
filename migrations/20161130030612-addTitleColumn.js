'use strict';

module.exports = {
    up: function(queryInterface, Sequelize) {
        return queryInterface.addColumn('notes', 'title', {
            type: Sequelize.STRING,
            allowNull: false
        });
    },

    down: function(queryInterface, Sequelize) {
        return queryInterface.removeColumn('notes', 'title');
    }
};
