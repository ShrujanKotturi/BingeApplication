var db = require('../db'),
    message = {},
    util = require('util'),
    result = {},
    FCM = require('fcm-node'),
    supporterAuthenticate = require('../middleware/supporterAuthenticate'),
    config = require('../config.json'),
    fcmCli = new FCM(config.SERVER_API_KEY);

function run() {

    this.daily = function () {
        //DailyLogs
        var currentDate = new Date().getFullYear() + "-" + (new Date().getMonth() + 1) + "-" + new Date().getDate();
        // var sqlQuery = "SELECT userUserId AS Users FROM dailyFoodLogs WHERE DATE(dateTimeLogged) <= " + currentDate;
        var sqlQuery = "SELECT DISTINCT(D.userUserId) AS Users, UDM.fcmToken AS Token FROM dailyFoodLogs AS D INNER JOIN users U ON U.userId = D.userUserId LEFT OUTER JOIN userdevicemappers UDM ON UDM.userUserId = U.userId WHERE DATE(D.dateTimeLogged) < '" + currentDate + "' AND U.appNotifications = 1";

        db.sequelize.query(sqlQuery).spread(function (results, metadata) {
            var notificationToUser = "You haven\'t logged your daily food today. Please log it";
            for (var i = 0; i < results.length; i++) {
                console.log("Result : " + util.inspect(results[i]));
                var payloadOk = {
                    to: results[i].Token,
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
            console.log(message);
        });
    };

    this.weekly = function () {
        //WeeklyLogs
        var pastWeekDate = new Date();
        pastWeekDate.setDate(pastWeekDate.getDate() - 7);
        var past = pastWeekDate.getFullYear() + "-" + (pastWeekDate.getMonth() + 1) + "-" + pastWeekDate.getDate();
        console.log('past week date : ' + past);
        var sqlQuery = "SELECT MAX(W.weekId) AS LastWeek, W.userUserId AS UserId, MAX(W.dateAdded) AS LastLoggedDate, UDM.fcmToken from weeklylogs W INNER JOIN users U ON U.userId = W.userUserId LEFT OUTER JOIN userdevicemappers UDM ON UDM.userUserId = U.userId WHERE U.appNotifications = 1 AND DATE(W.dateAdded) < '" + past + "' GROUP BY W.userUserId";
        var dateTimeSent = new Date().toISOString().slice(0, 19).replace('T', ' ');

        db.sequelize.query(sqlQuery).spread(function (results, metadata) {
            var notificationToUser = "You haven\'t logged your weekly food today. Please log it";
            for (var i = 0; i < results.length; i++) {
                db.app.notifications.findOrCreate({
                    where: {
                        userUserId: results[0].UserId,
                        notificationMessage: notificationToUser,
                        dateTimeSent: dateTimeSent,
                        from: "WHP",
                        to: results[0].UserId
                    },
                    defaults: {
                        userUserId: results[0].UserId,
                        notificationMessage: notificationToUser,
                        dateTimeSent: dateTimeSent,
                        from: "WHP",
                        to: results[0].UserId
                    }
                }).spread(function (notification, created) {
                    if (!created) {
                        message = {
                            'name': 'Failure',
                            'message': 'A message already exists with given data, couldn\'t send a notification'
                        };
                        console.log(message);
                        return;
                    }
                    message = {
                        'name': 'Success',
                        'message': 'Message log to the table'
                    };
                    console.log(message);

                }).catch(function (error) {
                    message = {
                        'name': 'Failure',
                        'message': 'A message already exists with given data, couldn\'t send a notification',
                        'error': util.inspect(error)
                    };
                    console.log(message);
                    return;
                });
                console.log("Result : " + util.inspect(results[i]));
                var payloadOk = {
                    to: results[i].Token,
                    priority: 'high',
                    notification: {
                        title: 'Women Health Project',
                        body: notificationToUser
                    }
                };
                fcmCli.send(payloadOk, function (err, resu) {
                    if (err) {
                        console.log("fcm if");
                    } else {
                        console.log(resu);
                        message.fcm = 'Message in-transit';
                        message.result = resu;
                        console.log("fcm else");
                    }
                });
                console.log(message);
            }
        }).catch(function (error) {
            message.name = 'Failure';
            message.users = util.inspect(error);
            console.log(message);
        });
    };

    
};

module.exports = new run();