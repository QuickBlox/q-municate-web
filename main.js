(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/*
 * Q-municate chat application
 *
 * User Actions Module
 *
 */

var User = require('./user');

module.exports = (function() {
  var user;

  var clearErrors = function() {
    $('.is-error').removeClass('is-error');
  };

  var switchPage = function(page) {
    $('body').removeClass('is-welcome');
    page.removeClass('is-hidden').siblings('section').addClass('is-hidden');

    // reset form
    clearErrors();
    page.find('input').val('');
    if (!page.is('#mainPage')) {
      page.find('form').removeClass('is-hidden').next('.l-form').remove(); // reset Forgot form after success sending of letter
      page.find('input:file').prev().find('img').attr('src', QMCONFIG.defAvatar.url).siblings('span').text(QMCONFIG.defAvatar.caption);
      page.find('input:checkbox').prop('checked', true);
      page.find('input:first').focus();
    }
  };

  var switchOnWelcomePage = function() {
    $('body').addClass('is-welcome');
    $('#welcomePage').removeClass('is-hidden').siblings('section').addClass('is-hidden');
  };

  var appearAnimation = function() {
    $('.popover').show(150);
  };

  return {

    createSpinner: function() {
      var spinnerBlock = '<div class="l-spinner"><div class="spinner">';
      spinnerBlock += '<div class="spinner-dot1"></div><div class="spinner-dot2"></div>';
      spinnerBlock += '</div></div>';

      $('section:visible form').addClass('is-hidden').after(spinnerBlock);
    },

    removeSpinner: function() {
      $('section:visible form').removeClass('is-hidden').next('.l-spinner').remove();
    },

    successFormCallback: function(user) {
      this.removeSpinner();
      $('#profile').find('img').attr('src', user.avatar).siblings('span').text(user.full_name);
      switchPage($('#mainPage'));
    },

    successSendEmailCallback: function() {
      var alert = '<div class="l-form l-flexbox"><div class="no-contacts l-flexbox">';
      alert += '<span class="no-contacts-oops">Success!</span>';
      alert += '<span class="no-contacts-description">Please check your email and click on the link in letter in order to reset your password</span>';
      alert += '</div></div>';

      this.removeSpinner();
      $('section:visible form').addClass('is-hidden').after(alert);
    },

    connectFB: function() {

    },

    signupQB: function() {
      switchPage($('#signUpPage'));
    },

    loginQB: function() {
      switchPage($('#loginPage'));
    },

    forgot: function() {
      switchPage($('#forgotPage'));
    },

    signupForm: function() {
      user = new User;
      clearErrors();
      user.signup();
    },

    loginForm: function() {
      user = new User;
      clearErrors();
      user.login();
    },

    forgotForm: function() {
      user = new User;
      clearErrors();
      user.forgot(function() {
        user = null;
      });
    },

    resetForm: function() {
      user = new User;
      clearErrors();
      user.resetPass();
    },

    autologin: function() {
      user = new User;
      user.autologin();
    },

    profilePopover: function(objDom) {
      var html = '<ul class="list-actions list-actions_profile popover">';
      // html += '<li class="list-item"><a class="list-actions-action" href="#">Profile</a></li>';
      html += '<li class="list-item"><a id="logout" class="list-actions-action" href="#">Logout</a></li>';
      html += '</ul>';

      objDom.after(html);
      appearAnimation();
    },

    contactPopover: function(objDom) {
      var html = '<ul class="list-actions list-actions_contacts popover">';
      // html += '<li class="list-item"><a class="list-actions-action" href="#">Video call</a></li>';
      // html += '<li class="list-item"><a class="list-actions-action" href="#">Audio call</a></li>';
      html += '<li class="list-item"><a class="list-actions-action" href="#">Add people</a></li>';
      // html += '<li class="list-item"><a class="list-actions-action" href="#">Profile</a></li>';
      html += '<li class="list-item"><a class="list-actions-action" href="#">Delete contact</a></li>';
      html += '</ul>';

      objDom.after(html).parent().addClass('is-contextmenu');
      appearAnimation();
    },

    logout: function() {
      user.logout(function() {
        user = null;
        switchOnWelcomePage();
        if (QMCONFIG.debug) console.log('current User and Session were destroyed');
      });
    }

  };
})();

},{"./user":6}],2:[function(require,module,exports){
/*
 * Q-municate chat application
 *
 * Main Module
 *
 */

var Routes = require('./routes'),
    QBApiCalls = require('./qbApiCalls');

var APP = {
  init: function() {
    var token;

    this.scrollbar();
    this.chromaHash();
    this.setHtml5Patterns();
    Routes.init();

    if (QMCONFIG.debug) console.log('App init', this);

    // Checking if autologin was chosen
    if (localStorage.getItem('QM.session')) {
      token = JSON.parse(localStorage.getItem('QM.session')).token;
      QBApiCalls.init(token);
    } else {
      QBApiCalls.init();
    }
  },

  scrollbar: function() {
    $('.scrollbar').mCustomScrollbar({
      theme: 'minimal-dark',
      scrollInertia: 150
    });
  },

  chromaHash: function() {
    new ChromaHash({
      visualization: 'bars'
    });
  },

  setHtml5Patterns: function() {
    $('.pattern-name').attr('pattern', QMCONFIG.patterns.name);
    $('.pattern-pass').attr('pattern', QMCONFIG.patterns.password);
  }
};

$(document).ready(function() {
  APP.init();
});

},{"./qbApiCalls":3,"./routes":4}],3:[function(require,module,exports){
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
    var UserActions = require('./actions');
    UserActions.removeSpinner();
    $('section:visible').find('.form-text_error').addClass('is-error').text(errMsg);
  };

  var failUser = function(detail) {
    var errMsg = 'This email ';
    errMsg += JSON.parse(detail).errors.email[0];
    $('section:visible input[type="email"]').addClass('is-error');
    fail(errMsg);
  };

  var failForgot = function() {
    var errMsg = QMCONFIG.errors.notFoundEmail;
    $('section:visible input[type="email"]').addClass('is-error');
    fail(errMsg);
  };

  return {

    init: function(token) {
      var UserActions = require('./actions');

      if (typeof token === 'undefined') {
        QB.init(QMCONFIG.qbAccount.appId, QMCONFIG.qbAccount.authKey, QMCONFIG.qbAccount.authSecret);
      } else {
        QB.init(token);
        UserActions.createSpinner();

        session = new Session;
        session.getStorage();
        UserActions.autologin();
      }
    },

    checkSession: function(callback) {
      if (new Date > session.storage.expirationTime) {
        this.init(); // reset QuickBlox JS SDK after autologin via an existing token
        this.createSession(session.storage.authParams, callback, session.storage.remember);
      } else {
        callback();
      }
    },

    createSession: function(params, callback, isRemember) {
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

          session = new Session(res.token, params, isRemember);
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

    logoutUser: function(callback) {
      if (QMCONFIG.debug) console.log('QB SDK: User has exited');
      session.destroy();
      session = null;
      this.init(); // reset QuickBlox JS SDK after autologin via an existing token
      callback();
    },

    forgotPassword: function(email, callback) {
      this.checkSession(function(res) {
        QB.users.resetPassword(email, function(response) {
          if (response.code === 404) {
            if (QMCONFIG.debug) console.log(response.message);

            failForgot();
          } else {
            if (QMCONFIG.debug) console.log('QB SDK: Instructions have been sent');

            session.destroy();
            session = null;
            callback();
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

            failUser(err.detail);
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

            failUser(err.detail);
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

},{"./actions":1,"./session":5}],4:[function(require,module,exports){
/*
 * Q-municate chat application
 *
 * Routes
 *
 */

module.exports = (function() {

  return {
    init: function() {
      var UserActions = require('./actions');

      $(document).on('click', function(event) {
        clickBehaviour(event);
      });

      $('input:file').on('change', function() {
        changeInputFile($(this));
      });

      $('#signupFB, #loginFB').on('click', function(event) {
        if (QMCONFIG.debug) console.log('connect with FB');
        event.preventDefault();
        UserActions.connectFB();
      });

      $('#signupQB').on('click', function() {
        if (QMCONFIG.debug) console.log('signup with QB');
        UserActions.signupQB();
      });

      $('#loginQB').on('click', function(event) {
        if (QMCONFIG.debug) console.log('login wih QB');
        event.preventDefault();
        UserActions.loginQB();
      });

      $('#forgot').on('click', function(event) {
        if (QMCONFIG.debug) console.log('forgot password');
        event.preventDefault();
        UserActions.forgot();
      });

      $('#signupForm').on('click', function(event) {
        if (QMCONFIG.debug) console.log('create user');
        event.preventDefault();
        UserActions.signupForm();
      });

      $('#loginForm').on('click', function(event) {
        if (QMCONFIG.debug) console.log('authorize user');
        event.preventDefault();
        UserActions.loginForm();
      });

      $('#forgotForm').on('click', function(event) {
        if (QMCONFIG.debug) console.log('send letter');
        event.preventDefault();
        UserActions.forgotForm();
      });

      $('#resetForm').on('click', function(event) {
        if (QMCONFIG.debug) console.log('reset password');
        event.preventDefault();
        UserActions.resetForm();
      });

      $('#profile').on('click', function(event) {
        event.preventDefault();
        removePopover();
        UserActions.profilePopover($(this));
      });

      $('.list').on('contextmenu', '.contact', function(event) {
        event.preventDefault();
        removePopover();
        UserActions.contactPopover($(this));
      });

      $('.header-profile').on('click', '#logout', function(event) {
        event.preventDefault();
        openPopup($('#popupLogout'));
      });

      $('.popup-control-button').on('click', function(event) {
        event.preventDefault();
        closePopup();
      });

      $('#logoutConfirm').on('click', function() {
        UserActions.logout();
      });

      /* temp routes */
      $('#searchContacts').on('submit', function(event) {
        if (QMCONFIG.debug) console.log('search contacts');
        event.preventDefault();
      });

      $('.list').on('click', '.contact', function(event) {
        event.preventDefault();
      });

    }
  };
})();

/* Private
---------------------------------------------------------------------- */
// Checking if the target is not an object run popover
function clickBehaviour(e) {
  var objDom = $(e.target);

  if (objDom.is('#profile, #profile *') || e.which === 3) {
    return false;
  } else {
    removePopover();
  }
}

function changeInputFile(objDom) {
  var URL = window.webkitURL || window.URL,
      file = objDom[0].files[0],
      src = file ? URL.createObjectURL(file) : QMCONFIG.defAvatar.url,
      fileName = file ? file.name : QMCONFIG.defAvatar.caption;
  
  objDom.prev().find('img').attr('src', src).siblings('span').text(fileName);
  if (typeof file !== 'undefined') URL.revokeObjectURL(src);
}

function removePopover() {
  $('.is-contextmenu').removeClass('is-contextmenu');
  $('.popover').remove();
}

var openPopup = function(objDom) {
  objDom.add('.popups').addClass('is-overlay');
};

var closePopup = function() {
  $('.is-overlay').removeClass('is-overlay');
};

},{"./actions":1}],5:[function(require,module,exports){
/*
 * Q-municate chat application
 *
 * Session Module
 *
 */

module.exports = Session;

function Session(token, params, isRemember) {
  this.storage = {
    token: token || null,
    expirationTime: null,
    remember: isRemember || null,
    authParams: params || null
  };
}

Session.prototype.setExpirationTime = function() {
  var limitHours = 2,
      d = new Date;

  d.setHours(d.getHours() + limitHours);
  this.storage.expirationTime = d.toISOString();

  if (this.storage.remember)
    localStorage.setItem('QM.session', JSON.stringify(this.storage));
};

Session.prototype.setAuthParams = function(params) {
  this.storage.authParams = params;
  if (this.storage.remember)
    localStorage.setItem('QM.session', JSON.stringify(this.storage));
};

Session.prototype.getStorage = function() {
  this.storage = JSON.parse(localStorage.getItem('QM.session'));
};

Session.prototype.destroy = function() {
  this.storage = {};
  localStorage.removeItem('QM.session');
  localStorage.removeItem('QM.user');
};

},{}],6:[function(require,module,exports){
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
          self.avatar = QMCONFIG.defAvatar.url;

          if (self.tempBlob) {
            uploadAvatar(self);
          } else {
            UserActions.successFormCallback(self);
          }
        });
      });
    }, false);
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

        if (self.remember) {
          delete self.remember;
          rememberMe(self);
        }
        delete self.remember;

        UserActions.successFormCallback(self);
      });
    }, self.remember);
  }
};

User.prototype.forgot = function(callback) {
  var UserActions = require('./actions'),
      form = $('section:visible form'),
      self = this;

  if (validate(form, this)) {
    if (QMCONFIG.debug) console.log('User', self);
    UserActions.createSpinner();

    QBApiCalls.createSession({}, function() {
      QBApiCalls.forgotPassword(self.email, function() {
        UserActions.successSendEmailCallback();
        callback();
      });
    }, false);
  }
};

User.prototype.resetPass = function() {
  var UserActions = require('./actions'),
      form = $('section:visible form'),
      self = this;

  if (validate(form, this)) {
    if (QMCONFIG.debug) console.log('User', self);
    
  }
};

User.prototype.autologin = function() {
  var UserActions = require('./actions'),
      storage = JSON.parse(localStorage.getItem('QM.user')),
      self = this;

  Object.keys(storage).forEach(function(prop) {
    self[prop] = storage[prop];
  });
  
  UserActions.successFormCallback(self);
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
      } else if (this.validity.patternMismatch && (errName === 'Password' || errName === 'New password')) {
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
  $('section:visible').find('.form-text_error').addClass('is-error').text(errMsg);
}

function uploadAvatar(user) {
  var UserActions = require('./actions');

  QBApiCalls.createBlob({file: user.tempBlob, 'public': true}, function(blob) {
    QBApiCalls.updateUser(user.id, {blob_id: blob.id, custom_data: blob.path}, function(res) {
      user.blob_id = res.blob_id;
      user.avatar = res.custom_data;
      delete user.tempBlob;

      UserActions.successFormCallback(user);
    });
  });
}

function rememberMe(user) {
  var storage = {};

  delete user.valid;
  Object.getOwnPropertyNames(user).forEach(function(prop) {
    storage[prop] = user[prop];
  });
  
  localStorage.setItem('QM.user', JSON.stringify(storage));
}

},{"./actions":1,"./qbApiCalls":3}]},{},[2])