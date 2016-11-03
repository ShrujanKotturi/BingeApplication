/**
 * Created by shruj on 11/02/2016.
 */
var express = require('express');
var router = express.Router();
var db = require('../db');
var util = require('util');
var message = {};

router.get('/login', function(req, res, next) {
    db.sequelize.sync({
        //force: true
    }).then(function () {
        db.user.researchers.findOne({
            where: {
                supporterId: req.query.supporterId,
                passwordHash: req.query.passwordHash,
                isAdmin: true
            }
        }).then(function (user) {
            if(!(user)){
                message ={
                    'name' : "Failure",
                    'message' : 'Id & Password match not found'
                }
                res.status(404).json(message);
            }
            message = {
                'name' : "Success",
                'message' : "Admin Login is Successfully"
            };
            console.log(user);
            res.json(message);
        }).catch(function (error) {
            message = {
                'name': error.name,
                'message': error.message
            };
            console.log(error);
            res.status(400).json(message);
        });
    }).catch(function (error) {
        message = {
            'name': error.name,
            'message': error.errors[0].message
        };
        console.log(error);
        res.status(400).json(message);
    });
});

router.post('/createUser', function(req, res, next) {
    db.sequelize.sync({
        //force: true
    }).then(function() {
        db.user.users.build({
            userId: req.body.userId,
            password: req.body.password,
            age: req.body.age
        }).save()
            .then(function(savedObject) {
                console.log(savedObject);
                message = {
                    'name': "Success",
                    'message': "User created successfully"
                };
                res.json(message);
            }).catch(function(error) {
            message = {
                'name': error.name,
                'message': error.errors[0].message
            };
            console.log(error);
            res.status(400).json(message);
    });
}).catch(function(error) {
        message = {
            'name': error.name,
            'message': error.errors[0].message
        };
        console.log(error);
        res.status(400).json(message);
    });

});

router.post('/createSupporter', function(req, res, next) {
    db.sequelize.sync({
        //force: true
    }).then(function() {
        db.user.researchers.build({
            supporterId: req.body.supporterId,
            password: req.body.password,
            contactNumber: req.body.contactNumber,
            isAdmin: false
        }).save()
            .then(function(savedObject) {
                console.lo(savedObject);
                message = {
                    'name': "Success",
                    'message': "Supporter created successfully"
                };
                res.json(message);
            }).catch(function(error) {
            console.log(error);
            message = {
                'name': error.name,
                'message': error.message
            };
            res.status(400).json(message);
        });
    }).catch(function(error) {
        console.log(error);
        message = {
            'name': error.name,
            'message': error.message
        };
        res.status(400).json(message);
    });

});

//assign supporter to participant

module.exports = router;