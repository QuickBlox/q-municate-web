/*
 * Q-municate chat application
 *
 * Authorization Module
 *
 */

var sessionModule = require('./session');

module.exports = function() {
  var Session = new sessionModule();

  var Auth = {
    signupParams: {
      fullName: $('#signupName').val().trim(),
      email: $('#signupEmail').val().trim(),
      password: $('#signupPass').val().trim(),
      avatar: $('#signupAvatar')[0].files[0] || null
    },

    signup: function(objDom) {
      QB.createSession(function(err, res) {
        if (err) {
          if (CONFIG.debug) console.log(err.detail);

          var errMsg = JSON.parse(err.detail).errors.base[0];
          errMsg += '. ' + CONFIG.errors.session;

          fail(objDom, errMsg);
        } else {
          if (CONFIG.debug) console.log('Session', res);

          Session.token = res.token;
          Session.expirationTime = Session.setExpirationTime(res.updated_at);
          console.log(Session);
        }
      });
    }
  };

  return Auth;
};

function fail(objDom, errMsg) {
  objDom.parents('form').find('.form-text_error').removeClass('is-invisible').text(errMsg);
}
