/*
 * Q-municate chat application
 *
 * QuickBlox JS SDK Wrapper
 *
 */

var Session = require('./session');

module.exports = (function() {
  var session;

  var fail = function(errMsg) {
    $('section:visible').find('.form-text_error').text(errMsg).removeClass('is-invisible');
  };

  return {

    init: function(token) {
      if (typeof token === 'undefined') {
        QB.init(QMCONFIG.qbAccount.appId, QMCONFIG.qbAccount.authKey, QMCONFIG.qbAccount.authSecret);
      } else {
        QB.init(token);
        session = new Session;
        session.getStorage();
      }
    },

    checkSession: function(callback) {
      if (new Date > session.storage.expirationTime) {
        this.init();
        this.createSession(session.storage.authParams, callback);
      } else {
        callback();
      }
    },

    createSession: function(params, callback) {
      QB.createSession(params, function(err, res) {
        if (err) {
          if (QMCONFIG.debug) console.log(err.detail);

          var errMsg,
              parseErr = JSON.parse(err.detail);

          if (err.code === 401) {
            errMsg = parseErr.errors[0];
            $('section:visible input:not(:checkbox)').addClass('is-error');
          } else {
            errMsg = parseErr.errors.base[0];
            errMsg += '. ' + QMCONFIG.errors.session;
          }

          fail(errMsg);
        } else {
          if (QMCONFIG.debug) console.log('QB SDK: Session is created', res);

          session = new Session(res.token, params);
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

    forgotPassword: function(email, callback) {
      this.checkSession(function(res) {
        QB.users.resetPassword(email, function(err, res) {
          if (err) {
            if (QMCONFIG.debug) console.log(err.detail);

          } else {
            if (QMCONFIG.debug) console.log('QB SDK: Instructions have been sent', res);

            session.setExpirationTime();
            callback(res);
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

            var errMsg = 'This email ';
            errMsg += JSON.parse(err.detail).errors.email[0];
            $('section:visible input[type="email"]').addClass('is-error').focus();
            
            fail(errMsg);
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

            var errMsg = 'This email ';
            errMsg += JSON.parse(err.detail).errors.email[0];
            $('section:visible input[type="email"]').addClass('is-error').focus();
            
            fail(errMsg);
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
