(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/*
 * Q-municate chat application
 *
 * User Actions Module
 *
 */

var Auth = require('./auth');

module.exports = (function(Auth) {

  var switchPage = function(page) {
    $('body, .l-wrapper').removeClass('is-welcome');
    page.removeClass('is-hidden').siblings('section').addClass('is-hidden');
  };

  return {

    init: function() {
      var self = this;

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
      
      objDom.prev().find('img').attr('src', src).siblings('span').text(fileName);
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
      var auth = new Auth;
      if (QMCONFIG.debug) console.log('Auth', auth);
      auth.signup(objDom);
    }

  };
})(Auth);

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
  var self = this;

  validate(objDom);

  /*QBApiCalls.createSession({},
    function() {
      QBApiCalls.createUser({
        full_name: self.signupParams.fullName,
        email: self.signupParams.email,
        password: self.signupParams.password
      });
    },
    function(errMsg) {
      fail(objDom, errMsg);
    }
  );*/
};

// Private methods
function validate(objDom) {
  var form = objDom.parents('form');

  form.find('input').each(function() {
    this.value = this.value.trim();

    if (!this.checkValidity()) {
      console.log(this.checkValidity());
      if (this.validity.valueMissing) {
        fail(objDom, 'Name is required');
      } else if (this.validity.typeMismatch) {
        fail(objDom, '');
      } else if (this.validity.patternMismatch) {
        if (this.value.length < 3 || this.value.length > 50)
          fail(objDom, 'Minimum length is 3 symbols, maximum is 50');
        else
          fail(objDom, 'Bad format');
      }

      $(this).addClass('is-error');

      return false;
    }
  });

// // console.log(form.elements.length);
//   for (i = 0, len = form.elements.length; i < len; i++) {
//     elem = form.elements[i];
//     console.log(elem);
//     //if (elem.localName !== 'input') continue;

    
//   }
  /*form.find('input').each(function(i) {
    this.value = this.value.trim();
    if (i === 2) {
      console.log(this);
      console.log(this.value);
      console.log(this.checkValidity());
      console.log(this.validity);
      console.log(this.validationMessage);
    }
  });*/
  /*form.noValidate = true;
  form.onsubmit = function(){
    for (var f = 0; f < form.elements.length; f++) {
      var field = form.elements[f];
      console.log(field.validity);
    }
    return false;
  };*/
}

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
    this.setDefAvatar();
    this.setHtml5Patterns();
    UserActions.init();
    QBApiCalls.init();

    if (QMCONFIG.debug) console.log('App init', this);
  },

  chromaHash: function() {
    new ChromaHash({
      visualization: 'bars'
    });
  },

  setDefAvatar: function() {
    $('#defAvatar').find('img').attr('src', QMCONFIG.defAvatar.url).siblings('span').text(QMCONFIG.defAvatar.caption);
  },

  setHtml5Patterns: function() {
    var FULL_NAME = "[^><;]{3,50}";
    var ALLNUM_ALLPUNCT = "[A-Za-z0-9`~!@#%&=_<>;:,'" + '\\"' + "\\.\\$\\^\\*\\-\\+\\\\\/\\|\\(\\)\\[\\]\\{\\}\\?]{8,40}";

    $('.regexp-name').attr({pattern: FULL_NAME, title: 'Minimum length is 3 symbols, maximum is 50'});
    $('.regexp-email').attr('title', 'Should look like an email address');
    $('.regexp-pass').attr({pattern: ALLNUM_ALLPUNCT, title: 'Should contain alphanumeric and punctuation characters only. Minimum length is 8 symbols, maximum is 40'});
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

},{"./qbSession":5}],5:[function(require,module,exports){
/*
 * Q-municate chat application
 *
 * QuickBlox Session Module
 *
 */

module.exports = Session;

function Session() {
  this.token = null;
  this.expirationTime = null;
  this.isUserLevel = null;
}

Session.prototype.setSession = function(res) {
  this.token = res.token;
  this.expirationTime = this.setExpirationTime(res.updated_at);
  this.isUserLevel = !!res.user_id;
};

Session.prototype.setExpirationTime = function(date) {
  var d = new Date(date);
  d.setHours(d.getHours() + 2);
  return d.toISOString();
};

},{}]},{},[3])