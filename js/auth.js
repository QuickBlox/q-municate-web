/*
 * Q-municate chat application
 *
 * Authorization Module
 *
 */

module.exports = Auth;
var QBApiCalls = require('./qbApi');

function Auth() {
  this.signupParams = {
    fullName: $('#signupName').val().trim(),
    email: $('#signupEmail').val().trim(),
    password: $('#signupPass').val().trim(),
    avatar: $('#signupAvatar')[0].files[0] || null
  };
};

Auth.prototype.signup = function(objDom) {

};

// Private methods
function fail(objDom, errMsg) {
  objDom.parents('form').find('.form-text_error').removeClass('is-invisible').text(errMsg);
}
