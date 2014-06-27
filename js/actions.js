/*
 * Q-municate chat application
 *
 * User Actions
 *
 */
module.exports = function() {
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
};
