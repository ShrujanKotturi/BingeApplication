/**
 * Created by shruj on 11/02/2016.
 */
var express = require('express'),
    bcrypt = require('bcrypt'),
    util = require('util'),
    _ = require('underscore'),
    cryptojs = require('crypto-js'),
    jwt = require('jsonwebtoken'),
    FCM = require('fcm-node'),
    supporterAuthenticate = require('../middleware/supporterAuthenticate'),
    config = require('../config.json'),
    fcmCli = new FCM(config.SERVER_API_KEY);

var router = express.Router();
var db = require('../db');
var message = {};

//Profile
router.get('/login', function (req, res) {
    var query = _.pick(req.query, 'supporterId', 'password');
    if (typeof query.supporterId !== 'string' || typeof query.password !== 'string') {
        message = {
            'name': 'Error',
            'message': 'Problem with query parameters'
        };
        console.log(message);
        return res.status(400).send(message);
    }

    db.app.researchers.findOne({
        where: {
            supporterId: query.supporterId
        }
    }).then(function (supporter) {
        if (_.isEmpty(supporter.dataValues) || !bcrypt.compareSync(query.password, supporter.get('passwordHash'))) {
            message = {
                'name': "Failure",
                'message': 'Id & Password match not found'
            };
            console.log(message);
            return res.status(404).json(message);
        }
        var result = supporter.toPublicJSON();
        message = {
            'name': "Success",
            'message': "Supporter Login is Successful",
            'result': util.inspect(result)
        };
        var session = {};
        var stringData = JSON.stringify(result);
        var encryptedData = cryptojs.AES.encrypt(stringData, 'abc123!@#').toString();
        var token = jwt.sign({
            token: encryptedData
        }, 'qwerty098');
        if (token) {
            session = req.session;
            session.supporterId = supporter.dataValues.supporterId;
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
            'message': util.inspect(error)
        };
        console.log(message);
        return res.status(400).json(message);
    });
});

router.post('/changePassword', supporterAuthenticate, function (req, res) {
    console.log(req.session);
    var responseId;
    var body = _.pick(req.body, 'userId', 'password');

    if (typeof body.userId !== 'string' || typeof body.password !== 'string') {
        message = {
            'name': 'Error',
            'message': 'Problem with query parameters'
        };
        return res.status(400).send(message);
    }

    db.app.users.find({
        where: {
            userId: body.userId,
        }
    }).then(function (data) {
        if (!_.isEmpty(data)) {
            data.update({
                passwordHash: bcrypt.hashSync(body.password, bcrypt.genSaltSync(10))
            }).then(function (data1) {
                console.log('data1: ' + util.inspect(data1));
                message.name = 'Success';
                message.message = 'Update to password successful';
                message.data = data1;

                return res.json(message);
            }).catch(function (error) {
                console.error('Error in updating the user password ' + erro);
                message.name = 'Failure';
                message.message = 'Error in updating the user password';
                message.error = util.inspect(error);
                return res.status(404).send(message);
            });
        }
    });


});


router.get('/getAllUsers', supporterAuthenticate, function (req, res) {
    console.log(req.session);

    db.app.users.findAll({
        attributes: [['userId', 'User Name'], ['researcherSupporterId', 'Supporter Id'], ['age', 'Age'], ['createdAt', 'Created Date']],
        where: {
            researcherSupporterId: req.session.supporterId,
            isActive: true
        }
    }).then(function (users) {
        if (!_.isEmpty(users))
            return res.json(users);
        else
            return res.status(400).json({ 'name': 'Failure', 'message': 'No participants exists' });
    }).catch(function (error) {
        message = {
            'name': error.name,
            'message': util.inspect(error)
        };
        console.log(error);
        return res.status(400).json(message);
    });
});

router.get('/getUserFoodLog', supporterAuthenticate, function (req, res) {
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

    db.app.dailyFoodLog.findAll({
        attributes: [['dailyFoodLogId', 'Daily Food Log Id'], ['foodConsumedLog', 'Food Consumed'], ['foodConsumedURL', 'Image'], 'latitude', 'longitude', ['dateTimeLogged', 'Logged Time'], ['feelingBinge', 'Feeling Binge'], ['feelingVomiting', 'Feeling Vomiting'], ['returnType', 'Image Type']],
        where: {
            userUserId: query.userId
        }
    }).then(function (foodLog) {
        if (!_.isEmpty(foodLog))
            return res.json(foodLog);
        else
            return res.status(400).json({ 'name': 'Failure', 'message': 'No food Log exists' });
    }).catch(function (error) {
        message = {
            'name': error.name,
            'message': util.inspect(error)
        };
        console.log(error);
        return res.status(400).json(message);
    });
});

router.get('/getUserWeeklyLog', supporterAuthenticate, function (req, res) {
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

    db.app.weeklyLog.findAll({
        attributes: [['weeklyLogId', 'Weekly Log Id'], ['WeekId', 'Week Id'], ['binges', 'Number of Binges'], ['goodDays', 'No. of good days'], ['weight', 'Weight'], ['V', 'V'], ['L', 'L'], ['D', 'D'], ['events', 'Events'], ['dateAdded', 'Date Logged for']],
        where: {
            userUserId: query.userId
        }
    }).then(function (weeklyLog) {
        if (!_.isEmpty(weeklyLog))
            return res.json(weeklyLog);
        else
            return res.status(400).json({ 'name': 'Failure', 'message': 'No weekly Log exists' });
    }).catch(function (error) {
        message = {
            'name': error.name,
            'message': util.inspect(error)
        };
        console.log(error);
        return res.status(400).json(message);
    });
});

router.get('/getUserPhysicalLog', supporterAuthenticate, function (req, res) {
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

    db.app.dailyPhysicalLog.findAll({
        attributes: [['dailyPhysicalLogId', 'Daily Physical Log Id'], ['physicalActivityPerformed', 'Physical Activity Logged'], ['duration', 'Duration'], ['dateTimeLogged', 'Logged Time'], ['feelingTired', 'Feeling Tired']],
        where: {
            userUserId: query.userId
        }
    }).then(function (physicalLog) {
        if (!_.isEmpty(physicalLog))
            return res.json(physicalLog);
        else
            return res.status(400).json({ 'name': 'Failure', 'message': 'No physical Log exists' });
    }).catch(function (error) {
        message = {
            'name': error.name,
            'message': util.inspect(error)
        };
        console.log(error);
        return res.status(400).json(message);
    });
});

router.post('/makeAppointment', supporterAuthenticate, function (req, res) {
    var body = _.pick(req.body, 'appointmentTime', 'title', 'comments', 'createdOn', 'userId', 'supporterId');
    console.log(req.session);
    if (typeof body.appointmentTime !== 'string' || typeof body.title !== 'string' || typeof body.comments !== 'string' || typeof body.createdOn !== 'string' || typeof body.userId !== 'string' || typeof body.supporterId !== 'string') {
        message = {
            'name': 'Error',
            'message': 'Problem with query parameters'
        };
        console.log(message);
        return res.status(400).send(message);
    }

    db.app.appointments.findOrCreate({
        where: {
            userUserId: body.userId,
            appointmentTime: body.appointmentTime,
            title: body.title,
            comments: body.comments,
            createdOn: body.createdOn,
            researcherSupporterId: req.session.supporterId || body.supporterId
        },
        defaults: {
            userUserId: body.userId,
            appointmentTime: body.appointmentTime,
            title: body.title,
            comments: body.comments,
            createdOn: body.createdOn,
            researcherSupporterId: req.session.supporterId || body.supporterId
        }
    }).spread(function (foodLog, created) {
        if (!(created)) {
            message = {
                'name': 'Failure',
                'message': 'Appointment already exists with the same date time'
            };
            return res.status(401).json(message);
        }
        message = {
            'name': 'Success',
            'message': 'Appointment created'
        };

        var notificationToUser = "An appointment is schedule at " + body.appointmentTime + ", check with your supporter";

        db.app.users.findOne({
            attributes: [['appNotifications', 'Permission']],
            where: {
                userId: body.userId,
                isActive: true
            }
        }).then(function (user) {
            if (!_.isEmpty(user)) {
                console.log('if: ' + user.dataValues.Permission);
                if (user.dataValues.Permission === 1) {
                    db.app.userDeviceMapper.findOne({
                        attributes: [['fcmToken', 'Token']],
                        where: {
                            userUserId: body.userId
                        }
                    }).then(function (deviceMapper) {
                        if (!_.isEmpty(deviceMapper)) {
                            var payloadOk = {
                                to: deviceMapper.dataValues.Token,
                                priority: 'high',
                                notification: {
                                    title: 'Women Health Project',
                                    body: notificationToUser
                                }
                            };
                            fcmCli.send(payloadOk, function (err, result) {
                                if (err) {
                                    console.error(err)
                                } else {
                                    console.log(result);
                                    message.fcm = 'Message in-transit';
                                    message.result = result;
                                }
                            });

                        } else {
                            message.mapperError = 'Couldn\'t find the Device Token associated with the User';
                        }
                    }).catch(function (error) {
                        message.error = error.name;
                        message.error_message = util.inspect(error);
                        console.log(error);
                        return res.status(400).json(message);
                    });

                    return res.json(message);


                } else {
                    message.name = 'Failure';
                    message.message = "Not authorized to send Messages to the Participant";
                    return res.status(401).send(message);
                }
            } else {
                message.name = 'Failure';
                message.message = "User doesn't exists/User isn't active";
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

        return res.json(message);
    }).catch(function (error) {
        message = {
            'name': 'Failure',
            'message': 'Couldn\'t create appointment',
            'error': util.inspect(error)
        };
        return res.status(400).send(message);
    });

});

//Messages
router.post('/messagesToUser', supporterAuthenticate, function (req, res) {
    var body = _.pick(req.body, 'message', 'dateTimeSent', 'to', 'userId', 'supporterId');
    console.log(req.session);

    console.log("messagesToUser: " + util.inspect(body));
    if (typeof body.message !== 'string' || typeof body.dateTimeSent !== 'string' || typeof body.to !== 'string' || typeof body.userId !== 'string' || typeof body.supporterId !== 'string') {
        message = {
            'name': 'Error',
            'message': 'Problem with query parameters'
        };
        console.log(message);
        return res.status(400).send(message);
    }

    db.app.users.findOne({
        attributes: [['sendMotivationalMessages', 'Permission']],
        where: {
            userId: body.userId,
            isActive: true
        }
    }).then(function (user) {
        if (!_.isEmpty(user)) {
            console.log('if: ' + user.dataValues.Permission);
            if (user.dataValues.Permission === 1) {
                db.app.notifications.findOrCreate({
                    where: {
                        userUserId: body.userId,
                        notificationMessage: body.message,
                        dateTimeSent: body.dateTimeSent,
                        from: req.session.supporterId || body.supporterId,
                        to: body.to
                    },
                    defaults: {
                        userUserId: body.userId,
                        notificationMessage: body.message,
                        dateTimeSent: body.dateTimeSent,
                        from: req.session.supporterId || body.supporterId,
                        to: body.to
                    }
                }).spread(function (notification, created) {
                    if (!created) {
                        message = {
                            'name': 'Failure',
                            'message': 'A message already exists with given data, couldn\'t send a notification'
                        };
                        return res.status(401).json(message);
                    }
                    message = {
                        'name': 'Success',
                        'message': 'Message log to the table'
                    };

                    db.app.userDeviceMapper.findOne({
                        attributes: [['fcmToken', 'Token']],
                        where: {
                            userUserId: body.userId
                        }
                    }).then(function (deviceMapper) {
                        if (!_.isEmpty(deviceMapper)) {
                            var payloadOk = {
                                to: deviceMapper.dataValues.Token,
                                priority: 'high',
                                notification: {
                                    title: 'Women Health Project',
                                    body: body.message
                                }
                            };
                            fcmCli.send(payloadOk, function (err, result) {
                                if (err) {
                                    console.error(err)
                                } else {
                                    console.log(result);
                                    message.fcm = 'Message in-transit';
                                    message.result = result;
                                }
                            });

                        } else {
                            message.mapperError = 'Couldn\'t find the Device Token associated with the User';
                        }
                    }).catch(function (error) {
                        message.error = error.name;
                        message.error_message = util.inspect(error);
                        console.log(error);
                        return res.status(400).json(message);
                    });

                    return res.json(message);
                }).catch(function (error) {
                    message = {
                        'name': 'Failure',
                        'message': 'A message already exists with given data, couldn\'t send a notification',
                        'error': util.inspect(error)
                    };
                    return res.status(400).send(message);
                });

            } else {
                message.name = 'Failure';
                message.message = "Not authorized to send Messages to the Participant";
                return res.status(401).send(message);
            }
        } else {
            message.name = 'Failure';
            message.message = "User doesn't exists/User isn't active";
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

router.get('/getAllMessages', supporterAuthenticate, function (req, res) {
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
        attributes: [['notificationId', 'Id'], ['notificationMessage', 'Message'], ['dateTimeSent', 'dateTimeSent'], ['from', 'from']],
        where: {
            to: query.userId
        }
    }).then(function (notifications) {
        if (!_.isEmpty(notifications)) {
            return res.json(notifications);
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

//Appointments
router.get('/getAllSupporterAppointments', supporterAuthenticate, function (req, res) {
    db.app.appointments.findAll({
        attributes: [['appointmentId', 'Id'], ['appointmentTime', 'appointmentTime'], ['title', 'title'], ['comments', 'comments'], ['userUserId', 'UserId'], ['createdOn', 'createdOn'], ['researcherSupporterId', 'SupporterId']],
        where: {
            researcherSupporterId: req.session.supporterId
        }
    }).then(function (appointments) {
        if (!_.isEmpty(appointments)) {
            return res.json(appointments);
        } else {
            message.name = 'Failure';
            message.message = 'There are no appointments for the supporter';
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

router.get('/getAllParticipantAppointments', supporterAuthenticate, function (req, res) {
    var query = _.pick(req.query, 'userId');

    if (typeof query.userId !== 'string') {
        message = {
            'name': 'Error',
            'message': 'Problem with query parameters'
        };
        console.log(message);
        return res.status(400).send(message);
    }

    db.app.appointments.findAll({
        attributes: [['appointmentId', 'Id'], ['appointmentTime', 'appointmentTime'], ['title', 'title'], ['comments', 'comments'], ['userUserId', 'UserId'], ['createdOn', 'createdOn'], ['researcherSupporterId', 'SupporterId']],
        where: {
            userUserId: query.userId
        }
    }).then(function (appointments) {
        if (!_.isEmpty(appointments)) {
            return res.json(appointments);
        } else {
            message.name = 'Failure';
            message.message = 'There are no appointments for the supporter';
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

//delete appointment doesn't notification
router.post('/deleteAppointment', supporterAuthenticate, function (req, res) {
    console.log(req.session);
    var body = _.pick(req.body, 'appointmentId');

    if (typeof body.appointmentId !== 'string') {
        message = {
            'name': 'Error',
            'message': 'Problem with query parameters'
        };
        return res.status(400).send(message);
    }

    db.app.appointments.find({
        where: {
            appointmentId: body.appointmentId,
            researcherSupporterId: req.session.supporterId
        }
    }).then(function (data) {
        if (!_.isEmpty(data)) {
            data.destroy();
            message.name = 'Success';
            message.message = 'Appointment deleted';



            return res.json(message);
        }
        else {
            message.name = 'Failure';
            message.message = 'Could\'t find the appointment';
            return res.json(message);
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

router.get('/getAllNotifications', supporterAuthenticate, function (req, res) {

    var query = _.pick(req.query, 'supporterId');
    console.log(req.session);
    if (typeof query.supporterId !== 'string') {
        message = {
            'name': 'Error',
            'message': 'Problem with query parameters'
        };
        console.log(message);
        return res.status(400).send(message);
    }

    db.app.notifications.findAll({
        attributes: [['notificationId', 'Id'], ['notificationMessage', 'Message'], ['dateTimeSent', 'dateTimeSent'], ['from', 'from']],
        where: {
            to: req.session.supporterId || query.supporterId
        }
    }).then(function (notifications) {
        if (!_.isEmpty(notifications)) {
            return res.json(notifications);
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

//Steps, Progress, Response
router.post('/assignSteps', supporterAuthenticate, function (req, res) {
    console.log(req.session);
    var responseId;
    var body = _.pick(req.body, 'stepId', 'userId', 'logDateTime', 'status', 'supporterId');

    if (typeof body.stepId !== 'string' || typeof body.userId !== 'string' || typeof body.logDateTime !== 'string' || typeof body.status !== 'string' || typeof body.supporterId !== 'string') {
        message = {
            'name': 'Error',
            'message': 'Problem with query parameters'
        };
        return res.status(400).send(message);
    }

    db.app.response.findOrCreate({
        where: {
            stepId: body.stepId,
            userId: body.userId
        },
        defaults: {
            stepId: body.stepId,
            userId: body.userId,
            logDateTime: body.logDateTime,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            userResponse: ""
        }
    }).spread(function (response, created) {
        console.log(util.inspect(response.responseId));
        responseId = response.responseId;

        if (!(created)) {
            message = {
                'name': 'Failure',
                'responseInfo': 'Log in response table exist for the user with the same step'
            };
            return res.status(401).json(message);
        }
        message = {
            'name': 'Success',
            'message': 'Log added to response table'
        };

        db.app.progress.findOrCreate({
            where: {
                supporterId: body.stepId,
                userId: body.userId,
                status: body.status,
                responseId: responseId
            },
            defaults: {
                supporterId: body.stepId,
                userId: body.userId,
                status: body.status,
                responseId: responseId,
                progressDateTime: body.logDateTime,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            }
        }).spread(function (response, created) {
            if (!(created)) {
                message.progress = "Already a step with the same status exists for the User";
                return res.status(401).json(message);
            }
            message.progress = "User has been assigned a step";

            var notificationToUser = "You have been assigned a Step -" + body.stepId + " by the supporter";

            db.app.users.findOne({
                attributes: [['appNotifications', 'Permission']],
                where: {
                    userId: body.userId,
                    isActive: true
                }
            }).then(function (user) {
                if (!_.isEmpty(user)) {
                    console.log('if: ' + user.dataValues.Permission);
                    if (user.dataValues.Permission === 1) {
                        db.app.userDeviceMapper.findOne({
                            attributes: [['fcmToken', 'Token']],
                            where: {
                                userUserId: body.userId
                            }
                        }).then(function (deviceMapper) {
                            if (!_.isEmpty(deviceMapper)) {
                                var payloadOk = {
                                    to: deviceMapper.dataValues.Token,
                                    priority: 'high',
                                    notification: {
                                        title: 'Women Health Project',
                                        body: notificationToUser
                                    }
                                };
                                fcmCli.send(payloadOk, function (err, result) {
                                    if (err) {
                                        console.error(err)
                                    } else {
                                        console.log(result);
                                        message.fcm = 'Message in-transit';
                                        message.result = result;
                                    }
                                });

                            } else {
                                message.mapperError = 'Couldn\'t find the Device Token associated with the User';
                            }
                        }).catch(function (error) {
                            message.error = error.name;
                            message.error_message = util.inspect(error);
                            console.log(error);
                            return res.status(400).json(message);
                        });

                        return res.json(message);


                    } else {
                        message.name = 'Failure';
                        message.message = "Not authorized to send Messages to the Participant";
                        return res.status(401).send(message);
                    }
                } else {
                    message.name = 'Failure';
                    message.message = "User doesn't exists/User isn't active";
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

            return res.send(message);

        }).catch(function (error) {
            message = {
                'name': 'Failure',
                'message': 'Couldn\'t create log to the response table',
                'error': util.inspect(error)
            };
            return res.status(400).send(message);
        });

    }).catch(function (error) {
        message = {
            'name': 'Failure',
            'message': 'Couldn\'t create log to the response table',
            'error': util.inspect(error)
        };
        return res.status(400).send(message);
    });

});

router.get('/getAllSteps', supporterAuthenticate, function (req, res) {
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

    var sqlQuery = "SELECT p.progressId AS Id, p.status, p.supporterId, p.progressDateTime AS stepAssignedOn, r.stepId, r.userResponse AS userResponse FROM progresses p INNER JOIN responses r ON r.responseId = p.responseId WHERE p.userId = '" + query.userId + "'";
    console.log(sqlQuery);
    var resultsData = {};
    db.sequelize.query(sqlQuery).spread(function (results, metadata) {
        resultsData.steps = results;
        return res.json(resultsData);
    }).catch(function (error) {
        message = {
            'name': 'Failure',
            'message': 'Couldn\'t get steps info',
            'error': util.inspect(error)
        };
        return res.status(400).send(message);
    });
});

router.post('/updateProgress', supporterAuthenticate, function (req, res) {
    console.log(req.session);
    var responseId;
    var body = _.pick(req.body, 'progressId', 'status');

    if (typeof body.progressId !== 'string' || typeof body.status !== 'string') {
        message = {
            'name': 'Error',
            'message': 'Problem with query parameters'
        };
        return res.status(400).send(message);
    }

    db.app.progress.find({
        where: {
            progressId: body.progressId
        }
    }).then(function (data) {
        if (!_.isEmpty(data)) {
            data.update({
                status: body.status
            }).then(function (data1) {
                console.log('data1: ' + util.inspect(data1));
                message.name = 'Success';
                message.message = 'Updated step progress successfully';
                message.data = data1;

                return res.json(message);
            }).catch(function (error) {
                console.error('Error in updating the user step progress ' + erro);
                message.name = 'Failure';
                message.message = 'Error in updating the user step progress';
                message.error = util.inspect(error);
                return res.status(404).send(message);
            });
        }
    });


});



router.post('/logout', function (req, res) {
    var body = _.pick(req.body, 'supporterId');
    console.log(req.session);
    if (typeof body.supporterId !== 'string') {
        message = {
            'name': 'Error',
            'message': 'Problem with query parameters'
        };
        console.log(message);
        return res.status(400).send(message);
    }

    //req.session.supporterId = null;
    req.session.destroy();
    //res.redirect()
    console.log(req.session);
    res.send();
});

module.exports = router;