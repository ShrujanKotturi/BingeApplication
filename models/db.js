/**
 * Created by shruj on 10/31/2016.
 */
var bcrypt = require('bcrypt');
var _ = require('underscore');
var db = {};

module.exports = function (sequelize, DataTypes) {

    db.users = sequelize.define('users', {
        userId: {
            type: DataTypes.STRING,
            allowNull: false,
            primaryKey: true
        },
        salt: {
            type: DataTypes.STRING
        },
        passwordHash: {
            type: DataTypes.STRING
        },
        password: {
            type: DataTypes.VIRTUAL,
            allowNull: false,
            validate: {
                len: [7, 100]
            },
            set: function (value) {
                var salt = bcrypt.genSaltSync(10);
                var hashedPassword = bcrypt.hashSync(value, salt);

                this.setDataValue('password', value);
                this.setDataValue('salt', salt);
                this.setDataValue('passwordHash', hashedPassword);
            }
        },
        isActive: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true
        },
        age: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: {
                isNumeric: true
            }
        },
        score: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        logNotifications: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        appNotifications: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        },
        quickLog: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        sendMotivationalMessages: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        }
    }, {
            hooks: {
                beforeValidate: function (users, options) {
                    if (typeof users.userId === 'string') {
                        users.userId = users.userId.toLowerCase();
                    }
                }
            },
            instanceMethods: {
                toPublicJSON: function () {
                    var json = this.toJSON();
                    return _.pick(json, 'userId', 'isActive', 'age', 'score', 'logNotifications', 'appNotifications', 'quickLog', 'sendMotivationalMessages', 'playGame', 'researcherSupporterId');
                },
                toPasswordPublicJSON: function () {
                    var json = this.toJSON();
                    return _.pick(json, 'userId', 'password', 'isActive', 'age', 'score', 'logNotifications', 'appNotifications', 'quickLog', 'sendMotivationalMessages', 'playGame');
                }
            }
        }, {
            timestamps: true,
            createdAt: 'dateCreated',
            updatedAt: 'dateUpdated'
        });


    db.researchers = sequelize.define('researcher', {
        supporterId: {
            type: DataTypes.STRING,
            primaryKey: true
        },
        salt: {
            type: DataTypes.STRING
        },
        passwordHash: {
            type: DataTypes.STRING
        },
        password: {
            type: DataTypes.VIRTUAL,
            allowNull: false,
            validate: {
                len: [7, 100]
            },
            set: function (value) {
                var salt = bcrypt.genSaltSync(10);
                var hashedPassword = bcrypt.hashSync(value, salt);

                this.setDataValue('password', value);
                this.setDataValue('salt', salt);
                this.setDataValue('passwordHash', hashedPassword);
            }
        },
        contactNumber: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                isNumeric: true
            }
        },
        isAdmin: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        isActive: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true
        }
    }, {
            hooks: {
                beforeValidate: function (researcher, options) {
                    if (typeof researcher.supporterId === 'string') {
                        researcher.supporterId = researcher.supporterId.toLowerCase();
                    }
                }
            },
            instanceMethods: {
                toPublicJSON: function () {
                    var json = this.toJSON();
                    return _.pick(json, 'supporterId', 'contactNumber', 'isAdmin', 'isActive');
                },
                toPasswordPublicJSON: function () {
                    var json = this.toJSON();
                    return _.pick(json, 'supporterId', 'password', 'contactNumber', 'isAdmin');
                }
            }
        }, {
            timestamps: true,
            createdAt: 'dateCreated',
            updatedAt: 'dateUpdated'
        });

    db.researchers.hasMany(db.users);

    db.dailyFoodLog = sequelize.define('dailyFoodLog', {
        // userId: {
        //     type: DataTypes.INTEGER,
        //     autoIncrement: true
        // },
        dailyFoodLogId: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        dateTimeLogged: {
            type: DataTypes.DATE,
            allowNull: false
        },
        foodConsumedLog: {
            type: DataTypes.STRING,
            allowNull: true
        },
        foodConsumedURL: {
            type: DataTypes.STRING,
            allowNull: true,
            validate: {
                isUrl: true
            }
        },
        latitude: {
            type: DataTypes.FLOAT,
            allowNull: true,
            defaultValue: null,
            validate: {
                min: -90,
                max: 90
            }
        },
        longitude: {
            type: DataTypes.FLOAT,
            allowNull: true,
            defaultValue: null,
            validate: {
                min: -180,
                max: 180
            }
        },
        feelingBinge: {
            type: DataTypes.ENUM,
            values: ['yes', 'no']
        },
        feelingVomiting: {
            type: DataTypes.ENUM,
            values: ['yes', 'no']
        },
        returnType: {
            type: DataTypes.STRING,
            allowNull: true,
            validate: {
                len: [0, 10]
            }
        }
    }, {
            timestamps: true,
            createdAt: 'dateCreated',
            updatedAt: 'dateUpdated'
        });

    db.users.hasMany(db.dailyFoodLog);

    db.dailyPhysicalLog = sequelize.define('dailyPhysicalLog', {
        dailyPhysicalLogId: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        dateTimeLogged: {
            type: DataTypes.DATE,
            allowNull: false
        },
        physicalActivityPerformed: {
            type: DataTypes.STRING,
            allowNull: false
        },
        duration: {
            type: DataTypes.FLOAT,
            allowNull: false
        },
        feelingTired: {
            type: DataTypes.ENUM,
            values: ['yes', 'no']
        }
    }, {
            timestamps: true,
            createdAt: 'dateCreated',
            updatedAt: 'dateUpdated'
        });

    db.users.hasMany(db.dailyPhysicalLog);

    db.weeklyLog = sequelize.define('weeklyLog', {
        // userId: {
        //     type: DataTypes.INTEGER,
        //     autoIncrement: true
        // },
        weeklyLogId: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        weekId: {
            type: DataTypes.STRING,
            allowNull: false
        },
        binges: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        goodDays: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        weight: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        V: {
            type: DataTypes.BOOLEAN,
            allowNull: false
        },
        L: {
            type: DataTypes.BOOLEAN,
            allowNull: false
        },
        D: {
            type: DataTypes.BOOLEAN,
            allowNull: false
        },
        events: {
            type: DataTypes.STRING,
            allowNull: true
        },
        dateAdded: {
            type: DataTypes.DATE,
            allowNull: false
        }
    }, {
            timestamps: true,
            createdAt: 'dateCreated',
            updatedAt: 'dateUpdated'
        });

    db.users.hasMany(db.weeklyLog);

    db.appointments = sequelize.define('appointments', {
        // userId: {
        //     type: DataTypes.INTEGER,
        //     autoIncrement: true
        // },
        appointmentId: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        appointmentTime: {
            type: DataTypes.DATE,
            allowNull: false
        },
        title: {
            type: DataTypes.STRING,
            allowNull: false
        },
        comments: {
            type: DataTypes.STRING,
            allowNull: true
        },
        createdOn: {
            type: DataTypes.DATE,
            allowNull: false
        }
    }, {
            timestamps: true,
            createdAt: 'dateCreated',
            updatedAt: 'dateUpdated'
        });

    db.users.hasMany(db.appointments);
    db.researchers.hasMany(db.appointments);

    db.notes = sequelize.define('notes', {
        // userId: {
        //     type: DataTypes.INTEGER,
        //     autoIncrement: true
        // },
        notesId: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        notes: {
            type: DataTypes.STRING,
            allowNull: true
        },
        isAdminShareable: {
            type: DataTypes.ENUM,
            values: ['yes', 'no'],
            defaultValue: 'no'
        },
        title: {
            type: DataTypes.STRING,
            allowNull: true
        }
    }, {
            timestamps: true,
            createdAt: 'dateCreated',
            updatedAt: 'dateUpdated'
        });

    db.users.hasMany(db.notes);
    db.researchers.hasMany(db.notes);
    db.appointments.hasMany(db.notes);

    db.notifications = sequelize.define('notifications', {
        notificationId: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        notificationMessage: {
            type: DataTypes.STRING,
            allowNull: true
        },
        dateTimeSent: {
            type: DataTypes.DATE,
            allowNull: false
        },
        from: {
            type: DataTypes.STRING,
            allowNull: false
        },
        to: {
            type: DataTypes.STRING,
            allowNull: false
        }
    }, {
            timestamps: true,
            createdAt: 'dateCreated',
            updatedAt: 'dateUpdated'
        });

    db.users.hasMany(db.notifications);

    db.userDeviceMapper = sequelize.define('userdevicemapper', {
        // userId: {
        //     type: DataTypes.INTEGER,
        //     autoIncrement: true
        // },
        userDeviceMapperId: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        deviceId: {
            type: DataTypes.STRING(20),
            allowNull: false

        },
        registeredTime: {
            type: DataTypes.DATE,
            allowNull: false
        },
        fcmToken: {
            type: DataTypes.STRING,
            allowNull: true
        }
    }, {
            timestamps: true,
            createdAt: 'dateCreated',
            updatedAt: 'dateUpdated'
        });

    db.users.hasMany(db.userDeviceMapper);

    db.learnings = sequelize.define('learnings', {
        // userId: {
        //     type: DataTypes.INTEGER,
        //     autoIncrement: true
        // },
        learningId: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        imageUrl: {
            type: DataTypes.STRING,
            allowNull: true,
            validate: {
                isUrl: true
            }
        },
        pdfUrl: {
            type: DataTypes.STRING,
            allowNull: true,
            validate: {
                isUrl: true
            }
        },
        title: {
            type: DataTypes.STRING,
            allowNull: true
        }
    }, {
            timestamps: true,
            createdAt: 'dateCreated',
            updatedAt: 'dateUpdated'
        });

    db.challenges = sequelize.define('challenges', {
        // userId: {
        //     type: DataTypes.INTEGER,
        //     autoIncrement: true
        // },
        challengesId: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        description: {
            type: DataTypes.STRING,
            allowNull: true
        },
        title: {
            type: DataTypes.STRING,
            allowNull: true
        }
    }, {
            timestamps: true,
            createdAt: 'dateCreated',
            updatedAt: 'dateUpdated'
        });

    db.assignChallenges = sequelize.define('assignChallenges', {
        assignChallengesId: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        dateAssigned: {
            type: DataTypes.DATE,
            allowNull: false
        },
        dueDate: {
            type: DataTypes.DATE,
            allowNull: false
        },
        status: {
            type: DataTypes.STRING,
            allowNull: true
        }
    }, {
            timestamps: true,
            createdAt: 'dateCreated',
            updatedAt: 'dateUpdated'
        });

    db.users.hasMany(db.assignChallenges);
    db.researchers.hasMany(db.assignChallenges);
    db.challenges.hasMany(db.assignChallenges);

    db.steps = sequelize.define('steps', {
        stepId: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            allowNull: false,
            autoIncrement: true,
        },
        description: {
            type: DataTypes.STRING,
            allowNull: false
        },
        checkList: {
            type: DataTypes.STRING(10000),
            allowNull: false
        },
        createdAt: {
            type: DataTypes.DATE,
            allowNull: false
        },
        updatedAt: {
            type: DataTypes.DATE,
            allowNull: false
        }
    },
        {
            timestamps: true,
            createdAt: 'dateCreated',
            updatedAt: 'dateUpdated'
        });

    db.response = sequelize.define('response', {
        responseId: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            allowNull: false,
            autoIncrement: true,
        },
        stepId: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        userResponse: {
            type: DataTypes.STRING,
            allowNull: false
        },
        comments: {
            type: DataTypes.STRING
        },
        logDateTime: {
            type: DataTypes.DATE,
            allowNull: false
        },
        userId: {
            type: DataTypes.STRING,
            allowNull: false
        },
        createdAt: {
            type: DataTypes.DATE,
            allowNull: false
        },
        updatedAt: {
            type: DataTypes.DATE,
            allowNull: false
        }
    }, {
            timestamps: true,
            createdAt: 'dateCreated',
            updatedAt: 'dateUpdated'
        });


    db.progress = sequelize.define('progress', {
        progressId: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false
        },
        status: {
            type: DataTypes.STRING,
            allowNull: false
        },
        userId: {
            type: DataTypes.STRING,
            allowNull: false
        },
        supporterId: {
            type: DataTypes.STRING,
            allowNull: false
        },
        responseId: {
            type: DataTypes.STRING,
            allowNull: false
        },
        progressDateTime: {
            type: DataTypes.DATE,
            allowNull: false
        },
        createdAt: {
            type: DataTypes.DATE,
            allowNull: false
        },
        updatedAt: {
            type: DataTypes.DATE,
            allowNull: false
        }
    }, {
            timestamps: true,
            createdAt: 'dateCreated',
            updatedAt: 'dateUpdated'
        });
    db.motivational = sequelize.define('motivationalMessages', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            allowNull: false,
            autoIncrement: true,
        },
        message: {
            type: DataTypes.STRING(10000),
            allowNull: false
        },
        stepId: {
            type: DataTypes.STRING(10000),
            allowNull: false
        },
        createdAt: {
            type: DataTypes.DATE,
            allowNull: false
        },
        updatedAt: {
            type: DataTypes.DATE,
            allowNull: false
        }
    }, {
            timestamps: true,
            createdAt: 'dateCreated',
            updatedAt: 'dateUpdated'
        });

    return db;
};