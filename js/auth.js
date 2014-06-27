/*
 * Q-municate chat application
 *
 * Authorization Module
 *
 */

module.exports = function() {
  var Auth = {
    signupParams: {
      fullName: $('#signupName').val().trim(),
      email: $('#signupEmail').val().trim(),
      password: $('#signupPass').val().trim(),
      avatar: $('#signupAvatar')[0].files[0] || null
    },

    signup: function(objDom) {
      
    }
  };

  return Auth;
};
