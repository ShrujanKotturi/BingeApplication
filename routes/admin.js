/**
 * Created by shruj on 11/02/2016.
 */
var express = require('express'),
    bcrypt = require('bcrypt'),
    util = require('util'),
    _ = require('underscore'),
    cryptojs = require('crypto-js'),
    jwt = require('jsonwebtoken'),
    adminAuthenticate = require('../middleware/supporterAuthenticate');

var router = express.Router();
var db = require('../db');
var message = {};

router.get('/login', function (req, res) {
    var query = _.pick(req.query, 'adminId', 'password');
    if (typeof query.adminId !== 'string' || typeof query.password !== 'string') {
        message = {
            'name': 'Error',
            'message': 'Problem with query parameters'
        };
        console.log(message);
        return res.status(400).send(message);
    }
    db.app.researchers.findOne({
        where: {
            supporterId: query.adminId,
            isAdmin: true
        }
    }).then(function (admin) {
        if (_.isEmpty(admin.dataValues) || !bcrypt.compareSync(query.password, admin.get('passwordHash'))) {
            message = {
                'name': "Failure",
                'message': 'Id & Password match not found'
            };
            console.log(message);
            return res.status(404).json(message);
        }

        var result = admin.toPublicJSON();

        message = {
            'name': "Success",
            'message': "Admin Login is Successful",
            'result': result
        };

        var stringData = JSON.stringify(result);
        var encryptedData = cryptojs.AES.encrypt(stringData, 'abc123!@#').toString();
        var token = jwt.sign({
            token: encryptedData
        }, 'qwerty098');
        if (token) {
            req.session.adminId = admin.dataValues.supporterId;
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
        console.log(error);
        return res.status(400).json(message);
    });
});

router.post('/changePassword', adminAuthenticate, function (req, res) {
    
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
            isActive: 1
        }
    }).then(function (data) {
        if (!_.isEmpty(data)) {
            data.update({
                passwordHash: bcrypt.hashSync(body.password, bcrypt.genSaltSync(10))
            }).then(function (data1) {
                //console.log('data1: ' + util.inspect(data1));
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
        } else {
            message.name = 'Failure';
            message.message = "The user doesn't exists with the data";
            return res.status(404).send(message);
        }
    });


});

router.post('/changeSupporterPassword', adminAuthenticate, function (req, res) {
    
    var responseId;
    var body = _.pick(req.body, 'supporterId', 'password');

    if (typeof body.supporterId !== 'string' || typeof body.password !== 'string') {
        message = {
            'name': 'Error',
            'message': 'Problem with query parameters'
        };
        return res.status(400).send(message);
    }

    db.app.researchers.find({
        where: {
            supporterId: body.supporterId,
            isAdmin: 0,
            isActive: 1
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
                console.error('Error in updating the supporter password ' + erro);
                message.name = 'Failure';
                message.message = 'Error in updating the supporter password';
                message.error = util.inspect(error);
                return res.status(404).send(message);
            });
        } else {
            message.name = 'Failure';
            message.message = "The supporter doesn't exists with the data";
            return res.status(404).send(message);
        }
    });


});

router.post('/createUser', adminAuthenticate, function (req, res) {
    var body = _.pick(req.body, 'userId', 'password', 'age', 'supporterId', 'logNotification', 'appNotification', 'quickLog', 'motivationalMessages');
    console.log(req.session);
    if (typeof body.userId !== 'string' || typeof body.password !== 'string' || typeof body.age !== 'string' || typeof body.supporterId !== 'string' || typeof body.logNotification !== 'string' || typeof body.appNotification !== 'string' || typeof body.quickLog !== 'string' || typeof body.motivationalMessages !== 'string') {
        message = {
            'name': 'Error',
            'message': 'Problem with query parameters'
        };
        console.log(message);
        return res.status(400).send(message);
    }

    db.app.users.findOrCreate({
        where: {
            userId: body.userId,
            passwordHash: bcrypt.hashSync(body.password, bcrypt.genSaltSync(10)),
            age: body.age,
            researcherSupporterId: body.supporterId,
            logNotifications: body.logNotification,
            appNotifications: body.appNotification,
            quickLog: body.quickLog,
            sendMotivationalMessages: body.motivationalMessages
        },
        defaults: {
            userId: body.userId,
            password: body.password,
            age: body.age,
            researcherSupporterId: body.supporterId,
            logNotifications: body.logNotification,
            appNotifications: body.appNotification,
            quickLog: body.quickLog,
            sendMotivationalMessages: body.motivationalMessages
        }
    }).spread(function (savedObject, created) {
        if (!(created)) {
            message = {
                'name': 'Failure',
                'message': 'Couldn\'t create user'
            };
            return res.json(message);
        }
        message = {
            'name': "Success",
            'message': "User created successfully",
            'result': savedObject.toPublicJSON()
        };
        console.log(message);
        return res.json(message);
    }).catch(function (error) {
        message = {
            'name': 'Failure',
            'message': 'Couldn\'t create user',
            'error': util.inspect(error)
        };
        return res.status(400).send(message);
    });

});

router.post('/createSupporter', adminAuthenticate, function (req, res) {
    var body = _.pick(req.body, 'supporterId', 'password', 'contactNumber');
    console.log(req.session);
    if (typeof body.supporterId !== 'string' || typeof body.password !== 'string' || typeof body.contactNumber !== 'string') {
        message = {
            'name': 'Error',
            'message': 'Problem with query parameters'
        };
        console.log(message);
        return res.status(400).send(message);
    }

    db.app.researchers.findOrCreate({
        where: {
            supporterId: body.supporterId,
            passwordHash: bcrypt.hashSync(body.password, bcrypt.genSaltSync(10)),
            contactNumber: body.contactNumber,
            isAdmin: false

        },
        defaults: {
            supporterId: body.supporterId,
            password: body.password,
            contactNumber: body.contactNumber,
            isAdmin: false
        }
    }).spread(function (savedObject, created) {
        if (!(created)) {
            message = {
                'name': 'Failure',
                'message': 'Couldn\'t create supporter'
            };
            return res.json(message);
        }
        message = {
            'name': "Success",
            'message': "Supporter created successfully",
            'result': savedObject.toPublicJSON()
        };
        console.log(message);
        return res.json(message);
    }).catch(function (error) {
        message = {
            'name': 'Failure',
            'message': 'Couldn\'t create supporter',
            'error': util.inspect(error)
        };
        return res.status(400).send(message);
    });
});

router.get('/getParticipantProfile', adminAuthenticate, function (req, res) {
    var query = _.pick(req.query, 'userId');

    if (typeof query.userId !== 'string') {
        message = {
            'name': 'Error',
            'message': 'Problem with query parameters'
        };
        console.log(message);
        return res.status(400).send(message);
    }

    db.app.users.findOne({
        where: {
            isActive: true,
            userId: query.userId
        }
    }).then(function (users) {
        if (!_.isEmpty(users))
            return res.json(users.toPublicJSON());
        else
            return res.status(400).json({ 'name': 'Failure', 'message': 'Couldn\'t fetch participants details' });
    }).catch(function (error) {
        message = {
            'name': error.name,
            'message': util.inspect(error)
        };
        console.log(error);
        return res.status(400).json(message);
    });
});

router.post('/updateParticipantProfile', adminAuthenticate, function (req, res) {
    var body = _.pick(req.body, 'userId', 'age', 'logNotifications', 'appNotifications', 'quickLog', 'sendMotivationalMessages', 'researcherSupporterId');

    if (typeof body.userId !== 'string' || typeof body.age !== 'string' || typeof body.logNotifications !== 'string' || typeof body.appNotifications !== 'string' || typeof body.quickLog !== 'string' || typeof body.sendMotivationalMessages !== 'string' || typeof body.researcherSupporterId !== 'string') {
        message = {
            'name': 'Error',
            'message': 'Problem with query parameters'
        };
        console.log(message);
        return res.status(400).send(message);
    }

    db.app.users.find({
        where: {
            userId: body.userId,
            isActive: true
        }
    }).then(function (data) {
        if (!_.isEmpty(data)) {
            data.update({
                userId: body.userId,
                age: body.age,
                researcherSupporterId: body.researcherSupporterId,
                logNotifications: body.logNotifications,
                appNotifications: body.appNotifications,
                quickLog: body.quickLog,
                sendMotivationalMessages: body.sendMotivationalMessages
            }).then(function (data1) {
                console.log('data1: ' + data1);
                message.name = 'Success';
                message.message = 'Updated user profile successfully';
                message.data = data1;
                return res.json(message);
            }).catch(function (error) {
                console.error('Error in updating the user profile : ' + error);
                message.name = 'Failure';
                message.message = 'Error in updating the profile';
                message.error = util.inspect(error);
                return res.status(404).send(message);
            });
        }
    });
});

router.get('/getAllSupporters', adminAuthenticate, function (req, res) {

    console.log(util.inspect(req.session));
    db.app.researchers.findAll({
        attributes: [['supporterId', 'Supporter Id'], ['contactNumber', 'Contact Number'], ['createdAt', 'Created Date']],
        where: {
            isAdmin: false,
            isActive: true
        }
    }).then(function (supporters) {
        if (!_.isEmpty(supporters))
            return res.json(supporters);
        else
            return res.status(400).json({ 'name': 'Failure', 'message': 'No supporters exists' });
    }).catch(function (error) {
        message = {
            'name': error.name,
            'message': util.inspect(error)
        };
        console.log(error);
        return res.status(400).json(message);
    });
});

router.get('/getAllParticipants', adminAuthenticate, function (req, res) {
    console.log(util.inspect(req.session));
    db.app.users.findAll({
        attributes: [['userId', 'User Name'], ['researcherSupporterId', 'Supporter Id'], ['age', 'Age'], ['createdAt', 'Created Date']],
        where: {
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

router.get('/getAllSupporterUsers', adminAuthenticate, function (req, res) {
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

    db.app.users.findAll({
        attributes: [['userId', 'User Name'], ['researcherSupporterId', 'Supporter Id'], ['age', 'Age'], ['createdAt', 'Created Date']],
        where: {
            researcherSupporterId: query.supporterId,
            isActive: true
        }
    }).then(function (users) {
        if (!_.isEmpty(users))
            return res.json(users);
        else
            return res.status(400).json({ 'name': 'Failure', 'message': 'No users exists' });
    }).catch(function (error) {
        message = {
            'name': error.name,
            'message': util.inspect(error)
        };
        console.log(error);
        return res.status(400).json(message);
    });
});

router.get('/getUserFoodLog', adminAuthenticate, function (req, res) {
    console.log(req.session);
    var query = _.pick(req.query, 'userId');
    console.log(util.inspect(req.session));
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
            return res.status(400).json({ 'name': 'Failure', 'message': 'No food log exists' });
    }).catch(function (error) {
        message = {
            'name': error.name,
            'message': util.inspect(error)
        };
        console.log(error);
        return res.status(400).json(message);
    });
});

router.get('/getUserWeeklyLog', adminAuthenticate, function (req, res) {
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

router.get('/getUserPhysicalLog', adminAuthenticate, function (req, res) {
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
            return res.status(400).json({ 'name': 'Failure', 'message': 'No physical log exists' });
    }).catch(function (error) {
        message = {
            'name': error.name,
            'message': util.inspect(error)
        };
        console.log(error);
        return res.status(400).json(message);
    });
});

router.post('/deleteUser', adminAuthenticate, function (req, res) {

    console.log(req.session);
    var body = _.pick(req.body, 'userId');

    if (typeof body.userId !== 'string') {
        message = {
            'name': 'Error',
            'message': 'Problem with query parameters'
        };
        return res.status(400).send(message);
    }

    db.app.users.find({
        where: {
            userId: body.userId,
            isActive: true
        }
    }).then(function (data) {
        if (!_.isEmpty(data)) {
            data.update({
                isActive: false
            }).then(function (data1) {
                message.name = 'Success';
                message.message = 'The user is not active now';
                message.data = data1.toPublicJSON();
                return res.json(message);
            }).catch(function (error) {
                console.error('Error in deleting the user : ' + error);
                message.name = 'Failure';
                message.message = 'Error in deleting the user ';
                message.error = util.inspect(error);
                return res.status(404).send(message);
            });
        } else {
            message.name = 'Failure';
            message.message = 'You are trying to delete an unactive user';
            return res.status(404).send(message);
        }
    });
});

router.post('/deleteSupporter', adminAuthenticate, function (req, res) {
    console.log(req.session);
    var body = _.pick(req.body, 'supporterId');

    if (typeof body.supporterId !== 'string') {
        message = {
            'name': 'Error',
            'message': 'Problem with query parameters'
        };
        return res.status(400).send(message);
    }

    db.app.researchers.find({
        where: {
            supporterId: body.supporterId,
            isActive: true
        }
    }).then(function (data) {
        if (data) {
            db.app.users.findAll({
                attributes: [['userId', 'User Name'], ['researcherSupporterId', 'Supporter Id'], ['age', 'Age'], ['createdAt', 'Created Date']],
                where: {
                    researcherSupporterId: body.supporterId,
                    isActive: true
                }
            }).then(function (supporters) {
                if (!_.isEmpty(supporters)) {
                    message.name = 'Failure';
                    message.message = 'Can\'t delete the supporter, he has participants assigned to him';
                    return res.status(400).send(message);
                } else {
                    data.update({
                        isActive: false
                    }).then(function (data1) {
                        message.name = 'Success';
                        message.message = 'The supporter is not active now';
                        message.data = data1.toPublicJSON();
                        return res.json(message);
                    }).catch(function (error) {
                        console.error('Error in deleting the supporter : ' + error);
                        message.name = 'Failure';
                        message.message = 'Error in deleting the supporter ';
                        message.error = util.inspect(error);
                        return res.status(404).send(message);
                    });
                }
            }).catch(function (error) {
                message = {
                    'name': error.name,
                    'message': util.inspect(error)
                };
                console.log(error);
                return res.status(400).json(message);
            });


        } else {
            message.name = 'Failure';
            message.message = 'You are trying to delete an unactive supporter';
            return res.status(404).send(message);
        }
    });
});

router.get('/getAllMessages', adminAuthenticate, function (req, res) {
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

router.get('/getAllSteps', adminAuthenticate, function (req, res) {
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

    var sqlQuery = "SELECT p.progressId AS Id, p.status, p.supporterId,r.stepId, p.dateUpdated AS stepAssignedOn,  s.checkList AS stepQuestions,  r.userResponse AS userResponse FROM progresses p INNER JOIN responses r ON r.responseId = p.responseId INNER JOIN steps s ON s.stepId = r.stepId WHERE p.userId = '" + query.userId + "'";
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

//Appointments
router.get('/getAllSupporterAppointments', adminAuthenticate, function (req, res) {
    var query = _.pick(req.query, 'supporterId');

    if (typeof query.supporterId !== 'string') {
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
            researcherSupporterId: query.supporterId
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

router.get('/getAllParticipantAppointments', adminAuthenticate, function (req, res) {
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

router.post('/deleteAppointment', adminAuthenticate, function (req, res) {
    console.log(req.session);
    var body = _.pick(req.body, 'appointmentId');
    console.log(typeof body.appointmentId);
    if (typeof body.appointmentId !== 'string') {
        message = {
            'name': 'Error',
            'message': 'Problem with query parameters'
        };
        return res.status(400).send(message);
    }

    db.app.appointments.find({
        where: {
            appointmentId: body.appointmentId
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

router.post('/logout', function (req, res) {
    var body = _.pick(req.body, 'adminId');
    console.log(req.session);
    if (typeof body.adminId !== 'string') {
        message = {
            'name': 'Error',
            'message': 'Problem with query parameters'
        };
        console.log(message);
        return res.status(400).send(message);
    }

    //req.session.adminId = null;
    req.session.destroy();
    console.log(req.session);
    //res.redirect()
    res.send();
});

module.exports = router;