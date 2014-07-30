/*
 * Q-municate chat application
 *
 * User Module
 *
 */

module.exports = User;

var tempParams;

function User(app) {
  this.app = app;
  this._is_import = false;
  this._remember = false;
  this._valid = false;
}

User.prototype = {

  connectFB: function(token) {
    var QBApiCalls = this.app.service,
        UserView = this.app.views.User,
        DialogView = this.app.views.Dialog,
        Contact = this.app.models.Contact,
        self = this,
        params;

    UserView.loginQB();
    UserView.createSpinner();

    params = {
      provider: 'facebook',
      keys: {token: token}
    };

    QBApiCalls.createSession(params, function(session) {
      QBApiCalls.getUser(session.user_id, function(user) {
        self.contact = Contact.create(user);
        self._is_import = getImport(user);

        if (QMCONFIG.debug) console.log('User', self);

        QBApiCalls.connectChat(self.contact.user_jid, function(roster) {
          self.rememberMe();
          UserView.successFormCallback();
          DialogView.prepareDownloading(roster);

          if (!self._is_import) {
            // import FB friends
            FB.api('/me/friends', function (res) {
                if (QMCONFIG.debug) console.log('FB friends', res);
                var ids = [];

                for (var i = 0, len = res.data.length; i < len; i++) {
                  ids.push(res.data[i].id);
                }

                DialogView.downloadDialogs(roster, ids);
              }
            );

            self._is_import = true;
            self.updateQBUser(user);
          } else {
            DialogView.downloadDialogs(roster);
          }
          
        });

      });
    }, true);
  },

  updateQBUser: function(user) {
    var QBApiCalls = this.app.service,
        custom_data;

    try {
      custom_data = JSON.parse(user.custom_data) || {};
    } catch(err) {
      custom_data = {};
    }

    custom_data.is_import = true;
    custom_data = JSON.stringify(custom_data);
    QBApiCalls.updateUser(user.id, {custom_data: custom_data}, function(res) {
      //if (QMCONFIG.debug) console.log('update of user', res);
    });
  },

  signup: function() {
    var QBApiCalls = this.app.service,
        UserView = this.app.views.User,
        DialogView = this.app.views.Dialog,
        Contact = this.app.models.Contact,
        form = $('section:visible form'),
        self = this,
        params;

    if (validate(form, this)) {
      UserView.createSpinner();

      params = {
        full_name: tempParams.full_name,
        email: tempParams.email,
        password: tempParams.password,
        tag_list: 'web'
      };

      QBApiCalls.createSession({}, function() {
        QBApiCalls.createUser(params, function() {
          delete params.full_name;
          delete params.tag_list;

          QBApiCalls.loginUser(params, function(user) {
            self.contact = Contact.create(user);

            if (QMCONFIG.debug) console.log('User', self);

            QBApiCalls.connectChat(self.contact.user_jid, function(roster) {
              if (tempParams.blob) {
                self.uploadAvatar(roster);
              } else {
                UserView.successFormCallback();
                DialogView.prepareDownloading(roster);
                DialogView.downloadDialogs(roster);
              }
            });
          });

        });
      }, false);
    }
  },

  uploadAvatar: function(roster) {
    var QBApiCalls = this.app.service,
        UserView = this.app.views.User,
        DialogView = this.app.views.Dialog,
        custom_data,
        self = this;

    QBApiCalls.createBlob({file: tempParams.blob, 'public': true}, function(blob) {
      self.contact.blob_id = blob.id;
      self.contact.avatar_url = blob.path;

      UserView.successFormCallback();
      DialogView.prepareDownloading(roster);
      DialogView.downloadDialogs(roster);
      
      custom_data = JSON.stringify({avatar_url: blob.path});
      QBApiCalls.updateUser(self.contact.id, {blob_id: blob.id, custom_data: custom_data}, function(res) {
        //if (QMCONFIG.debug) console.log('update of user', res);
      });
    });
  },

  login: function() {
    var QBApiCalls = this.app.service,
        UserView = this.app.views.User,
        DialogView = this.app.views.Dialog,
        Contact = this.app.models.Contact,
        form = $('section:visible form'),
        self = this,
        params;

    if (validate(form, this)) {
      UserView.createSpinner();

      params = {
        email: tempParams.email,
        password: tempParams.password
      };

      QBApiCalls.createSession(params, function(session) {
        QBApiCalls.getUser(session.user_id, function(user) {
          self.contact = Contact.create(user);

          if (QMCONFIG.debug) console.log('User', self);

          QBApiCalls.connectChat(self.contact.user_jid, function(roster) {
            if (self._remember) {
              self.rememberMe();
            }

            UserView.successFormCallback();
            DialogView.prepareDownloading(roster);
            DialogView.downloadDialogs(roster);
          });

        });
      }, self._remember);
    }
  },

  rememberMe: function() {
    var storage = {},
        self = this;

    Object.keys(self.contact).forEach(function(prop) {
      if (prop !== 'app')
        storage[prop] = self.contact[prop];
    });
    
    localStorage.setItem('QM.user', JSON.stringify(storage));
  },

  forgot: function() {
    var QBApiCalls = this.app.service,
        UserView = this.app.views.User,
        form = $('section:visible form'),
        self = this;

    if (validate(form, this)) {
      UserView.createSpinner();

      QBApiCalls.createSession({}, function() {
        QBApiCalls.forgotPassword(tempParams.email, function() {
          UserView.successSendEmailCallback();
          self._valid = false;
        });
      }, false);
    }
  },

  resetPass: function() {
    var QBApiCalls = this.app.service,
        UserView = this.app.views.User,
        form = $('section:visible form'),
        self = this;

    if (validate(form, this)) {
      // UserView.createSpinner();
    }
  },

  autologin: function() {
    var QBApiCalls = this.app.service,
        UserView = this.app.views.User,
        DialogView = this.app.views.Dialog,
        Contact = this.app.models.Contact,
        storage = JSON.parse(localStorage['QM.user']),
        self = this;

    UserView.createSpinner();
    this.contact = Contact.create(storage);

    if (QMCONFIG.debug) console.log('User', self);

    QBApiCalls.connectChat(self.contact.user_jid, function(roster) {
      UserView.successFormCallback();
      DialogView.prepareDownloading(roster);
      DialogView.downloadDialogs(roster);
    });
  },

  logout: function(callback) {
    var QBApiCalls = this.app.service,
        DialogView = this.app.views.Dialog,
        self = this;

    QB.chat.disconnect();
    DialogView.hideDialogs();
    QBApiCalls.logoutUser(function() {
      localStorage.removeItem('QM.user');
      self.contact = null;
      self._remember = false;
      self._valid = false;
      callback();
    });
  }

};

/* Private
---------------------------------------------------------------------- */
function validate(form, user) {
  var maxSize = QMCONFIG.maxLimitFile * 1024 * 1024,
      remember = form.find('input:checkbox')[0],
      file = form.find('input:file')[0],
      fieldName, errName,
      value, errMsg;

  tempParams = {};
  form.find('input:not(:file, :checkbox)').each(function() {
    // fix requeired pattern
    this.value = this.value.trim();

    fieldName = this.id.split('-')[1];
    errName = this.placeholder;
    value = this.value;

    if (this.checkValidity()) {

      user._valid = true;
      tempParams[fieldName] = value;

    } else {

      if (this.validity.valueMissing) {
        errMsg = errName + ' is required';
      } else if (this.validity.typeMismatch) {
        errMsg = QMCONFIG.errors.invalidEmail;
      } else if (this.validity.patternMismatch && errName === 'Name') {
        if (value.length < 3)
          errMsg = QMCONFIG.errors.shortName;
        else if (value.length > 50)
          errMsg = QMCONFIG.errors.bigName;
        else
          errMsg = QMCONFIG.errors.invalidName;
      } else if (this.validity.patternMismatch && (errName === 'Password' || errName === 'New password')) {
        if (value.length < 8)
          errMsg = QMCONFIG.errors.shortPass;
        else if (value.length > 40)
          errMsg = QMCONFIG.errors.bigPass;
        else
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
      tempParams.blob = file;
    }
  }

  return user._valid;
}

function fail(user, errMsg) {
  user._valid = false;
  $('section:visible').find('.text_error').addClass('is-error').text(errMsg);
}

function getImport(user) {
  var isImport;
  
  try {
    isImport = JSON.parse(user.custom_data).is_import || false;
  } catch(err) {
    isImport = false;
  }

  return isImport;
}
