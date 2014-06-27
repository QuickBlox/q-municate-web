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
