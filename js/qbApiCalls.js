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
    var UserActions = require('./user/UserView');
    UserActions.removeSpinner();
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

  return {

    init: function(token) {
      var UserActions = require('./user/UserView');

      if (typeof token === 'undefined') {
        QB.init(QMCONFIG.qbAccount.appId, QMCONFIG.qbAccount.authKey, QMCONFIG.qbAccount.authSecret);
      } else {
        QB.init(token);
        UserActions.createSpinner();

        session = new Session;
        session.getStorage();
        UserActions.autologin();
      }
    },

    checkSession: function(callback) {
      if (new Date > session.storage.expirationTime) {
        this.init(); // reset QuickBlox JS SDK after autologin via an existing token
        this.createSession(session.storage.authParams, callback, session.storage.remember);
      } else {
        callback();
      }
    },

    createSession: function(params, callback, isRemember) {
      var UserActions = require('./user/UserView');

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
              UserActions.getFBStatus();
            
            // This checking is needed when you trying to connect via FB
            // and your primary email has already been taken on the project 
            } else if (errMsg.indexOf('already') >= 0) {
              errMsg = 'Email ' + errMsg;
              UserActions.getFBStatus();
            } else {
              errMsg += '. ' + QMCONFIG.errors.session;
            }
          }

          fail(errMsg);
        } else {
          if (QMCONFIG.debug) console.log('QB SDK: Session is created', res);

          session = new Session(res.token, params, isRemember);
          session.setExpirationTime();

          callback(res);
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

    getUser: function(params, callback) {
      this.checkSession(function(res) {
        QB.users.get(params, function(err, res) {
          if (err) {
            if (QMCONFIG.debug) console.log(err.detail);

          } else {
            if (QMCONFIG.debug) console.log('QB SDK: User is found', res);

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
    }

  };
})();
