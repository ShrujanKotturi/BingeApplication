var cron = require('node-schedule');
var scheduler = require('./routes/scheduler');

module.exports = {
    configure: function (app) {
        cron.scheduleJob('0 * 19 * * *', function () {
            console.log("Scheduler running...");
            scheduler.run();
        });

        
    }

};
