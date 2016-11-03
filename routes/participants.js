/**
 * Created by shruj on 11/02/2016.
 */
var express = require('express');
var router = express.Router();
var db = require('../db');
var message = {};

router.get('/login', function(req, res, next) {
    db.sequelize.sync({
        //force: true
    }).then(function () {
        db.user.users.findOne({
            where: {
                userId: req.query.userId,
                passwordHash: req.query.passwordHash
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
                'message' : "Logged in Successfully"
            };
            console.log(user);
            res.json(message);
        }).catch(function (error) {
            message = {
                'name': error.name,
                'message': error.errors[0].message
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



module.exports = router;
