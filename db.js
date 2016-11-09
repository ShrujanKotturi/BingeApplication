/**
 * Created by shruj on 11/01/2016.
 */
var Sequelize = require('sequelize');
var env = 'development';
var sequelize;

if (env === 'production') {
    sequelize = new Sequelize('BingeApplication', 'root', 'password', {
        host: 'localhost',
        dialect: 'mysql',
        storage: __dirname + '/data/bingeapplication.sql'
    });
} else {
    sequelize = new Sequelize('BingeApplication', 'root', 'password', {
        host: 'localhost',
        dialect: 'mysql',
        storage: __dirname + '/data/bingeapplication.sql'
    });
}

var db = {};
db.app = sequelize.import(__dirname + '/models/db.js');
db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;