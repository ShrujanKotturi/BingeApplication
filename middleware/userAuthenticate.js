/**
 * Created by shruj on 11/07/2016.
 */
var cryptojs = require('crypto-js'),
    jwt = require('jsonwebtoken'),
    util = require('util');

module.exports = function (req, res, next) {
    var token = req.get('x-auth');
    try {
        var decoded = jwt.verify(token, 'qwerty098');

        var bytes = cryptojs.AES.decrypt(decoded.token, 'abc123!@#');
        var tokenData = JSON.parse(bytes.toString(cryptojs.enc.Utf8));
        //res.locals.userId = tokenData.userId
        res.locals.supporterId = tokenData.researcherSupporterId;
        next();
    }
    catch (err) {
        var message = {
            'name': 'Unauthorized Access',
            'message': 'User not authorized for this request'
        }
        console.log(message);
        res.status(401).send(message);
    }

};




