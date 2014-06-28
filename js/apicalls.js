/*
 * Q-municate chat application
 *
 * QuickBlox API Calls Module
 *
 */

module.exports = QBApiCalls;

function QBApiCalls() {}

QBApiCalls.prototype.init = function() {
  QB.init(CONFIG.qbAccount.appId, CONFIG.qbAccount.authKey, CONFIG.qbAccount.authSecret);
};

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
