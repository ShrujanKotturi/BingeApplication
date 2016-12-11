/**
 * Created by shruj on 11/02/2016.
 */
var express = require('express'),
    bcrypt = require('bcrypt'),
    util = require('util'),
    _ = require('underscore'),
    cryptojs = require('crypto-js'),
    jwt = require('jsonwebtoken'),
    fs = require('fs'),
    path = require('path'),
    userAuthenticate = require('../middleware/userAuthenticate');

var router = express.Router();
var db = require('../db');
var message = {},
    session = {};


router.get('/login', function (req, res) {
    var query = _.pick(req.query, 'userId', 'password', 'deviceId');
    if (typeof query.userId !== 'string' || typeof query.password !== 'string' || typeof query.deviceId !== 'string') {
        message = {
            'name': 'Error',
            'message': 'Problem with query parameters'
        };
        console.log(message);
        return res.status(400).send(message);
    }
    db.app.users.findOne({
        attributes: [['userId', 'userId'], ['salt', 'salt'], ['passwordHash', 'passwordHash'], ['isActive', 'isActive'], ['age', 'age'], ['score', 'score'], ['logNotifications', 'logNotifications'], ['appNotifications', 'appNotifications'], ['quickLog', 'quickLog'], ['sendMotivationalMessages', 'sendMotivationalMessages'], ['researcherSupporterId', 'researcherSupporterId']],
        where: {
            userId: query.userId
        }
    }).then(function (user) {
        if (_.isEmpty(user.dataValues) || !bcrypt.compareSync(query.password, user.get('passwordHash'))) {
            message = {
                'name': "Failure",
                'message': 'Id & Password match not found'
            };
            console.log(message);
            return res.status(404).json(message);
        }
        var result = user.toPublicJSON();
        message = {
            'name': "Success",
            'message': "Participant Login is Successful",
            'result': result
        };

        //start of userId update with userDeviceMapper

        db.app.userDeviceMapper.find({
            where: { 'deviceId': query.deviceId }
        }).then(function (userDevice) {
            if (!_.isEmpty(userDevice)) {
                userDevice.update({
                    userUserId: query.userId
                }).then(function () {
                    message.device = 'Device mapped to the successfully';
                }).catch(function (err) {
                    message.device = err;
                });
            } else
                message.device = 'Couldn\'t find the Device, so didn\'t update the DeviceMapper';
        }).catch(function (error) {
            console.error('Error in updating the user device : ' + error);
        });

        //end of userId update with userDeviceMapper

        var stringData = JSON.stringify(result);
        var encryptedData = cryptojs.AES.encrypt(stringData, 'abc123!@#').toString();
        var token = jwt.sign({
            token: encryptedData
        }, 'qwerty098');
        if (token) {
            session = req.session;
            session.userId = user.dataValues.userId;
            console.log(message);
            console.log(req.session);
            message.token = token;
            return res.header('x-auth', token).json(message);
        }
        else
            return res.status(400).send();

    }).catch(function (error) {
        message = {
            'name': error.name,
            'message': error
        };
        console.log(error);
        return res.status(400).json(message);
    });
});

router.post('/registerDevice', function (req, res) {
    var body = _.pick(req.body, 'deviceId', 'fcmToken', 'registeredTime');
    if (typeof body.deviceId !== 'string' || typeof body.fcmToken !== 'string' || typeof body.registeredTime !== 'string') {
        message = {
            'name': 'Error',
            'message': 'Problem with query parameters'
        };
        return res.status(400).send(message);
    }
    db.app.userDeviceMapper.upsert({
        registeredTime: body.registeredTime,
        deviceId: body.deviceId,
        fcmToken: body.fcmToken
    }).then(function (savedObject) {
        if (_.isEmpty(savedObject)) {
            message = {
                'name': "Failure",
                'message': 'Error in registering the device'
            };
            return res.status(404).json(message);
        }
        message = {
            'name': "Success",
            'message': "Device registered with Women Health Project",
            'result': util.inspect(savedObject)
        };
        return res.json(message);
    }).catch(function (error) {
        console.log(error);
        message = {
            'name': error.name,
            'message': error
        };
        return res.status(400).json(message);
    });
});

router.get('/getDates', userAuthenticate, function (req, res) {
    var userId = res.locals.userId || req.session.userId;
    var sqlQuery = "SELECT DATE(dateTimeLogged) AS LogDateTime FROM dailyFoodLogs WHERE userUserId = '" + userId + "' UNION SELECT DATE(dateTimeLogged) AS LogDateTime FROM dailyPhysicalLogs WHERE userUserId = '" + userId + "'";
    console.log(sqlQuery);
    var resultsData = {};
    db.sequelize.query(sqlQuery).spread(function (results, metadata) {

        resultsData.result = results;

        return res.json(resultsData);
    }).catch(function (error) {
        message = {
            'name': 'Failure',
            'message': 'Couldn\'t get dates',
            'error': util.inspect(error)
        };
        return res.status(400).send(message);
    });
});


//Food Log
router.post('/foodLog', userAuthenticate, function (req, res) {
    var body = _.pick(req.body, 'food', 'latitude', 'longitude', 'binge', 'vomit', 'logDateTime', 'tag');
    body.logDateTime = new Date(body.logDateTime).toISOString();
    // console.log(__dirname);
    // __dirname = __dirname.substring(0, __dirname.indexOf("\\routes")) + '\\images';
    // console.log(__dirname);
    if (typeof body.food !== 'string' || typeof body.latitude !== 'string' || typeof body.longitude !== 'string' || typeof body.binge !== 'string' || typeof body.vomit !== 'string' || typeof body.logDateTime !== 'string') {
        message = {
            'name': 'Error',
            'message': 'Problem with query parameters'
        };
        return res.status(403).send(message);
    }

    console.log(body.logDateTime);
    var userId = res.locals.userId || req.session.userId;
    db.app.dailyFoodLog.findOrCreate({
        where: {
            userUserId: userId,
            foodConsumedLog: body.food,
            feelingBinge: body.binge,
            feelingVomiting: body.vomit,
            dateTimeLogged: body.logDateTime
        },
        defaults: {
            userUserId: userId,
            foodConsumedLog: body.food,
            latitude: body.latitude,
            longitude: body.longitude,
            feelingBinge: body.binge,
            feelingVomiting: body.vomit,
            dateTimeLogged: body.logDateTime
        }
    }).spread(function (foodLog, created) {
        if (!created) {
            message = {
                'name': 'Failure',
                'message': 'Food Log with the given details exists'
            };
            return res.status(403).json(message);
        }
        message = {
            'name': 'Success',
            'message': 'Food Log created'
        };

        //Add entry to notification table - for the supporter
        var params = {};

        params.userId = userId;
        params.message = "Food log logged";
        params.dateTimeSent = new Date().toISOString();
        params.to = res.locals.supporterId;
        params.from = userId;

        db.app.notifications.findOrCreate({
            where: {
                userUserId: params.userId,
                notificationMessage: params.message,
                dateTimeSent: params.dateTimeSent,
                from: params.from,
                to: params.to
            },
            defaults: {
                userUserId: params.userId,
                notificationMessage: params.message,
                dateTimeSent: params.dateTimeSent,
                from: params.from,
                to: params.to
            }
        }).spread(function (notification, created) {
            if (!created)
                message.logMessage = 'A message already exists with given data, couldn\'t send a notification to the supporter';
            else
                message.logMessage = 'Message log to the table';
        }).catch(function (error) {
            message.logMessage = 'A message already exists with given data, couldn\'t send a notification to the supporter';
            message.error = util.inspect(error);
        });

        //end of notification logging

        return res.json(message);
    }).catch(function (error) {
        message = {
            'name': 'Failure',
            'message': 'Couldn\'t create food log',
            'error': util.inspect(error)
        };
        return res.status(400).send(message);
    });
});

router.get('/getFoodLog', userAuthenticate, function (req, res) {
    // var query = _.pick(req.query, 'date');
    // if (typeof query.date !== 'string') {
    //     message = {
    //         'name': 'Error',
    //         'message': 'Problem with query parameters'
    //     };
    //     console.log(message);
    //     return res.status(400).send(message);
    // }

    var results = {};
    var userId = res.locals.userId || req.session.userId;
    db.app.dailyPhysicalLog.findAll({
        attributes: [['dailyPhysicalLogId', 'Daily Physical Log Id'], ['physicalActivityPerformed', 'Physical Activity Logged'], ['duration', 'Duration'], ['dateTimeLogged', 'Logged Time'], ['feelingTired', 'Feeling Tired']],
        where: {
            userUserId: userId
            //dateTimeLogged: db.sequelize.where(db.sequelize.fn('date', db.sequelize.col('dateTimeLogged')), '=', query.date)
        }
    }).then(function (supporters) {
        results.PhysicalLogs = supporters;
    }).catch(function (error) {
        message = {
            'name': error.name,
            'message': util.inspect(error)
        };
        console.log(error);
        return res.status(400).json(message);
    });

    db.app.dailyFoodLog.findAll({
        attributes: [['dailyFoodLogId', 'Daily Food Log Id'], ['foodConsumedLog', 'Food Consumed'], ['foodConsumedURL', 'Image'], 'latitude', 'longitude', ['dateTimeLogged', 'Logged Time'], ['feelingBinge', 'Feeling Binge'], ['feelingVomiting', 'Feeling Vomiting'], ['returnType', 'Image Type']],
        where: {
            userUserId: userId
            // dateTimeLogged: db.sequelize.where(db.sequelize.fn('date', db.sequelize.col('dateTimeLogged')), '=', query.date)
        }
    }).then(function (supporters) {
        results.Foodlogs = supporters;
        return res.json(results);
    }).catch(function (error) {
        message = {
            'name': error.name,
            'message': util.inspect(error)
        };
        console.log(error);
        return res.status(400).json(message);
    });
});

router.post('/updateFoodLog', userAuthenticate, function (req, res) {
    var body = _.pick(req.body, 'dailyFoodLogId', 'food', 'latitude', 'longitude', 'binge', 'vomit', 'logDateTime');
    body.logDateTime = new Date(body.logDateTime).toISOString();

    if (typeof body.dailyFoodLogId !== 'string' || typeof body.food !== 'string' || typeof body.latitude !== 'string' || typeof body.longitude !== 'string' || typeof body.binge !== 'string' || typeof body.vomit !== 'string' || typeof body.logDateTime !== 'string') {
        message = {
            'name': 'Error',
            'message': 'Problem with query parameters'
        };
        return res.status(403).send(message);
    }
    var userId = res.locals.userId || req.session.userId;
    db.app.dailyFoodLog.find({
        where: {
            userUserId: userId,
            dailyFoodLogId: body.dailyFoodLogId
        }
    }).then(function (data) {
        if (!_.isEmpty(data)) {
            data.update({
                foodConsumedLog: body.food,
                latitude: body.latitude,
                longitude: body.longitude,
                feelingBinge: body.binge,
                feelingVomiting: body.vomit,
                dateTimeLogged: body.logDateTime
            }).then(function (data1) {
                console.log('data1: ' + data1);
                message.name = 'Success';
                message.message = 'Update to food log successful';
                message.data = data1;

                //Add entry to notification table - for the supporter
                var params = {};

                params.userId = userId;
                params.message = "Food log updated";
                params.dateTimeSent = new Date().toISOString();
                params.to = res.locals.supporterId;
                params.from = userId;

                db.app.notifications.findOrCreate({
                    where: {
                        userUserId: params.userId,
                        notificationMessage: params.message,
                        dateTimeSent: params.dateTimeSent,
                        from: params.from,
                        to: params.to
                    },
                    defaults: {
                        userUserId: params.userId,
                        notificationMessage: params.message,
                        dateTimeSent: params.dateTimeSent,
                        from: params.from,
                        to: params.to
                    }
                }).spread(function (notification, created) {
                    if (!created)
                        message.logMessage = 'A message already exists with given data, couldn\'t send a notification on update foodlog to the supporter';
                    else
                        message.logMessage = 'Message log to the table';
                }).catch(function (error) {
                    message.logMessage = 'A message already exists with given data, couldn\'t send a notification on update foodlog to the supporter';
                    message.error = util.inspect(error);
                });

                //end of notification logging


                return res.json(message);
            }).catch(function (error) {
                console.error('Error in updating the user device : ' + error);
                message.name = 'Failure';
                message.message = 'Error in updating the food log';
                message.error = util.inspect(error);
                return res.status(404).send(message);
            });
        }
    });
});

router.post('/deleteFoodLog', userAuthenticate, function (req, res) {
    var body = _.pick(req.body, 'dailyFoodLogId');

    if (typeof body.dailyFoodLogId !== 'string') {
        message = {
            'name': 'Error',
            'message': 'Problem with query parameters'
        };
        return res.status(400).send(message);
    }
    var userId = res.locals.userId || req.session.userId;
    db.app.dailyFoodLog.find({
        where: {
            userUserId: userId,
            dailyFoodLogId: body.dailyFoodLogId
        }
    }).then(function (data) {
        if (!_.isEmpty(data)) {
            data.destroy();
            message.name = 'Success';
            message.message = 'Food log deleted';


            //Add entry to notification table - for the supporter
            var params = {};

            params.userId = userId;
            params.message = "Food log deleted";
            params.dateTimeSent = new Date().toISOString();
            params.to = res.locals.supporterId;
            params.from = userId;

            db.app.notifications.findOrCreate({
                where: {
                    userUserId: params.userId,
                    notificationMessage: params.message,
                    dateTimeSent: params.dateTimeSent,
                    from: params.from,
                    to: params.to
                },
                defaults: {
                    userUserId: params.userId,
                    notificationMessage: params.message,
                    dateTimeSent: params.dateTimeSent,
                    from: params.from,
                    to: params.to
                }
            }).spread(function (notification, created) {
                if (!created)
                    message.logMessage = 'A message already exists with given data, couldn\'t send a notification on delete foodlog to the supporter';
                else
                    message.logMessage = 'Message log to the table';
            }).catch(function (error) {
                message.logMessage = 'A message already exists with given data, couldn\'t send a notification on delete foodlog to the supporter';
                message.error = util.inspect(error);
            });

            //end of notification logging



            return res.json(message);
        } else {
            message.name = 'Failure';
            message.message = 'Trying to delete the data which isn\'t there';
            return res.status(404).json(message);
        }
    }).catch(function (error) {
        message.name = 'Failure';
        message.message = util.inspect(error);
        return res.status(404).json(message);
    });
});


//Quick Log
router.post('/quickLog', userAuthenticate, function (req, res) {
    // var newPath = __dirname.substring(0, __dirname.indexOf("\\routes")) + '\\images';
    // var body = _.pick(req.body, 'food', 'latitude', 'longitude', 'binge', 'vomit', 'returnType', 'logDateTime');
    var body = _.pick(req.body, 'food', 'latitude', 'longitude', 'binge', 'vomit', 'logDateTime', 'image');
    body.logDateTime = new Date(body.logDateTime).toISOString();
    // body.imageFile = req.files.image;
    // body.returnType = path.extname(req.files.image.originalFilename).toLowerCase();
    // console.log("typeof the imagefile : " + typeof body.imageFile);
    // console.log("originalFilename : " + req.files.image.originalFilename);
    // console.log("originalFilePath : " + req.files.image.path);
    if (typeof body.food !== 'string' || typeof body.latitude !== 'string' || typeof body.longitude !== 'string' || typeof body.binge !== 'string' || typeof body.vomit !== 'string' || typeof body.logDateTime !== 'string' || typeof body.image !== 'string') {
        message = {
            'name': 'Error',
            'message': 'Problem with query parameters'
        };
        return res.status(400).send(message);
    }

    // fs.readFile(body.imageFile.path, function (err, data) {
    //     newPath += req.files.image.originalFilename;
    //     //newPath += req.files.image.originalFilename;
    //     console.log(newPath);
    //     fs.writeFile(newPath, data, function (err) {
    //         if (err) {
    //             message.image = 'Error in uploading the image';
    //         } else {
    //             message.image = 'Image uploaded successfully';
    //         }
    //     });
    // });

    var userId = res.locals.userId || req.session.userId;

    db.app.dailyFoodLog.findOrCreate({
        where: {
            userUserId: userId,
            foodConsumedLog: body.food,
            feelingBinge: body.binge,
            feelingVomiting: body.vomit,
            dateTimeLogged: body.logDateTime,
            foodConsumedURL: body.image
        },
        defaults: {
            userUserId: userId,
            foodConsumedLog: body.food,
            latitude: body.latitude,
            longitude: body.longitude,
            feelingBinge: body.binge,
            feelingVomiting: body.vomit,
            dateTimeLogged: body.logDateTime,
            foodConsumedURL: body.image
        }
    }).spread(function (foodLog, created) {
        if (!(created)) {
            message = {
                'name': 'Failure',
                'message': 'Error in creating quick log'
            };
            return res.status(404).json(message);
        }
        message = {
            'name': 'Success',
            'message': 'Quick log created successfully'
        };

        //Add entry to notification table - for the supporter
        var params = {};

        params.userId = userId;
        params.message = "Quick food log logged";
        params.dateTimeSent = new Date().toISOString();
        params.to = res.locals.supporterId;
        params.from = userId;

        db.app.notifications.findOrCreate({
            where: {
                userUserId: params.userId,
                notificationMessage: params.message,
                dateTimeSent: params.dateTimeSent,
                from: params.from,
                to: params.to
            },
            defaults: {
                userUserId: params.userId,
                notificationMessage: params.message,
                dateTimeSent: params.dateTimeSent,
                from: params.from,
                to: params.to
            }
        }).spread(function (notification, created) {
            if (!created)
                message.quickLogMessage = 'A message already exists with given data, couldn\'t send a notification to the supporter';
            else
                message.quickLogMessage = 'Message log to the table';
        }).catch(function (error) {
            message.quickLogMessage = 'A message already exists with given data, couldn\'t send a notification to the supporter';
            message.error = util.inspect(error);
        });

        //end of notification logging

        return res.json(message);
    }).catch(function (error) {
        message = {
            'name': 'Failure',
            'message': 'Couldn\'t create quick log',
            'error': util.inspect(error)
        };
        return res.status(400).send(message);
    });

});

//add to the notification table about update to the quick log
router.post('/updateQuickLog', userAuthenticate, function (req, res) {
    var body = _.pick(req.body, 'dailyFoodLogId', 'food', 'latitude', 'longitude', 'binge', 'vomit', 'logDateTime', 'image');
    body.logDateTime = new Date(body.logDateTime).toISOString();

    if (typeof body.dailyFoodLogId !== 'string' || typeof body.food !== 'string' || typeof body.latitude !== 'string' || typeof body.longitude !== 'string' || typeof body.binge !== 'string' || typeof body.vomit !== 'string' || typeof body.logDateTime !== 'string' || typeof body.image !== 'string') {
        message = {
            'name': 'Error',
            'message': 'Problem with query parameters'
        };
        return res.status(403).send(message);
    }
    var userId = res.locals.userId || req.session.userId;

    db.app.dailyFoodLog.find({
        where: {
            userUserId: userId,
            dailyFoodLogId: body.dailyFoodLogId
        }
    }).then(function (data) {
        if (!_.isEmpty(data)) {
            data.update({
                foodConsumedLog: body.food,
                latitude: body.latitude,
                longitude: body.longitude,
                feelingBinge: body.binge,
                feelingVomiting: body.vomit,
                dateTimeLogged: body.logDateTime,
                foodConsumedURL: body.image
            }).then(function (data1) {
                console.log('data1: ' + data1);
                message.name = 'Success';
                message.message = 'Update to food log successful';
                message.data = data1;

                //Add entry to notification table - for the supporter
                var params = {};

                params.userId = userId;
                params.message = "Quick food log updated";
                params.dateTimeSent = new Date().toISOString();
                params.to = res.locals.supporterId;
                params.from = userId;

                db.app.notifications.findOrCreate({
                    where: {
                        userUserId: params.userId,
                        notificationMessage: params.message,
                        dateTimeSent: params.dateTimeSent,
                        from: params.from,
                        to: params.to
                    },
                    defaults: {
                        userUserId: params.userId,
                        notificationMessage: params.message,
                        dateTimeSent: params.dateTimeSent,
                        from: params.from,
                        to: params.to
                    }
                }).spread(function (notification, created) {
                    if (!created)
                        message.quickLogMessage = 'A message already exists with given data, couldn\'t send a notification to the supporter';
                    else
                        message.quickLogMessage = 'Message log to the table';
                }).catch(function (error) {
                    message.quickLogMessage = 'A message already exists with given data, couldn\'t send a notification to the supporter';
                    message.error = util.inspect(error);
                });

                //end of notification logging


                return res.json(message);
            }).catch(function (error) {
                console.error('Error in updating the user device : ' + error);
                message.name = 'Failure';
                message.message = 'Error in updating the food log';
                message.error = util.inspect(error);
                return res.status(404).send(message);
            });
        }
    });
});


//Physical Log
router.post('/physicalLog', userAuthenticate, function (req, res) {

    var body = _.pick(req.body, 'physicalActivityPerformed', 'duration', 'feelingTired', 'logDateTime');
    body.logDateTime = new Date(body.logDateTime).toISOString();

    if (typeof body.physicalActivityPerformed !== 'string' || typeof body.duration !== 'string' || typeof body.feelingTired !== 'string' || typeof body.logDateTime !== 'string') {
        message = {
            'name': 'Error',
            'message': 'Problem with query parameters'
        };
        return res.status(400).send(message);
    }
    var userId = res.locals.userId || req.session.userId;
    db.app.dailyPhysicalLog.findOrCreate({
        where: {
            userUserId: userId,
            physicalActivityPerformed: body.physicalActivityPerformed,
            duration: body.duration,
            feelingTired: body.feelingTired,
            dateTimeLogged: body.logDateTime
        },
        defaults: {
            userUserId: userId,
            physicalActivityPerformed: body.physicalActivityPerformed,
            duration: body.duration,
            feelingTired: body.feelingTired,
            dateTimeLogged: body.logDateTime
        }
    }).spread(function (foodLog, created) {
        if (!(created)) {
            message = {
                'name': 'Failure',
                'message': 'Physical Log with the given details exists'
            };
            return res.status(401).json(message);
        }
        message = {
            'name': 'Success',
            'message': 'Physical Log created'
        };

        //Add entry to notification table - for the supporter
        var params = {};

        params.userId = userId;
        params.message = "Physical log logged";
        params.dateTimeSent = new Date().toISOString();
        params.to = res.locals.supporterId;
        params.from = userId;

        db.app.notifications.findOrCreate({
            where: {
                userUserId: params.userId,
                notificationMessage: params.message,
                dateTimeSent: params.dateTimeSent,
                from: params.from,
                to: params.to
            },
            defaults: {
                userUserId: params.userId,
                notificationMessage: params.message,
                dateTimeSent: params.dateTimeSent,
                from: params.from,
                to: params.to
            }
        }).spread(function (notification, created) {
            if (!created)
                message.physicalLogMessage = 'A message already exists with given data, couldn\'t send a notification to the supporter';
            else
                message.physicalLogMessage = 'Message log to the table';
        }).catch(function (error) {
            message.physicalLogMessage = 'A message already exists with given data, couldn\'t send a notification to the supporter';
            message.error = util.inspect(error);
        });

        //end of notification logging

        return res.json(message);
    }).catch(function (error) {
        message = {
            'name': 'Failure',
            'message': 'Couldn\'t create physical log',
            'error': util.inspect(error)
        };
        return res.status(400).send(message);
    });

});

router.post('/updatePhysicalLog', userAuthenticate, function (req, res) {

    var body = _.pick(req.body, 'dailyPhysicalLogId', 'physicalActivityPerformed', 'duration', 'feelingTired', 'logDateTime');
    body.logDateTime = new Date(body.logDateTime).toISOString();

    if (typeof body.dailyPhysicalLogId !== 'string' || typeof body.physicalActivityPerformed !== 'string' || typeof body.duration !== 'string' || typeof body.feelingTired !== 'string' || typeof body.logDateTime !== 'string') {
        message = {
            'name': 'Error',
            'message': 'Problem with query parameters'
        };
        return res.status(400).send(message);
    }
    var userId = res.locals.userId || req.session.userId;
    db.app.dailyPhysicalLog.find({
        where: {
            userUserId: userId,
            dailyPhysicalLogId: body.dailyPhysicalLogId
        }
    }).then(function (data) {
        if (!_.isEmpty(data)) {
            data.update({
                physicalActivityPerformed: body.physicalActivityPerformed,
                duration: body.duration,
                feelingTired: body.feelingTired,
                dateTimeLogged: body.logDateTime
            }).then(function (data1) {
                console.log('data1: ' + data1);
                message.name = 'Success';
                message.message = 'Update to Physical log successful';
                message.data = data1;

                //Add entry to notification table - for the supporter
                var params = {};

                params.userId = userId;
                params.message = "Physical log updated";
                params.dateTimeSent = new Date().toISOString();
                params.to = res.locals.supporterId;
                params.from = userId;

                db.app.notifications.findOrCreate({
                    where: {
                        userUserId: params.userId,
                        notificationMessage: params.message,
                        dateTimeSent: params.dateTimeSent,
                        from: params.from,
                        to: params.to
                    },
                    defaults: {
                        userUserId: params.userId,
                        notificationMessage: params.message,
                        dateTimeSent: params.dateTimeSent,
                        from: params.from,
                        to: params.to
                    }
                }).spread(function (notification, created) {
                    if (!created)
                        message.physicalLogMessage = 'A message already exists with given data, couldn\'t send a notification to the supporter';
                    else
                        message.physicalLogMessage = 'Message log to the table';
                }).catch(function (error) {
                    message.physicalLogMessage = 'A message already exists with given data, couldn\'t send a notification to the supporter';
                    message.error = util.inspect(error);
                });

                //end of notification logging


                return res.json(message);
            }).catch(function (error) {
                console.error('Error in updating the user device : ' + error);
                message.name = 'Failure';
                message.message = 'Error in updating the physical log';
                message.error = util.inspect(error);
                return res.status(404).send(message);
            });
        }
    });
});

router.post('/deletePhysicalLog', userAuthenticate, function (req, res) {

    var body = _.pick(req.body, 'dailyPhysicalLogId');

    if (typeof body.dailyPhysicalLogId !== 'string') {
        message = {
            'name': 'Error',
            'message': 'Problem with query parameters'
        };
        return res.status(400).send(message);
    }
    var userId = res.locals.userId || req.session.userId;
    db.app.dailyPhysicalLog.find({
        where: {
            userUserId: userId,
            dailyPhysicalLogId: body.dailyPhysicalLogId
        }
    }).then(function (data) {
        if (!_.isEmpty(data)) {
            data.destroy();
            message.name = 'Success';
            message.message = 'Physical log deleted';

            //Add entry to notification table - for the supporter
            var params = {};

            params.userId = userId;
            params.message = "Physical log deleted";
            params.dateTimeSent = new Date().toISOString();
            params.to = res.locals.supporterId;
            params.from = userId;

            db.app.notifications.findOrCreate({
                where: {
                    userUserId: params.userId,
                    notificationMessage: params.message,
                    dateTimeSent: params.dateTimeSent,
                    from: params.from,
                    to: params.to
                },
                defaults: {
                    userUserId: params.userId,
                    notificationMessage: params.message,
                    dateTimeSent: params.dateTimeSent,
                    from: params.from,
                    to: params.to
                }
            }).spread(function (notification, created) {
                if (!created)
                    message.physicalLogMessage = 'A message already exists with given data, couldn\'t send a notification to the supporter';
                else
                    message.physicalLogMessage = 'Message log to the table';
            }).catch(function (error) {
                message.physicalLogMessage = 'A message already exists with given data, couldn\'t send a notification to the supporter';
                message.error = util.inspect(error);
            });

            //end of notification logging

            return res.json(message);
        } else {
            message.name = 'Failure';
            message.message = 'Trying to delete the data which isn\'t there';
            return res.status(404).json(message);
        }
    }).catch(function (error) {
        message.name = 'Failure';
        message.message = util.inspect(error);
        return res.status(404).json(message);
    });
});


//Dashboard
router.get('/dashboard', userAuthenticate, function (req, res) {
    var userId = res.locals.userId || req.session.userId;
    var result = {};

    //noOfStepsFinished
    result.noOfStepsFinished = 0;
    var sqlQuery = "SELECT COUNT(progressId) AS noOfStepsFinished FROM progresses WHERE userId = '" + userId + "' AND status = 'Approved'";
    db.sequelize.query(sqlQuery).spread(function (results, metadata) {
        console.log(util.inspect(results[0].noOfStepsFinished));
        result.noOfStepsFinished = results[0].noOfStepsFinished;
    }).catch(function (error) {
        message.name = 'Failure';
        message.noOfStepsFinished = util.inspect(error);
    });


    //upcomingNotification
    result.upcomingNotification = "No upcoming appointments"
    db.app.appointments.findAll({
        attributes: [['appointmentTime', 'time'], ['title', 'message']],
        where: {
            userUserId: userId,
            appointmentTime: {
                gte: new Date().toISOString()
            }
        },
        order: [['appointmentTime', 'DESC']],
        limit: 1
    }).then(function (appointments) {
        if (!_.isEmpty(appointments)) {
            result.upcomingNotification = appointments;
        } else {
            result.upcomingNotification = "No upcoming appointments"
        }
    }).catch(function (error) {
        message.name = 'Failure';
        message.upcomingNotification = util.inspect(error);
        console.log(error);
    });

    //stats
    result.stats = [];
    db.app.weeklyLog.findAll({
        attributes: [['goodDays', 'goodDays'], ['dateAdded', 'dateTime'], ['binges', 'binge']],
        where: {
            userUserId: userId
        }
    }).then(function (weeklyLog) {
        if (!_.isEmpty(weeklyLog)) {
            result.stats = weeklyLog;
        } else {
            result.stats = [];
        }
    }).catch(function (error) {
        message.name = 'Failure';
        message.stats = util.inspect(error);
    });

    //dailylogtoday
    result.dailylogtoday = 0;
    var sqlQuery = "SELECT COUNT(DATE(dateTimeLogged)) AS dailylogtoday FROM dailyFoodLogs WHERE userUserId = '" + userId + "' AND DATE(dateTimeLogged) = '" + new Date().getFullYear() + "-" + (new Date().getMonth() + 1) + "-" + new Date().getDate() + "'";
    db.sequelize.query(sqlQuery).spread(function (results, metadata) {
        console.log(util.inspect(results[0].dailylogtoday));
        result.dailylogtoday = results[0].dailylogtoday;
    }).catch(function (error) {
        message.name = 'Failure';
        message.dailylogtoday = util.inspect(error);
    });

    //weight
    result.weight = [];
    db.app.weeklyLog.findAll({
        attributes: [['weight', 'weight'], ['dateAdded', 'dateTime']],
        where: {
            userUserId: userId
        }
    }).then(function (weeklyLog) {
        if (!_.isEmpty(weeklyLog)) {
            result.weight = weeklyLog;
        } else {
            result.weight = [];
        }
        return res.json(result);
    }).catch(function (error) {
        message.name = 'Failure';
        message.weight = util.inspect(error);
        return res.status(400).send(message);
    });



});

//Weekly Log
router.post('/weeklyLog', userAuthenticate, function (req, res) {
    var body = _.pick(req.body, 'weekId', 'binges', 'goodDays', 'V', 'L', 'D', 'events', 'weight', 'logDateTime');
    body.logDateTime = new Date(body.logDateTime).toISOString();

    if (typeof body.weekId !== 'string' || typeof body.binges !== 'string' || typeof body.goodDays !== 'string' || typeof body.V !== 'string' || typeof body.L !== 'string' || typeof body.D !== 'string' || typeof body.events !== 'string' || typeof body.weight !== 'string' || typeof body.logDateTime !== 'string') {
        message = {
            'name': 'Error',
            'message': 'Problem with query parameters'
        };
        return res.status(400).send(message);
    }
    var userId = res.locals.userId || req.session.userId;

    db.app.weeklyLog.findOrCreate({
        where: {
            userUserId: userId,
            weekId: body.weekId,
            binges: body.binges,
            goodDays: body.goodDays,
            V: body.V,
            L: body.L,
            D: body.D,
            events: body.events,
            weight: body.weight,
            dateAdded: body.logDateTime
        },
        defaults: {
            userUserId: userId,
            weekId: body.weekId,
            binges: body.binges,
            goodDays: body.goodDays,
            V: body.V,
            L: body.L,
            D: body.D,
            events: body.events,
            weight: body.weight,
            dateAdded: body.logDateTime
        }
    }).spread(function (foodLog, created) {
        if (!(created)) {
            message = {
                'name': 'Failure',
                'message': 'Weekly Log with the given details exists'
            };
            return res.status(401).json(message);
        }
        message = {
            'name': 'Success',
            'message': 'Weekly Log created'
        };

        //Add entry to notification table - for the supporter
        var params = {};
        var userId = res.locals.userId || req.session.userId;
        params.userId = userId;
        params.message = "Weekly log logged";
        params.dateTimeSent = new Date().toISOString();
        params.to = res.locals.supporterId;
        params.from = userId;

        db.app.notifications.findOrCreate({
            where: {
                userUserId: params.userId,
                notificationMessage: params.message,
                dateTimeSent: params.dateTimeSent,
                from: params.from,
                to: params.to
            },
            defaults: {
                userUserId: params.userId,
                notificationMessage: params.message,
                dateTimeSent: params.dateTimeSent,
                from: params.from,
                to: params.to
            }
        }).spread(function (notification, created) {
            if (!created)
                message.weeklyLogMessage = 'A message already exists with given data, couldn\'t send a notification to the supporter';
            else
                message.weeklyLogMessage = 'Message log to the table';
        }).catch(function (error) {
            message.weeklyLogMessage = 'A message already exists with given data, couldn\'t send a notification to the supporter';
            message.error = util.inspect(error);
        });

        //end of notification logging


        return res.json(message);
    }).catch(function (error) {
        message = {
            'name': 'Failure',
            'message': 'Couldn\'t create weekly log',
            'error': util.inspect(error)
        };
        return res.status(400).send(message);
    });


});

router.get('/getWeeklyLog', userAuthenticate, function (req, res) {
    var userId = res.locals.userId || req.session.userId;
    db.app.weeklyLog.findAll({
        attributes: [['weeklyLogId', 'Weekly Log Id'], ['WeekId', 'Week Id'], ['binges', 'Number of Binges'], ['goodDays', 'No. of good days'], ['weight', 'Weight'], ['V', 'V'], ['L', 'L'], ['D', 'D'], ['events', 'Events'], ['dateAdded', 'Date Logged for']],
        where: {
            userUserId: userId
            // dateAdded: db.sequelize.where(db.sequelize.fn('date', db.sequelize.col('dateAdded')), '=', query.date)
        }
    }).then(function (weeklyLog) {
        if (!_.isEmpty(weeklyLog))
            return res.json(weeklyLog);
        else
            return res.status(400).json({ 'name': 'Failure', 'message': 'No weekly log exists' });
    }).catch(function (error) {
        message = {
            'name': error.name,
            'message': util.inspect(error)
        };
        console.log(error);
        return res.status(400).json(message);
    });
});

router.post('/updateWeeklyLog', userAuthenticate, function (req, res) {
    var body = _.pick(req.body, 'weeklyLogId', 'weekId', 'binges', 'goodDays', 'V', 'L', 'D', 'events', 'weight', 'logDateTime');
    body.logDateTime = new Date(body.logDateTime).toISOString();

    if (typeof body.weeklyLogId !== 'string' || typeof body.weekId !== 'string' || typeof body.binges !== 'string' ||
        typeof body.goodDays !== 'string' || typeof body.V !== 'string' || typeof body.L !== 'string' || typeof body.D !== 'string' ||
        typeof body.events !== 'string' || typeof body.weight !== 'string' || typeof body.logDateTime !== 'string') {
        message = {
            'name': 'Error',
            'message': 'Problem with query parameters'
        };
        return res.status(400).send(message);
    }
    var userId = res.locals.userId || req.session.userId;

    db.app.weeklyLog.find({
        where: {
            userUserId: userId,
            weeklyLogId: body.weeklyLogId
        }
    }).then(function (data) {
        if (!_.isEmpty(data)) {
            data.update({
                binges: body.binges,
                goodDays: body.goodDays,
                V: body.V,
                L: body.L,
                D: body.D,
                events: body.events,
                weight: body.weight,
                dateAdded: body.logDateTime
            }).then(function (data1) {
                console.log('data1: ' + data1);
                message.name = 'Success';
                message.message = 'Update to Weekly log successful';
                message.data = data1;

                //Add entry to notification table - for the supporter
                var params = {};

                params.userId = userId;
                params.message = "Weekly log updated";
                params.dateTimeSent = new Date().toISOString();
                params.to = res.locals.supporterId;
                params.from = userId;

                db.app.notifications.findOrCreate({
                    where: {
                        userUserId: params.userId,
                        notificationMessage: params.message,
                        dateTimeSent: params.dateTimeSent,
                        from: params.from,
                        to: params.to
                    },
                    defaults: {
                        userUserId: params.userId,
                        notificationMessage: params.message,
                        dateTimeSent: params.dateTimeSent,
                        from: params.from,
                        to: params.to
                    }
                }).spread(function (notification, created) {
                    if (!created)
                        message.weeklyLogMessage = 'A message already exists with given data, couldn\'t send a notification to the supporter';
                    else
                        message.weeklyLogMessage = 'Message log to the table';
                }).catch(function (error) {
                    message.weeklyLogMessage = 'A message already exists with given data, couldn\'t send a notification to the supporter';
                    message.error = util.inspect(error);
                });

                //end of notification logging

                return res.json(message);
            }).catch(function (error) {
                console.error('Error in updating the user device : ' + error);
                message.name = 'Failure';
                message.message = 'Error in updating the weekly log';
                message.error = util.inspect(error);
                return res.status(404).send(message);
            });
        }
    });
});

router.post('/deleteWeeklyLog', userAuthenticate, function (req, res) {
    var body = _.pick(req.body, 'weeklyLogId');

    if (typeof body.weeklyLogId !== 'string') {
        message = {
            'name': 'Error',
            'message': 'Problem with query parameters'
        };
        return res.status(400).send(message);
    }
    var userId = res.locals.userId || req.session.userId;
    db.app.weeklyLog.find({
        where: {
            userUserId: userId,
            weeklyLogId: body.weeklyLogId
        }
    }).then(function (data) {
        if (!_.isEmpty(data)) {
            data.destroy();
            message.name = 'Success';
            message.message = 'Weekly log deleted';

            //Add entry to notification table - for the supporter
            var params = {};

            params.userId = userId;
            params.message = "Weekly log deleted";
            params.dateTimeSent = new Date().toISOString();
            params.to = res.locals.supporterId;
            params.from = userId;

            db.app.notifications.findOrCreate({
                where: {
                    userUserId: params.userId,
                    notificationMessage: params.message,
                    dateTimeSent: params.dateTimeSent,
                    from: params.from,
                    to: params.to
                },
                defaults: {
                    userUserId: params.userId,
                    notificationMessage: params.message,
                    dateTimeSent: params.dateTimeSent,
                    from: params.from,
                    to: params.to
                }
            }).spread(function (notification, created) {
                if (!created)
                    message.weeklyLogMessage = 'A message already exists with given data, couldn\'t send a notification to the supporter';
                else
                    message.weeklyLogMessage = 'Message log to the table';
            }).catch(function (error) {
                message.weeklyLogMessage = 'A message already exists with given data, couldn\'t send a notification to the supporter';
                message.error = util.inspect(error);
            });

            //end of notification logging

            return res.json(message);
        } else {
            message.name = 'Failure';
            message.message = 'Trying to delete the data which isn\'t there';
            return res.status(404).json(message);
        }
    }).catch(function (error) {
        message.name = 'Failure';
        message.message = util.inspect(error);
        return res.status(404).json(message);
    });
});

//Notes
router.post('/addNotes', userAuthenticate, function (req, res) {
    var body = _.pick(req.body, 'notes', 'shareable', 'appointmentId', 'titl');

    if (typeof body.notes !== 'string' || typeof body.shareable !== 'string' || typeof body.appointmentId !== 'string' || typeof body.titl !== 'string') {
        message = {
            'name': 'Error',
            'message': 'Problem with query parameters'
        };
        console.log('message: ' + message);
        console.log('body: ' + util.inspect(body));
        return res.status(400).send(message);
    }
    var userId = res.locals.userId || req.session.userId;
    var supporterId = res.locals.supporterId;

    db.app.notes.findOrCreate({
        where: {
            notes: body.notes,
            isAdminShareable: body.shareable,
            userUserId: userId,
            researcherSupporterId: supporterId,
            appointmentAppointmentId: body.appointmentId,
            title: body.titl
        },
        defaults: {
            notes: body.notes,
            isAdminShareable: body.shareable,
            userUserId: userId,
            researcherSupporterId: supporterId,
            appointmentAppointmentId: body.appointmentId,
            title: body.titl
        }
    }).spread(function (foodLog, created) {
        if (!(created)) {
            message = {
                'name': 'Failure',
                'message': 'Note with the given details exists'
            };
            return res.status(401).json(message);
        }
        message = {
            'name': 'Success',
            'message': 'Note added'
        };

        //Add entry to notification table - for the supporter
        var params = {};
        var userId = res.locals.userId || req.session.userId;
        params.userId = userId;
        params.message = "Note added";
        params.dateTimeSent = new Date().toISOString();
        params.to = res.locals.supporterId;
        params.from = userId;

        db.app.notifications.findOrCreate({
            where: {
                userUserId: params.userId,
                notificationMessage: params.message,
                dateTimeSent: params.dateTimeSent,
                from: params.from,
                to: params.to
            },
            defaults: {
                userUserId: params.userId,
                notificationMessage: params.message,
                dateTimeSent: params.dateTimeSent,
                from: params.from,
                to: params.to
            }
        }).spread(function (notification, created) {
            if (!created)
                message.notes = 'A note already exists with given data, couldn\'t send a notification to the supporter';
            else
                message.notes = 'Message log to the table';
        }).catch(function (error) {
            message.notes = 'A note already exists with given data, couldn\'t send a notification to the supporter';
            message.error = util.inspect(error);
        });

        //end of notification logging


        return res.json(message);
    }).catch(function (error) {
        message = {
            'name': 'Failure',
            'message': 'Couldn\'t add note to the appointment',
            'error': util.inspect(error)
        };
        return res.status(400).send(message);
    });


});

router.post('/updateNotes', userAuthenticate, function (req, res) {
    var body = _.pick(req.body, 'notes', 'shareable', 'appointmentId', 'titl');

    if (typeof body.notes !== 'string' || typeof body.shareable !== 'string' || typeof body.appointmentId !== 'string' || typeof body.titl !== 'string') {
        message = {
            'name': 'Error',
            'message': 'Problem with query parameters'
        }
        return res.status(400).send(message);
    }
    var userId = res.locals.userId || req.session.userId;
    var supporterId = res.locals.supporterId;

    db.app.notes.find({
        where: {
            notes: body.notes,
            isAdminShareable: body.shareable,
            userUserId: userId,
            researcherSupporterId: supporterId,
            appointmentAppointmentId: body.appointmentId,
            title: body.titl
        }
    }).then(function (data) {
        if (!_.isEmpty(data)) {
            data.update({
                notes: body.notes,
                isAdminShareable: body.shareable,
                userUserId: userId,
                researcherSupporterId: supporterId,
                appointmentAppointmentId: body.appointmentId,
                title: body.titl
            }).then(function (data1) {
                console.log('data1: ' + data1);
                message.name = 'Success';
                message.message = 'Update to Note successful';
                message.data = data1;

                //Add entry to notification table - for the supporter
                var params = {};

                params.userId = userId;
                params.message = "Note updated";
                params.dateTimeSent = new Date().toISOString();
                params.to = res.locals.supporterId;
                params.from = userId;

                db.app.notifications.findOrCreate({
                    where: {
                        userUserId: params.userId,
                        notificationMessage: params.message,
                        dateTimeSent: params.dateTimeSent,
                        from: params.from,
                        to: params.to
                    },
                    defaults: {
                        userUserId: params.userId,
                        notificationMessage: params.message,
                        dateTimeSent: params.dateTimeSent,
                        from: params.from,
                        to: params.to
                    }
                }).spread(function (notification, created) {
                    if (!created)
                        message.notes = 'A note already exists with given data, couldn\'t send a notification to the supporter';
                    else
                        message.notes = 'Message log to the table';
                }).catch(function (error) {
                    message.notes = 'A note already exists with given data, couldn\'t send a notification to the supporter';
                    message.error = util.inspect(error);
                });

                //end of notification logging

                return res.json(message);
            }).catch(function (error) {
                message.name = 'Failure';
                message.message = 'Error in updating the note';
                message.error = util.inspect(error);
                return res.status(404).send(message);
            });
        }
    });
});

router.post('/deleteNotes', userAuthenticate, function (req, res) {
    var body = _.pick(req.body, 'noteId');

    if (typeof body.noteId !== 'string') {
        message = {
            'name': 'Error',
            'message': 'Problem with query parameters'
        };
        return res.status(400).send(message);
    }
    var userId = res.locals.userId || req.session.userId;
    db.app.notes.find({
        where: {
            notesId: body.noteId
        }
    }).then(function (data) {
        if (!_.isEmpty(data)) {
            data.destroy();
            message.name = 'Success';
            message.message = 'Note deleted';

            //Add entry to notification table - for the supporter
            var params = {};

            params.userId = userId;
            params.message = "Note deleted";
            params.dateTimeSent = new Date().toISOString();
            params.to = res.locals.supporterId;
            params.from = userId;

            db.app.notifications.findOrCreate({
                where: {
                    userUserId: params.userId,
                    notificationMessage: params.message,
                    dateTimeSent: params.dateTimeSent,
                    from: params.from,
                    to: params.to
                },
                defaults: {
                    userUserId: params.userId,
                    notificationMessage: params.message,
                    dateTimeSent: params.dateTimeSent,
                    from: params.from,
                    to: params.to
                }
            }).spread(function (notification, created) {
                if (!created)
                    message.weeklyLogMessage = 'A Note already exists with given data, couldn\'t send a notification to the supporter';
                else
                    message.weeklyLogMessage = 'Message log to the table';
            }).catch(function (error) {
                message.weeklyLogMessage = 'A Note already exists with given data, couldn\'t send a notification to the supporter';
                message.error = util.inspect(error);
            });

            //end of notification logging

            return res.json(message);
        } else {
            message.name = 'Failure';
            message.message = 'Trying to delete the note which isn\'t there';
            return res.status(404).json(message);
        }
    }).catch(function (error) {
        message.name = 'Failure';
        message.message = util.inspect(error);
        return res.status(404).json(message);
    });
});

//Appointments
router.get('/getAppointmentDetails', userAuthenticate, function (req, res) {
    var userId = res.locals.userId || req.session.userId;
    var sqlQuery = "SELECT * FROM appointments LEFT OUTER JOIN notes on notes.appointmentAppointmentId = appointments.appointmentId WHERE appointments.userUserId = '" + userId + "'";
    // var sqlQuery1 = "SELECT * FROM appointments WHERE appointments.userUserId = '" + userId + "'";
    // var sqlQuery2 = "SELECT * FROM notes WHERE notes.userUserId = '" + userId + "'";
    // var sqlQuery = "SELECT DISTINCT appointments.appointmentId AS id, appointments.appointmentTime as dateTime, appointments.title as title, appointments.researcherSupporterId AS supporter, (SELECT GROUP_CONCAT(DISTINCT notesId , notes, isAdminShareable, title) FROM notes n WHERE n.appointmentAppointmentId = appointmentId) AS notes     FROM appointments INNER JOIN notes on notes.appointmentAppointmentId = appointments.appointmentId WHERE appointments.userUserId = '" + userId + "' GROUP BY appointments.appointmentId";
    // var sqlQuery = "SELECT DISTINCT a.appointmentId AS id, a.appointmentTime as dateTime, a.title as title, a.researcherSupporterId AS supporter, (SELECT JSON_OBJECT('id', notesId , 'notes', notes,'adminshared', isAdminShareable,'title', title) FROM notes n WHERE n.appointmentAppointmentId = a.appointmentId) AS notes  FROM appointments a INNER JOIN notes n on n.appointmentAppointmentId = a.appointmentId WHERE a.userUserId = '" + userId + "' GROUP BY a.appointmentId";
    //var sqlQuery = "SELECT DISTINCT a.appointmentId AS id, a.appointmentTime as dateTime, a.title as title, a.researcherSupporterId AS supporter, row_to_json(n.notesId , n.notes, n.isAdminShareable, n.title) AS notes FROM appointments a INNER JOIN notes n on n.appointmentAppointmentId = a.appointmentId WHERE a.userUserId = '" + userId + "' GROUP BY a.appointmentId";
    // console.log(sqlQuery1);
    // console.log(sqlQuery2);
    console.log(sqlQuery);

    var resultsData = {};

    db.sequelize.query(sqlQuery).spread(function (results, metadata) {

        resultsData.appointments = results;

        return res.json(resultsData);
    }).catch(function (error) {
        message = {
            'name': 'Failure',
            'message': 'Couldn\'t get appointments',
            'error': util.inspect(error)
        };
        return res.status(400).send(message);
    });
});

//Steps
router.get('/getStepInfo', userAuthenticate, function (req, res) {
    var userId = res.locals.userId || req.session.userId;

    var sqlQuery = "SELECT DISTINCT r.responseId AS id, s.description as stepname, p.supporterId as assignedby, p.status AS status, r.dateUpdated AS responseDateTime, s.checkList AS checkList,r.comments AS comments, r.userResponse AS responseStatus, p.dateUpdated AS progressDateTime  FROM steps s INNER JOIN responses r ON s.stepId = r.stepId INNER JOIN progresses p ON p.responseId = r.responseId WHERE r.userId = '" + userId + "'";

    console.log(sqlQuery);

    var resultsData = {};

    db.sequelize.query(sqlQuery).spread(function (results, metadata) {

        resultsData.steps = results;

        return res.json(resultsData);
    }).catch(function (error) {
        message = {
            'name': 'Failure',
            'message': 'Couldn\'t get steps',
            'error': util.inspect(error)
        };
        return res.status(400).send(message);
    });
});

router.post('/updateResponse', userAuthenticate, function (req, res) {
    console.log(req.session);
    var responseId;
    var body = _.pick(req.body, 'responseId', 'comments', 'response');

    if (typeof body.responseId !== 'string' || typeof body.comments !== 'string' || typeof body.response !== 'string') {
        message = {
            'name': 'Error',
            'message': 'Problem with query parameters'
        };
        return res.status(400).send(message);
    }

    db.app.response.find({
        where: {
            responseId: body.responseId
        }
    }).then(function (data) {
        if (!_.isEmpty(data)) {
            data.update({
                comments: body.comments,
                userResponse: body.response
            }).then(function (data1) {
                console.log('data1: ' + util.inspect(data1));
                message.name = 'Success';
                message.message = 'Updated user response successfully';
                message.data = data1;

                return res.json(message);
            }).catch(function (error) {
                console.error('Error in updating the user response ' + erro);
                message.name = 'Failure';
                message.message = 'Error in updating the user responses';
                message.error = util.inspect(error);
                return res.status(404).send(message);
            });
        }
    });


});

//notifications
router.get('/getNotifications', userAuthenticate, function (req, res) {

    var query = _.pick(req.query, 'userId');
    console.log(req.session);
    if (typeof query.userId !== 'string') {
        message = {
            'name': 'Error',
            'message': 'Problem with query parameters'
        };
        console.log(message);
        return res.status(400).send(message);
    }

    db.app.notifications.findAll({
        attributes: [['notificationId', 'Id'], ['notificationMessage', 'Message'], ['dateTimeSent', 'dateTimeSent'], ['from', 'from'], ['type', 'type']],
        where: {
            to: res.locals.userId || query.userId
        },
        order: [['dateTimeSent', 'DESC']]
    }).then(function (notifications) {
        if (!_.isEmpty(notifications)) {
            var sent = {};
            sent.notifications = notifications;
            return res.json(sent);
        } else {
            message.name = 'Failure';
            message.message = 'There are no messages for the user';
            return res.status(404).send(message);
        }
    }).catch(function (error) {
        message = {
            'name': error.name,
            'message': util.inspect(error)
        };
        console.log(error);
        return res.status(400).json(message);
    });
});



module.exports = router;