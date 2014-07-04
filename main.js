(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/*
 * Q-municate chat application
 *
 * User Actions Module
 *
 */

var User = require('./user');

module.exports = (function() {

  var switchPage = function(page) {
    $('body, .l-wrapper').removeClass('is-welcome');
    page.removeClass('is-hidden').siblings('section').addClass('is-hidden');
  };

  return {

    init: function() {
      var self = this;

      $('input:file').on('change', function() {
        self.changeInputFile($(this));
      });

      $('#signupFB, #loginFB').on('click', function() {
        if (QMCONFIG.debug) console.log('connect with FB');
        self.connectFB();
      });

      $('#signupQB').on('click', function() {
        if (QMCONFIG.debug) console.log('signup with QB');
        self.signupQB();
      });

      $('#loginQB').on('click', function(event) {
        if (QMCONFIG.debug) console.log('login wih QB');
        event.preventDefault();
        self.loginQB();
      });

      $('#signupForm').on('click', function(event) {
        if (QMCONFIG.debug) console.log('create user');
        event.preventDefault();
        self.signupForm();
      });

      $('#loginForm').on('click', function(event) {
        if (QMCONFIG.debug) console.log('authorize user');
        event.preventDefault();
        self.loginForm();
      });
    },

    changeInputFile: function(objDom) {
      var URL = window.webkitURL || window.URL,
          file = objDom[0].files[0],
          src = file ? URL.createObjectURL(file) : QMCONFIG.defAvatar.url,
          fileName = file ? file.name : QMCONFIG.defAvatar.caption;
      
      objDom.prev().find('img').attr('src', src).siblings('span').text(fileName);
      if (typeof file !== undefined) URL.revokeObjectURL(src);
    },

    connectFB: function() {

    },

    signupQB: function() {
      var obj = $('#signUpPage');
      switchPage(obj);
      obj.find('input:first').focus();
    },

    loginQB: function() {
      var obj = $('#loginPage');
      switchPage(obj);
      obj.find('input:first').focus();
    },

    signupForm: function() {
      var user = new User;
      if (QMCONFIG.debug) console.log('User', user);

      $('.form-text_error').addClass('is-invisible');
      $('.is-error').removeClass('is-error');
      user.signup();
    },

    loginForm: function() {
      var user = new User;
      if (QMCONFIG.debug) console.log('User', user);

      $('.form-text_error').addClass('is-invisible');
      $('.is-error').removeClass('is-error');
      user.login();
    }

  };
})();

},{"./user":5}],2:[function(require,module,exports){
/*
 * Q-municate chat application
 *
 * Main Module
 *
 */

var UserActions = require('./actions'),
    QBApiCalls = require('./qbApiCalls');

var APP = {
  init: function() {
    this.chromaHash();
    this.setDefAvatar();
    this.setHtml5Patterns();
    UserActions.init();
    QBApiCalls.init();

    if (QMCONFIG.debug) console.log('App init', this);
  },

  chromaHash: function() {
    new ChromaHash({
      visualization: 'bars'
    });
  },

  setDefAvatar: function() {
    $('#defAvatar').find('img').attr('src', QMCONFIG.defAvatar.url).siblings('span').text(QMCONFIG.defAvatar.caption);
  },

  setHtml5Patterns: function() {
    var FULL_NAME = "[^><;]{3,50}";
    var ALLNUM_ALLPUNCT = "[A-Za-z0-9`~!@#%&=_<>;:,'" + '\\"' + "\\.\\$\\^\\*\\-\\+\\\\\/\\|\\(\\)\\[\\]\\{\\}\\?]{8,40}";

    $('.pattern-name').attr('pattern', FULL_NAME);
    $('.pattern-pass').attr('pattern', ALLNUM_ALLPUNCT);
  }
};

$(document).ready(function() {
  APP.init();
});

},{"./actions":1,"./qbApiCalls":3}],3:[function(require,module,exports){
/*
 * Q-municate chat application
 *
 * QuickBlox JS SDK Wrapper
 *
 */

var Session = require('./session');

module.exports = (function() {
  var session;

  var fail = function(errMsg) {
    $('section:visible').find('.form-text_error').text(errMsg).removeClass('is-invisible');
  };

  return {

    init: function(token) {
      if (typeof token === 'undefined') {
        QB.init(QMCONFIG.qbAccount.appId, QMCONFIG.qbAccount.authKey, QMCONFIG.qbAccount.authSecret);
      } else {
        QB.init(token);
        session = new Session;
        session.getStorage();
      }
    },

    checkSession: function(callback) {
      if (new Date > session.storage.expirationTime) {
        this.init();
        this.createSession(session.storage.authParams, callback);
      } else {
        callback();
      }
    },

    createSession: function(params, callback) {
      QB.createSession(params, function(err, res) {
        if (err) {
          if (QMCONFIG.debug) console.log(err.detail);

          var errMsg,
              parseErr = JSON.parse(err.detail);

          if (err.code === 401) {
            errMsg = parseErr.errors[0];
            $('section:visible input:not(:checkbox)').addClass('is-error');
          } else {
            errMsg = parseErr.errors.base[0];
            errMsg += '. ' + QMCONFIG.errors.session;
          }

          fail(errMsg);
        } else {
          if (QMCONFIG.debug) console.log('QB SDK: Session is created', res);

          session = new Session(res.token, params);
          session.setExpirationTime();

          callback(res);
        }
      });
    },

    loginUser: function(params, callback) {
      this.checkSession(function(res) {
        QB.login(params, function(err, res) {
          if (err) {
            if (QMCONFIG.debug) console.log(err.detail);

          } else {
            if (QMCONFIG.debug) console.log('QB SDK: User has logged', res);

            session.setAuthParams(params);
            session.setExpirationTime();

            callback(res);
          }
        });
      });
    },

    forgotPassword: function(email, callback) {
      this.checkSession(function(res) {
        QB.users.resetPassword(email, function(err, res) {
          if (err) {
            if (QMCONFIG.debug) console.log(err.detail);

          } else {
            if (QMCONFIG.debug) console.log('QB SDK: Instructions have been sent', res);

            session.setExpirationTime();
            callback(res);
          }
        });
      });
    },

    getUser: function(params, callback) {
      this.checkSession(function(res) {
        QB.users.get(params, function(err, res) {
          if (err) {
            if (QMCONFIG.debug) console.log(err.detail);

          } else {
            if (QMCONFIG.debug) console.log('QB SDK: User is found', res);

            session.setExpirationTime();
            callback(res);
          }
        });
      });
    },

    createUser: function(params, callback) {
      this.checkSession(function(res) {
        QB.users.create(params, function(err, res) {
          if (err) {
            if (QMCONFIG.debug) console.log(err.detail);

            var errMsg = 'This email ';
            errMsg += JSON.parse(err.detail).errors.email[0];
            $('section:visible input[type="email"]').addClass('is-error').focus();
            
            fail(errMsg);
          } else {
            if (QMCONFIG.debug) console.log('QB SDK: User is created', res);

            session.setExpirationTime();
            callback(res);
          }
        });
      });
    },

    updateUser: function(id, params, callback) {
      this.checkSession(function(res) {
        QB.users.update(id, params, function(err, res) {
          if (err) {
            if (QMCONFIG.debug) console.log(err.detail);

          } else {
            if (QMCONFIG.debug) console.log('QB SDK: User is updated', res);

            session.setExpirationTime();
            callback(res);
          }
        });
      });
    },

    createBlob: function(params, callback) {
      this.checkSession(function(res) {
        QB.content.createAndUpload(params, function(err, res) {
          if (err) {
            if (QMCONFIG.debug) console.log(err.detail);

          } else {
            if (QMCONFIG.debug) console.log('QB SDK: Blob is uploaded', res);

            session.setExpirationTime();
            callback(res);
          }
        });
      });
    }

  };
})();

},{"./session":4}],4:[function(require,module,exports){
/*
 * Q-municate chat application
 *
 * Session Module
 *
 */

module.exports = Session;

function Session(token, params) {
  this.storage = {
    token: token,
    expirationTime: null,
    authParams: params
  };
}

Session.prototype.setExpirationTime = function() {
  var limitHours = 2,
      d = new Date;

  d.setHours(d.getHours() + limitHours);
  this.storage.expirationTime = d.toISOString();

  localStorage.setItem('QM.session', JSON.stringify(this.storage));
};

Session.prototype.setAuthParams = function(params) {
  this.storage.authParams = params;
  localStorage.setItem('QM.session', JSON.stringify(this.storage));
};

Session.prototype.getStorage = function() {
  this.storage = JSON.parse(localStorage.getItem('QM.session'));
};

Session.prototype.destroy = function() {
  this.storage = {};
  localStorage.removeItem('QM.session');
};

},{}],5:[function(require,module,exports){
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
      password: self.password
    };

    QBApiCalls.createSession({}, function() {
      QBApiCalls.createUser(params, function() {
        delete params.full_name;
        
        QBApiCalls.loginUser(params, function(user) {
          self.id = user.id;
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
        self.id = user.id;
        self.full_name = user.full_name;
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

},{"./qbApiCalls":3}]},{},[2])