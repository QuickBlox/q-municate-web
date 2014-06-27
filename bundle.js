(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/*
 * Q-municate chat application
 *
 * User Actions
 *
 */
module.exports = function() {
  $('#signupFB, #loginFB').on('click', function() {
    console.log('signup FB');
  });

  $('#signupQB').on('click', function() {
    console.log('signup QB');
  });

  $('#loginQB').on('click', function(event) {
    event.preventDefault();
    console.log('login QB');
  });
};

},{}],2:[function(require,module,exports){
/*
 * Q-municate chat application
 *
 * Main Application Module
 *
 */
(function($, ChromaHash, QB, QBAPP) {
  var userActions = require('./actions');

  var APP = {
    init: function() {
      userActions();
    }
  };

  APP.init();
})(jQuery, ChromaHash, QB, QBAPP);

},{"./actions":1}]},{},[2])