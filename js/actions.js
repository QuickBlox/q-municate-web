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
