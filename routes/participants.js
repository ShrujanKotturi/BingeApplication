/**
 * Created by shruj on 11/02/2016.
 */
var express = require('express'),
    bcrypt = require('bcrypt'),
    util = require('util'),
    _ = require('underscore'),
    cryptojs = require('crypto-js'),
    jwt = require('jsonwebtoken'),
    userAuthenticate = require('../middleware/userAuthenticate');

var router = express.Router();
var db = require('../db');
var message = {},
    session = {};

router.get('/login', function (req, res) {
    var query = _.pick(req.query, 'userId', 'password');
    if (typeof query.userId !== 'string' || typeof query.password !== 'string') {
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
        var result = user.toJSON();
        message = {
            'name': "Success",
            'message': "Participant Login is Successful",
            'result': util.inspect(result)
        };

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

router.post('/foodLog', userAuthenticate, function (req, res) {
    var body = _.pick(req.body, 'userId', 'food', 'latitude', 'longitude', 'binge', 'vomit');
    if (typeof body.userId !== 'string' || typeof body.food !== 'string' || typeof body.latitude !== 'string' || typeof body.longitude !== 'string' || typeof body.binge !== 'string' || typeof body.vomit !== 'string') {
        message = {
            'name': 'Error',
            'message': 'Problem with query parameters'
        };
        return res.status(400).send(message);
    }
    db.app.dailyFoodLog.build({
        userUserId: body.userId || req.session.userId,
        foodConsumedLog: body.food,
        latitude: body.latitude,
        longitude: body.longitude,
        feelingBinge: body.binge,
        feelingVomiting: body.vomit
    }).save()
        .then(function (savedObject) {
            if (!savedObject) {
                message = {
                    'name': "Failure",
                    'message': 'Error in creating food log'
                }
                return res.status(404).json(message);
            }
            message = {
                'name': "Success",
                'message': "Food log created successfully"
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

router.post('/quickLog', userAuthenticate, function (req, res) {
    var body = _.pick(req.body, 'userId', 'food', 'latitude', 'longitude', 'binge', 'vomit');
    if (typeof body.userId !== 'string' || typeof body.food !== 'string' || typeof body.latitude !== 'string' || typeof body.longitude !== 'string' || typeof body.binge !== 'string' || typeof body.vomit !== 'string') {
        message = {
            'name': 'Error',
            'message': 'Problem with query parameters'
        };
        return res.status(400).send(message);
    }

    db.app.dailyFoodLog.build({
        userUserId: req.body.userId || req.session.userId,
        foodConsumedURL: req.body.food,
        latitude: req.body.latitude,
        longitude: req.body.longitude,
        feelingBinge: req.body.binge,
        feelingVomiting: req.body.vomit
    }).save()
        .then(function (savedObject) {
            if (!savedObject) {
                message = {
                    'name': "Failure",
                    'message': 'Error in creating quick log'
                }
                return res.status(404).json(message);
            }
            message = {
                'name': "Success",
                'message': "Quick log created successfully"
            };
            res.json(message);
        }).catch(function (error) {
        console.log(error);
        message = {
            'name': error.name,
            'message': error.errors[0].message
        };

        return res.status(400).json(message);
    });
});

router.post('/physicalLog', userAuthenticate, function (req, res) {

    var body = _.pick(req.body, 'userId', 'physicalActivityPerformed', 'duration', 'feelingTired');
    if (typeof body.userId !== 'string' || typeof body.physicalActivityPerformed !== 'string' || typeof body.duration !== 'string' || typeof body.feelingTired !== 'string') {
        message = {
            'name': 'Error',
            'message': 'Problem with query parameters'
        };
        return res.status(400).send(message);
    }

    db.app.dailyPhysicalLog.build({
        userUserId: body.userId || req.session.userId,
        physicalActivityPerformed: body.physicalActivityPerformed,
        duration: body.duration,
        feelingTired: body.feelingTired
    }).save()
        .then(function (savedObject) {
            if (!savedObject) {
                message = {
                    'name': "Failure",
                    'message': 'Error in creating physical log'
                };
                return res.status(404).json(message);

            }
            message = {
                'name': "Success",
                'message': "Weekly log created successfully"
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

router.post('/weeklyLog', userAuthenticate, function (req, res) {

    var body = _.pick(req.body, 'userId', 'weekId', 'binges', 'goodDays', 'V', 'L', 'D', 'events', 'weight');
    if (typeof body.userId !== 'string' || typeof body.weekId !== 'string' || typeof body.binges !== 'string' || typeof body.goodDays !== 'string' || typeof body.V !== 'string' || typeof body.L !== 'string' || typeof body.D !== 'string' || typeof body.events !== 'string' || typeof body.weight !== 'string') {
        message = {
            'name': 'Error',
            'message': 'Problem with query parameters'
        };
        return res.status(400).send(message);
    }

    db.app.weeklyLog.build({
        userUserId: body.userId || req.session.userId,
        weekId: body.weekId,
        binges: body.binges,
        goodDays: body.goodDays,
        V: body.V,
        L: body.L,
        D: body.D,
        events: body.events,
        weight: body.weight
    }).save()
        .then(function (savedObject) {
            if (!savedObject) {
                message = {
                    'name': "Failure",
                    'message': 'Error in creating weekly log'
                };
                return res.status(404).json(message);

            }
            message = {
                'name': "Success",
                'message': "Weekly log created successfully"
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


module.exports = router;