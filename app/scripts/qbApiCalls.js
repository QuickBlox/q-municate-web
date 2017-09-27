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
        DialogView,
        ContactListView,
        ContactList,
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
        ContactList = this.app.models.ContactList;
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

                Session.create(JSON.parse(localStorage['QM.session']));
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

                        self.createSession(Session.authParams, function() {
                            callback();
                        });
                    });
                } else if (Session.authParams.provider === 'firebase_phone') {
                    self.getFirebasePhone(function() {
                        callback();
                    });
                } else {
                    self.createSession(Session.decrypt(Session.authParams), function() {
                        callback();
                    });

                    Session.encrypt(Session.authParams);
                }
            } else {
                callback();
            }
        },

        createSession: function(params, callback) {
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
                        });
                    }

                    Session.update({
                        date: new Date()
                    });

                    callback(res);
                }
            });
        },

        loginUser: function(params, callback) {
            this.checkSession(function() {
                QB.login(params, function(err, res) {
                    if (res && !err) {
                        Helpers.log('QB SDK: User has logged', res);

                        Session.update({
                            date: new Date(),
                            authParams: Session.encrypt(params)
                        });

                        if (typeof callback === 'function') {
                            callback(res);
                        }
                    } else {
                        Helpers.log(err);

                        window.location.reload();
                    }
                });
            });
        },

        getFirebasePhone: function(callback) {
            self.createSession({}, function(session) {
                QB.login(Session.authParams, function(err, user) {
                    if (user && !err) {
                        Session.update({
                            date: new Date(),
                            authParams: Session.encrypt(Session.authParams)
                        });

                        callback(session);
                    } else {
                        UserView.logInFirebase(function(authParams) {
                            self.loginUser(authParams);
                        });
                    }
                });
            });
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
            this.checkSession(function() {
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
            this.checkSession(function() {
                QB.users.listUsers(params, function(err, res) {
                    if (err) {
                        Helpers.log(err.detail);

                    } else {
                        Helpers.log('QB SDK: Users are found', res);

                        Session.update({
                            date: new Date()
                        });

                        if (params.filter && params.filter.value) {
                            var requestIds = params.filter.value.split(',').map(Number),
                                responseIds = [];

                            res.items.forEach(function(item) {
                                responseIds.push(item.user.id);
                            });

                            ContactList.cleanUp(requestIds, responseIds);
                        }

                        callback(res);
                    }
                });
            });
        },

        getUser: function(params, callback) {
            this.checkSession(function() {
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
                        Helpers.log('QB SDK: User is found', res);

                        Session.update({
                            date: new Date()
                        });

                        callback(res);
                    }
                });
            });
        },

        createUser: function(params, callback) {
            this.checkSession(function() {
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
            this.checkSession(function() {
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
            this.checkSession(function() {
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
            this.checkSession(function() {
                var password = Session.token;

                QB.chat.connect({
                    jid: jid,
                    password: password,
                    connectWithoutGettingRoster: true
                }, function(err) {
                    if (err) {
                        Helpers.log(err);
                        UserView.logout();
                        fail(err.detail);
                    } else {
                        Listeners.stateActive = true;

                        self.getContactList(function(res) {
                            self.app.models.ContactList.saveRoster(res);
                            callback();
                        });

                        Listeners.setChatState(true);

                        Session.update({
                            date: new Date()
                        });

                        setRecoverySessionInterval();
                    }
                });
            });
        },

        reconnectChat: function() {
            self.connectChat(User.contact.user_jid, function() {
                Listeners.setQBHandlers();
                Listeners.onReconnected();
                Listeners.updateDialogs(true);
            });
        },

        disconnectChat: function() {
            this.checkSession(function() {
                Listeners.stateActive = false;

                QB.chat.disconnect();
                DialogView.hideDialogs();

                Entities.active = '';
                Entities.Collections.dialogs = undefined;
                // init the new dialog's collection
                Entities.Collections.dialogs = new Entities.Collections.Dialogs();
            });
        },

        listDialogs: function(params, callback) {
            this.checkSession(function() {
                QB.chat.dialog.list(params, function(err, res) {
                    if (err) {
                        Helpers.log(err.detail);

                        callback(err);
                    } else {
                        Helpers.log('QB SDK: Dialogs is found', res);

                        Session.update({
                            date: new Date()
                        });

                        callback(null, res);
                    }
                });
            });
        },

        createDialog: function(params, callback) {
            this.checkSession(function() {
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
            this.checkSession(function() {
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

        deleteDialog: function(id, callback) {
            this.checkSession(function() {
                QB.chat.dialog.delete(id, function(err, res) {
                    if (err) {
                        Helpers.log(err.detail);
                    } else {
                        Helpers.log('QB SDK: Dialog is deleted', res);

                        Session.update({
                            date: new Date()
                        });

                        callback(res);
                    }
                });
            });
        },

        listMessages: function(params, callback) {
            this.checkSession(function() {
                QB.chat.message.list(params, function(err, res) {
                    if (err) {
                        Helpers.log(err.detail);
                        callback(null, err);
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
            this.checkSession(function() {
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
        },

        getContactList: function(callback) {
            QB.chat.roster.get(function(roster) {
                callback(roster);
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
