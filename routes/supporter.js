/**
 * Created by shruj on 11/02/2016.
 */
var express = require('express'),
    bcrypt = require('bcrypt'),
    util = require('util'),
    _ = require('underscore'),
    cryptojs = require('crypto-js'),
    jwt = require('jsonwebtoken'),
    supporterAuthenticate = require('../middleware/supporterAuthenticate');

var router = express.Router();
var db = require('../db');
var message = {},
    session = {};

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
        var result = supporter.toJSON();
        message = {
            'name': "Success",
            'message': "Supporter Login is Successful",
            'result': util.inspect(result)
        };

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