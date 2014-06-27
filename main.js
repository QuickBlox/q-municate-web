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
    console.log('connect with FB');
    self.connectFB();
  });

  $('#signupQB').on('click', function() {
    console.log('signup with QB');
    self.signupQB();
  });

  $('#loginQB').on('click', function(event) {
    console.log('login wih QB');
    event.preventDefault();
    self.loginQB();
  });

  $('#signupForm').on('click', function(event) {
    console.log('create user');
    event.preventDefault();
    self.signupForm($(this));
  });
};

UserActions.prototype.changeInputFile = function(objDom) {
  var URL = window.webkitURL || window.URL,
      file = objDom[0].files[0],
      src = file ? URL.createObjectURL(file) : 'images/ava-single.png',
      fileName = file ? file.name : 'Choose user picture';
  
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
  console.log('Auth object', Auth);
  //Auth.signup();
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

module.exports = function() {
  var Auth = {
    signupParams: {
      fullName: $('#signupName').val().trim(),
      email: $('#signupEmail').val().trim(),
      password: $('#signupPass').val().trim(),
      avatar: $('#signupAvatar')[0].files[0] || null
    },

    signup: function(objDom) {
      
    }
  };

  return Auth;
};

},{}],3:[function(require,module,exports){
/*
 * Q-municate chat application
 *
 * Main Module
 *
 */

(function(window, $, ChromaHash, QB, QBAPP) {
  var actionsModule = require('./actions'),
      UserActions = new actionsModule();

  var APP = {
    init: function() {
      this.chromaHash();
      UserActions.init();
    },

    chromaHash: function() {
      new ChromaHash({
        visualization: 'bars'
      });
    }
  };

  APP.init();
})(window, jQuery, ChromaHash, QB, QBAPP);

},{"./actions":1}]},{},[3])