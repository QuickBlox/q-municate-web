(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/*
 * Q-municate chat application
 *
 * User Actions Module
 *
 */

var Auth = require('./auth');

module.exports = (function() {

  var setAvatar = function(objDom, url, caption) {
    objDom.find('img').attr('src', url).siblings('span').text(caption);
  };

  var switchPage = function(page) {
    $('body, .l-wrapper').removeClass('is-welcome');
    page.removeClass('is-hidden').siblings('section').addClass('is-hidden');
  };

  return {

    init: function() {
      var self = this;

      setAvatar($('#defAvatar'), QMCONFIG.defAvatar.url, QMCONFIG.defAvatar.caption);

      $('input:file').on('change', function() {
        self.changeInputFile($(this));
      });

      $('#signupFB, #loginFB').on('click', function() {
        if (QMCONFIG.debug) console.log('connect with FB');
        self.connectFB();
      });

      $('#signupQB').on('click', function() {
        if (QMCONFIG.debug) console.log('signup with QB');
        self.signupQB();
      });

      $('#loginQB').on('click', function(event) {
        if (QMCONFIG.debug) console.log('login wih QB');
        event.preventDefault();
        self.loginQB();
      });

      $('#signupForm').on('click', function(event) {
        if (QMCONFIG.debug) console.log('create user');
        event.preventDefault();
        self.signupForm($(this));
      });
    },

    changeInputFile: function(objDom) {
      var URL = window.webkitURL || window.URL,
          file = objDom[0].files[0],
          src = file ? URL.createObjectURL(file) : QMCONFIG.defAvatar.url,
          fileName = file ? file.name : QMCONFIG.defAvatar.caption;
      
      this.setAvatar(objDom.prev(), src, fileName);
      if (typeof file !== undefined) URL.revokeObjectURL(src);
    },

    connectFB: function() {

    },

    signupQB: function() {
      switchPage($('#signUpPage'));
    },

    loginQB: function() {
      switchPage($('#loginPage'));
    },

    signupForm: function(objDom) {
      var auth = new Auth();
      if (QMCONFIG.debug) console.log('Auth', auth);
      auth.signup(objDom);
    }

  };
})();

},{"./auth":2}],2:[function(require,module,exports){
/*
 * Q-municate chat application
 *
 * Authorization Module
 *
 */

module.exports = Auth;
var QBApiCalls = require('./qbApi');

function Auth() {
  this.signupParams = {
    fullName: $('#signupName').val().trim(),
    email: $('#signupEmail').val().trim(),
    password: $('#signupPass').val().trim(),
    avatar: $('#signupAvatar')[0].files[0] || null
  };
};

Auth.prototype.signup = function(objDom) {

};

// Private methods
function fail(objDom, errMsg) {
  objDom.parents('form').find('.form-text_error').removeClass('is-invisible').text(errMsg);
}

},{"./qbApi":4}],3:[function(require,module,exports){
/*
 * Q-municate chat application
 *
 * Main Module
 *
 */

var UserActions = require('./actions'),
    QBApiCalls = require('./qbApi');

var APP = {
  init: function() {
    this.chromaHash();
    UserActions.init();
    QBApiCalls.init();

    if (QMCONFIG.debug) console.log('App init', this);
  },

  chromaHash: function() {
    new ChromaHash({
      visualization: 'bars'
    });
  }
};

$(document).ready(function() {
  APP.init();
});

},{"./actions":1,"./qbApi":4}],4:[function(require,module,exports){
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

},{}]},{},[3])