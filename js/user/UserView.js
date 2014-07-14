/*
 * Q-municate chat application
 *
 * User View
 *
 */

var User = require('./UserModel');

module.exports = (function() {
  var user;

  var clearErrors = function() {
    $('.is-error').removeClass('is-error');
  };

  var switchPage = function(page) {
    $('body').removeClass('is-welcome');
    page.removeClass('is-hidden').siblings('section').addClass('is-hidden');

    // reset form
    clearErrors();
    page.find('input').val('');
    if (!page.is('#mainPage')) {
      page.find('form').removeClass('is-hidden').next('.l-form').remove(); // reset Forgot form after success sending of letter
      page.find('input:file').prev().find('img').attr('src', QMCONFIG.defAvatar.url).siblings('span').text(QMCONFIG.defAvatar.caption);
      page.find('input:checkbox').prop('checked', true);
      page.find('input:first').focus();
    }
  };

  var switchOnWelcomePage = function() {
    $('body').addClass('is-welcome');
    $('#welcomePage').removeClass('is-hidden').siblings('section').addClass('is-hidden');
  };

  var appearAnimation = function() {
    $('.popover').show(150);
  };

  return {

    createSpinner: function() {
      var spinnerBlock = '<div class="l-spinner"><div class="spinner">';
      spinnerBlock += '<div class="spinner-dot1"></div><div class="spinner-dot2"></div>';
      spinnerBlock += '</div></div>';

      $('section:visible form').addClass('is-hidden').after(spinnerBlock);
    },

    removeSpinner: function() {
      $('section:visible form').removeClass('is-hidden').next('.l-spinner').remove();
    },

    successFormCallback: function(user) {
      this.removeSpinner();
      $('#profile').find('img').attr('src', user.contact.avatar_url);
      switchPage($('#mainPage'));
    },

    successSendEmailCallback: function() {
      var alert = '<div class="note l-form l-flexbox l-flexbox_column">';
      alert += '<span class="text text_alert">Success!</span>';
      alert += '<span class="text">Please check your email and click on the link in letter in order to reset your password</span>';
      alert += '</div>';

      this.removeSpinner();
      $('section:visible form').addClass('is-hidden').after(alert);
    },

    connectFB: function(token) {
      user = new User;
      user.connectFB(token);
    },

    getFBStatus: function() {
      FB.getLoginStatus(function(response) {
        if (QMCONFIG.debug) console.log('FB status response', response);
      }, true);
    },

    signupQB: function() {
      switchPage($('#signUpPage'));
    },

    loginQB: function() {
      switchPage($('#loginPage'));
    },

    forgot: function() {
      switchPage($('#forgotPage'));
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

    resetForm: function() {
      user = new User;
      clearErrors();
      user.resetPass();
    },

    autologin: function(session) {
      user = new User;
      user.autologin(session);
    },

    profilePopover: function(objDom) {
      var html = '<ul class="list-actions list-actions_profile popover">';
      // html += '<li class="list-item"><a class="list-actions-action" href="#">Profile</a></li>';
      html += '<li class="list-item"><a id="logout" class="list-actions-action" href="#">Log Out</a></li>';
      html += '</ul>';

      objDom.after(html);
      appearAnimation();
    },

    contactPopover: function(objDom) {
      var html = '<ul class="list-actions list-actions_contacts popover">';
      // html += '<li class="list-item"><a class="list-actions-action" href="#">Video call</a></li>';
      // html += '<li class="list-item"><a class="list-actions-action" href="#">Audio call</a></li>';
      html += '<li class="list-item"><a class="list-actions-action" href="#">Add people</a></li>';
      // html += '<li class="list-item"><a class="list-actions-action" href="#">Profile</a></li>';
      html += '<li class="list-item"><a class="list-actions-action" href="#">Delete contact</a></li>';
      html += '</ul>';

      objDom.after(html).parent().addClass('is-contextmenu');
      appearAnimation();
    },

    logout: function() {
      user.logout(function() {
        user = null;
        switchOnWelcomePage();
        if (QMCONFIG.debug) console.log('current User and Session were destroyed');
      });
    },

    localSearch: function(form) {
      var val = form.find('input[type="search"]').val().trim();
      
      if (val.length > 0) {
        // if (QMCONFIG.debug) console.log('local search =', val);
        $('#searchList').removeClass('is-hidden').siblings('section').addClass('is-hidden');
      } else {
        $('#emptyList').removeClass('is-hidden').siblings('section').addClass('is-hidden');
      }
    }

  };
})();
