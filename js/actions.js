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
    if (CONFIG.debug) console.log('connect with FB');
    self.connectFB();
  });

  $('#signupQB').on('click', function() {
    if (CONFIG.debug) console.log('signup with QB');
    self.signupQB();
  });

  $('#loginQB').on('click', function(event) {
    if (CONFIG.debug) console.log('login wih QB');
    event.preventDefault();
    self.loginQB();
  });

  $('#signupForm').on('click', function(event) {
    if (CONFIG.debug) console.log('create user');
    event.preventDefault();
    self.signupForm($(this));
  });
};

UserActions.prototype.changeInputFile = function(objDom) {
  var URL = window.webkitURL || window.URL,
      file = objDom[0].files[0],
      src = file ? URL.createObjectURL(file) : CONFIG.defaultAvatar.url,
      fileName = file ? file.name : CONFIG.defaultAvatar.text;
  
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
  if (CONFIG.debug) console.log('Auth', Auth);
  Auth.signup(objDom);
};

// Private methods
function switchPage(page) {
  $('body, .l-wrapper').removeClass('is-welcome');
  page.removeClass('is-hidden').siblings('section').addClass('is-hidden');
}
