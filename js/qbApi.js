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
        session.storage = JSON.parse(localStorage.getItem('QM.session'));
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
          } else {
            errMsg = parseErr.errors.base[0];
            errMsg += '. ' + QMCONFIG.errors.session;
          }

          fail(errMsg);
        } else {
          if (QMCONFIG.debug) console.log('Session', res);

          session = new Session(res.token, params);
          session.setExpirationTime();

          callback(res);
        }
      });
    },

    login: function(params, callback) {
      this.checkSession(function(res) {
        QB.login(params, function(err, res) {
          if (err) {
            if (QMCONFIG.debug) console.log(err.detail);
            
          } else {
            if (QMCONFIG.debug) console.log('User', res);

            session.setAuthParams(params);
            session.setExpirationTime();

            callback(res);
          }
        });
      });
    },

    // createUser: function(params, callback) {
    //   QB.users.create(params, function(err, res) {
    //     if (err) {
    //       if (QMCONFIG.debug) console.log(err.detail);
    //     } else {
    //       if (QMCONFIG.debug) console.log('User', res);
    //     }
    //   });
    // },

    // updateUser: function(params, callback) {
    //   QB.users.update(params, function(err, res) {
    //     if (err) {
    //       if (QMCONFIG.debug) console.log(err.detail);
    //     } else {
    //       if (QMCONFIG.debug) console.log('User', res);
    //     }
    //   });
    // },

    // getUser: function(params, callback) {
    //   QB.users.get(params, function(err, res) {
    //     if (err) {
    //       if (QMCONFIG.debug) console.log(err.detail);
    //     } else {
    //       if (QMCONFIG.debug) console.log('User', res);
    //     }
    //   });
    // }

  };
})();
