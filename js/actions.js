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
