'use strict';

module.exports = {
    up: function(queryInterface, Sequelize) {
        queryInterface.addColumn('notifications', 'from', {
            type: Sequelize.STRING,
            allowNull: false
        });
        
        queryInterface.addColumn('notifications', 'to', {
            type: Sequelize.STRING,
            allowNull: false
        });
    },

    down: function(queryInterface, Sequelize) {
        queryInterface.removeColumn('notifications', 'from');
        queryInterface.removeColumn('notifications', 'to');
    }
};
