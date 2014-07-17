/*
 * Q-municate chat application
 *
 * QuickBlox JS SDK Wrapper
 *
 */

var Session = require('./session/SessionModel');

module.exports = (function() {
  var session;

  var fail = function(errMsg) {
    var UserView = require('./user/UserView');
    UserView.removeSpinner();
    $('section:visible').find('.text_error').addClass('is-error').text(errMsg);
  };

  var failUser = function(detail) {
    var errMsg = 'This email ';
    errMsg += JSON.parse(detail).errors.email[0];
    $('section:visible input[type="email"]').addClass('is-error');
    fail(errMsg);
  };

  var failForgot = function() {
    var errMsg = QMCONFIG.errors.notFoundEmail;
    $('section:visible input[type="email"]').addClass('is-error');
    fail(errMsg);
  };

  var failSearch = function() {
    var FriendlistView = require('./friendlist/FriendlistView');
    $('.popup:visible .note').removeClass('is-hidden').siblings('.popup-elem').addClass('is-hidden');
    FriendlistView.removeDataSpinner();
  };

  return {

    init: function(token) {
      var UserView = require('./user/UserView');

      if (typeof token === 'undefined') {
        QB.init(QMCONFIG.qbAccount.appId, QMCONFIG.qbAccount.authKey, QMCONFIG.qbAccount.authSecret);
      } else {
        QB.init(token);

        session = new Session;
        session.getStorage();
        UserView.autologin(session);
      }
    },

    checkSession: function(callback) {
      var UserView = require('./user/UserView'),
          self = this;

      if ((new Date).toISOString() > session.storage.expirationTime) {
        self.init(); // reset QuickBlox JS SDK after autologin via an existing token

        if (session.storage.authParams.provider) {
          UserView.getFBStatus(function(token) {
            session.storage.authParams.keys.token = token;
            self.createSession(session.storage.authParams, callback, session._remember);
          });
        } else {
          session.decrypt(session.storage.authParams);
          self.createSession(session.storage.authParams, callback, session._remember);
          session.encrypt(session.storage.authParams);
        }
        
      } else {
        callback();
      }
    },

    createSession: function(params, callback, isRemember) {
      var UserView = require('./user/UserView');

      QB.createSession(params, function(err, res) {
        if (err) {
          if (QMCONFIG.debug) console.log(err.detail);

          var errMsg,
              parseErr = JSON.parse(err.detail);

          if (err.code === 401) {
            errMsg = parseErr.errors[0];
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
              errMsg = 'Email ' + errMsg;
              UserView.getFBStatus();
            } else {
              errMsg = QMCONFIG.errors.session;
            }
          }

          fail(errMsg);
        } else {
          if (QMCONFIG.debug) console.log('QB SDK: Session is created', res);

          if (session)
            session.update(res.token);
          else
            session = new Session(res.token, params, isRemember);

          session.setExpirationTime();

          callback(res, session);
        }
      });
    },

    loginUser: function(params, callback) {
      this.checkSession(function(res) {
        QB.login(params, function(err, res) {
          if (err) {
            if (QMCONFIG.debug) console.log(err.detail);

          } else {
            if (QMCONFIG.debug) console.log('QB SDK: User has logged', res);

            session.setAuthParams(params);
            session.setExpirationTime();

            callback(res);
          }
        });
      });
    },

    logoutUser: function(callback) {
      if (QMCONFIG.debug) console.log('QB SDK: User has exited');
      session.destroy();
      session = null;
      this.init(); // reset QuickBlox JS SDK after autologin via an existing token
      callback();
    },

    forgotPassword: function(email, callback) {
      this.checkSession(function(res) {
        QB.users.resetPassword(email, function(response) {
          if (response.code === 404) {
            if (QMCONFIG.debug) console.log(response.message);

            failForgot();
          } else {
            if (QMCONFIG.debug) console.log('QB SDK: Instructions have been sent');

            session.destroy();
            session = null;
            callback();
          }
        });
      });
    },

    listUsers: function(params, callback) {
      this.checkSession(function(res) {
        QB.users.listUsers(params, function(err, res) {
          if (err) {
            if (QMCONFIG.debug) console.log(err.detail);

          } else {
            if (QMCONFIG.debug) console.log('QB SDK: Users is found', res);

            session.setExpirationTime();
            callback(res);
          }
        });
      });
    },

    getUser: function(params, callback) {
      this.checkSession(function(res) {
        QB.users.get(params, function(err, res) {
          if (err && err.code === 404) {
            if (QMCONFIG.debug) console.log(err.message);

            failSearch();
          } else {
            if (QMCONFIG.debug) console.log('QB SDK: Users is found', res);

            session.setExpirationTime();
            callback(res);
          }
        });
      });
    },

    createUser: function(params, callback) {
      this.checkSession(function(res) {
        QB.users.create(params, function(err, res) {
          if (err) {
            if (QMCONFIG.debug) console.log(err.detail);

            failUser(err.detail);
          } else {
            if (QMCONFIG.debug) console.log('QB SDK: User is created', res);

            session.setExpirationTime();
            callback(res);
          }
        });
      });
    },

    updateUser: function(id, params, callback) {
      this.checkSession(function(res) {
        QB.users.update(id, params, function(err, res) {
          if (err) {
            if (QMCONFIG.debug) console.log(err.detail);

            failUser(err.detail);
          } else {
            if (QMCONFIG.debug) console.log('QB SDK: User is updated', res);

            session.setExpirationTime();
            callback(res);
          }
        });
      });
    },

    createBlob: function(params, callback) {
      this.checkSession(function(res) {
        QB.content.createAndUpload(params, function(err, res) {
          if (err) {
            if (QMCONFIG.debug) console.log(err.detail);

          } else {
            if (QMCONFIG.debug) console.log('QB SDK: Blob is uploaded', res);

            session.setExpirationTime();
            callback(res);
          }
        });
      });
    },

    chatConnect: function(jid, callback) {
      this.checkSession(function(res) {
        var password;
        
        session.decrypt(session.storage.authParams);
        password = session.storage.authParams.provider ? session.storage.token : session.storage.authParams.password;
        session.encrypt(session.storage.authParams);

        QB.chat.connect({jid: jid, password: password}, function(err, res) {
          if (err) {
            if (QMCONFIG.debug) console.log(err.detail);

          } else {
            callback();
          }
        });
      });
    },

    chatDisconnect: function() {
      QB.chat.disconnect();
    }

  };
})();
