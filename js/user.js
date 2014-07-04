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
  var form = $('section:visible form'),
      self = this,
      params;

  if (validate(form, this)) {
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
          if (QMCONFIG.debug) console.log('User', self);

          self.id = user.id;
          self.tag = user.user_tags;
          self.blob_id = null;
          self.avatar = null;

          if (self.tempBlob) self.uploadAvatar();
        });
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

    QBApiCalls.createSession(params, function(session) {
      QBApiCalls.getUser(session.user_id, function(user) {
        if (QMCONFIG.debug) console.log('User', self);
        
        self.id = user.id;
        self.full_name = user.full_name;
        self.tag = user.user_tags;
        self.blob_id = user.blob_id;
        self.avatar = user.custom_data;

        if (self.remember) self.rememberMe();
      });
    });
  }
};

User.prototype.uploadAvatar = function() {
  var self = this;

  QBApiCalls.createBlob({file: this.tempBlob, 'public': true}, function(blob) {
    QBApiCalls.updateUser(self.id, {blob_id: blob.id, custom_data: blob.path}, function(user) {
      self.blob_id = user.blob_id;
      self.avatar = user.custom_data;
      delete self.tempBlob;
    });
  });
};

User.prototype.rememberMe = function() {

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
