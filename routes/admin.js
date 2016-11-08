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
var message = {},
    session = {};

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
        if (!admin.dataValues || !bcrypt.compareSync(query.password, admin.get('passwordHash'))) {
            message = {
                'name': "Failure",
                'message': 'Id & Password match not found'
            };
            console.log(message);
            return res.status(404).json(message);
        }

        console.log(1);
        var result = admin.toPublicJSON();

        console.log(2);
        message = {
            'name': "Success",
            'message': "Admin Login is Successful",
            'result': util.inspect(result)
        };
        console.log('result = ' + result);

        var stringData = JSON.stringify(result);
        var encryptedData = cryptojs.AES.encrypt(stringData, 'abc123!@#').toString();
        var token = jwt.sign({
            token: encryptedData
        }, 'qwerty098');
        if (token) {
            session = req.session;
            session.adminId = admin.dataValues.supporterId;
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

router.post('/createUser', adminAuthenticate, function (req, res) {
    var body = _.pick(req.body, 'userId', 'password', 'age', 'supporterId', 'logNotification', 'appNotification', 'quickLog', 'motivationalMessages');
    console.log(body);
    if (typeof body.userId !== 'string' || typeof body.password !== 'string' || typeof body.age !== 'string' || typeof body.supporterId !== 'string'|| typeof body.logNotification !== 'string'|| typeof body.appNotification !== 'string'|| typeof body.quickLog !== 'string'|| typeof body.motivationalMessages !== 'string') {
        message = {
            'name': 'Error',
            'message': 'Problem with query parameters'
        };
        console.log(message);
        return res.status(400).send(message);
    }
    db.app.users.build({
        userId: body.userId,
        password: body.password,
        age: body.age,
        researcherSupporterId: body.supporterId,
        logNotification: body.logNotification,
        appNotification: body.appNotification,
        quickLog: body.quickLog,
        sendMotivationalMessages: body.motivationalMessages
    }).save()
        .then(function (savedObject) {
            message = {
                'name': "Success",
                'message': "User created successfully",
                'result': savedObject.toPublicJSON()
            };
            console.log(message);
            return res.json(message);
        }).catch(function (error) {
        message = {
            'name': error.name,
            'message': util.inspect(error)
        };
        console.log(error);
        return res.status(400).json(message);
    });
});

router.post('/createSupporter', adminAuthenticate, function (req, res) {
    var body = _.pick(req.body, 'supporterId', 'password', 'contactNumber');
    if (typeof body.supporterId !== 'string' || typeof body.password !== 'string' || typeof body.contactNumber !== 'string') {
        message = {
            'name': 'Error',
            'message': 'Problem with query parameters'
        };
        console.log(message);
        return res.status(400).send(message);
    }

    db.app.researchers.build({
        supporterId: body.supporterId,
        password: body.password,
        contactNumber: body.contactNumber,
        isAdmin: false
    }).save()
        .then(function (savedObject) {
            message = {
                'name': "Success",
                'message': "Supporter created successfully",
                'result': savedObject.toPublicJSON()
            };
            console.log(message);
            return res.json(message);
        }).catch(function (error) {
        console.log(error);
        message = {
            'name': error.name,
            'message': error.message
        };
        return res.status(400).json(message);
    });
});

router.get('/getAllSupporters', adminAuthenticate, function (req, res) {

    db.app.researchers.findAll({
        attributes: [['supporterId', 'Supporter Id'], ['contactNumber', 'Contact Number'], ['createdAt', 'Created Date']],
        where: {
            isAdmin: false
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

router.get('/getAllParticipants', adminAuthenticate, function (req, res) {
    db.app.users.findAll({
        attributes: [['userId', 'User Name'], ['researcherSupporterId', 'Supporter Id'], ['age', 'Age'], ['createdAt', 'Created Date']],
        where: {
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

module.exports = router;