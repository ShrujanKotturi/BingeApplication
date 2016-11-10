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
    config = require('../config.json');
fcmCli = new FCM(config.SERVER_API_KEY);

var router = express.Router();
var db = require('../db');
var message = {};


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
        if (!supporter.dataValues || !bcrypt.compareSync(query.password, supporter.get('passwordHash'))) {
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

router.get('/getAllUsers', supporterAuthenticate, function (req, res) {
    console.log(req.session);
    var query = _.pick(req.query, 'supporterId');
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
    }).then(function (supporters) {
        return res.json(supporters);
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
    }).then(function (supporters) {
        return res.json(supporters);
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

    req.session.destroy();
    //res.redirect()
    console.log(req.session);
    res.send();
});

// router.post('/createUser', function(req, res) {
//
//     var body = _.pick(req.body, 'userId', 'password', 'age');
//     if (typeof body.userId !== 'string' || typeof body.password !== 'string' || typeof body.age !== 'number') {
//         message = {
//             'name': 'Error',
//             'message': 'Problem with query parameters'
//         };
//         console.log(message);
//         return res.status(400).send(message);
//     }
//     db.app.users.build({
//         userId: req.body.userId,
//         password: req.body.password,
//         age: req.body.age
//     }).save()
//         .then(function(savedObject) {
//             message = {
//                 'name': "Success",
//                 'message': "User created successfully",
//                 'result': util.inspect(savedObject)
//             };
//             console.log(message);
//             res.json(message);
//         }).catch(function(error) {
//         message = {
//             'name': error.name,
//             'message': util.inspect(error)
//         };
//         console.log(error);
//         res.status(400).json(message);
//     });
// });

module.exports = router;