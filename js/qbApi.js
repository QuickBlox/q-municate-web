/*
 * Q-municate chat application
 *
 * QuickBlox API Calls Module
 *
 */

module.exports = (function() {

  return {

    init: function() {
      QB.init(QMCONFIG.qbAccount.appId, QMCONFIG.qbAccount.authKey, QMCONFIG.qbAccount.authSecret);
    },

    createSession: function(params, callback) {
      QB.createSession(params, function(err, res) {
        if (err) {
          if (QMCONFIG.debug) console.log(err.detail);

          var errMsg = JSON.parse(err.detail).errors.base[0];
          errMsg += '. ' + QMCONFIG.errors.session;

          fail(objDom, errMsg);
        } else {
          if (QMCONFIG.debug) console.log('Session', res);

          Session.token = res.token;
          Session.expirationTime = Session.setExpirationTime(res.updated_at);
          console.log(Session);

          callback();
        }
      });
    },

    createUser: function() {
      
    }
    
  };
})();

/*module.exports = function() {
  var Session = {
    token: null,
    user: null,
    expirationTime: null,

    setExpirationTime: function(date) {
      var d = new Date(date);
      d.setHours(d.getHours() + 2);
      return d.toISOString();
    },

    recovery: function() {

    }
  };

  return Session;
};*/
