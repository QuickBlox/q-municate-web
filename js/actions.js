/*
 * Q-municate chat application
 *
 * User Actions Module
 *
 */

var User = require('./user');

module.exports = (function() {
  var user;

  var setDefAvatar = function() {
    $('#defAvatar').find('img').attr('src', QMCONFIG.defAvatar.url).siblings('span').text(QMCONFIG.defAvatar.caption);
  };

  var switchPage = function(page) {
    $('body').removeClass('is-welcome');
    page.removeClass('is-hidden').siblings('section').addClass('is-hidden');
  };

  var backToWelcomePage = function() {
    $('body').addClass('is-welcome');
    $('#welcomePage').removeClass('is-hidden').siblings('section').addClass('is-hidden');
  };

  var clearErrors = function() {
    $('.form-text_error').addClass('is-invisible');
    $('.is-error').removeClass('is-error');
  };

  var resetForgotForm = function() {
    $('section:visible form').removeClass('is-hidden').next('.l-form').remove();
  };

  var inputFocus = function() {
    var obj = $('section:visible');
    setDefAvatar();
    obj.find('input').val('');
    obj.find('input:checkbox').prop('checked', true);
    obj.find('input:first').focus();
  };

  var appearAnimations = function() {
    $('.popover').hide().show(150);
  };

  var removePopover = function() {
    $('.is-contextmenu').removeClass('is-contextmenu');
    $('.popover').remove();
  };

  var clickBehaviour = function(e) {
    var obj = $(e.target);

    if (obj.is('#profile, #profile *') || e.which === 3)
      return false;

    removePopover();
  };

  var openPopup = function(objDom) {
    objDom.add('.popups').addClass('is-overlay');
  };

  var closePopup = function() {
    $('.is-overlay').removeClass('is-overlay');
  };

  return {

    init: function() {
      var self = this;

      setDefAvatar();

      $(document).click(function(event) {
        clickBehaviour(event);
      });

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

      $('#forgot').on('click', function(event) {
        if (QMCONFIG.debug) console.log('forgot password');
        event.preventDefault();
        self.forgot();
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

      $('#forgotForm').on('click', function(event) {
        if (QMCONFIG.debug) console.log('send letter');
        event.preventDefault();
        self.forgotForm();
      });

      $('#profile').on('click', function(event) {
        event.preventDefault();
        removePopover();
        self.profilePopover($(this));
      });

      $('.list').on('contextmenu', '.contact', function(event) {
        event.preventDefault();
        removePopover();
        self.contactsPopover($(this));
      });

      $('.header-profile').on('click', '#logout', function(event) {
        event.preventDefault();
        openPopup($('#popupLogout'));
      });

      $('.popup-control-button').on('click', function(event) {
        event.preventDefault();
        closePopup();
      });

      $('#logoutConfirm').on('click', function(event) {
        self.logout();
      });

      /* temp actions */
      $('#searchContacts').on('submit', function(event) {
        if (QMCONFIG.debug) console.log('search contacts');
        event.preventDefault();
      });

      $('.list').on('click', '.contact', function(event) {
        event.preventDefault();
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

    processingForm: function(user) {
      clearErrors();
      this.removeSpinner();
      $('#profile').find('img').attr('src', user.avatar).siblings('span').text(user.full_name);
      switchPage($('#mainPage'));
    },

    successSendEmailCallback: function() {
      var success = '<div class="l-form l-flexbox"><div class="no-contacts l-flexbox">';
      success += '<span class="no-contacts-oops">Success!</span>';
      success += '<span class="no-contacts-description">Please check your email and click on the link in letter in order to reset your password</span>';
      success += '</div></div>';

      clearErrors();
      this.removeSpinner();
      $('section:visible form').addClass('is-hidden').after(success);
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

    forgot: function() {
      switchPage($('#forgotPage'));
      resetForgotForm();
      inputFocus();
    },

    signupForm: function() {
      user = new User;
      clearErrors();
      user.signup();
    },

    loginForm: function() {
      user = new User;
      clearErrors();
      user.login();
    },

    forgotForm: function() {
      user = new User;
      clearErrors();
      user.forgot(function() {
        user = null;
      });
    },

    profilePopover: function(objDom) {
      var html = '<ul class="list-actions list-actions_profile popover">';
      // html += '<li class="list-item"><a class="list-actions-action" href="#">Profile</a></li>';
      html += '<li class="list-item"><a id="logout" class="list-actions-action" href="#">Logout</a></li>';
      html += '</ul>';
      objDom.after(html);
      appearAnimations();
    },

    contactsPopover: function(objDom) {
      var html = '<ul class="list-actions list-actions_contacts popover">';
      // html += '<li class="list-item"><a class="list-actions-action" href="#">Video call</a></li>';
      // html += '<li class="list-item"><a class="list-actions-action" href="#">Audio call</a></li>';
      html += '<li class="list-item"><a class="list-actions-action" href="#">Add people</a></li>';
      // html += '<li class="list-item"><a class="list-actions-action" href="#">Profile</a></li>';
      html += '<li class="list-item"><a class="list-actions-action" href="#">Delete contact</a></li>';
      html += '</ul>';
      objDom.addClass('is-contextmenu').after(html);
      appearAnimations();
    },

    logout: function() {
      user.logout(function() {
        user = null;
        backToWelcomePage();
        if (QMCONFIG.debug) console.log('current User and Session were destroyed');
      });
    }

  };
})();
