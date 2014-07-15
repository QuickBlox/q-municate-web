/*
 * Q-municate chat application
 *
 * Friendlist View
 *
 */

var Friendlist = require('./FriendlistModel'),
    QBApiCalls = require('../qbApiCalls');

module.exports = (function() {
  var friendlist;

  return {

    globalSearch: function(form) {
      var val = form.find('input[type="search"]').val().trim();

      if (val.length > 0) {
        QBApiCalls.getUser({full_name: val}, function(data) {
          // if (QMCONFIG.debug) console.log('local search =', val);
        });
      }
    }

  };
})();
