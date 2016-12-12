var cron = require('node-schedule');
var scheduler = require('./routes/scheduler');

module.exports = {
    configure: function (app) {
        console.log("Scheduler is ON...");
        var dailyRule = new cron.RecurrenceRule();

        dailyRule.hour = 16;
        dailyRule.minute = 15;
        cron.scheduleJob(dailyRule, function () {
            console.log("Daily Scheduler Running...");
            scheduler.daily();
        });

        var weeklyRule = new cron.RecurrenceRule();

        weeklyRule.hour = 14;
        weeklyRule.minute = 00;
        cron.scheduleJob(weeklyRule, function () {
            console.log("Weekly Scheduler Running...");
            scheduler.weekly();
        });

        var motivationalRule = new cron.RecurrenceRule();

        motivationalRule.hour = 05;
        motivationalRule.minute = 00;

        cron.scheduleJob(motivationalRule, function () {
            console.log("Coach Running...");
            scheduler.motivational();
        });

    }

};
