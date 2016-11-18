/**
 * Created by shruj on 11/01/2016.
 */
var Sequelize = require('sequelize'),
    CONFIG = require('./config.json');
var env = process.env.NODE_ENV || CONFIG.DEVELOPMENT;
var sequelize;

if (env === CONFIG.PRODUCTION) {
    sequelize = new Sequelize(CONFIG.DATABASE, CONFIG.USERNAME, CONFIG.PASSWORD_PROD, {
        host: CONFIG.HOST,
        dialect: "mysql",
        storage: __dirname + '/data/bingeapplication.sql'
    });
} else if (env === CONFIG.TESTING) {
    sequelize = new Sequelize(CONFIG.DATABASE_TEST, CONFIG.USERNAME, CONFIG.PASSWORD_PROD, {
        host: CONFIG.HOST,
        dialect: "mysql",
        storage: __dirname + '/data/bingeapplication.sql'
    });
} else {
    sequelize = new Sequelize(CONFIG.DATABASE, CONFIG.USERNAME, CONFIG.PASSWORD_DEV, {
        host: CONFIG.HOST,
        dialect: "mysql",
        storage: __dirname + '/data/bingeapplication.sql'
    });
}

var db = {};
db.app = sequelize.import(__dirname + '/models/db.js');
db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;