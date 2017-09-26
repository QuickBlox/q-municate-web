/*
 * Q-municate chat application
 *
 * User Module
 *
 */
define([
    'jquery',
    'underscore',
    'config',
    'quickblox',
    'Helpers',
    'FirebaseWidget',
    'models/person',
    'views/profile',
    'views/change_password',
    'views/fb_import'
], function(
    $,
    _,
    QMCONFIG,
    QB,
    Helpers,
    FirebaseWidget,
    Person,
    ProfileView,
    ChangePassView,
    FBImportView
) {

    var self,
        tempParams,
        isFacebookCalled;

    function User(app) {
        this.app = app;
        this._is_import = null;
        this._valid = false;
        self = this;
    }

    User.prototype = {

        initProfile: function() {
            var currentUser = new Person(_.clone(self.contact), {
                app: self.app,
                parse: true
            });

            var profileView = new ProfileView({
                model: currentUser
            });

            var changePassView = new ChangePassView({
                model: currentUser
            });

            var fbImportView = new FBImportView();

            self.app.views.Profile = profileView;
            self.app.views.ChangePass = changePassView;
            self.app.views.FBImport = fbImportView;
        },

        reLogInFirebasePhone: function(callback) {
            FirebaseWidget.init();

            firebase.auth().onAuthStateChanged(function(user) {
                if (user) {
                    self.logInFirebasePhone(user, function(authParams) {
                        callback(authParams);
                    });
                } else {
                    callback();
                }
            });
        },

        logInFirebasePhone: function(user, callback) {
            user.getIdToken().then(function(idToken) {
                var authParams = {
                    'provider': 'firebase_phone',
                    'firebase_phone': {
                        'access_token': idToken,
                        'project_id': QMCONFIG.firebase.projectId
                    }
                };

                self.providerConnect(authParams);

                if (typeof callback === 'function') {
                    callback(authParams);
                }
            });
        },

        logInFacebook: function () {
            if (isFacebookCalled) {
                return false;
            } else {
                isFacebookCalled = true;
            }

            // NOTE!! You should use FB.login method instead FB.getLoginStatus
            // and your browser won't block FB Login popup
            FB.login(function(response) {
                if (response.authResponse && response.status === 'connected') {
                    self.connectFB(response.authResponse.accessToken);

                    isFacebookCalled = false;
                    Helpers.log('FB authResponse', response);
                } else {
                    isFacebookCalled = false;
                    Helpers.log('User cancelled login or did not fully authorize.');
                }
            }, {
                scope: QMCONFIG.fbAccount.scope
            });
        },

        connectFB: function(token) {
            self.providerConnect({
                provider: 'facebook',
                keys: { token: token }
            });
        },

        providerConnect: function(params) {
            var self = this,
                QBApiCalls = self.app.service,
                UserView = self.app.views.User,
                DialogView = self.app.views.Dialog,
                Contact = self.app.models.Contact;

            UserView.loginQB();
            UserView.createSpinner();

            if (params.provider === 'facebook') {
                QBApiCalls.createSession(params, function(session) {
                    QBApiCalls.getUser(session.user_id, function(user) {
                        _prepareChat(user, true);
                    });
                });
            } else {
                QBApiCalls.createSession({}, function() {
                    QBApiCalls.loginUser(params, function(user) {
                        _prepareChat(user);
                    });
                });
            }

            function _prepareChat(user, isFB) {
                self.contact = Contact.create(user);
                self._is_import = getImport(user);

                Helpers.log('User', self);

                UserView.successFormCallback();

                QBApiCalls.connectChat(self.contact.user_jid, function() {
                    self.rememberMe();
                    DialogView.prepareDownloading();
                    DialogView.downloadDialogs();

                    if (!self._is_import && isFB) {
                        self.import(user);
                    }

                    if (self.contact.full_name === 'Unknown user') {
                        self.app.views.Profile.render().openPopup();
                    }
                });
            }
        },

        import: function(user) {
            var DialogView = this.app.views.Dialog,
                isFriendsPermission = false,
                self = this;

            FB.api('/me/permissions', function(response) {
                Helpers.log('FB Permissions', response);
                for (var i = 0, len = response.data.length; i < len; i++) {
                    if (response.data[i].permission === 'user_friends' && response.data[i].status === 'granted') {
                        isFriendsPermission = true;
                    }
                }

                if (isFriendsPermission) {

                    // import FB friends
                    FB.api('/me/friends', function(res) {
                        Helpers.log('FB friends', res);
                        var ids = [];

                        for (var i = 0, len = res.data.length; i < len; i++) {
                            ids.push(res.data[i].id);
                        }

                        if (ids.length > 0) {
                            DialogView.downloadDialogs(ids);
                        } else {
                            DialogView.downloadDialogs();
                        }
                    });

                } else {
                    DialogView.downloadDialogs();
                }
                self._is_import = '1';
                self.updateQBUser(user);
            });
        },

        updateQBUser: function(user) {
            var QBApiCalls = this.app.service,
                custom_data;

            try {
                custom_data = JSON.parse(user.custom_data) || {};
            } catch (err) {
                custom_data = {};
            }

            custom_data.is_import = '1';
            custom_data = JSON.stringify(custom_data);
            QBApiCalls.updateUser(user.id, {
                custom_data: custom_data
            }, function(res) {

            });
        },

        signup: function() {
            var QBApiCalls = this.app.service,
                UserView = this.app.views.User,
                DialogView = this.app.views.Dialog,
                Contact = this.app.models.Contact,
                form = $('section:visible form'),
                self = this,
                params;

            if (validate(form, this)) {
                UserView.createSpinner();

                params = {
                    full_name: tempParams.full_name,
                    email: tempParams.email,
                    password: tempParams.password,
                    tag_list: 'web'
                };

                QBApiCalls.createSession({}, function() {
                    QBApiCalls.createUser(params, function() {
                        delete params.full_name;
                        delete params.tag_list;

                        QBApiCalls.loginUser(params, function(user) {
                            self.contact = Contact.create(user);

                            Helpers.log('User', self);

                            UserView.successFormCallback();

                            QBApiCalls.connectChat(self.contact.user_jid, function() {
                                if (tempParams.blob) {
                                    self.uploadAvatar();
                                } else {
                                    DialogView.prepareDownloading();
                                    DialogView.downloadDialogs();
                                }
                            });
                        });

                    });
                });
            }
        },

        uploadAvatar: function() {
            var QBApiCalls = this.app.service,
                UserView = this.app.views.User,
                DialogView = this.app.views.Dialog,
                Attach = this.app.models.Attach,
                custom_data,
                self = this;

            Attach.crop(tempParams.blob, {
                w: 1000,
                h: 1000
            }, function(file) {
                QBApiCalls.createBlob({
                    file: file,
                    'public': true
                }, function(blob) {
                    self.contact.blob_id = blob.id;
                    self.contact.avatar_url = blob.path;

                    UserView.successFormCallback();
                    DialogView.prepareDownloading();
                    DialogView.downloadDialogs();

                    custom_data = JSON.stringify({
                        avatar_url: blob.path
                    });
                    QBApiCalls.updateUser(self.contact.id, {
                        blob_id: blob.id,
                        custom_data: custom_data
                    }, function(res) {

                    });
                });
            });
        },

        login: function() {
            var QBApiCalls = this.app.service,
                UserView = this.app.views.User,
                DialogView = this.app.views.Dialog,
                Contact = this.app.models.Contact,
                form = $('section:visible form'),
                self = this,
                params;

            if (validate(form, this)) {
                UserView.createSpinner();

                params = {
                    email: tempParams.email,
                    password: tempParams.password
                };

                QBApiCalls.createSession(params, function(session) {
                    QBApiCalls.getUser(session.user_id, function(user) {
                        self.contact = Contact.create(user);

                        Helpers.log('User', self);

                        UserView.successFormCallback();

                        QBApiCalls.connectChat(self.contact.user_jid, function() {
                            self.rememberMe();
                            DialogView.prepareDownloading();
                            DialogView.downloadDialogs();
                        });
                    });
                });
            }
        },

        rememberMe: function() {
            var storage = {},
                self = this;

            Object.keys(self.contact).forEach(function(prop) {
                if (prop !== 'app') {
                    storage[prop] = self.contact[prop];
                }
            });

            localStorage.setItem('QM.user', JSON.stringify(storage));
        },

        forgot: function() {
            var QBApiCalls = this.app.service,
                UserView = this.app.views.User,
                form = $('section:visible form'),
                self = this;

            if (validate(form, this)) {
                UserView.createSpinner();

                QBApiCalls.createSession({}, function() {
                    QBApiCalls.forgotPassword(tempParams.email, function() {
                        UserView.successSendEmailCallback();
                        self._valid = false;
                    });
                });
            }
        },

        autologin: function() {
            var QBApiCalls = this.app.service,
                UserView = this.app.views.User,
                DialogView = this.app.views.Dialog,
                Contact = this.app.models.Contact,
                storage = JSON.parse(localStorage['QM.user']),
                self = this;

            UserView.createSpinner();

            QBApiCalls.getUser(storage.id, function(user) {
                if (user) {
                    self.contact = Contact.create(user);
                } else {
                    self.contact = Contact.create(storage);
                }

                Helpers.log('User', user);

                UserView.successFormCallback();

                QBApiCalls.connectChat(self.contact.user_jid, function() {
                    self.rememberMe();
                    DialogView.prepareDownloading();
                    DialogView.downloadDialogs();
                });
            });
        },

        logout: function() {
            var self = this,
                QBApiCalls = self.app.service;

            QBApiCalls.disconnectChat();

            QBApiCalls.logoutUser(function() {
                localStorage.removeItem('QM.user');
                self.contact = null;
                self._valid = false;

                localStorage.clear();
                window.location.reload();
            });
        }

    };

    /* Private
    ---------------------------------------------------------------------- */
    function validate(form, user) {
        var maxSize = QMCONFIG.maxLimitFile * 1024 * 1024,
            file = form.find('input:file')[0],
            fieldName, errName,
            value, errMsg;

        tempParams = {};
        form.find('input:not(:file, :checkbox)').each(function() {
            // fix requeired pattern
            this.value = this.value.trim();

            fieldName = this.id.split('-')[1];
            errName = this.placeholder;
            value = this.value;

            if (this.checkValidity()) {

                user._valid = true;
                tempParams[fieldName] = value;

            } else {

                if (this.validity.valueMissing) {
                    errMsg = errName + ' is required';
                } else if (this.validity.typeMismatch) {
                    this.value = '';
                    errMsg = QMCONFIG.errors.invalidEmail;
                } else if (this.validity.patternMismatch && errName === 'Name') {
                    if (value.length < 3) {
                        errMsg = QMCONFIG.errors.shortName;
                    } else if (value.length > 50) {
                        errMsg = QMCONFIG.errors.bigName;
                    } else {
                        errMsg = QMCONFIG.errors.invalidName;
                    }
                } else if (this.validity.patternMismatch && (errName === 'Password' || errName === 'New password')) {
                    if (value.length < 8) {
                        errMsg = QMCONFIG.errors.shortPass;
                    } else if (value.length > 40) {
                        errMsg = QMCONFIG.errors.bigPass;
                    } else {
                        errMsg = QMCONFIG.errors.invalidPass;
                    }
                }

                fail(user, errMsg);
                $(this).addClass('is-error').focus();

                return false;
            }
        });

        if (user._valid && file && file.files[0]) {
            file = file.files[0];

            if (file.type.indexOf('image/') === -1) {
                errMsg = QMCONFIG.errors.avatarType;
                fail(user, errMsg);
            } else if (file.name.length > 100) {
                errMsg = QMCONFIG.errors.fileName;
                fail(user, errMsg);
            } else if (file.size > maxSize) {
                errMsg = QMCONFIG.errors.fileSize;
                fail(user, errMsg);
            } else {
                tempParams.blob = file;
            }
        }

        return user._valid;
    }

    function fail(user, errMsg) {
        user._valid = false;
        $('section:visible .text_error').addClass('is-error').text(errMsg);
        $('section:visible input:password').val('');
        $('section:visible .chroma-hash label').css('background-color', 'rgb(255, 255, 255)');
    }

    function getImport(user) {
        var isImport;

        try {
            isImport = JSON.parse(user.custom_data).is_import || null;
        } catch (err) {
            isImport = null;
        }

        return isImport;
    }

    return User;

});
