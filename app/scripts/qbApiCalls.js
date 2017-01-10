/*
 * Q-municate chat application
 *
 * QuickBlox JS SDK Wrapper
 *
 */
define([
    'jquery',
    'config',
    'quickblox',
    'Entities',
    'Helpers',
    'LocationView'
], function($,
    QMCONFIG,
    QB,
    Entities,
    Helpers,
    Location
) {

    var Session,
        UserView,
        ContactListView,
        User,
        Listeners;

    var timer;

    var self;

    function QBApiCalls(app) {
        this.app = app;
        self = this;

        Session = this.app.models.Session;
        UserView = this.app.views.User;
        DialogView = this.app.views.Dialog;
        ContactListView = this.app.views.ContactList;
        User = this.app.models.User;
        Listeners = this.app.listeners;
    }

    QBApiCalls.prototype = {

        init: function(token) {
            if (typeof token === 'undefined') {
                QB.init(QMCONFIG.qbAccount.appId, QMCONFIG.qbAccount.authKey, QMCONFIG.qbAccount.authSecret, QMCONFIG.QBconf);
            } else {
                QB.init(token, QMCONFIG.qbAccount.appId, null, QMCONFIG.QBconf);
                QB.service.qbInst.session.application_id = QMCONFIG.qbAccount.appId;
                QB.service.qbInst.config.creds = QMCONFIG.qbAccount;

                Session.create(JSON.parse(localStorage['QM.session']), true);
                UserView.autologin();
            }

            Helpers.log('QB init', this);

            // init dialog's collection with starting app
            Entities.Collections.dialogs = new Entities.Collections.Dialogs();
        },

        checkSession: function(callback) {
            if ((new Date()).toISOString() > Session.expirationTime) {
                // recovery session
                if (Session.authParams.provider === 'facebook') {
                    UserView.getFBStatus(function(token) {
                        Session.authParams.keys.token = token;

                        self.createSession(Session.authParams, function(session) {
                            callback(session);
                        }, Session._remember);
                    });
                } else if (Session.authParams.provider === 'twitter_digits') {
                    self.getTwitterDigits(function(session) {
                        callback(session);
                    });
                } else {
                    self.createSession(Session.decrypt(Session.authParams), function(session) {
                        callback(session);
                    }, Session._remember);

                    Session.encrypt(Session.authParams);
                }
            } else {
                callback();
            }
        },

        createSession: function(params, callback, isRemember) {
            // Remove coordinates from localStorage
            Location.toggleGeoCoordinatesToLocalStorage(false, function(res, err) {
                Helpers.log(err ? err : res);
            });

            QB.createSession(params, function(err, res) {
                if (err) {
                    Helpers.log(err.detail);

                    var errMsg,
                        parseErr = JSON.parse(err.detail);

                    if (err.code === 401) {
                        errMsg = QMCONFIG.errors.unauthorized;
                        $('section:visible input:not(:checkbox)').addClass('is-error');
                    } else {
                        errMsg = parseErr.errors.email ? parseErr.errors.email[0] :
                            parseErr.errors.base ? parseErr.errors.base[0] : parseErr.errors[0];

                        // This checking is needed when your user has exited from Facebook
                        // and you try to relogin on a project via FB without reload the page.
                        // All you need it is to get the new FB user status and show specific error message
                        if (errMsg.indexOf('Authentication') >= 0) {
                            errMsg = QMCONFIG.errors.crashFBToken;
                            UserView.getFBStatus();

                            // This checking is needed when you trying to connect via FB
                            // and your primary email has already been taken on the project
                        } else if (errMsg.indexOf('already') >= 0) {
                            errMsg = QMCONFIG.errors.emailExists;
                            UserView.getFBStatus();
                        } else {
                            errMsg = QMCONFIG.errors.session;
                        }
                    }

                    fail(errMsg);
                } else {
                    Helpers.log('QB SDK: Session is created', res);

                    if (Session.token) {
                        Session.update({
                            token: res.token
                        });
                    } else {
                        Session.create({
                            token: res.token,
                            authParams: Session.encrypt(params)
                        }, isRemember);
                    }

                    Session.update({
                        date: new Date()
                    });
                    callback(res);
                }
            });
        },

        loginUser: function(params, callback) {
            this.checkSession(function(res) {
                QB.login(params, function(err, res) {
                    if (err) {
                        Helpers.log(err.detail);
                    } else {
                        Helpers.log('QB SDK: User has logged', res);

                        Session.update({
                            date: new Date(),
                            authParams: Session.encrypt(params)
                        });
                        callback(res);
                    }
                });
            });
        },

        getTwitterDigits: function(callback) {
            self.createSession({}, function(session) {
                QB.login(Session.authParams, function(err, user) {
                    if (err) {
                        Helpers.log(err.detail);
                    } else {
                        Session.update({
                            date: new Date(),
                            authParams: Session.encrypt(Session.authParams)
                        });
                        callback(session);
                    }
                });
            }, Session._remember);
        },

        logoutUser: function(callback) {
            Helpers.log('QB SDK: User has exited');
            // reset QuickBlox JS SDK after autologin via an existing token
            QB.service.qbInst.config.creds = QMCONFIG.qbAccount;
            clearTimeout(timer);
            Session.destroy();
            callback();
        },

        forgotPassword: function(email, callback) {
            this.checkSession(function(res) {
                QB.users.resetPassword(email, function(response) {
                    if (response.code === 404) {
                        Helpers.log(response.message);

                        failForgot();
                    } else {
                        Helpers.log('QB SDK: Instructions have been sent');

                        Session.destroy();
                        callback();
                    }
                });
            });
        },

        listUsers: function(params, callback) {
            this.checkSession(function(res) {
                QB.users.listUsers(params, function(err, res) {
                    if (err) {
                        Helpers.log(err.detail);

                    } else {
                        Helpers.log('QB SDK: Users is found', res);

                        Session.update({
                            date: new Date()
                        });
                        callback(res);
                    }
                });
            });
        },

        getUser: function(params, callback) {
            this.checkSession(function(res) {
                QB.users.get(params, function(err, res) {
                    if (err && err.code === 404) {
                        Helpers.log(err.message);

                        failSearch();
                        /** emulate right answer from a server */
                        callback({
                            current_page: 1,
                            items: []
                        });
                    } else {
                        Helpers.log('QB SDK: Users is found', res);

                        Session.update({
                            date: new Date()
                        });
                        callback(res);
                    }
                });
            });
        },

        createUser: function(params, callback) {
            this.checkSession(function(res) {
                QB.users.create(params, function(err, res) {
                    if (err) {
                        Helpers.log(err.detail);

                        var parseErr = JSON.parse(err.detail).errors.email[0];
                        failUser(parseErr);
                    } else {
                        Helpers.log('QB SDK: User is created', res);

                        Session.update({
                            date: new Date()
                        });
                        callback(res);
                    }
                });
            });
        },

        updateUser: function(id, params, callback) {
            this.checkSession(function(res) {
                QB.users.update(id, params, function(err, res) {
                    if (err) {
                        Helpers.log(err.detail);

                        var parseErr = JSON.parse(err.detail).errors.email;
                        if (parseErr) {
                            failUser(parseErr[0]);
                        } else {
                            callback(null, err);
                        }
                    } else {
                        Helpers.log('QB SDK: User is updated', res);

                        Session.update({
                            date: new Date()
                        });
                        callback(res);
                    }
                });
            });
        },

        createBlob: function(params, callback) {
            this.checkSession(function(res) {
                QB.content.createAndUpload(params, function(err, res) {
                    if (err) {
                        Helpers.log(err.detail);

                    } else {
                        Helpers.log('QB SDK: Blob is uploaded', res);

                        Session.update({
                            date: new Date()
                        });
                        callback(res);
                    }
                });
            });
        },

        connectChat: function(jid, callback) {
            this.checkSession(function(res) {
                var password = Session.token;

                QB.chat.connect({
                    jid: jid,
                    password: password
                }, function(err, res) {
                    if (err) {
                        Helpers.log(err);

                        UserView.logout();
                        window.location.reload();
                        fail(err.detail);
                    } else {
                        Listeners.setChatState(true);

                        startFlurryAgent();

                        Session.update({
                            date: new Date()
                        });

                        setRecoverySessionInterval();
                        callback(res);

                        if (User.contact.full_name === 'Unknown user') {
                            self.app.views.Profile.render().openPopup();
                        }
                    }
                });
            });
        },

        reconnectChat: function() {
            self.connectChat(User.contact.user_jid, function(roster) {
                Listeners.setQBHandlers();
                Listeners.onReconnected();

                Entities.Collections.dialogs.each(function(dialog) {
                    if (dialog.get('type') === 2) {
                        QB.chat.muc.join(dialog.get('room_jid'));
                    }
                });
            });
        },

        listDialogs: function(params, callback) {
            this.checkSession(function(res) {
                QB.chat.dialog.list(params, function(err, res) {
                    if (err) {
                        Helpers.log(err.detail);
                    } else {
                        Helpers.log('QB SDK: Dialogs is found', res);

                        Session.update({
                            date: new Date()
                        });
                        callback(res);
                    }
                });
            });
        },

        createDialog: function(params, callback) {
            this.checkSession(function(res) {
                QB.chat.dialog.create(params, function(err, res) {
                    if (err) {
                        Helpers.log(err.detail);

                    } else {
                        Helpers.log('QB SDK: Dialog is created', res);

                        Session.update({
                            date: new Date()
                        });
                        callback(res);
                    }
                });
            });
        },

        updateDialog: function(id, params, callback) {
            this.checkSession(function(res) {
                QB.chat.dialog.update(id, params, function(err, res) {
                    if (err) {
                        Helpers.log(err.detail);

                    } else {
                        Helpers.log('QB SDK: Dialog is updated', res);

                        Session.update({
                            date: new Date()
                        });
                        callback(res);
                    }
                });
            });
        },

        listMessages: function(params, callback) {
            this.checkSession(function(res) {
                QB.chat.message.list(params, function(err, res) {
                    if (err) {
                        Helpers.log(err.detail);

                    } else {
                        Helpers.log('QB SDK: Messages is found', res);

                        Session.update({
                            date: new Date()
                        });

                        callback(res.items);
                    }
                });
            });
        },

        deleteMessage: function(params, callback) {
            this.checkSession(function(res) {
                QB.chat.message.delete(params, function(response) {
                    if (response.code === 404) {
                        Helpers.log(response.message);

                    } else {
                        Helpers.log('QB SDK: Message is deleted');

                        Session.update({
                            date: new Date()
                        });
                        callback();
                    }
                });
            });
        },

        sendPushNotification: function(calleeId, fullName) {
            var params = {
                'notification_type': 'push',
                'environment': "production",
                'message': QB.pushnotifications.base64Encode(fullName + ' is calling you.'),
                'user': { ids: [calleeId] },
                'ios_badge': '1',
                'ios_sound': 'default'
            };

            QB.pushnotifications.events.create(params, function(err, response) {
                if (err) {
                    Helpers.log('Create event error: ', err);
                } else {
                    Helpers.log('Create event: ', response);
                }
            });
        }

    };

    /* Private
    ---------------------------------------------------------------------- */
    function setRecoverySessionInterval() {
        // update QB session every one hour
        timer = setTimeout(function() {
            QB.getSession(function(err, session) {
                if (err) {
                    return Helpers.log('recovery session error', err);
                } else {
                    Session.update({
                        date: new Date()
                    });
                    setRecoverySessionInterval();
                }
            });
        }, 3600 * 1000);
    }

    function startFlurryAgent() {
        var eventParams = {
            'chat_endpoint': QB.auth.service.qbInst.config.endpoints.chat,
            'app_id': (QMCONFIG.qbAccount.appId).toString()
        };

        FlurryAgent.logEvent("Connect_to_chat", eventParams);
    }

    var fail = function(errMsg) {
        UserView.removeSpinner();
        $('section:visible .text_error').addClass('is-error').text(errMsg);
        $('section:visible input:password').val('');
    };

    var failUser = function(err) {
        var errMsg;

        if (err.indexOf('already') >= 0) {
            errMsg = QMCONFIG.errors.emailExists;
        } else if (err.indexOf('look like') >= 0) {
            errMsg = QMCONFIG.errors.invalidEmail;
        }

        $('section:visible input[type="email"]').addClass('is-error');
        fail(errMsg);
    };

    var failForgot = function() {
        var errMsg = QMCONFIG.errors.notFoundEmail;
        $('section:visible input[type="email"]').addClass('is-error');
        fail(errMsg);
    };

    var failSearch = function() {
        $('.popup:visible .note').removeClass('is-hidden').siblings('.popup-elem').addClass('is-hidden');
        ContactListView.removeDataSpinner();
    };

    return QBApiCalls;

});
