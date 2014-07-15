(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/*
 * Q-municate chat application
 *
 * Contact Model
 *
 */

module.exports = Contact;

function Contact(qbUser) {
  this.id = qbUser.id;
  this.facebook_id = qbUser.facebook_id;
  this.full_name = qbUser.full_name;
  this.email = qbUser.email;
  this.blob_id = qbUser.blob_id;
  
  if (qbUser.blob_id) {
    try {
      this.avatar_url = JSON.parse(qbUser.custom_data).avatar_url;
    } catch(err) {
      // qbUser.website - temporary storage of avatar url for mobile apps (14.07.2014)
      this.avatar_url = qbUser.website || qbUser.avatar_url;
    }
  } else {
    facebookAvatar(this);
  }

  try {
    this.status = JSON.parse(qbUser.custom_data).status || null;
  } catch(err) {
    // qbUser.custom_data - temporary storage of status message for mobile apps (14.07.2014)
    this.status = qbUser.custom_data || qbUser.status;
  }

  this.tag = qbUser.user_tags || qbUser.tag;
}

/* Private
---------------------------------------------------------------------- */
function facebookAvatar(contact) {
  if (contact.facebook_id) {
    // Note! Getting an user's picture faster than in second case below
    contact.avatar_url = 'https://graph.facebook.com/' + contact.facebook_id + '/picture?width=146&height=146';

    // FB.api('/' + contact.facebook_id + '/picture', {redirect: false, width: 146, height: 146},
    //         function (avatar) {
    //           //if (QMCONFIG.debug) console.log('FB user picture', avatar);

    //           // checking if the avatar is a default Facebook avatar
    //           contact.avatar_url = avatar.data.is_silhouette ? QMCONFIG.defAvatar.url : avatar.data.url;
    //         }
    // );
  } else {
    contact.avatar_url = QMCONFIG.defAvatar.url;
  }
}

},{}],2:[function(require,module,exports){
/*
 * Q-municate chat application
 *
 * Friendlist Model
 *
 */

module.exports = Friendlist;

function Friendlist() {
  this.contacts = [];
}

Friendlist.prototype.localSearch = function() {

};

Friendlist.prototype.globalSearch = function() {

};

},{}],3:[function(require,module,exports){
/*
 * Q-municate chat application
 *
 * Friendlist View
 *
 */

var Friendlist = require('./FriendlistModel'),
    QBApiCalls = require('../qbApiCalls');

module.exports = (function() {
  var friendlist;

  return {

    globalSearch: function(form) {
      var val = form.find('input[type="search"]').val().trim();

      if (val.length > 0) {
        QBApiCalls.getUser({full_name: val}, function(data) {
          // if (QMCONFIG.debug) console.log('local search =', val);
        });
      }
    }

  };
})();

},{"../qbApiCalls":5,"./FriendlistModel":2}],4:[function(require,module,exports){
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
    if (localStorage.getItem('QM.session') && localStorage.getItem('QM.user') &&
        // new format of storage data (14.07.2014)
        JSON.parse(localStorage.getItem('QM.user')).contact) {

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

// Application initialization
$(document).ready(function() {
  APP.init();
});

// FB SDK initialization
window.fbAsyncInit = function() {
  FB.init({
    appId: QMCONFIG.fbAccount.appId,
    version: 'v2.0'
  });

  if (QMCONFIG.debug) console.log('FB init', FB);
};

},{"./qbApiCalls":5,"./routes":6}],5:[function(require,module,exports){
/*
 * Q-municate chat application
 *
 * QuickBlox JS SDK Wrapper
 *
 */

var Session = require('./session/SessionModel');

module.exports = (function() {
  var session;

  var fail = function(errMsg) {
    var UserView = require('./user/UserView');
    UserView.removeSpinner();
    $('section:visible').find('.text_error').addClass('is-error').text(errMsg);
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
      var UserView = require('./user/UserView');

      if (typeof token === 'undefined') {
        QB.init(QMCONFIG.qbAccount.appId, QMCONFIG.qbAccount.authKey, QMCONFIG.qbAccount.authSecret);
      } else {
        QB.init(token);
        UserView.createSpinner();

        session = new Session;
        session.getStorage();
        UserView.autologin(session);
      }
    },

    checkSession: function(callback) {
      if ((new Date).toISOString() > session.storage.expirationTime) {
        session.decrypt(session.storage.authParams);
        
        this.init(); // reset QuickBlox JS SDK after autologin via an existing token
        this.createSession(session.storage.authParams, callback, session._remember);

        session.encrypt(session.storage.authParams);
      } else {
        callback();
      }
    },

    createSession: function(params, callback, isRemember) {
      var UserView = require('./user/UserView');

      QB.createSession(params, function(err, res) {
        if (err) {
          if (QMCONFIG.debug) console.log(err.detail);

          var errMsg,
              parseErr = JSON.parse(err.detail);

          if (err.code === 401) {
            errMsg = parseErr.errors[0];
            $('section:visible input:not(:checkbox)').addClass('is-error');
          } else {
            errMsg = parseErr.errors.email ? parseErr.errors.email[0] :
                     parseErr.errors.base ? parseErr.errors.base[0] : parseErr.errors[0];

            // This checking is needed when your user has exited from Facebook
            // and you try to relogin on a project via FB without reload the page.
            // All you need it is to get the new FB user status and show specific error message
            if (errMsg.indexOf('Authentication') >= 0) {
              errMsg = QMCONFIG.errors.crashFBToken;
              UserView.getFBStatus();
            
            // This checking is needed when you trying to connect via FB
            // and your primary email has already been taken on the project 
            } else if (errMsg.indexOf('already') >= 0) {
              errMsg = 'Email ' + errMsg;
              UserView.getFBStatus();
            } else {
              errMsg += '. ' + QMCONFIG.errors.session;
            }
          }

          fail(errMsg);
        } else {
          if (QMCONFIG.debug) console.log('QB SDK: Session is created', res);

          if (session)
            session.update(res.token);
          else
            session = new Session(res.token, params, isRemember);

          session.setExpirationTime();

          callback(res, session);
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

    listUsers: function(params, callback) {
      this.checkSession(function(res) {
        QB.users.listUsers(params, function(err, res) {
          if (err) {
            if (QMCONFIG.debug) console.log(err.detail);

          } else {
            if (QMCONFIG.debug) console.log('QB SDK: Users is found', res);

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
            if (QMCONFIG.debug) console.log('QB SDK: Users is found', res);

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

},{"./session/SessionModel":7,"./user/UserView":9}],6:[function(require,module,exports){
/*
 * Q-municate chat application
 *
 * Routes
 *
 */

module.exports = (function() {

  return {
    init: function() {
      var UserView = require('./user/UserView'),
          FriendlistView = require('./friendlist/FriendlistView');

      $(document).on('click', function(event) {
        clickBehaviour(event);
      });

      $('input:file').on('change', function() {
        changeInputFile($(this));
      });

      $('#signupFB, #loginFB').on('click', function(event) {
        if (QMCONFIG.debug) console.log('connect with FB');
        event.preventDefault();

        // NOTE!! You should use FB.login method instead FB.getLoginStatus
        // and your browser won't block FB Login popup
        FB.login(function(response) {
          if (QMCONFIG.debug) console.log('FB authResponse', response);
          if (response.status === 'connected') {
            UserView.connectFB(response.authResponse.accessToken);
          }
        }, {scope: QMCONFIG.fbAccount.scope});
      });

      $('#signupQB').on('click', function() {
        if (QMCONFIG.debug) console.log('signup with QB');
        UserView.signupQB();
      });

      $('#loginQB').on('click', function(event) {
        if (QMCONFIG.debug) console.log('login wih QB');
        event.preventDefault();
        UserView.loginQB();
      });

      $('#forgot').on('click', function(event) {
        if (QMCONFIG.debug) console.log('forgot password');
        event.preventDefault();
        UserView.forgot();
      });

      $('#signupForm').on('click', function(event) {
        if (QMCONFIG.debug) console.log('create user');
        event.preventDefault();
        UserView.signupForm();
      });

      $('#loginForm').on('click', function(event) {
        if (QMCONFIG.debug) console.log('authorize user');
        event.preventDefault();
        UserView.loginForm();
      });

      $('#forgotForm').on('click', function(event) {
        if (QMCONFIG.debug) console.log('send letter');
        event.preventDefault();
        UserView.forgotForm();
      });

      $('#resetForm').on('click', function(event) {
        if (QMCONFIG.debug) console.log('reset password');
        event.preventDefault();
        UserView.resetForm();
      });

      $('#profile').on('click', function(event) {
        event.preventDefault();
        removePopover();
        UserView.profilePopover($(this));
      });

      $('.list:not(.list_contacts)').on('contextmenu', '.contact', function(event) {
        event.preventDefault();
        removePopover();
        UserView.contactPopover($(this));
      });

      $('.header-links-item').on('click', '#logout', function(event) {
        event.preventDefault();
        openPopup($('#popupLogout'));
      });

      $('.search').on('click', function() {
        if (QMCONFIG.debug) console.log('global search');
        openPopup($('#popupSearch'));
      });

      $('.popup-control-button').on('click', function(event) {
        event.preventDefault();
        closePopup();
      });

      $('#logoutConfirm').on('click', function() {
        UserView.logout();
      });

      $('#searchContacts').on('keyup search submit', function(event) {
        event.preventDefault();
        var type = event.type,
            code = event.keyCode; // code=27 (Esc key), code=13 (Enter key)

        if ((type === 'keyup' && code !== 27 && code !== 13) || (type === 'search')) {
          UserView.localSearch($(this));
        }
      });

      $('#globalSearch').on('submit', function(event) {
        event.preventDefault();
        FriendlistView.globalSearch($(this));
      });

      /* temp routes */
      $('.list').on('click', '.contact', function(event) {
        event.preventDefault();
      });

      $('#home, #share, #contacts').on('click', function(event) {
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

    if (objDom.is('.popup, .popup *, .search') || $('.popup.is-overlay').is('.is-open')) {
      return false;
    } else {
      closePopup();
    }
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

},{"./friendlist/FriendlistView":3,"./user/UserView":9}],7:[function(require,module,exports){
/*
 * Q-municate chat application
 *
 * Session Model
 *
 */

module.exports = Session;

function Session(token, params, isRemember) {
  this.storage = {
    token: token || null,
    expirationTime: null,
    authParams: this.encrypt(params) || null
  };

  this._remember = isRemember || false;
}

Session.prototype.setExpirationTime = function() {
  var limitHours = 2,
      d = new Date;

  d.setHours(d.getHours() + limitHours);
  this.storage.expirationTime = d.toISOString();

  if (this._remember)
    localStorage.setItem('QM.session', JSON.stringify(this.storage));
};

Session.prototype.setAuthParams = function(params) {
  this.storage.authParams = this.encrypt(params);

  if (this._remember)
    localStorage.setItem('QM.session', JSON.stringify(this.storage));
};

Session.prototype.getStorage = function() {
  this.storage = JSON.parse(localStorage.getItem('QM.session'));
  this._remember = true;
};

Session.prototype.update = function(token) {
  this.storage.token = token;
  this.storage.expirationTime = null;
};

Session.prototype.destroy = function() {
  this.storage = {};
  this._remember = false;
  localStorage.removeItem('QM.session');
  localStorage.removeItem('QM.user');
};

// crypto methods for password
Session.prototype.encrypt = function(params) {
  if (params && params.password) {
    params.password = CryptoJS.AES.encrypt(params.password, QMCONFIG.qbAccount.authSecret).toString();
  }
  return params;
};

Session.prototype.decrypt = function(params) {
  if (params && params.password) {
    params.password = CryptoJS.AES.decrypt(params.password, QMCONFIG.qbAccount.authSecret).toString(CryptoJS.enc.Utf8);
  }
  return params;
};

},{}],8:[function(require,module,exports){
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

},{"../contacts/ContactModel":1,"../qbApiCalls":5,"./UserView":9}],9:[function(require,module,exports){
/*
 * Q-municate chat application
 *
 * User View
 *
 */

var User = require('./UserModel');

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
      $('#profile').find('img').attr('src', user.contact.avatar_url);
      switchPage($('#mainPage'));
    },

    successSendEmailCallback: function() {
      var alert = '<div class="note l-form l-flexbox l-flexbox_column">';
      alert += '<span class="text text_alert">Success!</span>';
      alert += '<span class="text">Please check your email and click on the link in letter in order to reset your password</span>';
      alert += '</div>';

      this.removeSpinner();
      $('section:visible form').addClass('is-hidden').after(alert);
    },

    connectFB: function(token) {
      user = new User;
      user.connectFB(token);
    },

    getFBStatus: function() {
      FB.getLoginStatus(function(response) {
        if (QMCONFIG.debug) console.log('FB status response', response);
      }, true);
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

    autologin: function(session) {
      user = new User;
      user.autologin(session);
    },

    profilePopover: function(objDom) {
      var html = '<ul class="list-actions list-actions_profile popover">';
      // html += '<li class="list-item"><a class="list-actions-action" href="#">Profile</a></li>';
      html += '<li class="list-item"><a id="logout" class="list-actions-action" href="#">Log Out</a></li>';
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
    },

    localSearch: function(form) {
      var val = form.find('input[type="search"]').val().trim();
      
      if (val.length > 0) {
        // if (QMCONFIG.debug) console.log('local search =', val);
        $('#searchList').removeClass('is-hidden').siblings('section').addClass('is-hidden');
      } else {
        $('#emptyList').removeClass('is-hidden').siblings('section').addClass('is-hidden');
      }
    }

  };
})();

},{"./UserModel":8}]},{},[4])