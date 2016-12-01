var db = require('../db'),
    message = {},
    util = require('util');

function run() {

    //DailyLogs
    var currentDate = new Date().getFullYear() + "-" + (new Date().getMonth() + 1) + "-" + new Date().getDay();
    // var sqlQuery = "SELECT userUserId AS Users FROM dailyFoodLogs WHERE DATE(dateTimeLogged) <= " + currentDate;
    var sqlQuery = "SELECT DISTINCT(D.userUserId) AS Users, UDM.fcmToken AS Token FROM dailyFoodLogs AS D INNER JOIN users U ON U.userId = D.userUserId INNER JOIN userdevicemappers UDM ON UDM.userUserId = U.userId WHERE DATE(D.dateTimeLogged) <= " + currentDate + " AND U.appNotifications = 1";

    db.sequelize.query(sqlQuery).spread(function (results, metadata) {
        console.log("These users haven\'t logged the daily logs" + util.inspect(results[0]));
        result.users = results[0];
        var notificationToUser = "You haven\'t logged your daily food today. Please log it";
        for (var i = 0; i < results[0].length; i++) {
            var payloadOk = {
                to: results[0][i].Token,
                priority: 'high',
                notification: {
                    title: 'Women Health Project',
                    body: notificationToUser
                }
            };
            fcmCli.send(payloadOk, function (err, resu) {
                if (err) {
                    console.error(err)
                } else {
                    console.log(resu);
                    message.fcm = 'Message in-transit';
                    message.result = resu;
                }
            });
        }
    }).catch(function (error) {
        message.name = 'Failure';
        message.users = util.inspect(error);
    });

};

module.exports = new run();