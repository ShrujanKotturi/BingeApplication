var cron = require('node-schedule');
var scheduler = require('./routes/scheduler');

module.exports = {
    configure: function (app) {
        console.log("Scheduler start...");
        var dailyRule = new cron.RecurrenceRule();
        
        dailyRule.hour = 19;
        dailyRule.minute = 15;
        cron.scheduleJob(dailyRule, function () {
            console.log("Scheduler running...");
            scheduler.daily();
        });

        var weeklyRule = new cron.RecurrenceRule();

        weeklyRule.hour = 17;
        weeklyRule.minute = 00;
        cron.scheduleJob(weeklyRule, function () {
            console.log("Scheduler running...");
            scheduler.weekly();
        });


    }

};
