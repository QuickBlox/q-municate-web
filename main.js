(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/*
 * Q-municate chat application
 *
 * User Actions
 *
 */

module.exports = UserActions;
var authModule = require('./auth');

function UserActions() {}

UserActions.prototype.init = function() {
  var self = this;

  $('input:file').on('change', function() {
    self.changeInputFile($(this));
  });

  $('#signupFB, #loginFB').on('click', function() {
    if (CONFIG.debug) console.log('connect with FB');
    self.connectFB();
  });

  $('#signupQB').on('click', function() {
    if (CONFIG.debug) console.log('signup with QB');
    self.signupQB();
  });

  $('#loginQB').on('click', function(event) {
    if (CONFIG.debug) console.log('login wih QB');
    event.preventDefault();
    self.loginQB();
  });

  $('#signupForm').on('click', function(event) {
    if (CONFIG.debug) console.log('create user');
    event.preventDefault();
    self.signupForm($(this));
  });
};

UserActions.prototype.changeInputFile = function(objDom) {
  var URL = window.webkitURL || window.URL,
      file = objDom[0].files[0],
      src = file ? URL.createObjectURL(file) : CONFIG.defaultAvatar.url,
      fileName = file ? file.name : CONFIG.defaultAvatar.text;
  
  objDom.prev().find('img').attr('src', src).siblings('span').text(fileName);
  if (typeof file !== undefined) URL.revokeObjectURL(src);
};

UserActions.prototype.connectFB = function() {

};

UserActions.prototype.signupQB = function() {
  switchPage($('#signUpPage'));
};

UserActions.prototype.loginQB = function() {
  switchPage($('#loginPage'));
};

UserActions.prototype.signupForm = function(objDom) {
  var Auth = new authModule();
  if (CONFIG.debug) console.log('Auth', Auth);
  Auth.signup(objDom);
};

// Private methods
function switchPage(page) {
  $('body, .l-wrapper').removeClass('is-welcome');
  page.removeClass('is-hidden').siblings('section').addClass('is-hidden');
}

},{"./auth":2}],2:[function(require,module,exports){
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

},{"./session":4}],3:[function(require,module,exports){
/*
 * Q-municate chat application
 *
 * Main Module
 *
 */

(function(window, $, ChromaHash, QB, CONFIG) {
  var actionsModule = require('./actions'),
      UserActions = new actionsModule();

  var APP = {
    init: function() {
      this.chromaHash();
      UserActions.init();
      QB.init(CONFIG.qbAccount.appId, CONFIG.qbAccount.authKey, CONFIG.qbAccount.authSecret);

      if (CONFIG.debug) console.log('App init', this);
    },

    chromaHash: function() {
      new ChromaHash({
        visualization: 'bars'
      });
    }
  };

  APP.init();
})(window, jQuery, ChromaHash, QB, CONFIG);

},{"./actions":1}],4:[function(require,module,exports){
/*
 * Q-municate chat application
 *
 * Session module
 *
 */

module.exports = function() {
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
};

},{}]},{},[3])