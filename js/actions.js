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

  return {

    init: function() {
      var self = this;

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

      /* temp actions */
      $('#searchContacts').on('submit', function(event) {
        if (QMCONFIG.debug) console.log('search contacts');
        event.preventDefault();
      });

      $('.list, .header-profile').on('click', '.contact, .list-actions-action', function(event) {
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
    },

    profilePopover: function(objDom) {
      var html = '<ul class="list-actions list-actions_profile popover">';
      html += '<li class="list-item"><a class="list-actions-action" href="#">Profile</a></li>';
      html += '<li class="list-item"><a class="list-actions-action" href="#">Logout</a></li>';
      html += '</ul>';
      objDom.after(html);
      appearAnimations();
    },

    contactsPopover: function(objDom) {
      var html = '<ul class="list-actions list-actions_contacts popover">';
      html += '<li class="list-item"><a class="list-actions-action" href="#">Video call</a></li>';
      html += '<li class="list-item"><a class="list-actions-action" href="#">Audio call</a></li>';
      html += '<li class="list-item"><a class="list-actions-action" href="#">Add people</a></li>';
      html += '<li class="list-item"><a class="list-actions-action" href="#">Profile</a></li>';
      html += '<li class="list-item"><a class="list-actions-action" href="#">Delete contact</a></li>';
      html += '</ul>';
      objDom.addClass('is-contextmenu').after(html);
      appearAnimations();
    }

  };
})();
