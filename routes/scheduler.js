var db = require('../db');

function run() {

    //DailyLogs
    var currentDate = new Date().getFullYear() + "-" + (new Date().getMonth() + 1) + "-" + new Date().getDay();
    //var sqlQuery = "SELECT userUserId AS Users FROM dailyFoodLogs WHERE DATE(dateTimeLogged) <= " + currentDate;
    // var sqlQuery = "SELECT DISTINCT(D.userUserId) AS Users, UDM.fcmToken AS Token FROM dailyFoodLogs AS D INNER JOIN users U ON U.userId = D.userUserId INNER JOIN userdevicemappers UDM ON UDM.userUserId = U.userId WHERE DATE(D.dateTimeLogged) <= " + currentDate + " AND U.appNotifications = 1";

    // db.sequelize.query(sqlQuery).spread(function (results, metadata) {
    //     console.log("These users haven\'t logged the daily logs" + util.inspect(results[0]));
    //     result.users = results[0];


    // }).catch(function (error) {
    //     message.name = 'Failure';
    //     message.users = util.inspect(error);
    // });

};

module.exports = new run();