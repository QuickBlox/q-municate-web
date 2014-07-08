/*
 * Q-municate chat application
 *
 * Routes
 *
 */

module.exports = (function() {

  return {
    init: function() {
      var UserActions = require('./actions');

      $(document).on('click', function(event) {
        clickBehaviour(event);
      });

      $('input:file').on('change', function() {
        changeInputFile($(this));
      });

      $('#signupFB, #loginFB').on('click', function(event) {
        if (QMCONFIG.debug) console.log('connect with FB');
        event.preventDefault();

        // NOTE!! You should use FB.login method instead FB.getLoginStatus
        // and your browser won't block FB Login popup
        FB.login(function(response) {
          if (QMCONFIG.debug) console.log('FB authResponse', response);
          if (response.status === 'connected') {
            UserActions.connectFB(response.authResponse.accessToken);
          }
        }, {scope: QMCONFIG.fbAccount.scope});
      });

      $('#signupQB').on('click', function() {
        if (QMCONFIG.debug) console.log('signup with QB');
        UserActions.signupQB();
      });

      $('#loginQB').on('click', function(event) {
        if (QMCONFIG.debug) console.log('login wih QB');
        event.preventDefault();
        UserActions.loginQB();
      });

      $('#forgot').on('click', function(event) {
        if (QMCONFIG.debug) console.log('forgot password');
        event.preventDefault();
        UserActions.forgot();
      });

      $('#signupForm').on('click', function(event) {
        if (QMCONFIG.debug) console.log('create user');
        event.preventDefault();
        UserActions.signupForm();
      });

      $('#loginForm').on('click', function(event) {
        if (QMCONFIG.debug) console.log('authorize user');
        event.preventDefault();
        UserActions.loginForm();
      });

      $('#forgotForm').on('click', function(event) {
        if (QMCONFIG.debug) console.log('send letter');
        event.preventDefault();
        UserActions.forgotForm();
      });

      $('#resetForm').on('click', function(event) {
        if (QMCONFIG.debug) console.log('reset password');
        event.preventDefault();
        UserActions.resetForm();
      });

      $('#profile').on('click', function(event) {
        event.preventDefault();
        removePopover();
        UserActions.profilePopover($(this));
      });

      $('.list').on('contextmenu', '.contact', function(event) {
        event.preventDefault();
        removePopover();
        UserActions.contactPopover($(this));
      });

      $('.header-profile').on('click', '#logout', function(event) {
        event.preventDefault();
        openPopup($('#popupLogout'));
      });

      $('.popup-control-button').on('click', function(event) {
        event.preventDefault();
        closePopup();
      });

      $('#logoutConfirm').on('click', function() {
        UserActions.logout();
      });

      /* temp routes */
      $('#searchContacts').on('submit', function(event) {
        if (QMCONFIG.debug) console.log('search contacts');
        event.preventDefault();
      });

      $('.list').on('click', '.contact', function(event) {
        event.preventDefault();
      });

    }
  };
})();

/* Private
---------------------------------------------------------------------- */
// Checking if the target is not an object run popover
function clickBehaviour(e) {
  var objDom = $(e.target);

  if (objDom.is('#profile, #profile *') || e.which === 3) {
    return false;
  } else {
    removePopover();
  }
}

function changeInputFile(objDom) {
  var URL = window.webkitURL || window.URL,
      file = objDom[0].files[0],
      src = file ? URL.createObjectURL(file) : QMCONFIG.defAvatar.url,
      fileName = file ? file.name : QMCONFIG.defAvatar.caption;
  
  objDom.prev().find('img').attr('src', src).siblings('span').text(fileName);
  if (typeof file !== 'undefined') URL.revokeObjectURL(src);
}

function removePopover() {
  $('.is-contextmenu').removeClass('is-contextmenu');
  $('.popover').remove();
}

var openPopup = function(objDom) {
  objDom.add('.popups').addClass('is-overlay');
};

var closePopup = function() {
  $('.is-overlay').removeClass('is-overlay');
};
