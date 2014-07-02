/*
 * Q-municate chat application
 *
 * QuickBlox API Calls Module
 *
 */

var Session = require('./qbSession');

module.exports = (function(Session) {
  var session = new Session;

  return {

    init: function() {
      QB.init(QMCONFIG.qbAccount.appId, QMCONFIG.qbAccount.authKey, QMCONFIG.qbAccount.authSecret);
    },

    createSession: function(params, successCallback, errorCallback) {
      QB.createSession(params, function(err, res) {
        if (err) {
          if (QMCONFIG.debug) console.log(err.detail);

          var errMsg = JSON.parse(err.detail).errors.base[0];
          errMsg += '. ' + QMCONFIG.errors.session;

          errorCallback(errMsg);
        } else {
          if (QMCONFIG.debug) console.log('Session', res);

          session.setSession(res);
          console.log(session);
          successCallback();
        }
      });
    },

    createUser: function(params, successCallback, errorCallback) {
      QB.users.create(params, function(err, res) {
        if (err) {
          if (QMCONFIG.debug) console.log(err.detail);
        } else {
          if (QMCONFIG.debug) console.log('User', res);
        }
      });
    }

  };
})(Session);
