/*
 * Q-municate chat application
 *
 * QuickBlox JS SDK Wrapper
 *
 */

define(['jquery', 'config', 'quickblox', 'Helpers'], function($, QMCONFIG, QB, Helpers) {

  var Session, UserView, ContactListView, User;
  var timer;

  function QBApiCalls(app) {
    this.app = app;

    Session = this.app.models.Session;
    UserView = this.app.views.User;
    ContactListView = this.app.views.ContactList;
    User = this.app.models.User;
  }

  QBApiCalls.prototype = {

    init: function(token) {
      if (typeof token === 'undefined') {
        QB.init(QMCONFIG.qbAccount.appId, QMCONFIG.qbAccount.authKey, QMCONFIG.qbAccount.authSecret, QMCONFIG.QBconf);
      } else {
        QB.init(token, QMCONFIG.qbAccount.appId, null, QMCONFIG.QBconf);
        QB.service.qbInst.session.application_id = QMCONFIG.qbAccount.appId;

        Session.create(JSON.parse(localStorage['QM.session']), true);
        UserView.autologin();
      }

      Helpers.showInConsole('QB init', this);
    },

    checkSession: function(callback) {
      var self = this;

      if ((new Date()).toISOString() > Session.expirationTime) {
        // reset QuickBlox JS SDK after autologin via an existing token
        self.init();

        // recovery session
        if (Session.authParams.provider) {
          UserView.getFBStatus(function(token) {
            Session.authParams.keys.token = token;
            self.createSession(Session.authParams, callback, Session._remember);
          });
        } else {
          self.createSession(Session.decrypt(Session.authParams), callback, Session._remember);
          Session.encrypt(Session.authParams);
        }
        
      } else {
        callback();
      }
    },

    createSession: function(params, callback, isRemember) {
      QB.createSession(params, function(err, res) {
        if (err) {
          Helpers.showInConsole(err.detail);

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
          Helpers.showInConsole('QB SDK: Session is created', res);

          if (Session.token) {
            Session.update({ token: res.token });
          } else {
            Session.create({ token: res.token, authParams: Session.encrypt(params) }, isRemember);
          }

          Session.update({ date: new Date() });
          callback(res);
        }
      });
    },

    loginUser: function(params, callback) {
      this.checkSession(function(res) {
        QB.login(params, function(err, res) {
          if (err) {
            Helpers.showInConsole(err.detail);

          } else {
            Helpers.showInConsole('QB SDK: User has logged', res);

            Session.update({ date: new Date(), authParams: Session.encrypt(params) });
            callback(res);
          }
        });
      });
    },

    logoutUser: function(callback) {
      Helpers.showInConsole('QB SDK: User has exited');
      // reset QuickBlox JS SDK after autologin via an existing token
      this.init();
      clearTimeout(timer);
      Session.destroy();
      callback();
    },

    forgotPassword: function(email, callback) {
      this.checkSession(function(res) {
        QB.users.resetPassword(email, function(response) {
          if (response.code === 404) {
            Helpers.showInConsole(response.message);

            failForgot();
          } else {
            Helpers.showInConsole('QB SDK: Instructions have been sent');

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
            Helpers.showInConsole(err.detail);

          } else {
            Helpers.showInConsole('QB SDK: Users is found', res);

            Session.update({ date: new Date() });
            callback(res);
          }
        });
      });
    },

    getUser: function(params, callback) {
      this.checkSession(function(res) {
        QB.users.get(params, function(err, res) {
          if (err && err.code === 404) {
            Helpers.showInConsole(err.message);

            failSearch();
          } else {
            Helpers.showInConsole('QB SDK: Users is found', res);

            Session.update({ date: new Date() });
            callback(res);
          }
        });
      });
    },

    createUser: function(params, callback) {
      this.checkSession(function(res) {
        QB.users.create(params, function(err, res) {
          if (err) {
            Helpers.showInConsole(err.detail);

            var parseErr = JSON.parse(err.detail).errors.email[0];
            failUser(parseErr);
          } else {
            Helpers.showInConsole('QB SDK: User is created', res);

            Session.update({ date: new Date() });
            callback(res);
          }
        });
      });
    },

    updateUser: function(id, params, callback) {
      this.checkSession(function(res) {
        QB.users.update(id, params, function(err, res) {
          if (err) {
            Helpers.showInConsole(err.detail);

            var parseErr = JSON.parse(err.detail).errors.email;
            if (parseErr) {
              failUser(parseErr[0]);
            } else {
              callback(null, err);
            }
          } else {
            Helpers.showInConsole('QB SDK: User is updated', res);

            Session.update({ date: new Date() });
            callback(res);
          }
        });
      });
    },

    createBlob: function(params, callback) {
      this.checkSession(function(res) {
        QB.content.createAndUpload(params, function(err, res) {
          if (err) {
            Helpers.showInConsole(err.detail);

          } else {
            Helpers.showInConsole('QB SDK: Blob is uploaded', res);

            Session.update({ date: new Date() });
            callback(res);
          }
        });
      });
    },

    connectChat: function(jid, callback) {
      this.checkSession(function(res) {
        // var password = Session.authParams.provider ? Session.token :
        //                Session.decrypt(Session.authParams).password;

        // Session.encrypt(Session.authParams);
        var password = Session.token;
        QB.chat.connect({jid: jid, password: password}, function(err, res) {
          if (err) {
            Helpers.showInConsole(err.detail);

            if (err.detail.indexOf('Status.ERROR') >= 0 || err.detail.indexOf('Status.AUTHFAIL') >= 0) {
              fail(err.detail);
              UserView.logout();
              window.location.reload();
            }
          } else {
            var currentUser = User.contact;
            var eventParameters = {           
              'appID': (QMCONFIG.qbAccount.appId).toString(),
              'full_name': currentUser.full_name,
              'email': currentUser.email || '',
              'facebook_id': currentUser.facebook_id || '',
              'user_id': (currentUser.id).toString(),
              'user_tags': currentUser.user_tags || ''
            }

            FlurryAgent.logEvent("Connect to chat", eventParameters, true);

            Session.update({ date: new Date() });
            setRecoverySessionInterval();
            callback(res);
          }
        });
      });
    },

    listDialogs: function(params, callback) {
      this.checkSession(function(res) {
        QB.chat.dialog.list(params, function(err, res) {
          if (err) {
            Helpers.showInConsole(err.detail);

          } else {
            Helpers.showInConsole('QB SDK: Dialogs is found', res);

            Session.update({ date: new Date() });
            callback(res.items);
          }
        });
      });
    },

    createDialog: function(params, callback) {
      this.checkSession(function(res) {
        QB.chat.dialog.create(params, function(err, res) {
          if (err) {
            Helpers.showInConsole(err.detail);

          } else {
            Helpers.showInConsole('QB SDK: Dialog is created', res);

            Session.update({ date: new Date() });
            callback(res);
          }
        });
      });
    },

    updateDialog: function(id, params, callback) {
      this.checkSession(function(res) {
        QB.chat.dialog.update(id, params, function(err, res) {
          if (err) {
            Helpers.showInConsole(err.detail);

          } else {
            Helpers.showInConsole('QB SDK: Dialog is updated', res);

            Session.update({ date: new Date() });
            callback(res);
          }
        });
      });
    },

    listMessages: function(params, callback) {
      this.checkSession(function(res) {
        QB.chat.message.list(params, function(err, res) {
          if (err) {
            Helpers.showInConsole(err.detail);

          } else {
            Helpers.showInConsole('QB SDK: Messages is found', res);

            Session.update({ date: new Date() });
            callback(res.items);
          }
        });
      });
    },

    updateMessage: function(id, params, callback) {
      this.checkSession(function(res) {
        QB.chat.message.update(id, params, function(response) {
          if (response.code === 404) {
            Helpers.showInConsole(response.message);

          } else {
            Helpers.showInConsole('QB SDK: Message is updated');

            Session.update({ date: new Date() });
            callback();
          }
        });
      });
    },

    deleteMessage: function(params, callback) {
      this.checkSession(function(res) {
        QB.chat.message.delete(params, function(response) {
          if (response.code === 404) {
            Helpers.showInConsole(response.message);

          } else {
            Helpers.showInConsole('QB SDK: Message is deleted');

            Session.update({ date: new Date() });
            callback();
          }
        });
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
          return Helpers.showInConsole('recovery session error', err);
        } else {
          Session.update({ date: new Date() });
          setRecoverySessionInterval();
        }
      });
    }, 3600 * 1000);
  }

  var fail = function(errMsg) {
    UserView.removeSpinner();
    $('section:visible .text_error').addClass('is-error').text(errMsg);
    $('section:visible input:password').val('');
    $('section:visible .chroma-hash label').css('background-color', 'rgb(255, 255, 255)');
  };

  var failUser = function(err) {
    var errMsg;

    if (err.indexOf('already') >= 0)
      errMsg = QMCONFIG.errors.emailExists;
    else if (err.indexOf('look like') >= 0)
      errMsg = QMCONFIG.errors.invalidEmail;

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
