/*
 * Q-municate chat application
 *
 * User Module
 *
 */

var QBApiCalls = require('./qbApiCalls');
module.exports = User;

function User() {
  this.valid = true;
};

User.prototype.signup = function() {
  var form = $('section:visible form'),
      self = this,
      params;

  if (validate(form, this)) {
    params = {
      full_name: self.full_name,
      email: self.email,
      password: self.password
    };

    QBApiCalls.createSession({}, function() {
      QBApiCalls.createUser(params, function() {

      });
    });
  }
};

User.prototype.login = function() {
  var form = $('section:visible form'),
      self = this,
      params;

  if (validate(form, this)) {
    params = {
      email: self.email,
      password: self.password
    };

    QBApiCalls.createSession(params, function() {

    });
  }
};

// Private methods
function validate(form, user) {
  var maxSize = QMCONFIG.maxLimitFile * 1024 * 1024,
      remember = form.find('input:checkbox')[0],
      file = form.find('input:file')[0],
      fieldName, errName,
      value, errMsg;

  form.find('input:not(:file, :checkbox)').each(function() {
    fieldName = this.id.split('-')[1];
    errName = this.placeholder;
    value = this.value.trim();

    if (this.checkValidity()) {

      user[fieldName] = value;

    } else {

      if (this.validity.valueMissing) {
        errMsg = errName + ' is required';
      } else if (this.validity.typeMismatch) {
        errMsg = QMCONFIG.errors.invalidEmail;
      } else if (this.validity.patternMismatch && errName === 'Name') {
        errMsg = QMCONFIG.errors.invalidName;
      } else if (this.validity.patternMismatch && errName === 'Password') {
        errMsg = QMCONFIG.errors.invalidPass;
      }

      fail(user, errMsg);
      $(this).addClass('is-error').focus();

      return false;
    }
  });

  if (user.valid && file && file.files[0]) {
    file = file.files[0];

    if (file.type.indexOf('image/') === -1) {
      errMsg = QMCONFIG.errors.avatarType;
      fail(user, errMsg);
    } else if (file.name.length > 100) {
      errMsg = QMCONFIG.errors.fileName;
      fail(user, errMsg);
    } else if (file.size > maxSize) {
      errMsg = QMCONFIG.errors.fileSize;
      fail(user, errMsg);
    } else {
      user.tempBlob = file;
    }
  }

  if (user.valid && remember) {
    user.remember = remember.checked;
  }

  return user.valid;
}

function fail(user, errMsg) {
  user.valid = false;
  $('section:visible').find('.form-text_error').text(errMsg).removeClass('is-invisible');
}
