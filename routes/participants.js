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
        where: {
            userId: query.userId
        }
    }).then(function (user) {
        if (!user.dataValues || !bcrypt.compareSync(query.password, user.get('passwordHash'))) {
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
            where: {'deviceId': query.deviceId}
        }).then(function (userDevice) {
            if (userDevice) {
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
    }, {
        validate: true,
        fields: {
            registeredTime: body.registeredTime,
            deviceId: body.deviceId,
            fcmToken: body.fcmToken
        }
    }).then(function (savedObject) {
        if (!savedObject) {
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
            'message': error.errors[0].message
        };
        return res.status(400).json(message);
    });
});

router.get('/getDates', userAuthenticate, function (req, res) {
    var sqlQuery = "SELECT DATE(dateTimeLogged) AS LogDateTime FROM dailyFoodLogs WHERE userUserId = '" + res.locals.userId + "' UNION SELECT DATE(dateTimeLogged) AS LogDateTime FROM dailyphysicallogs WHERE userUserId = '" + res.locals.userId + "'";
    console.log(sqlQuery);
    var resultsData = {};
    db.sequelize.query(sqlQuery).spread(function (results, metadata) {
        console.log(util.inspect(metadata));
        resultsData.result = results;
        console.log(util.inspect(resultsData));
        return res.json(resultsData);
    });
});


//Food Log
router.post('/foodLog', userAuthenticate, function (req, res) {
    var body = _.pick(req.body, 'food', 'latitude', 'longitude', 'binge', 'vomit', 'logDateTime');
    body.logDateTime = new Date(body.logDateTime).toISOString();
    console.log(__dirname);
    __dirname = __dirname.substring(0, __dirname.indexOf("\\routes")) + '\\images';
    console.log(__dirname);
    if (typeof body.food !== 'string' || typeof body.latitude !== 'string' || typeof body.longitude !== 'string' || typeof body.binge !== 'string' || typeof body.vomit !== 'string' || typeof body.logDateTime !== 'string') {
        message = {
            'name': 'Error',
            'message': 'Problem with query parameters'
        };
        return res.status(403).send(message);
    }

    console.log(body.logDateTime);

    db.app.dailyFoodLog.findOrCreate({
        where: {
            userUserId: res.locals.userId || req.session.userId,
            foodConsumedLog: body.food,
            feelingBinge: body.binge,
            feelingVomiting: body.vomit,
            dateTimeLogged: body.logDateTime
        },
        defaults: {
            userUserId: res.locals.userId || req.session.userId,
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
            return res.json(message);
        }
        message = {
            'name': 'Success',
            'message': 'Food Log created'
        };
        return res.json(message);
    });

    // db.app.dailyFoodLog.build({
    //     userUserId: body.userId || req.session.userId,
    //     foodConsumedLog: body.food,
    //     latitude: body.latitude,
    //     longitude: body.longitude,
    //     feelingBinge: body.binge,
    //     feelingVomiting: body.vomit,
    //     dateTimeLogged: body.logDateTime
    // }).save()
    //     .then(function (savedObject) {
    //         if (!savedObject) {
    //             message = {
    //                 'name': "Failure",
    //                 'message': 'Error in creating food log'
    //             }
    //             return res.status(404).json(message);
    //         }
    //         message = {
    //             'name': "Success",
    //             'message': "Food log created successfully"
    //         };
    //         return res.json(message);
    //     }).catch(function (error) {
    //     console.log(error);
    //     message = {
    //         'name': error.name,
    //         'message': error.errors[0].message
    //     };
    //     return res.status(400).json(message);
    // });
});

router.get('/getFoodLog', userAuthenticate, function (req, res) {
    var query = _.pick(req.query, 'date');
    if (typeof query.date !== 'string') {
        message = {
            'name': 'Error',
            'message': 'Problem with query parameters'
        };
        console.log(message);
        return res.status(400).send(message);
    }

    var results = {};

    db.app.dailyPhysicalLog.findAll({
        attributes: [['dailyPhysicalLogId', 'Daily Physical Log Id'], ['physicalActivityPerformed', 'Physical Activity Logged'], ['duration', 'Duration'], ['dateTimeLogged', 'Logged Time'], ['feelingTired', 'Feeling Tired']],
        where: {
            userUserId: res.locals.userId,
            dateTimeLogged: db.sequelize.where(db.sequelize.fn('date', db.sequelize.col('dateTimeLogged')), '=', query.date)
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
            userUserId: res.locals.userId,
            dateTimeLogged: db.sequelize.where(db.sequelize.fn('date', db.sequelize.col('dateTimeLogged')), '=', query.date)
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

    db.app.dailyFoodLog.find({
        where: {
            userUserId: res.locals.userId,
            dailyFoodLogId: body.dailyFoodLogId
        }
    }).then(function (data) {
        if (data) {
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

    db.app.dailyFoodLog.find({
        where: {
            userUserId: res.locals.userId,
            dailyFoodLogId: body.dailyFoodLogId
        }
    }).then(function (data) {
        if (data) {
            data.destroy();
            message.name = 'Success';
            message.message = 'Daily log deleted';
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
    var newPath = __dirname.substring(0, __dirname.indexOf("\\routes")) + '\\images';
    var body = _.pick(req.body, 'food', 'latitude', 'longitude', 'binge', 'vomit', 'returnType', 'logDateTime');

    body.imageFile = req.files.image;
    body.returnType = path.extname(req.files.image.originalFilename).toLowerCase();
    console.log("typeof the imagefile : " + typeof body.imageFile);
    console.log("originalFilename : " + req.files.image.originalFilename);
    console.log("originalFilePath : " + req.files.image.path);
    if (typeof body.food !== 'string' || typeof body.latitude !== 'string' || typeof body.longitude !== 'string' || typeof body.binge !== 'string' || typeof body.vomit !== 'string' || typeof body.returnType !== 'string' || typeof body.logDateTime !== 'string') {
        message = {
            'name': 'Error',
            'message': 'Problem with query parameters'
        };
        return res.status(400).send(message);
    }

    fs.readFile(body.imageFile.path, function (err, data) {
        newPath += req.files.image.originalFilename;
        //newPath += req.files.image.originalFilename;
        console.log(newPath);
        fs.writeFile(newPath, data, function (err) {
            if (err) {
                message.image = 'Error in uploading the image';
            } else {
                message.image = 'Image uploaded successfully';
            }
        });
    });

    db.app.dailyFoodLog.findOrCreate({
        where: {
            userUserId: res.locals.userId || req.session.userId,
            foodConsumedLog: body.food,
            feelingBinge: body.binge,
            feelingVomiting: body.vomit,
            dateTimeLogged: body.logDateTime
        },
        defaults: {
            userUserId: res.locals.userId || req.session.userId,
            foodConsumedLog: body.food,
            foodConsumedURL: newPath + returnType,
            latitude: body.latitude,
            longitude: body.longitude,
            feelingBinge: body.binge,
            feelingVomiting: body.vomit,
            dateTimeLogged: body.logDateTime,
            returnType: body.returnType
        }
    }).spread(function (foodLog, created) {
        if (!created) {
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
        return res.json(message);
    });


    // db.app.dailyFoodLog.findOrCreate({
    //     userUserId: res.locals.userId || req.session.userId,
    //     foodConsumedLog: req.body.food,
    //     foodConsumedURL: newPath + returnType,
    //     latitude: req.body.latitude,
    //     longitude: req.body.longitude,
    //     feelingBinge: req.body.binge,
    //     feelingVomiting: req.body.vomit,
    //     dateTimeLogged: body.logDateTime,
    //     returnType: body.returnType
    // }).save()
    //     .then(function (savedObject) {
    //         if (!savedObject) {
    //             message.name = "Failure";
    //             message.message = 'Error in creating quick log';
    //             return res.status(404).json(message);
    //         }
    //         message.name = "Success";
    //         message.message = 'Quick log created successfully';
    //         return res.json(message);
    //     }).catch(function (error) {
    //     console.log(error);
    //     message = {
    //         'name': error.name,
    //         'message': error.errors[0].message
    //     };
    //
    //     return res.status(400).json(message);
    // });
});

router.post('/updateQuickLog', userAuthenticate, function (req, res) {
    var body = _.pick(req.body, 'dailyFoodLogId', 'food', 'latitude', 'longitude', 'binge', 'vomit', 'logDateTime');
    body.logDateTime = new Date(body.logDateTime).toISOString();

    if (typeof body.dailyFoodLogId !== 'string' || typeof body.food !== 'string' || typeof body.latitude !== 'string' || typeof body.longitude !== 'string' || typeof body.binge !== 'string' || typeof body.vomit !== 'string' || typeof body.logDateTime !== 'string') {
        message = {
            'name': 'Error',
            'message': 'Problem with query parameters'
        };
        return res.status(403).send(message);
    }

    db.app.dailyFoodLog.find({
        where: {
            userUserId: res.locals.userId,
            dailyFoodLogId: body.dailyFoodLogId
        }
    }).then(function (data) {
        if (data) {
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

    db.app.dailyPhysicalLog.findOrCreate({
        where: {
            userUserId: res.locals.userId || req.session.userId,
            physicalActivityPerformed: body.physicalActivityPerformed,
            duration: body.duration,
            feelingTired: body.feelingTired,
            dateTimeLogged: body.logDateTime
        },
        defaults: {
            userUserId: res.locals.userId || req.session.userId,
            physicalActivityPerformed: body.physicalActivityPerformed,
            duration: body.duration,
            feelingTired: body.feelingTired,
            dateTimeLogged: body.logDateTime
        }
    }).spread(function (foodLog, created) {
        if (!created) {
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
        return res.json(message);
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

    db.app.dailyPhysicalLog.find({
        where: {
            userUserId: res.locals.userId,
            dailyPhysicalLogId: body.dailyPhysicalLogId
        }
    }).then(function (data) {
        if (data) {
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

    db.app.dailyPhysicalLog.find({
        where: {
            userUserId: res.locals.userId,
            dailyPhysicalLogId: body.dailyPhysicalLogId
        }
    }).then(function (data) {
        if (data) {
            data.destroy();
            message.name = 'Success';
            message.message = 'Physical log deleted';
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

    db.app.weeklyLog.findOrCreate({
        where: {
            userUserId: res.locals.userId || req.session.userId,
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
            userUserId: res.locals.userId || req.session.userId,
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
        if (!created) {
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
        return res.json(message);
    });

});

router.get('/getWeeklyLog', userAuthenticate, function (req, res) {
    var query = _.pick(req.query, 'date');
    if (typeof query.date !== 'string') {
        message = {
            'name': 'Error',
            'message': 'Problem with query parameters'
        };
        console.log(message);
        return res.status(400).send(message);
    }

    db.app.weeklyLog.findAll({
        attributes: [['weeklyLogId', 'Weekly Log Id'], ['WeekId', 'Week Id'], ['binges', 'Number of Binges'], ['goodDays', 'No. of good days'], ['weight', 'Weight'], ['V', 'V'], ['L', 'L'], ['D', 'D'], ['events', 'Events'], ['dateAdded', 'Date Logged for']],
        where: {
            userUserId: res.locals.userId,
            dateAdded: db.sequelize.where(db.sequelize.fn('date', db.sequelize.col('dateAdded')), '=', query.date)
        }
    }).then(function (supporters) {
        res.json(supporters);
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

    db.app.weeklyLog.find({
        where: {
            userUserId: res.locals.userId,
            weeklyLogId: body.weeklyLogId
        }
    }).then(function (data) {
        if (data) {
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

    db.app.weeklyLog.find({
        where: {
            userUserId: res.locals.userId,
            weeklyLogId: body.weeklyLogId
        }
    }).then(function (data) {
        if (data) {
            data.destroy();
            message.name = 'Success';
            message.message = 'Weekly log deleted';
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

module.exports = router;