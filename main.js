(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/*
 * Q-municate chat application
 *
 * User Actions
 *
 */

var authModule = require('./auth');

module.exports = function() {
  var Auth;

  function switchPage(page) {
    $('body, .l-wrapper').removeClass('is-welcome');
    page.removeClass('is-hidden').siblings('section').addClass('is-hidden');
  }

  $('#signupFB, #loginFB').on('click', function() {
    console.log('signup FB');
  });

  $('#signupQB').on('click', function() {
    console.log('signup QB');
    switchPage($('#signUpPage'));
  });

  $('#loginQB').on('click', function(event) {
    console.log('login QB');
    event.preventDefault();
    switchPage($('#loginPage'));
  });

  $('#signupForm').on('click', function(event) {
    console.log('User Sign Up');
    event.preventDefault();
    Auth = new authModule();
    console.log(Auth);
    //Auth.signup();
  });

  $('input:file').on('change', function() {
    var URL = window.webkitURL || window.URL,
        file = $(this)[0].files[0],
        src = file ? URL.createObjectURL(file) : 'images/ava-single.png',
        fileName = file ? file.name : 'Choose user picture';
    
    $(this).prev().find('img').attr('src', src).siblings('span').text(fileName);
    if (typeof file !== undefined) URL.revokeObjectURL(src);
  });
};

},{"./auth":2}],2:[function(require,module,exports){
/*
 * Q-municate chat application
 *
 * Authorization Module
 *
 */
module.exports = function() {
  var Auth = {
    fullName: $('#signupName').val().trim(),
    email: $('#signupEmail').val().trim(),
    password: $('#signupPass').val().trim(),
    avatar: $('#signupAvatar')[0].files[0] || null,

    signup: function() {

    }
  };

  return Auth;
};

},{}],3:[function(require,module,exports){
/*
 * Q-municate chat application
 *
 * Main Application Module
 *
 */
(function(window, $, ChromaHash, QB, QBAPP) {
  var userActions = require('./actions');

  var APP = {
    init: function() {
      userActions();
      this.chromaHash();
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