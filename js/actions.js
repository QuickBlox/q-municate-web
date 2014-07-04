/*
 * Q-municate chat application
 *
 * User Actions Module
 *
 */

var User = require('./user');

module.exports = (function() {

  var switchPage = function(page) {
    $('body, .l-wrapper').removeClass('is-welcome');
    page.removeClass('is-hidden').siblings('section').addClass('is-hidden');
  };

  var clearErrors = function() {
    $('.form-text_error').addClass('is-invisible');
    $('.is-error').removeClass('is-error');
  };

  var inputFocus = function() {
    $('section:visible input:first').focus();
  };

  return {

    init: function() {
      var self = this;

      $('input:file').on('change', function() {
        self.changeInputFile($(this));
      });

      $('#signupFB, #loginFB').on('click', function(event) {
        if (QMCONFIG.debug) console.log('connect with FB');
        event.preventDefault();
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
        self.signupForm();
      });

      $('#loginForm').on('click', function(event) {
        if (QMCONFIG.debug) console.log('authorize user');
        event.preventDefault();
        self.loginForm();
      });
    },

    createSpinner: function() {
      var spinnerBlock = '<div class="l-spinner"><div class="spinner">';
      spinnerBlock += '<div class="spinner-dot1"></div><div class="spinner-dot2"></div>';
      spinnerBlock += '</div></div>';

      $('section:visible form').addClass('is-hidden').after(spinnerBlock);
    },

    removeSpinner: function() {
      $('section:visible form').removeClass('is-hidden').next('.l-spinner').remove();
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
      inputFocus();
    },

    loginQB: function() {
      switchPage($('#loginPage'));
      inputFocus();
    },

    signupForm: function() {
      var user = new User;
      clearErrors();
      user.signup();
    },

    loginForm: function() {
      var user = new User;
      clearErrors();
      user.login();
    }

  };
})();
