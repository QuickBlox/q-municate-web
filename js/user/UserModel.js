/*
 * Q-municate chat application
 *
 * User Model
 *
 */

var Contact = require('../contacts/ContactModel'),
    QBApiCalls = require('../qbApiCalls'),
    tempParams;

module.exports = User;

function User() {
  tempParams = {};
}

User.prototype.connectFB = function(token) {
  var UserView = require('./UserView'),
      self = this,
      params;

  UserView.loginQB();
  UserView.createSpinner();

  params = {
    provider: 'facebook',
    keys: {token: token}
  };

  QBApiCalls.createSession(params, function(qbSession, session) {
    QBApiCalls.getUser(qbSession.user_id, function(user) {
      self.contact = new Contact(user);
      rememberMe(self);

      self.session = session;

      // import FB friends
      FB.api('/me/friends', function (data) {
          console.log(data);
        }
      );

      UserView.successFormCallback(self);
      if (QMCONFIG.debug) console.log('User', self);
    });
  }, true);
};

User.prototype.signup = function() {
  var UserView = require('./UserView'),
      form = $('section:visible form'),
      self = this,
      params;

  if (validate(form, this)) {
    delete self._valid;
    UserView.createSpinner();

    params = {
      full_name: tempParams.full_name,
      email: tempParams.email,
      password: tempParams.password,
      tag_list: 'web'
    };

    QBApiCalls.createSession({}, function(qbSession, session) {
      QBApiCalls.createUser(params, function() {
        delete params.full_name;
        delete params.tag_list;

        QBApiCalls.loginUser(params, function(user) {
          self.contact = new Contact(user);
          self.session = session;

          if (tempParams._blob) {
            uploadAvatar(self);
          } else {
            UserView.successFormCallback(self);
          }

          if (QMCONFIG.debug) console.log('User', self);
        });
      });
    }, false);
  }
};

User.prototype.login = function() {
  var UserView = require('./UserView'),
      form = $('section:visible form'),
      self = this,
      params;

  if (validate(form, this)) {
    delete self._valid;
    UserView.createSpinner();

    params = {
      email: tempParams.email,
      password: tempParams.password
    };

    QBApiCalls.createSession(params, function(qbSession, session) {
      QBApiCalls.getUser(qbSession.user_id, function(user) {
        self.contact = new Contact(user);

        if (self._remember) {
          delete self._remember;
          rememberMe(self);
        }
        delete self._remember;

        self.session = session;

        UserView.successFormCallback(self);
        if (QMCONFIG.debug) console.log('User', self);
      });
    }, self._remember);
  }
};

User.prototype.forgot = function(callback) {
  var UserView = require('./UserView'),
      form = $('section:visible form'),
      self = this;

  if (validate(form, this)) {
    delete self._valid;
    UserView.createSpinner();

    QBApiCalls.createSession({}, function() {
      QBApiCalls.forgotPassword(tempParams.email, function() {
        UserView.successSendEmailCallback();
        callback();
      });
    }, false);
  }
};

User.prototype.resetPass = function() {
  var UserView = require('./UserView'),
      form = $('section:visible form'),
      self = this;

  if (validate(form, this)) {
    delete self._valid;
  }
};

User.prototype.autologin = function(session) {
  var UserView = require('./UserView'),
      storage = JSON.parse(localStorage.getItem('QM.user')),
      self = this;

  Object.keys(storage).forEach(function(prop) {
    if (prop === 'contact') {
      self[prop] = new Contact(storage[prop]);
    } else {
      self[prop] = storage[prop];  
    }
  });  

  self.session = session;

  UserView.successFormCallback(self);
  if (QMCONFIG.debug) console.log('User', self);
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

  user._valid = false;

  form.find('input:not(:file, :checkbox)').each(function() {
    fieldName = this.id.split('-')[1];
    errName = this.placeholder;
    value = this.value.trim();

    if (this.checkValidity()) {

      user._valid = true;
      tempParams[fieldName] = value;

    } else {

      if (this.validity.valueMissing) {
        errMsg = errName + ' is required';
      } else if (this.validity.typeMismatch) {
        errMsg = QMCONFIG.errors.invalidEmail;
      } else if (this.validity.patternMismatch && errName === 'Name') {
        errMsg = QMCONFIG.errors.invalidName;
      } else if (this.validity.patternMismatch && (errName === 'Password' || errName === 'New password')) {
        errMsg = QMCONFIG.errors.invalidPass;
      }

      fail(user, errMsg);
      $(this).addClass('is-error').focus();

      return false;
    }
  });

  if (user._valid && remember) {
    user._remember = remember.checked;
  }

  if (user._valid && file && file.files[0]) {
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
      tempParams._blob = file;
    }
  }

  return user._valid;
}

function fail(user, errMsg) {
  user._valid = false;
  $('section:visible').find('.text_error').addClass('is-error').text(errMsg);
}

function uploadAvatar(user) {
  var UserView = require('./UserView'),
      custom_data;

  QBApiCalls.createBlob({file: tempParams._blob, 'public': true}, function(blob) {
    user.contact.blob_id = blob.id;
    user.contact.avatar_url = blob.path;

    UserView.successFormCallback(user);
    
    custom_data = JSON.stringify({avatar_url: blob.path});
    QBApiCalls.updateUser(user.contact.id, {blob_id: blob.id, custom_data: custom_data}, function(res) {
      //if (QMCONFIG.debug) console.log('update of user', res);
    });
  });
}

function rememberMe(user) {
  var storage = {};

  Object.getOwnPropertyNames(user).forEach(function(prop) {
    storage[prop] = user[prop];
  });
  
  localStorage.setItem('QM.user', JSON.stringify(storage));
}
