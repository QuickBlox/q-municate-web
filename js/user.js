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
}

User.prototype.signup = function() {
  var UserActions = require('./actions'),
      form = $('section:visible form'),
      self = this,
      params;

  if (validate(form, this)) {
    if (QMCONFIG.debug) console.log('User', self);
    UserActions.createSpinner();

    params = {
      full_name: self.full_name,
      email: self.email,
      password: self.password,
      tag_list: 'web'
    };

    QBApiCalls.createSession({}, function() {
      QBApiCalls.createUser(params, function() {
        delete params.full_name;
        delete params.tag_list;

        QBApiCalls.loginUser(params, function(user) {
          self.id = user.id;
          self.tag = user.user_tags;
          self.blob_id = null;
          self.avatar = null || QMCONFIG.defAvatar.url;

          if (self.tempBlob) {
            uploadAvatar(self);
          } else {
            UserActions.processingForm(self);
          }
        });
      });
    });
  }
};

User.prototype.login = function() {
  var UserActions = require('./actions'),
      form = $('section:visible form'),
      self = this,
      params;

  if (validate(form, this)) {
    if (QMCONFIG.debug) console.log('User', self);
    UserActions.createSpinner();

    params = {
      email: self.email,
      password: self.password
    };

    QBApiCalls.createSession(params, function(session) {
      QBApiCalls.getUser(session.user_id, function(user) {
        self.id = user.id;
        self.full_name = user.full_name;
        self.tag = user.user_tags;
        self.blob_id = user.blob_id;
        self.avatar = user.custom_data || QMCONFIG.defAvatar.url;

        if (self.remember) rememberMe();
        UserActions.processingForm(self);
      });
    });
  }
};

User.prototype.logout = function(callback) {
  QBApiCalls.logoutUser(function() {
    callback();
  });
};

/* Private
---------------------------------------------------------------------- */
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

function uploadAvatar(user) {
  var UserActions = require('./actions');

  QBApiCalls.createBlob({file: user.tempBlob, 'public': true}, function(blob) {
    QBApiCalls.updateUser(user.id, {blob_id: blob.id, custom_data: blob.path}, function(res) {
      user.blob_id = res.blob_id;
      user.avatar = res.custom_data;
      delete user.tempBlob;

      UserActions.processingForm(user);
    });
  });
}

function rememberMe() {

}
